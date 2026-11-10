const dataSource = require("./index");

async function testCrud() {
  try {
    await dataSource.initialize();

    console.log("Database connected");

    const stockRepository = dataSource.getRepository("Stock");

    // C
    const stock = stockRepository.create({
      symbol: "VNM",
      companyName: "Vinamilk",
      price: 72500
    });

    const savedStock = await stockRepository.save(stock);

    console.log("Created:", savedStock);

    // R
    const stocks = await stockRepository.find();

    console.log("All stocks:", stocks);

    // U
    await stockRepository.update(savedStock.id, {
      price: 73000
    });

    console.log("Updated");

    // D
    await stockRepository.delete(savedStock.id);

    console.log("Deleted");

    await dataSource.destroy();
  } catch (error) {
    console.error("CRUD error:", error);
  }
}

testCrud();