const datasource = require("../../db/data-source");

function getUserRepository() {
  return datasource.getRepository("User");
}

module.exports = {
  getUserRepository
};
