const express = require("express");
const stockController = require("../../controller/stock");

const router = express.Router();

// TODO: Thêm GET /:id/snapshots cho biểu đồ chi tiết mã ~ BE1
router.post("/", stockController.createStock);
router.get("/", stockController.getAllStocks);
router.get("/:id", stockController.getStockById);
router.put("/:id", stockController.updateStock);
router.delete("/:id", stockController.deleteStock);

module.exports = router;
