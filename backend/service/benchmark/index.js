const datasource = require("../../db/data-source");
const { genId } = require("../../utils/id");
const { findMinMaxSequential, findMinMaxPairwise } = require("./algorithms");

/**
 * MODULE BENCHMARK — chạy thực nghiệm đối chiếu 2 thuật toán trên nhiều kích
 * thước/mẫu dữ liệu giá giả lập, đo CPU time bằng process.hrtime.bigint(),
 * đếm phép so sánh, lưu kết quả vào benchmark_logs.
 */

const PATTERNS = ["random", "sorted", "reversed", "few-unique", "nearly-sorted"];

const SIZE_MIN = 10;
const SIZE_MAX = 2_000_000;
const RUNS_MIN = 1;
const RUNS_MAX = 10;

/** Sinh dataset giá cổ phiếu giả lập theo mẫu dữ liệu. */
function generateDataset(size, pattern) {
  const data = new Array(size);
  for (let i = 0; i < size; i++) {
    data[i] = Math.round(Math.random() * 150_000 * 100) / 100; // giá VND, 2 chữ số
  }

  if (pattern === "sorted") {
    data.sort((a, b) => a - b);
  } else if (pattern === "reversed") {
    data.sort((a, b) => b - a);
  } else if (pattern === "few-unique") {
    const bucket = [10_000, 25_500, 43_800, 61_200, 88_900, 120_000, 150_000];
    for (let i = 0; i < size; i++) {
      data[i] = bucket[Math.floor(Math.random() * bucket.length)];
    }
  } else if (pattern === "nearly-sorted") {
    data.sort((a, b) => a - b);
    const swaps = Math.max(1, Math.floor(size * 0.01));
    for (let s = 0; s < swaps; s++) {
      const i = Math.floor(Math.random() * size);
      const j = Math.min(size - 1, i + Math.floor(Math.random() * 10) + 1);
      const tmp = data[i];
      data[i] = data[j];
      data[j] = tmp;
    }
  }

  return data;
}

/** Chạy 1 thuật toán nhiều lần, trả về thời gian CPU trung bình (ms). */
function measureCpuTime(algorithm, data, runs) {
  const times = [];
  for (let r = 0; r < runs; r++) {
    const start = process.hrtime.bigint();
    const result = algorithm(data);
    const end = process.hrtime.bigint();
    times.push(Number(end - start) / 1_000_000);

    if (r === 0) {
      // Chạy đầu tiên dùng để lấy số phép so sánh (bất biến giữa các lần chạy)
      var firstResult = result;
    }
  }

  const totalTime = times.reduce((sum, t) => sum + t, 0);
  return {
    avgTimeMs: totalTime / times.length,
    bestTimeMs: Math.min(...times),
    comparisons: firstResult.comparisons,
    min: firstResult.min,
    max: firstResult.max
  };
}

function getBenchmarkRepository() {
  return datasource.getRepository("BenchmarkLog");
}

/** Thực thi 1 lượt benchmark và lưu kết quả vào DB. */
async function runBenchmark(options = {}) {
  const size = clamp(Number(options.size) || 100_000, SIZE_MIN, SIZE_MAX);
  const pattern = PATTERNS.includes(options.pattern) ? options.pattern : "random";
  const runs = clamp(Number(options.runs) || 3, RUNS_MIN, RUNS_MAX);

  const dataset = generateDataset(size, pattern);

  // Warm-up để JIT ổn định, kết quả đo phản ánh đúng đặc tính thuật toán.
  findMinMaxSequential(dataset);
  findMinMaxPairwise(dataset);

  const seq = measureCpuTime(findMinMaxSequential, dataset, runs);
  const pair = measureCpuTime(findMinMaxPairwise, dataset, runs);

  const savedRatio = ((seq.comparisons - pair.comparisons) / seq.comparisons) * 100;

  const log = {
    id: genId("BM"),
    datasetSize: size,
    dataPattern: pattern,
    seqComparisions: seq.comparisons,
    pairComparisions: pair.comparisons,
    seqTimeMs: seq.avgTimeMs.toFixed(4),
    pairTimeMs: pair.avgTimeMs.toFixed(4),
    createdAt: new Date()
  };

  await getBenchmarkRepository().insert(log);

  return {
    ...log,
    detail: {
      runs,
      seqBestTimeMs: seq.bestTimeMs.toFixed(4),
      pairBestTimeMs: pair.bestTimeMs.toFixed(4),
      comparisonSavingPercent: Number(savedRatio.toFixed(2)),
      seqFound: { min: seq.min, max: seq.max },
      pairFound: { min: pair.min, max: pair.max }
    }
  };
}

async function getBenchmarkLogs(limit = 50) {
  return getBenchmarkRepository().find({
    order: { createdAt: "DESC" },
    take: clamp(Number(limit) || 50, 1, 200)
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Quy ước: chỉ export phần controller/routes thực sự gọi (runBenchmark,
// getBenchmarkLogs). Dataset và danh sách pattern là chi tiết nội bộ.
module.exports = {
  runBenchmark,
  getBenchmarkLogs
};
