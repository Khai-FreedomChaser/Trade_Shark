require("dotenv").config();
const datasource = require("../db/data-source");
const { genId } = require("../utils/id");

/**
 * SEED: sinh N mã cổ phiếu (mặc định 3.000, tối đa 5.000) từ refPrice ngẫu nhiên
 * theo bước 100 VND trong khoảng [10.000 - 150.000].
 *
 *  node scripts/seed-stocks.js 3000        # thêm mã còn thiếu
 *  node scripts/seed-stocks.js 3000 --fresh   # xóa sạch stocks rồi seed lại
 *
 * Đây là MASTER DATA — giá biến động KHÔNG được lưu vào bảng stocks.
 */

const SYMBOL_CHARS = "ABCDEFGHIJKLMNOPQRSTUVXYZW";

const BUSINESS_WORDS = [
  "Chứng khoán", "Thương mại", "Công nghệ", "Xây dựng", "Thực phẩm",
  "Điện lực", "Dệt may", "Hóa chất", "Vật liệu", "Logistics",
  "Bất động sản", "Ngân hàng", "Dược phẩm", "Nông sản", "Cơ khí"
];

function randomSymbol(existing) {
  for (let attempt = 0; attempt < 1000; attempt++) {
    let symbol = "";
    for (let i = 0; i < 3; i++) {
      symbol += SYMBOL_CHARS[Math.floor(Math.random() * SYMBOL_CHARS.length)];
    }
    if (!existing.has(symbol)) {
      existing.add(symbol);
      return symbol;
    }
  }
  throw new Error("Không sinh được symbol mới");
}

function buildStocks(count, existing) {
  const stocks = [];
  for (let i = 0; i < count; i++) {
    const symbol = randomSymbol(existing);
    const refPrice = (Math.floor(Math.random() * 1400) + 100) * 100; // 10.000 - 150.000
    const marketRoll = Math.random();

    stocks.push({
      id: genId("S"),
      symbol,
      companyName: `Công ty CP ${BUSINESS_WORDS[Math.floor(Math.random() * BUSINESS_WORDS.length)]} ${symbol}`,
      refPrice,
      market: marketRoll < 0.6 ? "HOSE" : marketRoll < 0.9 ? "HNX" : "UPCOM",
      createdAt: new Date()
    });
  }
  return stocks;
}

async function main() {
  const count = Math.min(5000, Math.max(1, Number(process.argv[2]) || Number(process.env.SEED_COUNT) || 3000));
  const fresh = process.argv.includes("--fresh");

  await datasource.initialize();

  if (fresh) {
    // Xóa theo thứ tự phụ thuộc FK cho gọn (cascade sẽ dọn con, truncate an toàn hơn)
    await datasource.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const table of ["stock_alerts", "stock_snapshots", "stock_users", "balance_history", "stocks"]) {
      await datasource.query(`TRUNCATE TABLE ${table}`);
    }
    await datasource.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("Đã xóa dữ liệu cũ (--fresh)");
  }

  const repository = datasource.getRepository("Stock");
  const existingSymbols = new Set(
    (await repository.find({ select: { symbol: true } })).map((s) => s.symbol)
  );

  const stocks = buildStocks(count, existingSymbols);
  for (let i = 0; i < stocks.length; i += 500) {
    await repository.insert(stocks.slice(i, i + 500));
  }

  const total = await repository.count();
  console.log(`Seed xong: +${stocks.length} mã mới, tổng ${total} mã trong bảng stocks`);

  await datasource.destroy();
}

main().catch((err) => {
  console.error("Seed thất bại:", err);
  process.exit(1);
});
