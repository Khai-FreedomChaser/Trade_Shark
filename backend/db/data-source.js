// .env chỉ điền các biến CHƯA có trong môi trường: biến môi trường thật luôn thắng
// (vd `SIM_ENABLED=false npm run dev` hoặc biến do CI/deploy set) — đúng chuẩn 12-factor.
require("dotenv").config();
const { DataSource } = require("typeorm");

module.exports = new DataSource({
  type: "mysql",
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT) || 3306,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  synchronize: false,
  entities: [__dirname + "/entities/*.entity.js"],
  migrations: [__dirname + "/migrations/*.js"]
})
