/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class Auto1794621647166 {
    name = 'Auto1794621647166'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(20) NOT NULL, \`userName\` varchar(50) NOT NULL, \`email\` varchar(100) NOT NULL, \`password\` varchar(255) NOT NULL, \`balance\` decimal(15,2) NOT NULL DEFAULT '0.00', \`dateOfBirth\` datetime NOT NULL, \`refreshToken\` text NOT NULL, \`refreshTokenExpiry\` datetime NOT NULL, \`lastLogin\` datetime NOT NULL, \`createdAt\` datetime NOT NULL, \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`stocks\` DROP COLUMN \`price\``);
        await queryRunner.query(`ALTER TABLE \`stocks\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`stocks\` ADD \`refPrice\` decimal(15,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`stocks\` ADD \`market\` varchar(10) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`stocks\` ADD \`createdAt\` datetime NOT NULL`);
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
        await queryRunner.query(`ALTER TABLE \`stocks\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`stocks\` DROP COLUMN \`market\``);
        await queryRunner.query(`ALTER TABLE \`stocks\` DROP COLUMN \`refPrice\``);
        await queryRunner.query(`ALTER TABLE \`stocks\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`stocks\` ADD \`price\` decimal NOT NULL`);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }
}
