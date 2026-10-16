import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { composeFile, dockerCompose, repositoryRoot } from "./docker.mjs";
const root = resolve(import.meta.dirname, "../.."),
  command = process.argv[2];
if (
  !readFileSync(composeFile, "utf8").startsWith(
    "name: rafik-prisma-local",
  )
)
  throw Error("Local compose guard failed");
const run = (program, args, options = {}) =>
  execFileSync(program, args, { cwd: root, stdio: "inherit", ...options });
const cli = resolve(repositoryRoot, "node_modules/.bin/prisma");
if (command === "start") {
  dockerCompose(["up", "-d", "--wait"]);
  run(cli, ["migrate", "deploy"]);
  run(cli, ["generate"]);
} else if (command === "stop") dockerCompose(["stop"]);
else if (command === "seed") {
  const count = dockerCompose(
    [
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
  dockerCompose(
    [
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
  // Preview identities may own real local organizations after normal app use.
  // Even rollback-only assertions need a canonical fixture baseline.
  run(process.execPath, [resolve(root, "scripts/prisma/fresh.mjs")]);
} else if (command === "web-env") {
  writeFileSync(
    resolve(repositoryRoot, ".env.local"),
    "VITE_API_URL=http://127.0.0.1:55331\nVITE_LOCAL_PREVIEW=true\n",
  );
  console.log("Wrote local API web configuration.");
} else
  throw Error(
    "Use start, stop, seed, test or web-env. Database reset is deliberately not an automatic command.",
  );
