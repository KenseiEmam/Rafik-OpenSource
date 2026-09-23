import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
test("local runtime rejects remote, unrelated local databases and production adapters", () => {
  for (const url of [
    "postgresql://rafik_api:x@example.com:55332/rafik",
    "postgresql://rafik_api:x@127.0.0.1:5432/rafik",
    "postgresql://rafik_api:x@127.0.0.1:55332/unrelated",
  ]) {
    const result = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "-e",
        "import('./server/db.ts').then(m=>m.db.$disconnect())",
      ],
      { env: { ...process.env, DATABASE_URL: url }, encoding: "utf8" },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /local API accepts only/);
  }
  const production = spawnSync(
    process.execPath,
    ["--import", "tsx", "-e", "import('./server/db.ts')"],
    { env: { ...process.env, NODE_ENV: "production" }, encoding: "utf8" },
  );
  assert.notEqual(production.status, 0);
  assert.match(production.stderr, /Hosting adapters/);
});
