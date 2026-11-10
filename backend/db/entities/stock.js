const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Stock",
  tableName: "stocks",

  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true
    },

    symbol: {
      type: "varchar",
      length: 20,
      unique: true
    },

    companyName: {
      type: "varchar",
      length: 100
    },

    price: {
      type: "decimal",
      precision: 10,
      scale: 2
    }
  }
});