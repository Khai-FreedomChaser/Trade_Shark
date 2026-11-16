/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class AddAveragePriceToStockUser1794855615767 {
    name = 'AddAveragePriceToStockUser1794855615767'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`stock_users\` ADD \`averagePrice\` decimal(15,2) NOT NULL DEFAULT '0.00'`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`stock_users\` DROP COLUMN \`averagePrice\``);
    }
}
