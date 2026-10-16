import { spawnSync } from "node:child_process";
import { Client } from "pg";

const migrationUrl = process.env.MIGRATION_DATABASE_URL;
const apiPassword = process.env.RAFIK_API_PASSWORD;
if (!migrationUrl || !/^[a-f0-9]{64}$/.test(apiPassword || "")) {
  throw new Error(
    "MIGRATION_DATABASE_URL and a 64-character RAFIK_API_PASSWORD are required.",
  );
}

const prismaCli = new URL(
  "../../../../node_modules/prisma/build/index.js",
  import.meta.url,
);
const migration = spawnSync(
  process.execPath,
  [prismaCli.pathname, "migrate", "deploy"],
  {
    cwd: new URL("../../", import.meta.url),
    env: process.env,
    stdio: "inherit",
  },
);
if (migration.error) throw migration.error;
if (migration.status !== 0) process.exit(migration.status || 1);

const client = new Client({ connectionString: migrationUrl });
try {
  await client.connect();
  const { rows } = await client.query(
    "SELECT format('ALTER ROLE rafik_api WITH PASSWORD %L', $1::text) AS statement",
    [apiPassword],
  );
  await client.query(rows[0].statement);
} finally {
  await client.end();
}
