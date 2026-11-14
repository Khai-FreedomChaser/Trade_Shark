const express = require("express");

const router = express.Router();

router.use("/user", require("./user"));
router.use("/stock", require("./stock"));
router.use("/benchmark", require("./benchmark"));

module.exports = router;
