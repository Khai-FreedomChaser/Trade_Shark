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
