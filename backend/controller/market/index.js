const wsHub = require("../../ws");
const { getAggregationStats } = require("../../service/market/snapshot-writer");
const { getAlertCacheStats } = require("../../service/user/alert-listener");

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

/**
 * Số liệu tối ưu hoá runtime — dùng làm minh chứng thực nghiệm cho thuật toán
 * Min–Max ghép cặp và cache cảnh báo (xem service/market/snapshot-writer.js).
 */
async function getOptimizationStats(req, res) {
  try {
    res.status(200).json({
      symbols: wsHub.marketState.getAll().length,
      windowAggregation: getAggregationStats(),
      streamUpdate: {
        note: "Đáy/đỉnh phiên cập nhật theo từng tick (hiển thị tức thời): 2 phép so sánh/tick — không phải quét mảng",
        comparisonsPerTick: 2
      },
      alertCache: getAlertCacheStats()
    });
  } catch (error) {
    res.status(500).json({
      message: "Không thể lấy số liệu tối ưu hoá",
      error: error.message
    });
  }
}

module.exports = {
  getMarketState,
  getSymbolState,
  getOptimizationStats
};
