import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const raw = readFileSync(resolve(root, "content/exercise-videos.json"), "utf8");
const pack = JSON.parse(raw);
if (
  pack.items.length !== 45 ||
  new Set(pack.items.map((x) => x.exerciseId)).size !== 45
)
  throw Error("Expected 45 distinct reviewed motion entries");
for (const item of pack.items) {
  if (
    item.creator !== "Goulart" ||
    item.license !== "CC-BY-SA-4.0" ||
    !item.sourceSha256 ||
    !item.modified ||
    !item.changes
  )
    throw Error("Missing motion provenance");
  for (const [key, extension] of [
    ["video", "mp4"],
    ["poster", "webp"],
  ]) {
    const a = item[key],
      data = readFileSync(
        resolve(root, `content/exercise-videos/${item.id}.${extension}`),
      );
    if (
      data.length !== a.bytes ||
      createHash("sha256").update(data).digest("hex") !== a.sha256
    )
      throw Error(`Changed immutable asset ${item.id}`);
    if (a.path !== `/v1/catalog/exercise-videos/${item.id}.${extension}`)
      throw Error("Noncanonical path");
  }
}
const web = resolve(root, "../src/content/exercise-videos.json");
const migration = resolve(
  root,
  "prisma/migrations/202609231550_exercise_motion_references/migration.sql",
);
const sql =
  "-- R15: attach immutable motion keys to their own wger source records only. Existing prescriptions remain unchanged.\n" +
  pack.items
    .map(
      (i) =>
        `UPDATE public.exercises SET media_ref = '${i.id}' WHERE id = '${i.exerciseId}' AND owner_id IS NULL;`,
    )
    .join("\n") +
  "\n";
if (process.argv.includes("--generate")) {
  mkdirSync(dirname(migration), { recursive: true });
  writeFileSync(migration, sql);
  writeFileSync(web, raw);
} else {
  if (readFileSync(migration, "utf8") !== sql)
    throw Error("Motion migration drift");
  // The API checkout can be verified independently in CI.
  try {
    if (readFileSync(web, "utf8") !== raw)
      throw Error("Regenerate web motion manifest");
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}
console.log(
  `Verified ${pack.items.length} videos and posters (${pack.items.reduce((n, i) => n + i.video.bytes + i.poster.bytes, 0)} bytes), exact identities and provenance.`,
);
