// override: true — backend/.env là nguồn cấu hình khi chạy local; biến MYSQL_* lỡ
// có sẵn trong shell/harness không được phép ghi đè thông tin kết nối DB.
require("dotenv").config({ override: true });
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
