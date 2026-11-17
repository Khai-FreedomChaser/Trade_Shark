const marketState = require("./market-state");
const { genId } = require("../../utils/id");
const { findMinMaxPairwise, findMinMaxSequential } = require("../benchmark/algorithms");

/**
 * SNAPSHOT WRITER — cầu nối duy nhất giữa RAM và DB, và là chỗ ÁP DỤNG THUẬT TOÁN
 * tìm đồng thời Min–Max bằng KỸ THUẬT GHÉP CẶP trên đường dữ liệu thật.
 *
 * Cũ: mỗi tick cập nhật cửa sổ bằng cách so giá với min rồi so với max
 *      -> 2 phép so sánh mỗi tick, tổng 2(n−1) cho n giá của cửa sổ.
 * Mới: gom n giá của cửa sổ vào một mảng rồi tìm Min–Max bằng ghép cặp
 *      -> 3n/2 − 2 (n chẵn) | 3(n−1)/2 (n lẻ) phép so sánh, tức ~1,5 phép/giá,
 *         giảm ~25% cho cùng một công việc báo cáo.
 *
 * Số liệu của CẢ HAI cách được đếm thật và cộng dồn để đối chiếu tại
 * GET /api/market/stats (nhiệm vụ "chứng minh hiệu quả qua số liệu thực nghiệm").
 * MINMAX_SELFCHECK=true: chạy thêm thuật toán tuần tự trên đúng dữ liệu đó để kiểm
 * chứng hai thuật toán cho cùng kết quả (chỉ bật khi test — tốn thêm CPU).
 */
const SNAPSHOT_INTERVAL_MS = Number(process.env.SNAPSHOT_INTERVAL_MS) || 60_000;
const SELF_CHECK = process.env.MINMAX_SELFCHECK === "true";

// symbol -> mảng giá trong cửa sổ hiện tại (chưa ghi DB)
const windows = new Map();

const aggregation = {
  windows: 0,               // số cửa sổ đã chốt
  rows: 0,                  // số dòng snapshot đã ghi
  ticks: 0,                 // số giá đã gom
  sequentialComparisons: 0, // chi phí tương ứng nếu duyệt tuần tự: 2(n−1)
  pairwiseComparisons: 0,   // số phép so sánh THẬT của thuật toán ghép cặp
  mismatches: 0,            // số lần 2 thuật toán lệch kết quả (chỉ khi bật self-check)
  lastFlushAt: null
};

function attachListeners() {
  marketState.onTick((state) => {
    let prices = windows.get(state.symbol);
    if (!prices) {
      prices = [];
      windows.set(state.symbol, prices);
    }
    prices.push(state.price);
  });
}

async function flush(datasource) {
  if (windows.size === 0) return 0;

  const repository = datasource.getRepository("StockSnapshot");
  const now = new Date();
  const rows = [];

  for (const [symbol, prices] of windows) {
    const state = marketState.get(symbol);
    if (!state) continue;

    const { min, max, comparisons } = findMinMaxPairwise(prices);

    if (SELF_CHECK) {
      const sequential = findMinMaxSequential(prices);
      if (sequential.min !== min || sequential.max !== max) {
        aggregation.mismatches++;
        console.error(
          `Min-Max lệch kết quả ở ${symbol}: ghép cặp ${min}/${max} vs tuần tự ${sequential.min}/${sequential.max}`
        );
      }
    }

    aggregation.ticks += prices.length;
    aggregation.pairwiseComparisons += comparisons;
    aggregation.sequentialComparisons += 2 * (prices.length - 1);

    rows.push({
      id: genId("SN"),
      stockId: state.stockId,
      minPrice: min,
      maxPrice: max,
      closePrice: prices[prices.length - 1],
      createdAt: now
    });
  }

  windows.clear();

  for (let i = 0; i < rows.length; i += 500) {
    await repository.insert(rows.slice(i, i + 500));
  }

  aggregation.windows++;
  aggregation.rows += rows.length;
  aggregation.lastFlushAt = now.getTime();

  return rows.length;
}

/** Số liệu đối chiếu Min–Max tích luỹ từ khi server khởi động. */
function getAggregationStats() {
  const saved = aggregation.sequentialComparisons - aggregation.pairwiseComparisons;
  return {
    intervalMs: SNAPSHOT_INTERVAL_MS,
    selfCheck: SELF_CHECK,
    ...aggregation,
    savedComparisons: saved,
    savedPercent: aggregation.sequentialComparisons === 0
      ? 0
      : Number(((saved / aggregation.sequentialComparisons) * 100).toFixed(2))
  };
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

  console.log(`Snapshot writer: gom ${SNAPSHOT_INTERVAL_MS}ms rồi tìm Min–Max bằng ghép cặp`);

  return {
    stop() {
      clearInterval(timer);
    }
  };
}

module.exports = { startSnapshotWriter, flush, getAggregationStats };
