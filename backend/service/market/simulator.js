const marketState = require("./market-state");

/**
 * MARKET DATA SIMULATOR (skeleton chạy được — BE1).
 *
 * Random walk có hồi quy về giá tham chiếu:
 *   - shock: nhiễu ngẫu nhiên đều trong ±SIM_VOLATILITY.
 *   - pull : lực nhẹ kéo giá về refPrice (MEAN_REVERSION) để giá không dồn
 *            hết lên trần/sàn khi chạy lâu.
 *   - Làm tròn NGẪU NHIÊN về bước 100 VND: giữ nguyên kỳ vọng, nên mã giá thấp
 *     (10.000 - 30.000) vẫn nhích giá thay vì bị Math.round kéo về giá cũ mãi.
 * Giá bị chặn trong [floor, ceiling] bởi marketState.tick().
 *
 * Không ghi DB tại đây. DB chỉ nhận snapshot theo lô (snapshot-writer.js).
 */
// Tham số đọc từ .env: TICK_INTERVAL_MS, TICK_RATIO, SIM_VOLATILITY
const TICK_INTERVAL_MS = Number(process.env.TICK_INTERVAL_MS) || 1000;
const TICK_RATIO = Number(process.env.TICK_RATIO) || 0.15; // % mã di chuyển mỗi tick
const VOLATILITY = Number(process.env.SIM_VOLATILITY) || 0.003;

const PRICE_STEP = 100;      // bước giá 100 VND (CONTRACT mục 4)
const MEAN_REVERSION = 0.02; // độ mạnh lực kéo về refPrice mỗi tick

function nextPrice(state) {
  const shock = (Math.random() * 2 - 1) * VOLATILITY;
  const pull = (MEAN_REVERSION * (state.refPrice - state.price)) / state.price;

  // Số bước giá muốn dịch (số thực) -> làm tròn ngẫu nhiên theo phần lẻ
  const x = (state.price * (shock + pull)) / PRICE_STEP;
  const base = Math.floor(x);
  const steps = base + (Math.random() < x - base ? 1 : 0);

  // Bám lưới bước giá (giá có thể lệch lưới sau khi bị chặn ở trần/sàn)
  const onGrid = Math.round(state.price / PRICE_STEP) * PRICE_STEP;
  return onGrid + steps * PRICE_STEP;
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

module.exports = { startSimulator, nextPrice };
