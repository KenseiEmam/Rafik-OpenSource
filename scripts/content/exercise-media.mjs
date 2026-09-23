// Verify the checked-in allowlist; --fetch repairs missing files from the pinned source only.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../../content/", import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL("exercise-media.json", root), "utf8"),
);
if (
  !/^[a-f0-9]{40}$/.test(manifest.source.commit) ||
  manifest.source.repository !== "https://github.com/bryllim/workout-guide"
)
  throw Error("Unexpected source");
let count = 0,
  total = 0;
for (const item of manifest.items) {
  if (!/^[a-z0-9-]{1,100}$/.test(item.id)) throw Error("Invalid key");
  for (const f of item.frames) {
    if (
      ![1, 2, 3].includes(f.index) ||
      !/^packages\/workout-guide\/assets\/[a-z0-9-]+\/frame-[123]\.svg$/.test(
        f.sourcePath,
      )
    )
      throw Error("Invalid frame");
    const dir = new URL(`exercise-media/${item.id}/`, root),
      path = new URL(`${f.index}.svg`, dir);
    let data;
    try {
      data = await readFile(path);
    } catch (error) {
      if (!process.argv.includes("--fetch")) throw error;
      const response = await fetch(
        `https://raw.githubusercontent.com/bryllim/workout-guide/${manifest.source.commit}/${f.sourcePath}`,
      );
      if (!response.ok) throw Error(`Download failed: ${response.status}`);
      data = Buffer.from(await response.arrayBuffer());
    }
    if (
      data.length !== f.bytes ||
      data.length > 200000 ||
      createHash("sha256").update(data).digest("hex") !== f.sha256
    )
      throw Error(`Hash/size mismatch: ${item.id}/${f.index}`);
    const svg = data.toString("utf8");
    if (
      !svg.includes('viewBox="0 0 512 512"') ||
      /<(?:script|foreignObject|image|animate|set)\b|\bon\w+\s*=|\bhref\s*=|url\s*\(|@import/i.test(
        svg,
      )
    )
      throw Error(`Unsafe or unexpected SVG: ${item.id}`);
    if (process.argv.includes("--fetch")) {
      await mkdir(dir, { recursive: true });
      await writeFile(path, data);
    }
    count++;
    total += data.length;
  }
}
console.log(`Verified ${count} pinned vector frames (${total} bytes).`);
