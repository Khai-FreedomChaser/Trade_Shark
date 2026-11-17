require("dotenv").config({ override: true });
const { spawnSync } = require("child_process");
const mysql = require("mysql2/promise");

/**
 * RESET DATABASE: DROP + CREATE + migration:run + seed — 1 lệnh cho cả nhóm.
 * Dùng khi: clone repo lần đầu, schema vừa được lead thay đổi, hoặc DB rối.
 *
 *  npm run db:reset            # dùng SEED_COUNT trong .env (mặc định 3000)
 *  npm run db:reset 1500       # seed 1500 mã
 *
 * LƯU Ý: xóa toàn bộ dữ liệu hiện có của database (dữ liệu dev giả lập).
 */

async function main() {
  const database = process.env.MYSQL_DATABASE;
  if (!database) {
    throw new Error("Thiếu MYSQL_DATABASE trong backend/.env");
  }

  const seedCount = process.argv[2] || process.env.SEED_COUNT || 3000;

  // DROP/CREATE cần quyền root (user app chỉ có quyền trên chính DB của mình)
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_ROOT_USER || "root",
    password: process.env.MYSQL_ROOT_PASSWORD
  });

  console.log(`> DROP DATABASE ${database}`);
  await conn.query(`DROP DATABASE IF EXISTS \`${database}\``);
  console.log(`> CREATE DATABASE ${database}`);
  await conn.query(
    `CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.end();

  console.log("> migration:run");
  const migrate = spawnSync("npx", ["typeorm", "migration:run", "-d", "db/data-source.js"], {
    stdio: "inherit",
    shell: true
  });
  if (migrate.status !== 0) {
    throw new Error("migration:run thất bại");
  }

  console.log(`> seed ${seedCount} mã`);
  const seed = spawnSync("node", ["scripts/seed-stocks.js", String(seedCount)], {
    stdio: "inherit",
    shell: true
  });
  if (seed.status !== 0) {
    throw new Error("seed thất bại");
  }

  console.log("✅ db:reset hoàn tất — chạy `npm run dev` là lên sóng.");
}

main().catch((err) => {
  console.error("❌ db:reset thất bại:", err.message);
  process.exit(1);
});
