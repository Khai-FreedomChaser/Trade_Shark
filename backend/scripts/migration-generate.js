const { spawnSync } = require("child_process");

const name = process.argv[2] || "Auto";
const result = spawnSync(
  "npx",
  ["typeorm", "migration:generate", "-o", `db/migrations/${name}`, "-d", "db/data-source.js"],
  { stdio: "inherit", shell: true }
);
process.exit(result.status ?? 1);
