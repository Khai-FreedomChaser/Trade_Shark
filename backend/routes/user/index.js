const express = require("express");
const userController = require("../../controller/user");
const { authMiddleware } = require("../../middleware/auth");
const router = express.Router();


router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.post("/refresh", userController.refreshAccessToken);
router.get("/me", authMiddleware, userController.getMe);
router.post("/balance/deposit", authMiddleware, userController.deposit);
router.post("/balance/withdrawal", authMiddleware, userController.withdrawal);
router.post("/trade/buy", authMiddleware, userController.buyStock);
router.post("/trade/sell", authMiddleware, userController.sellStock);
router.get("/balance-history", authMiddleware, userController.getBalanceHistory);
router.get("/portfolio", authMiddleware, userController.getPortfolio);
module.exports = router;
