const datasource = require("../../db/data-source");

async function getUserRepository() {
    return datasource.getRepository("users");
}

module.exports = {

};