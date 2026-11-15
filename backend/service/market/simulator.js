const marketState = require("./market-state");

/**
 * MARKET DATA SIMULATOR (skeleton chạy được — BE1).
 *
 * Random Walk: mỗi tick, giá mới = giá cũ * (1 + drift), với drift ngẫu nhiên
 * trong khoảng ±SIM_VOLATILITY. Giá được làm tròn theo bước 100 VND và bị chặn
 * trong biên độ [floor, ceiling] bởi marketState.tick().
 *
 * Không ghi DB tại đây. DB chỉ nhận snapshot theo lô (snapshot-writer.js).
 */
// TODO: Làm simulator (biên độ, tần suất, mô hình giá) ~ BE1
// Tham số đã đọc từ .env: TICK_INTERVAL_MS, TICK_RATIO, SIM_VOLATILITY
const TICK_INTERVAL_MS = Number(process.env.TICK_INTERVAL_MS) || 1000;
const TICK_RATIO = Number(process.env.TICK_RATIO) || 0.15; // % mã di chuyển mỗi tick
const VOLATILITY = Number(process.env.SIM_VOLATILITY) || 0.003;

function nextPrice(state) {
  const drift = 1 + (Math.random() * 2 - 1) * VOLATILITY;
  const raw = state.price * drift;
  return Math.round(raw / 100) * 100; // bước giá 100 VND
}

function startSimulator() {
  const symbols = marketState.symbols();
  if (symbols.length === 0) {
    console.warn("Simulator: không có mã nào trong RAM. Chạy `npm run seed` trước.");
    return null;
  }

  const timer = setInterval(() => {
    // Mỗi tick chỉ một tỷ lệ mã di chuyển — bảng điện sống động nhưng payload WS gọn.
    for (const symbol of symbols) {
      if (Math.random() > TICK_RATIO) continue;
      const state = marketState.get(symbol);
      marketState.tick(symbol, nextPrice(state));
    }
  }, TICK_INTERVAL_MS);

  console.log(
    `Simulator: random walk ${symbols.length} mã | tick ${TICK_INTERVAL_MS}ms | ratio ${TICK_RATIO}`
  );

  return {
    stop() {
      clearInterval(timer);
    }
  };
}

module.exports = { startSimulator };
