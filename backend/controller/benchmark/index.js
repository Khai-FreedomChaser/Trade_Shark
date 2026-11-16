const benchmarkService = require("../../service/benchmark");

async function runBenchmark(req, res) {
  try {
    const result = await benchmarkService.runBenchmark({
      size: req.body.size,
      pattern: req.body.pattern,
      runs: req.body.runs
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      message: "Không thể chạy benchmark",
      error: error.message
    });
  }
}

async function getBenchmarkLogs(req, res) {
  try {
    const logs = await benchmarkService.getBenchmarkLogs(req.query.limit);

    res.status(200).json({
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      message: "Không thể lấy lịch sử benchmark",
      error: error.message
    });
  }
}

module.exports = {
  runBenchmark,
  getBenchmarkLogs
};
