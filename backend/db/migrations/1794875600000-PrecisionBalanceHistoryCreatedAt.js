/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * balance_history.createdAt là datetime (độ phân giải 1 giây) nên nhiều giao dịch
 * trong cùng một giây bị sắp xếp tuỳ ý -> lịch sử số dư hiển thị sai thứ tự và
 * "số dư sau giao dịch" tính ngược từ số dư hiện tại bị lệch.
 * Đổi sang datetime(6) (micro giây) như các cột updatedAt khác.
 *
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class PrecisionBalanceHistoryCreatedAt1794875600000 {
    name = 'PrecisionBalanceHistoryCreatedAt1794875600000'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`balance_history\` MODIFY \`createdAt\` datetime(6) NOT NULL`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`balance_history\` MODIFY \`createdAt\` datetime NOT NULL`);
    }
}
