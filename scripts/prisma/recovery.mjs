// Disposable restore rehearsal; never restore over the preview.
import { execFileSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
  lstatSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
const root = resolve(import.meta.dirname, "../..");
if (
  !readFileSync(resolve(root, "compose.yaml"), "utf8").startsWith(
    "name: rafik-prisma-local",
  )
)
  throw Error("Local project required");
const stamp = Date.now(),
  database = "rafik_restore_" + stamp,
  out = resolve(root, ".local/backups", String(stamp));
const docker = (args, options = {}) =>
  execFileSync("docker", ["compose", "exec", "-T", "db", ...args], {
    cwd: root,
    maxBuffer: 256 * 1024 * 1024,
    ...options,
  });
const sql = (db, input) =>
  docker(
    ["psql", "-U", "rafik_migrate", "-d", db, "-At", "-v", "ON_ERROR_STOP=1"],
    { input, encoding: "utf8" },
  ).trim();
mkdirSync(resolve(out, "files"), { recursive: true, mode: 0o700 });
writeFileSync(
  resolve(out, "database.dump"),
  docker(["pg_dump", "-U", "rafik_migrate", "-d", "rafik", "-Fc"]),
  { mode: 0o600 },
);
const files = resolve(root, ".local/files"),
  manifest = [];
for (const name of existsSync(files) ? readdirSync(files) : []) {
  if (!/^[a-f0-9]{64}$/.test(name) || !lstatSync(resolve(files, name)).isFile())
    continue;
  copyFileSync(resolve(files, name), resolve(out, "files", name));
  manifest.push({
    name,
    sha256: createHash("sha256")
      .update(readFileSync(resolve(out, "files", name)))
      .digest("hex"),
  });
}
let created = false;
try {
  sql("rafik", `CREATE DATABASE ${database};`);
  created = true;
  docker(
    ["pg_restore", "-U", "rafik_migrate", "-d", database, "--exit-on-error"],
    { input: readFileSync(resolve(out, "database.dump")) },
  );
  const paths = sql(
    database,
    "select object_path from public.resources where state='ready' union select 'program/'||workspace_id||'/'||id from public.program_media;",
  )
    .split("\n")
    .filter(Boolean);
  const hashes = new Set(manifest.map((x) => x.name));
  const metadata = JSON.parse(
    sql(
      database,
      "select coalesce(json_agg(x),'[]') from (select object_path path,bytes::int bytes,null::text digest from public.resources where state='ready' union all select 'program/'||workspace_id||'/'||id,bytes,digest from public.program_media) x;",
    ),
  );
  for (const row of metadata) {
    const contents = readFileSync(
      resolve(
        out,
        "files",
        createHash("sha256").update(row.path).digest("hex"),
      ),
    );
    if (
      contents.length !== row.bytes ||
      (row.digest &&
        createHash("sha256").update(contents).digest("hex") !== row.digest)
    )
      throw Error("Restored private bytes do not match metadata");
  }
  for (const path of paths)
    if (!hashes.has(createHash("sha256").update(path).digest("hex")))
      throw Error("Restored metadata references a missing private file");
  const counts = sql(
    database,
    "select json_build_object('users',(select count(*) from identity.users),'workspaces',(select count(*) from public.workspaces),'sessions',(select count(*) from public.sessions)+(select count(*) from public.organization_sessions),'messages',(select count(*) from public.messages)+(select count(*) from public.organization_messages));",
  );
  writeFileSync(
    resolve(out, "manifest.json"),
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        scope: "local recovery rehearsal",
        counts: JSON.parse(counts),
        files: manifest,
        referencedFiles: paths.length,
        restore: "passed",
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(
    JSON.stringify({
      restore: "passed",
      databaseRemoved: true,
      counts: JSON.parse(counts),
      referencedFiles: paths.length,
      backup: out,
    }),
  );
} finally {
  if (created) sql("rafik", `DROP DATABASE ${database} WITH (FORCE);`);
}
