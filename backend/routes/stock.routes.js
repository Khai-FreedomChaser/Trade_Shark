const express = require("express");
const stockController = require("../controller/stock.controller");

const router = express.Router();

router.post("/", stockController.createStock);
router.get("/", stockController.getAllStocks);
router.get("/:id", stockController.getStockById);
router.put("/:id", stockController.updateStock);
router.delete("/:id", stockController.deleteStock);

module.exports = router;