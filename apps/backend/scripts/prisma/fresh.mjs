// Rehearse a fresh installation in a new disposable database; never reset the preview.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { composeFile, dockerCompose, repositoryRoot } from "./docker.mjs";
const root = resolve(import.meta.dirname, "../.."),
  name = "rafik_check_" + Date.now();
if (
  !readFileSync(composeFile, "utf8").startsWith(
    "name: rafik-prisma-local",
  )
)
  throw Error("Local guard failed");
const sql = (database, input) =>
  dockerCompose(
    [
      "exec",
      "-T",
      "db",
      "psql",
      "-U",
      "rafik_migrate",
      "-d",
      database,
      "-v",
      "ON_ERROR_STOP=1",
    ],
    {
      cwd: root,
      input,
      stdio: ["pipe", "pipe", "pipe"],
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    },
  );
let created = false;
try {
  sql("rafik", `create database ${name};`);
  created = true;
  execFileSync(
    resolve(repositoryRoot, "node_modules/.bin/prisma"),
    ["migrate", "deploy"],
    {
      cwd: root,
      env: {
        ...process.env,
        MIGRATION_DATABASE_URL: `postgresql://rafik_migrate:rafik-local-migrations-only@127.0.0.1:55332/${name}`,
      },
      stdio: "inherit",
    },
  );
  sql(name, readFileSync(resolve(root, "prisma/seed.sql"), "utf8"));
  for (const suite of [
    "core",
    "daily_coaching",
    "ongoing_coaching",
    "service_delivery",
    "team_business",
    "exercise_choices",
    "daily_workspace",
    "exercise_catalog",
  ])
    sql(name, readFileSync(resolve(root, `tests/sql/${suite}.sql`), "utf8"));
  console.log(
    "Fresh Prisma migrations, fixtures and eight SQL suites pass. Preview database unchanged.",
  );
} finally {
  if (created) sql("rafik", `drop database ${name} with (force);`);
}
