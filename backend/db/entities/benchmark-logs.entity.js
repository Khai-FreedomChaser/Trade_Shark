const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'BenchmarkLog',
    tableName: 'benchmark_logs',
    columns: {
        id: {
            type: 'varchar',
            length: 20,
            primary: true
        },

        datasetSize: {
            type: 'int',
        },

        dataPattern: {
            type: 'varchar',
            length: 50,
        },

        seqComparisions: {
            type: 'bigint',
        },

        pairComparisions: {
            type: 'bigint',
        },

        seqTimeMs: {
            type: 'decimal',
            precision: 10,
            scale: 4,
        },

        pairTimeMs: {
            type: 'decimal',
            precision: 10,
            scale: 4,
        },
        
        createdAt: {
            type: 'datetime',
        }
    }
});