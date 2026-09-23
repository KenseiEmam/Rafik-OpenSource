import { asActor, ApiError, type Actor } from "./db.ts";
import { readPrivate, writePrivate, removePrivate } from "./private-bytes.ts";
export async function fileOperation(
  actor: Actor,
  method: string,
  path: string,
  bytes: Buffer,
  type: string,
) {
  if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}$/.test(path))
    throw new ApiError(400, "invalid_file");
  return asActor(actor, async (tx) => {
    if (method === "GET") {
      const objects = await tx.$queryRaw<
        { metadata: { mimetype: string } }[]
      >`SELECT metadata FROM file_store.objects WHERE bucket_id='rafik-private' AND name=${path}`;
      if (!objects.length) throw new ApiError(404, "resource_unavailable");
      const contents = await readPrivate(path);
      return { bytes: contents, type: objects[0].metadata.mimetype };
    }
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${path},42))::text`;
    const resources = await tx.$queryRaw<
      { owner_id: string; bytes: bigint; media_type: string; state: string }[]
    >`SELECT owner_id,bytes,media_type,state FROM public.resources WHERE object_path=${path}`;
    const r = resources[0];
    if (!r || r.owner_id !== actor.id) throw new ApiError(403, "forbidden");
    if (method === "PUT") {
      const access = await tx.$queryRaw<
        { allowed: boolean }[]
      >`SELECT public.can_upload_resource(${path}) allowed`;
      if (!access[0]?.allowed) throw new ApiError(409, "resource_unavailable");
      if (
        BigInt(bytes.length) !== r.bytes ||
        type !== r.media_type ||
        bytes.length > 10485760
      )
        throw new ApiError(400, "invalid_file");
      const old = await tx.$queryRaw<
        unknown[]
      >`SELECT id FROM file_store.objects WHERE bucket_id='rafik-private' AND name=${path}`;
      if (old.length) throw new ApiError(409, "file_exists");
      await writePrivate(path, bytes);
      await tx.$executeRaw`INSERT INTO file_store.objects(bucket_id,name,metadata) VALUES('rafik-private',${path},${JSON.stringify({ size: bytes.length, mimetype: type })}::jsonb)`;
      return { saved: true };
    }
    if (method === "DELETE") {
      if (r.state !== "retired")
        throw new ApiError(409, "resource_unavailable");
      // Retired files cannot be shared/read; retry after byte deletion safely finishes metadata deletion.
      await removePrivate(path);
      await tx.$executeRaw`DELETE FROM file_store.objects WHERE bucket_id='rafik-private' AND name=${path}`;
      return { removed: true };
    }
    throw new ApiError(405, "method_not_allowed");
  });
}
