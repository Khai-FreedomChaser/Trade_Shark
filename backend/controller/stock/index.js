const stockService = require("../../service/stock");

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
    const stocks = await stockService.getAllStocks();

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

const SNAPSHOT_DEFAULT_LIMIT = 100;
const SNAPSHOT_MAX_LIMIT = 1000;

function parseDateParam(value) {
  if (value === undefined || value === "") return { ok: true, date: undefined };
  const date = new Date(value);
  return { ok: !Number.isNaN(date.getTime()), date };
}

async function getStockSnapshots(req, res) {
  try {
    const rawLimit = parseInt(req.query.limit, 10);
    const limit = Number.isNaN(rawLimit)
      ? SNAPSHOT_DEFAULT_LIMIT
      : Math.min(Math.max(rawLimit, 1), SNAPSHOT_MAX_LIMIT);

    const from = parseDateParam(req.query.from);
    const to = parseDateParam(req.query.to);
    if (!from.ok || !to.ok) {
      return res.status(400).json({
        message: "Tham số from/to phải là thời gian ISO (vd 2026-11-15T09:00:00Z)",
        error: "Invalid date"
      });
    }
    if (from.date && to.date && from.date > to.date) {
      return res.status(400).json({
        message: "from phải nhỏ hơn hoặc bằng to",
        error: "Invalid range"
      });
    }

    const stock = await stockService.getStockById(req.params.id);
    if (!stock) {
      return res.status(404).json({
        message: "Không tìm thấy stock"
      });
    }

    const data = await stockService.getSnapshots(req.params.id, {
      limit,
      from: from.date,
      to: to.date
    });

    res.status(200).json({ count: data.length, data });
  } catch (error) {
    res.status(500).json({
      message: "Không thể lấy snapshot của stock",
      error: error.message
    });
  }
}

module.exports = {
  createStock,
  getAllStocks,
  getStockById,
  updateStock,
  deleteStock,
  getStockSnapshots
};
