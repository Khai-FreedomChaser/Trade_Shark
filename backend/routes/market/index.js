const express = require("express");
const marketController = require("../../controller/market");

const router = express.Router();

router.get("/state", marketController.getMarketState);
router.get("/state/:symbol", marketController.getSymbolState);

module.exports = router;
