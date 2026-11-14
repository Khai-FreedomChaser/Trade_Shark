const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'StockSnapshot',
    tableName: 'stock_snapshots',
    columns: {
        id: {
            type: 'varchar',
            length: 20,
            primary: true
        },

        stockId: {
            type: 'varchar',
            length: 20,
        },

        minPrice: {
            type: 'decimal',
            precision: 15,
            scale: 2,
        },
        
        maxPrice: {
            type: 'decimal',
            precision: 15,
            scale: 2,
        },

        closePrice: {
            type: 'decimal',
            precision: 15,
            scale: 2,
        },

        createdAt: {
            type: 'datetime',
        }
    },
    relations: {
        stock: {
            type: 'many-to-one',
            target: 'Stock',
            joinColumn: {
                name: 'stockId',
                referencedColumnName: 'id'
            },
            inverseSide: 'stockSnapshots',
            onDelete: 'CASCADE'
        }
    }
});