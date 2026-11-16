const express = require("express");
const benchmarkController = require("../../controller/benchmark");

const router = express.Router();

router.post("/run", benchmarkController.runBenchmark);
router.get("/logs", benchmarkController.getBenchmarkLogs);

module.exports = router;
