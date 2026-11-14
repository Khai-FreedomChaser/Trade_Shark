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
      length: 100,
    },

    refPrice: {
      type: "decimal",
      precision: 15,
      scale: 2,
    },

    market: {
      type: "varchar",
      length: 10,
    },

    createdAt: {
      type: "datetime",
    }
  },
  relations: {
    stockUsers: {
      type: "one-to-many",
      target: "StockUser",
      inverseSide: "stock"
    },

    balanceHistories: {
      type: "one-to-many",
      target: "BalanceHistory",
      inverseSide: "stock"
    },

    stockAlerts: {
      type: "one-to-many",
      target: "StockAlert",
      inverseSide: "stock"
    },

    stockSnapshots: {
      type: "one-to-many",
      target: "StockSnapshot",
      inverseSide: "stock"
    }
  }
})
