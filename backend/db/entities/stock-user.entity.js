const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: "StockUser",
    tableName: "stock_users",
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

        quantity: {
            type: "int",
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
            inverseSide: "stockUsers",
            onDelete: "CASCADE"
        },
        stock: {
            type: "many-to-one",
            target: "Stock",
            joinColumn: {
                name: "stockId",
                referencedColumnName: "id"
            },
            inverseSide: "stockUsers",
            onDelete: "CASCADE"
        }
    }
});
