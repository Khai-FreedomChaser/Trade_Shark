const { Between, MoreThanOrEqual, LessThanOrEqual } = require("typeorm");
const datasource = require("../../db/data-source");
const { findMinMaxSequential, findMinMaxPairwise } = require("../benchmark/algorithms");

async function createStock(data) {
  const stock = getStockRepository().create(data);

  return getStockRepository().save(stock);
}

async function getAllStocks() {
  return getStockRepository().find();
}

async function getStockById(id) {
  return getStockRepository().findOneBy({
    id
  });
}

async function updateStock(id, data) {
  const repository = getStockRepository();

  await repository.update(
    { id },
    data
  );

  return getStockById(id);
}

async function deleteStock(id) {
  return getStockRepository().delete({
    id
  });
}

/**
 * Chuỗi snapshot min/max/close của 1 mã cho biểu đồ, luôn trả về theo createdAt ASC.
 *  - Không có `from`: lấy `limit` điểm MỚI NHẤT (query DESC rồi đảo lại),
 *    vì ASC + LIMIT sẽ trả về các điểm CŨ NHẤT của phiên.
 *  - Có `from`: đọc xuôi từ mốc `from`, tối đa `limit` điểm.
 */
async function getSnapshots(stockId, { limit = 100, from, to } = {}) {
  const where = { stockId };
  if (from && to) where.createdAt = Between(from, to);
  else if (from) where.createdAt = MoreThanOrEqual(from);
  else if (to) where.createdAt = LessThanOrEqual(to);

  const repository = datasource.getRepository("StockSnapshot");

  if (from) {
    return repository.find({ where, order: { createdAt: "ASC" }, take: limit });
  }

  const latest = await repository.find({ where, order: { createdAt: "DESC" }, take: limit });
  return latest.reverse();
}

/**
 * Áp dụng thuật toán Min–Max trên DỮ LIỆU THẬT: tổng hợp Đáy/Đỉnh của một mã
 * từ chuỗi snapshot đã lưu trong DB (nguồn sự thật khi RAM reset / server restart).
 *
 * Mỗi mã có 2 cột cần quét (minPrice -> đáy, maxPrice -> đỉnh). Cả hai thuật toán
 * đều chạy trên cùng mảng và số phép so sánh của chúng được trả về để đối chiếu:
 *   - duyệt tuần tự: 2(n-1)
 *   - ghép cặp:      3n/2 - 2 (n chẵn) | 3(n-1)/2 (n lẻ)  -> ít hơn ~25%
 */
async function getSnapshotMinMax(stockId, { from, to } = {}) {
  const where = { stockId };
  if (from && to) where.createdAt = Between(from, to);
  else if (from) where.createdAt = MoreThanOrEqual(from);
  else if (to) where.createdAt = LessThanOrEqual(to);

  const rows = await datasource.getRepository("StockSnapshot").find({
    where,
    order: { createdAt: "ASC" }
  });

  const compare = (values) => {
    const sequential = findMinMaxSequential(values);
    const pairwise = findMinMaxPairwise(values);

    // Bất biến: 2 thuật toán phải cho cùng kết quả trên mọi dữ liệu.
    if (sequential.min !== pairwise.min || sequential.max !== pairwise.max) {
      throw new Error("Hai thuật toán Min-Max cho kết quả khác nhau");
    }

    return { sequential, pairwise };
  };

  const low = rows.length > 0 ? compare(rows.map((row) => Number(row.minPrice))) : null;
  const high = rows.length > 0 ? compare(rows.map((row) => Number(row.maxPrice))) : null;

  const sequentialComparisons =
    (low?.sequential.comparisons ?? 0) + (high?.sequential.comparisons ?? 0);
  const pairwiseComparisons =
    (low?.pairwise.comparisons ?? 0) + (high?.pairwise.comparisons ?? 0);

  return {
    stockId,
    count: rows.length,
    from: from ?? null,
    to: to ?? null,
    low: low && {
      value: low.pairwise.min,
      comparisons: {
        sequential: low.sequential.comparisons,
        pairwise: low.pairwise.comparisons
      }
    },
    high: high && {
      value: high.pairwise.max,
      comparisons: {
        sequential: high.sequential.comparisons,
        pairwise: high.pairwise.comparisons
      }
    },
    totalComparisons: {
      sequential: sequentialComparisons,
      pairwise: pairwiseComparisons,
      saved: sequentialComparisons - pairwiseComparisons,
      savedPercent: sequentialComparisons === 0
        ? 0
        : Number((((sequentialComparisons - pairwiseComparisons) / sequentialComparisons) * 100).toFixed(2))
    }
  };
}

function getStockRepository() {
  return datasource.getRepository("Stock");
}

module.exports = {
  createStock,
  getAllStocks,
  getStockById,
  updateStock,
  deleteStock,
  getSnapshots,
  getSnapshotMinMax
};
