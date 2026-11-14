const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'BalanceHistory',
    tableName: 'balance_history',
    columns: {
        id: {
            type: 'varchar',
            length: 20,
            primary: true,
        },
        
        userId: {
            type: 'varchar',
            length: 20,
        },

        stockId: {
            type: 'varchar',
            length: 20,
            nullable: true,
        },

        amount: {
            type: 'decimal',
            precision: 15,
            scale: 2,
        },

        type: {
            type: 'enum',
            enum: ['deposit', 'withdrawal', 'trade'],
        },

        createdAt: {
            type: 'datetime',
        },
    },
    relations: {
        user: {
            type: 'many-to-one',
            target: 'User',
            joinColumn: {
                name: 'userId',
                referencedColumnName: 'id',
            },
            inverseSide: 'balanceHistories',
            onDelete: 'CASCADE',
        },
        stock: {
            type: 'many-to-one',
            target: 'Stock',
            joinColumn: {
                name: 'stockId',
                referencedColumnName: 'id',
            },
            inverseSide: 'balanceHistories',
            onDelete: 'CASCADE',
        },
    },
});