const wsHub = require("../../ws");

/**
 * REST đọc trạng thái RAM của thị trường (dùng để bootstrap bảng điện).
 * Luồng "nóng" vẫn qua WebSocket tại ws://localhost:3636/ws.
 */

async function getMarketState(req, res) {
  try {
    res.status(200).json({
      count: wsHub.marketState.getAll().length,
      data: wsHub.marketState.getAll()
    });
  } catch (error) {
    res.status(500).json({
      message: "Không thể lấy trạng thái thị trường",
      error: error.message
    });
  }
}

async function getSymbolState(req, res) {
  try {
    const state = wsHub.marketState.get(req.params.symbol);
    if (!state) {
      return res.status(404).json({
        message: "Không tìm thấy mã trong trạng thái thị trường"
      });
    }

    res.status(200).json(state);
  } catch (error) {
    res.status(500).json({
      message: "Không thể lấy trạng thái mã",
      error: error.message
    });
  }
}

module.exports = {
  getMarketState,
  getSymbolState
};
