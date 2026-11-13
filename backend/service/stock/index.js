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

function getStockRepository() {
  return datasource.getRepository("Stock");
}

module.exports = {
  createStock,
  getAllStocks,
  getStockById,
  updateStock,
  deleteStock
};
