import { test } from "node:test";
import assert from "node:assert/strict";
import {
  exerciseVideoCatalog,
  exerciseVideoAsset,
  videoRange,
} from "../server/public-catalog.ts";
test("video ranges bound playback and reject malformed and unsatisfiable requests", () => {
  assert.equal(videoRange(undefined, 100), null);
  assert.deepEqual(videoRange("bytes=0-1", 100), { start: 0, end: 1 });
  assert.deepEqual(videoRange("bytes=90-", 100), { start: 90, end: 99 });
  assert.deepEqual(videoRange("bytes=-10", 100), { start: 90, end: 99 });
  assert.deepEqual(videoRange("bytes=90-900", 100), { start: 90, end: 99 });
  for (const value of [
    "bytes=100-",
    "bytes=2-1",
    "bytes=-0",
    "bytes=0-1,3-4",
    "items=1-2",
    "bytes=-",
    "bytes=9007199254740994-",
  ])
    assert.throws(() => videoRange(value, 100));
});
test("motion pack retains exact exercise identity, source and derivative integrity", async () => {
  const pack = await exerciseVideoCatalog();
  assert.equal(pack.items.length, 45);
  assert.equal(new Set(pack.items.map((i: any) => i.exerciseId)).size, 45);
  assert.ok(!pack.items.some((i: any) => i.exerciseId === "wger-477"));
  let bytes = 0;
  for (const item of pack.items) {
    assert.equal(item.exerciseId, "wger-" + item.source.exerciseId);
    assert.equal(item.license, "CC-BY-SA-4.0");
    assert.equal(item.creator, "Goulart");
    assert.match(item.sourceSha256, /^[a-f0-9]{64}$/);
    for (const ext of ["mp4", "webp"]) {
      const a = await exerciseVideoAsset(item.id, ext);
      bytes += a.bytes.length;
      assert.equal(a.mime, ext === "mp4" ? "video/mp4" : "image/webp");
    }
  }
  assert.ok(bytes < 60_000_000);
  await assert.rejects(exerciseVideoAsset("../private", "mp4"));
  await assert.rejects(exerciseVideoAsset(pack.items[0].id, "svg"));
});
