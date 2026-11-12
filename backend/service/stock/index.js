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
    id: Number(id)
  });
}

async function updateStock(id, data) {
  const repository = getStockRepository();

  await repository.update(
    { id: Number(id) },
    data
  );

  return getStockById(id);
}

async function deleteStock(id) {
  return getStockRepository().delete({
    id: Number(id)
  });
}

async function getStockRepository() {
  return datasource.getRepository("stocks");
}

module.exports = {
  createStock,
  getAllStocks,
  getStockById,
  updateStock,
  deleteStock
};
