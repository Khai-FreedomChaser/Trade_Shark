const marketState = require("./market-state");
const { genId } = require("../../utils/id");

/**
 * SNAPSHOT WRITER (skeleton — BE1).
 *
 * Cầu nối duy nhất giữa RAM và DB theo đúng thiết kế của đề tài:
 *  - Lắng nghe tick từ marketState, tổng hợp min/max/open/close theo cửa sổ thời gian.
 *  - Mỗi SNAPSHOT_INTERVAL_MS, batch INSERT vào bảng stock_snapshots rồi reset cửa sổ.
 * => 3.000 mã chỉ tốn ~3.000 row / phút thay vì hàng nghìn row/giây.
 */
// Khi tắt server (SIGINT/SIGTERM) sẽ flush() lần cuối — không mất dữ liệu cửa sổ cuối phiên.
const SNAPSHOT_INTERVAL_MS = Number(process.env.SNAPSHOT_INTERVAL_MS) || 60_000;

// symbol -> { open, min, max, close, ticked }
const windows = new Map();
const prevClose = new Map(); // symbol -> giá đóng của cửa sổ trước

function attachListeners() {
  marketState.onTick((state) => {
    let w = windows.get(state.symbol);
    if (!w) {
      const open = prevClose.get(state.symbol) ?? state.price;
      w = { open, min: state.price, max: state.price, close: state.price, ticked: true };
      windows.set(state.symbol, w);
    }
    if (state.price < w.min) w.min = state.price;
    if (state.price > w.max) w.max = state.price;
    w.close = state.price;
  });
}

async function flush(datasource) {
  if (windows.size === 0) return 0;
  const repository = datasource.getRepository("StockSnapshot");
  const now = new Date();

  const rows = [];
  for (const [symbol, w] of windows) {
    const state = marketState.get(symbol);
    if (!state) continue;
    rows.push({
      id: genId("SN"),
      stockId: state.stockId,
      minPrice: w.min,
      maxPrice: w.max,
      closePrice: w.close,
      createdAt: now
    });
    prevClose.set(symbol, w.close);
  }
  windows.clear();

  for (let i = 0; i < rows.length; i += 500) {
    await repository.insert(rows.slice(i, i + 500));
  }
  return rows.length;
}

const SHUTDOWN_TIMEOUT_MS = 5000; // DB treo thì vẫn thoát, không kẹt process

let inflight = Promise.resolve(); // lượt flush định kỳ đang chạy (nếu có)
let shuttingDown = false;

async function flushAndLog(datasource, label) {
  try {
    const written = await flush(datasource);
    if (written > 0) {
      console.log(`Snapshot${label}: đã ghi ${written} dòng vào stock_snapshots`);
    }
    return written;
  } catch (err) {
    console.error(`Snapshot${label} ghi DB lỗi:`, err.message);
    return 0;
  }
}

function registerShutdown(datasource, timer) {
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    clearInterval(timer);
    setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();

    console.log(`Snapshot: nhận ${signal}, flush lần cuối trước khi thoát...`);
    await inflight; // chờ lô định kỳ đang INSERT dở, tránh mất lô đó
    await flushAndLog(datasource, " (flush cuối)");
    process.exit(0);
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

function startSnapshotWriter(datasource) {
  attachListeners();
  const timer = setInterval(() => {
    if (shuttingDown) return;
    inflight = flushAndLog(datasource, "");
  }, SNAPSHOT_INTERVAL_MS);

  registerShutdown(datasource, timer);

  console.log(`Snapshot writer: batch mỗi ${SNAPSHOT_INTERVAL_MS}ms`);

  return {
    stop() {
      clearInterval(timer);
    }
  };
}

module.exports = { startSnapshotWriter, flush };
