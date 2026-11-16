const datasource = require("../../db/data-source");

function getUserRepository() {
  return datasource.getRepository("User");
}

// TODO: Hiện thực hóa nghiệp vụ user tại đây (auth, trade, alerts) ~ BE2
module.exports = {};
