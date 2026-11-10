const { EntitySchema, DataSource } = require("typeorm");

const dataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "nhom-1",
  password: "1324",
  database: "thuattoan",
  synchronize: true,
  entities: [
    require("./entities/stock")
  ],
});

module.exports = dataSource;