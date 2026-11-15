/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class Init1794708795234 {
    name = 'Init1794708795234'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE \`balance_history\` (\`id\` varchar(20) NOT NULL, \`userId\` varchar(20) NOT NULL, \`stockId\` varchar(20) NULL, \`amount\` decimal(15,2) NOT NULL, \`type\` enum ('deposit', 'withdrawal', 'trade') NOT NULL, \`createdAt\` datetime NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`benchmark_logs\` (\`id\` varchar(20) NOT NULL, \`datasetSize\` int NOT NULL, \`dataPattern\` varchar(50) NOT NULL, \`seqComparisions\` bigint NOT NULL, \`pairComparisions\` bigint NOT NULL, \`seqTimeMs\` decimal(10,4) NOT NULL, \`pairTimeMs\` decimal(10,4) NOT NULL, \`createdAt\` datetime NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`stock_alerts\` (\`userId\` varchar(20) NOT NULL, \`stockId\` varchar(20) NOT NULL, \`alertMin\` decimal(15,2) NULL, \`alertMax\` decimal(15,2) NULL, \`createdAt\` datetime NOT NULL, \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`userId\`, \`stockId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`stock_snapshots\` (\`id\` varchar(20) NOT NULL, \`stockId\` varchar(20) NOT NULL, \`minPrice\` decimal(15,2) NOT NULL, \`maxPrice\` decimal(15,2) NOT NULL, \`closePrice\` decimal(15,2) NOT NULL, \`createdAt\` datetime NOT NULL, INDEX \`IDX_snapshot_stock_created\` (\`stockId\`, \`createdAt\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`stock_users\` (\`userId\` varchar(20) NOT NULL, \`stockId\` varchar(20) NOT NULL, \`quantity\` int NOT NULL, \`createdAt\` datetime NOT NULL, \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`userId\`, \`stockId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`stocks\` (\`id\` varchar(20) NOT NULL, \`symbol\` varchar(20) NOT NULL, \`companyName\` varchar(100) NOT NULL, \`refPrice\` decimal(15,2) NOT NULL, \`market\` varchar(10) NOT NULL, \`createdAt\` datetime NOT NULL, UNIQUE INDEX \`IDX_abdd997b009437486baf753185\` (\`symbol\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(20) NOT NULL, \`userName\` varchar(50) NOT NULL, \`email\` varchar(100) NOT NULL, \`password\` varchar(255) NOT NULL, \`balance\` decimal(15,2) NOT NULL DEFAULT '0.00', \`dateOfBirth\` datetime NULL, \`refreshToken\` text NULL, \`refreshTokenExpiry\` datetime NULL, \`lastLogin\` datetime NULL, \`createdAt\` datetime NOT NULL, \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`balance_history\` ADD CONSTRAINT \`FK_3e799f0d1c9ff376768d9bab2bb\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`balance_history\` ADD CONSTRAINT \`FK_cb7c7fc457826e9318e1757adb6\` FOREIGN KEY (\`stockId\`) REFERENCES \`stocks\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stock_alerts\` ADD CONSTRAINT \`FK_9cbd7d597f74b4cebba5135d52f\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stock_alerts\` ADD CONSTRAINT \`FK_6dc2f372e32f9d5adf1a6b386f0\` FOREIGN KEY (\`stockId\`) REFERENCES \`stocks\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stock_snapshots\` ADD CONSTRAINT \`FK_db1880695ce5788d169c39a7e16\` FOREIGN KEY (\`stockId\`) REFERENCES \`stocks\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stock_users\` ADD CONSTRAINT \`FK_e3ed284c9041d34c6a57bb2ebad\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stock_users\` ADD CONSTRAINT \`FK_ea300e19bed0ccea0f40a1ba9b1\` FOREIGN KEY (\`stockId\`) REFERENCES \`stocks\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`stock_users\` DROP FOREIGN KEY \`FK_ea300e19bed0ccea0f40a1ba9b1\``);
        await queryRunner.query(`ALTER TABLE \`stock_users\` DROP FOREIGN KEY \`FK_e3ed284c9041d34c6a57bb2ebad\``);
        await queryRunner.query(`ALTER TABLE \`stock_snapshots\` DROP FOREIGN KEY \`FK_db1880695ce5788d169c39a7e16\``);
        await queryRunner.query(`ALTER TABLE \`stock_alerts\` DROP FOREIGN KEY \`FK_6dc2f372e32f9d5adf1a6b386f0\``);
        await queryRunner.query(`ALTER TABLE \`stock_alerts\` DROP FOREIGN KEY \`FK_9cbd7d597f74b4cebba5135d52f\``);
        await queryRunner.query(`ALTER TABLE \`balance_history\` DROP FOREIGN KEY \`FK_cb7c7fc457826e9318e1757adb6\``);
        await queryRunner.query(`ALTER TABLE \`balance_history\` DROP FOREIGN KEY \`FK_3e799f0d1c9ff376768d9bab2bb\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_abdd997b009437486baf753185\` ON \`stocks\``);
        await queryRunner.query(`DROP TABLE \`stocks\``);
        await queryRunner.query(`DROP TABLE \`stock_users\``);
        await queryRunner.query(`DROP INDEX \`IDX_snapshot_stock_created\` ON \`stock_snapshots\``);
        await queryRunner.query(`DROP TABLE \`stock_snapshots\``);
        await queryRunner.query(`DROP TABLE \`stock_alerts\``);
        await queryRunner.query(`DROP TABLE \`benchmark_logs\``);
        await queryRunner.query(`DROP TABLE \`balance_history\``);
    }
}
