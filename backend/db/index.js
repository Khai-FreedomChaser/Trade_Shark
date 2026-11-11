const path = require("path");
const { DataSource } = require("typeorm");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env")
});

const dataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  synchronize: true,

  entities: [
    require("./entities/stock")
  ]
});

dataSource
  .initialize()
  .then(() => {
    console.log("Đã kết nối với DB");
  })
  .catch((error) => {
    console.error("Lỗi kết nối DB:", error);
  });

module.exports = dataSource;