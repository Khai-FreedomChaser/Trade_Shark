const datasource = require("../../db/data-source");

async function getBenchmarkRepository() {
    return datasource.getRepository("benchmark_logs");
}

module.exports = {
    
}