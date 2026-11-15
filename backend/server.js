const express = require("express");
const cors = require("cors");
require("dotenv").config();

const datasource = require("./db/data-source");
const { marketState, startSimulator, startSnapshotWriter } = require("./service/market");
const { attachWsServer } = require("./ws");

const app = express();
const PORT = process.env.PORT || 3636;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Toàn bộ REST API nằm dưới tiền tố /api (xem docs/CONTRACT.md)
app.use("/api", require("./routes"));

datasource
  .initialize()
  .then(async () => {
    console.log("Successfully connected to the database");

    // Nạp master data vào RAM -> nguồn sự thật của giá trong phiên
    await marketState.initFromDatabase(datasource);

    const server = app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });

    // WebSocket lõi real-time: ws://localhost:3636/ws
    attachWsServer(server);

    if (process.env.SIM_ENABLED !== "false") {
      startSimulator();
    }

    // Batch ghi stock_snapshots theo lô — điểm nối duy nhất giữa RAM và DB
    startSnapshotWriter(datasource);
  })
  .catch((err) => {
    console.error("Error connecting to the database", err);
    process.exit(1);
  });
