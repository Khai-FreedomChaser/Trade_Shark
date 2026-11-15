const { Between, MoreThanOrEqual, LessThanOrEqual } = require("typeorm");
const datasource = require("../../db/data-source");

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

function getStockRepository() {
  return datasource.getRepository("Stock");
}

module.exports = {
  createStock,
  getAllStocks,
  getStockById,
  updateStock,
  deleteStock,
  getSnapshots
};
