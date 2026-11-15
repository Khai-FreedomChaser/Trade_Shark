const Stock = require("./stock.entity");
const StockAlert = require("./stock-alert.entity");
const StockSnapshot = require("./stock-snapshots.entity");
const StockUser = require("./stock-user.entity");
const User = require("./user.entity");
const BalanceHistory = require("./balance-history.entity");
const BenchmarkLog = require("./benchmark-logs.entity");

module.exports = {
  Stock,
  StockAlert,
  StockSnapshot,
  StockUser,
  User,
  BalanceHistory,
  BenchmarkLog
};
