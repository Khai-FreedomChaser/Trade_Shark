const stockService = require("../service/stock.service");

async function createStock(req, res) {
  try {
    const stock = await stockService.createStock(req.body);

    res.status(201).json(stock);
  } catch (error) {
    res.status(500).json({
      message: "Không thể tạo stock",
      error: error.message
    });
  }
}

async function getAllStocks(req, res) {
  try {
    const stocks = await stockService.getAl~lStocks();

    res.status(200).json(stocks);
  } catch (error) {
    res.status(500).json({
      message: "Không thể lấy danh sách stock",
      error: error.message
    });
  }
}

async function getStockById(req, res) {
  try {
    const stock = await stockService.getStockById(req.params.id);

    if (!stock) {
      return res.status(404).json({
        message: "Không tìm thấy stock"
      });
    }

    res.status(200).json(stock);
  } catch (error) {
    res.status(500).json({
      message: "Không thể lấy stock",
      error: error.message
    });
  }
}

async function updateStock(req, res) {
  try {
    const stock = await stockService.updateStock(
      req.params.id,
      req.body
    );

    res.status(200).json(stock);
  } catch (error) {
    res.status(500).json({
      message: "Không thể cập nhật stock",
      error: error.message
    });
  }
}

async function deleteStock(req, res) {
  try {
    await stockService.deleteStock(req.params.id);

    res.status(200).json({
      message: "Đã xóa stock"
    });
  } catch (error) {
    res.status(500).json({
      message: "Không thể xóa stock",
      error: error.message
    });
  }
}

module.exports = {
  createStock,
  getAllStocks,
  getStockById,
  updateStock,
  deleteStock
};