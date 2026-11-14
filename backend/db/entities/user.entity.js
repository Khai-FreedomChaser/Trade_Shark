const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: "User",
    tableName: "users",
    columns: {
        id: {
            type: "varchar",
            length: 20,
            primary: true,
        },

        userName: {
            type: "varchar",
            length: 50,
        },

        email: {
            type: "varchar",
            length: 100,
            unique: true,
        },

        password: {
            type: "varchar",
            length: 255,
        },

        balance: {
            type: "decimal",
            precision: 15,
            scale: 2,
            default: 0.00
        },

        dateOfBirth: {
            type: "datetime",
        },

        refreshToken: {
            type: "text"
        },

        refreshTokenExpiry: {
            type: "datetime"
        },

        lastLogin: {
            type: "datetime"
        },
        
        createdAt: {
            type: "datetime",
        },

        updatedAt: {
            type: "datetime",
            updateDate: true
        }
    },
    relations: {
        stockUsers: {
            target: "StockUser",
            type: "one-to-many",
            inverseSide: "user"
        },

        balanceHistories: {
            target: "BalanceHistory",
            type: "one-to-many",
            inverseSide: "user"
        },

        stockAlerts: {
            target: "StockAlert",
            type: "one-to-many",
            inverseSide: "user"
        }
    }
});