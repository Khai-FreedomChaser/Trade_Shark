const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: "StockAlert",
    tableName: "stock_alerts",
    columns: {
        userId: {
            type: "varchar",
            length: 20,
            primary: true,
        },

        stockId: {
            type: "varchar",
            length: 20,
            primary: true,
        },

        alertMin: {
            type: "decimal",
            precision: 15,
            scale: 2,
            nullable: true
        },

        alertMax: {
            type: "decimal",
            precision: 15,
            scale: 2,
            nullable: true
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
        user: {
            type: "many-to-one",
            target: "User",
            joinColumn: {
                name: "userId",
                referencedColumnName: "id"
            },
            inverseSide: "stockAlerts",
            onDelete: "CASCADE"
        },
        stock: {
            type: "many-to-one",
            target: "Stock",
            joinColumn: {
                name: "stockId",
                referencedColumnName: "id"
            },
            inverseSide: "stockAlerts",
            onDelete: "CASCADE"
        }
    }
});