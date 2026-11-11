const dataSource = require("../db");

function getStockRepository() {
  return dataSource.getRepository("Stock");
}

async function createStock(data) {
  const repository = getStockRepository();
  const stock = repository.create(data);

  return repository.save(stock);
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

module.exports = {
  createStock,
  getAllStocks,
  getStockById,
  updateStock,
  deleteStock
};