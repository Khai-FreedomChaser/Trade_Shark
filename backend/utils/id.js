const crypto = require("crypto");

/**
 * Sinh id ngắn (<= 20 ký tự) khớp với các cột id varchar(20) trong DB.
 * Dùng chung cho stock, user, snapshot, benchmark log...
 */
function genId(prefix = "") {
  const id = Date.now().toString(36) + crypto.randomBytes(4).toString("hex");
  return (prefix ? prefix + "_" : "") + id;
}

module.exports = { genId };
