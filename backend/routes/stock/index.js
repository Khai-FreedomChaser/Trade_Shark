const express = require("express");
const stockController = require("../../controller/stock");

const router = express.Router();

router.post("/", stockController.createStock);
router.get("/", stockController.getAllStocks);
// :id là Stock.id (vd S_xxx), KHÔNG phải symbol — xem CONTRACT mục 3.2
router.get("/:id/snapshots", stockController.getStockSnapshots);
router.get("/:id", stockController.getStockById);
router.put("/:id", stockController.updateStock);
router.delete("/:id", stockController.deleteStock);

module.exports = router;
