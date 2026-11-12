const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 3636;

require("./db")
  .initialize()
  .then(() => console.log("Successfully connected to the database"))
  .catch(err => console.error("Error connecting to the database", err));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(require("./routes"));

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
