const express = require("express");
const userController = require("../../controller/user");
const { authMiddleware } = require("../../middleware/auth");
const router = express.Router();

// TODO: Gán controller vào các route tương đương ~ B

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.post("/refresh", userController.refreshAccessToken);
router.get("/me", authMiddleware, userController.getMe);

module.exports = router;
