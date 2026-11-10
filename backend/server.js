const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 3636;
const connectDB = require("db");
const controller = require("controller");
const service= require("service");
const middleware = require("middleware");
const userRoutes = require("routes");

app.use(cors());
app.use(express.json());
app.use(connectDB);
app.use(controller);
app.use(service);
app.use(middleware);
app.use(routes);


app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});