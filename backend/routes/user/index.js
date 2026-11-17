const express = require("express");
const userController = require("../../controller/user");
const { authMiddleware } = require("../../middleware/auth");
const router = express.Router();


router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.post("/refresh", userController.refreshAccessToken);
router.get("/me", authMiddleware, userController.getMe);
router.post("/balance/deposit", authMiddleware, userController.deposit);
// Path theo docs/CONTRACT.md mục 3.4 (FE gọi /balance/withdraw)
router.post("/balance/withdraw", authMiddleware, userController.withdrawal);
router.post("/trade/buy", authMiddleware, userController.buyStock);
router.post("/trade/sell", authMiddleware, userController.sellStock);
router.get("/balance-history", authMiddleware, userController.getBalanceHistory);
router.get("/portfolio", authMiddleware, userController.getPortfolio);
router.get("/alerts", authMiddleware, userController.getAlerts);
router.post("/alerts", authMiddleware, userController.saveUserAlert);
router.delete("/alerts", authMiddleware, userController.deleteUserAlert);
module.exports = router;
