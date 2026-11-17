/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * Cùng lý do như PrecisionBalanceHistoryCreatedAt: benchmark_logs.createdAt là datetime
 * (1 giây) nên 2 lượt benchmark trong cùng một giây bị sắp xếp tuỳ ý, bảng "Lịch sử
 * thực nghiệm" hiển thị sai thứ tự. Đổi sang datetime(6).
 *
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class PrecisionBenchmarkLogCreatedAt1794875900000 {
    name = 'PrecisionBenchmarkLogCreatedAt1794875900000'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`benchmark_logs\` MODIFY \`createdAt\` datetime(6) NOT NULL`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`benchmark_logs\` MODIFY \`createdAt\` datetime NOT NULL`);
    }
}
