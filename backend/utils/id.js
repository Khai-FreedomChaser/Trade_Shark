const crypto = require("crypto");

function genId(prefix = "") {
  const id = Date.now().toString(36) + crypto.randomBytes(4).toString("hex");
  return (prefix ? prefix + "_" : "") + id;
}

module.exports = { genId };
