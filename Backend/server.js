const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 3636;

app.use(cors());
app.use(express.json());
// test  thử:v
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running"
  });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});