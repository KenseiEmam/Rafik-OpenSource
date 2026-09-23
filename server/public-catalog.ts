import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { ApiError } from "./db.ts";

// Public reference content only. No person, organization or uploaded content belongs here.
const root = new URL("../content/", import.meta.url);
export async function foodCatalog() {
  return JSON.parse(await readFile(new URL("foods.json", root), "utf8"));
}
export async function exerciseMediaCatalog() {
  return JSON.parse(
    await readFile(new URL("exercise-media.json", root), "utf8"),
  );
}
export async function exerciseMediaAsset(key: string, frame: string) {
  if (!/^[a-z0-9-]{1,100}$/.test(key) || !/^[123]$/.test(frame))
    throw new ApiError(404, "resource_unavailable");
  const manifest = await exerciseMediaCatalog();
  const item = manifest.items.find((item: { id: string }) => item.id === key);
  const asset = item?.frames[Number(frame) - 1];
  if (!asset) throw new ApiError(404, "resource_unavailable");
  const bytes = await readFile(
    new URL(`exercise-media/${key}/${frame}.svg`, root),
  );
  if (createHash("sha256").update(bytes).digest("hex") !== asset.sha256)
    throw new ApiError(503, "resource_unavailable");
  return { bytes, digest: asset.sha256 };
}
