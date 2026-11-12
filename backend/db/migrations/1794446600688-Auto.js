module.exports = class Auto1794446600688 {
    name = 'Auto1794446600688'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE \`stocks\` (\`id\` varchar(20) NOT NULL, \`symbol\` varchar(20) NOT NULL, \`companyName\` varchar(100) NOT NULL, \`price\` decimal(10,2) NOT NULL, \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_abdd997b009437486baf753185\` (\`symbol\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX \`IDX_abdd997b009437486baf753185\` ON \`stocks\``);
        await queryRunner.query(`DROP TABLE \`stocks\``);
    }
}
