import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "../.."),
  command = process.argv[2];
if (
  !readFileSync(resolve(root, "compose.yaml"), "utf8").startsWith(
    "name: rafik-prisma-local",
  )
)
  throw Error("Local compose guard failed");
const run = (program, args, options = {}) =>
  execFileSync(program, args, { cwd: root, stdio: "inherit", ...options });
const cli = resolve(root, "node_modules/.bin/prisma");
if (command === "start") {
  run("docker", ["compose", "up", "-d", "--wait"]);
  run(cli, ["migrate", "deploy"]);
  run(cli, ["generate"]);
} else if (command === "stop") run("docker", ["compose", "stop"]);
else if (command === "seed") {
  const count = run(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "db",
      "psql",
      "-U",
      "rafik_migrate",
      "-d",
      "rafik",
      "-Atc",
      "select count(*) from public.profiles",
    ],
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  ).trim();
  if (count !== "0")
    throw Error(
      "Seed requires an empty local database; no preview records were changed.",
    );
  run(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "db",
      "psql",
      "-U",
      "rafik_migrate",
      "-d",
      "rafik",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    {
      input: readFileSync(resolve(root, "prisma/seed.sql")),
      stdio: ["pipe", "inherit", "inherit"],
    },
  );
} else if (command === "test") {
  const input = [
    "core",
    "daily_coaching",
    "ongoing_coaching",
    "service_delivery",
    "team_business",
    "exercise_choices",
    "daily_workspace",
    "exercise_catalog",
  ]
    .map((n) => readFileSync(resolve(root, `tests/sql/${n}.sql`), "utf8"))
    .join("\n");
  const result = spawnSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "db",
      "psql",
      "-U",
      "rafik_migrate",
      "-d",
      "rafik",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { cwd: root, input, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
  );
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  process.exitCode = result.status ?? 1;
} else if (command === "web-env") {
  writeFileSync(
    resolve(root, "../RAFIK-FRONTEND/.env.local"),
    "VITE_API_URL=http://127.0.0.1:55331\nVITE_LOCAL_PREVIEW=true\n",
  );
  console.log("Wrote local API web configuration.");
} else
  throw Error(
    "Use start, stop, seed, test or web-env. Database reset is deliberately not an automatic command.",
  );
