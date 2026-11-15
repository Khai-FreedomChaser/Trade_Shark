const { EventEmitter } = require("events");

/**
 * MARKET STATE — nguồn sự thật trong RAM cho toàn bộ giá trong phiên.
 *
 * Mỗi tick giá KHÔNG ghi vào DB. DB chỉ nhận snapshot theo lô (xem snapshot-writer.js).
 * Ai muốn "nghe" giá thì subscribe event của store này:
 *   - ws broadcaster       -> đẩy tick lên client theo lô
 *   - alert listener (BE2) -> dò ngưỡng alertMin/alertMax
 *   - snapshot writer      -> tổng hợp min/max/close theo cửa sổ thời gian
 */

const states = new Map(); // symbol -> state
const emitter = new EventEmitter();

function clampPrice(price, state) {
  if (price < state.floor) return state.floor;
  if (price > state.ceiling) return state.ceiling;
  return price;
}

/** Tính trần/sàn theo luật ±7% quanh giá tham chiếu (giữ 2 chữ số thập phân). */
function bandFromRef(refPrice) {
  return {
    ceiling: Math.round(refPrice * 1.07 * 100) / 100,
    floor: Math.round(refPrice * 0.93 * 100) / 100
  };
}

/**
 * Khởi tạo state từ bảng stocks trong DB (master data).
 * Được gọi đúng 1 lần khi server start, sau khi DataSource initialize.
 */
async function initFromDatabase(datasource) {
  const stocks = await datasource.getRepository("Stock").find();
  for (const stock of stocks) {
    const { ceiling, floor } = bandFromRef(Number(stock.refPrice));
    states.set(stock.symbol, {
      symbol: stock.symbol,
      stockId: stock.id,
      companyName: stock.companyName,
      market: stock.market,
      refPrice: Number(stock.refPrice),
      price: Number(stock.refPrice),
      high: Number(stock.refPrice),
      low: Number(stock.refPrice),
      ceiling,
      floor,
      updatedAt: Date.now()
    });
  }
  console.log(`Market state: ${states.size} mã được nạp vào RAM`);
  return states.size;
}

/**
 * Ghi nhận 1 tick giá mới. Đây là cổng duy nhất để thay đổi giá trong RAM.
 * Phát sự kiện "tick" cho mọi listener (WS, alert, snapshot...).
 */
function tick(symbol, newPrice) {
  const state = states.get(symbol);
  if (!state) return false;

  const price = clampPrice(Math.round(newPrice * 100) / 100, state);
  if (price === state.price) return false;

  state.price = price;
  if (price > state.high) state.high = price;
  if (price < state.low) state.low = price;
  state.updatedAt = Date.now();

  emitter.emit("tick", state);
  return true;
}

/** State hiện tại của 1 mã (object gốc — không copy, tránh tốn RAM với nghìn mã). */
function get(symbol) {
  return states.get(symbol) || null;
}

/** Toàn bộ states dạng mảng — dùng cho snapshot frame khi client mới kết nối. */
function getAll() {
  return Array.from(states.values());
}

/** Danh sách symbol có trong RAM. */
function symbols() {
  return Array.from(states.keys());
}

/** Đăng ký listener cho luồng tick. Trả về hàm hủy đăng ký. */
function onTick(handler) {
  emitter.on("tick", handler);
  return () => emitter.off("tick", handler);
}

module.exports = {
  bandFromRef,
  initFromDatabase,
  tick,
  get,
  getAll,
  symbols,
  onTick
};
