import { test, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  foodCatalog,
  exerciseMediaCatalog,
  exerciseMediaAsset,
} from "../server/public-catalog.ts";
import { db } from "../server/db.ts";
after(() => db.$disconnect());
test("curated nutrition preserves source energy, macro units, portions and provenance", async () => {
  const data = await foodCatalog();
  assert.equal(data.schema, 1);
  assert.equal(data.foods.length, 15);
  assert.equal(new Set(data.foods.map((f: { id: string }) => f.id)).size, 15);
  for (const f of data.foods) {
    assert.equal(f.basis, 100);
    assert.equal(f.unit, "g");
    assert.match(f.sourceUrl, /^https:\/\/fdc.nal.usda.gov\//);
    assert.ok(f.originalDescription && f.name_ar);
    for (const k of ["kcal", "protein_g", "carb_g", "fat_g"])
      assert.ok(Number.isFinite(f.nutrients[k]) && f.nutrients[k] >= 0);
    for (const p of f.portions) {
      assert.match(p.name_ar, /[\u0600-\u06ff]/);
      assert.ok(
        p.grams > 0 &&
          f.sourcePortions.some(
            (s: { gramWeight: number }) => s.gramWeight === p.grams,
          ),
      );
    }
  }
  assert.equal(
    data.foods.find((f: { fdcId: number }) => f.fdcId === 171413).nutrients
      .kcal,
    884,
  );
  const response = await fetch("http://127.0.0.1:55331/v1/catalog/foods");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).version, data.version);
});
test("all reviewed illustrations have immutable URLs, safe vectors, hashes and retained attribution", async () => {
  const manifest = await exerciseMediaCatalog();
  assert.equal(manifest.items.length, 10);
  const starter = JSON.parse(
    await readFile(new URL("../content/starter.json", import.meta.url), "utf8"),
  );
  for (const item of manifest.items)
    assert.equal(
      starter.exercises.find((e: { id: string }) => e.id === item.exerciseId)
        ?.media_ref,
      item.id,
    );
  for (const e of starter.exercises)
    if (e.media_ref)
      assert.ok(
        manifest.items.some((item: { id: string }) => item.id === e.media_ref),
      );
  let total = 0;
  for (const item of manifest.items) {
    assert.equal(item.frames.length, 3);
    assert.equal(item.modified, false);
    assert.equal(item.attribution.license, "CC BY-SA 4.0");
    for (const frame of item.frames) {
      const result = await exerciseMediaAsset(item.id, String(frame.index));
      total += result.bytes.length;
      assert.equal(
        createHash("sha256").update(result.bytes).digest("hex"),
        frame.sha256,
      );
      assert.doesNotMatch(
        result.bytes.toString(),
        /<(?:script|foreignObject|image|animate|set)\b|\bon\w+\s*=|\bhref\s*=|url\s*\(|@import/i,
      );
      assert.equal(frame.width, 512);
      assert.equal(frame.height, 512);
      if (existsSync(new URL("../../RAFIK-FRONTEND/", import.meta.url))) {
        const web = await readFile(
          new URL(
            `../../RAFIK-FRONTEND/public/exercise-media/${item.id}/${frame.index}.svg`,
            import.meta.url,
          ),
        );
        assert.deepEqual(web, result.bytes);
      }
    }
  }
  assert.ok(total < 1000000);
  await assert.rejects(exerciseMediaAsset("../private", "1"));
  await assert.rejects(exerciseMediaAsset(manifest.items[0].id, "4"));
  const response = await fetch(
    "http://127.0.0.1:55331" + manifest.items[0].frames[0].path,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/svg+xml");
  assert.match(response.headers.get("cache-control")!, /immutable/);
  assert.match(response.headers.get("content-security-policy")!, /sandbox/);
});
