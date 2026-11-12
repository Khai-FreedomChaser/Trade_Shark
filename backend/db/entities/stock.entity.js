const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Stock",
  tableName: "stocks",
  columns: {
    id: {
      type: "varchar",
      length: 20,
      primary: true
    },

    symbol: {
      type: "varchar",
      length: 20,
      unique: true,
    },

    companyName: {
      type: "varchar",
      length: 100
    },

    price: {
      type: "decimal",
      precision: 10,
      scale: 2
    },

    updatedAt: {
      type: "datetime",
      updateDate: true
    }
  }
})
