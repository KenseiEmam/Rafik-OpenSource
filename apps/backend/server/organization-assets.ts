import { createHash } from "node:crypto";
import { ApiError, db, type Actor } from "./db.ts";
import {
  scoped,
  mutation,
  uuid,
  textValue,
  type Tx,
  type Role,
  access,
} from "./workspaces.ts";
const role = (v: unknown): Role => {
  if (!["admin", "trainer", "trainee"].includes(String(v)))
    throw new ApiError(400, "invalid_roles");
  return v as Role;
};
import { pageOffset } from "./service-definitions.ts";
import { readPrivate, writePrivate } from "./private-bytes.ts";
type Self = Awaited<ReturnType<typeof access>>;
export type Asset = {
  id: string;
  workspace_id: string;
  owner_id: string;
  purpose: string;
  channel_id: string | null;
  filename: string;
  media_type: string;
  bytes: number;
  digest: string;
  retired: boolean;
  revision?: number;
  created_at: Date;
};
export const assetPath = (asset: Asset) =>
  `organization/${asset.workspace_id}/${asset.id}`;
function validBytes(bytes: Buffer, type: string) {
  if (type === "image/png")
    return bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === "image/jpeg")
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (type === "image/webp")
    return (
      bytes.subarray(0, 4).toString() === "RIFF" &&
      bytes.subarray(8, 12).toString() === "WEBP"
    );
  if (type === "image/gif")
    return ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString());
  if (type === "video/mp4") return bytes.subarray(4, 8).toString() === "ftyp";
  if (type === "application/pdf")
    return bytes.subarray(0, 5).toString() === "%PDF-";
  return false;
}
async function channelMember(
  tx: Tx,
  workspace: string,
  self: Self,
  channel: string,
) {
  const found = await tx.organization_channels.findFirst({
    where: {
      id: channel,
      workspace_id: workspace,
      organization_channel_members: { some: { member_id: self.id } },
    },
  });
  if (!found) throw new ApiError(403, "conversation_unavailable");
  return found;
}
export async function putOrganizationAsset(
  actor: Actor,
  workspace: string,
  id: string,
  q: URLSearchParams,
  bytes: Buffer,
  type: string,
) {
  uuid(id);
  const view = role(q.get("view")),
    purpose = String(q.get("purpose")),
    channel = q.get("channel") ? uuid(q.get("channel")) : null;
  if (
    !["exercise", "message"].includes(purpose) ||
    (purpose === "message") !== !!channel ||
    !bytes.length ||
    bytes.length > 26214400 ||
    !validBytes(bytes, type) ||
    (purpose === "exercise" && type === "application/pdf")
  )
    throw new ApiError(400, "invalid_file");
  const filename = textValue(q.get("filename"), 180).replace(
      /[\r\n\/\\]/g,
      "_",
    ),
    digest = createHash("sha256").update(bytes).digest("hex");
  return scoped(actor, workspace, [view], async (tx, self) => {
    if (purpose === "exercise" && view === "trainee")
      throw new ApiError(403, "forbidden");
    if (channel && (await channelMember(tx, workspace, self, channel)).archived)
      throw new ApiError(409, "conversation_unavailable");
    const old = (
      await tx.$queryRaw<
        Asset[]
      >`SELECT * FROM public.organization_assets WHERE id=${id}::uuid`
    )[0];
    if (
      old &&
      (old.workspace_id !== workspace ||
        old.owner_id !== self.id ||
        old.digest !== digest ||
        old.purpose !== purpose ||
        old.channel_id !== channel ||
        old.media_type !== type ||
        old.filename !== filename ||
        old.retired)
    )
      throw new ApiError(409, "file_mismatch");
    const record = {
      id,
      workspace_id: workspace,
      owner_id: self.id,
      purpose,
      channel_id: channel,
      filename,
      media_type: type,
      bytes: bytes.length,
      digest,
      retired: false,
      created_at: new Date(),
    };
    await writePrivate(assetPath(record), bytes);
    if (!old)
      await tx.$executeRaw`INSERT INTO public.organization_assets(id,workspace_id,owner_id,purpose,channel_id,filename,media_type,bytes,digest) VALUES(${id}::uuid,${workspace}::uuid,${self.id}::uuid,${purpose},${channel}::uuid,${filename},${type},${bytes.length},${digest})`;
    return { id, filename, media_type: type, bytes: bytes.length };
  });
}
export async function usableExerciseAsset(
  tx: Tx,
  workspace: string,
  self: Self,
  value: unknown,
  retained = false,
) {
  const id = uuid(value);
  const a = (
    await tx.$queryRaw<
      Asset[]
    >`SELECT * FROM public.organization_assets WHERE id=${id}::uuid AND workspace_id=${workspace}::uuid AND purpose='exercise' AND (NOT retired OR ${retained})`
  )[0];
  if (!a) throw new ApiError(403, "resource_unavailable");
  if (a.owner_id !== self.id) {
    const shared = await tx.$queryRaw<
      { id: string }[]
    >`SELECT id FROM public.organization_exercises WHERE workspace_id=${workspace}::uuid AND active AND coalesce(data->>'scope','organization')='organization' AND data->>'media_asset'=${id} LIMIT 1`;
    if (!shared.length) throw new ApiError(403, "forbidden");
  }
  return a;
}
export async function getOrganizationAsset(actor: Actor, id: string) {
  uuid(id);
  const a = (
    await db.$queryRaw<
      Asset[]
    >`SELECT * FROM public.organization_assets WHERE id=${id}::uuid`
  )[0];
  if (!a) throw new ApiError(404, "resource_unavailable");
  return scoped(actor, a.workspace_id, [], async (tx, self) => {
    if (a.purpose === "message") {
      await channelMember(tx, a.workspace_id, self, a.channel_id!);
      const sent = await tx.organization_messages.findFirst({
        where: { channel_id: a.channel_id!, asset_id: a.id },
      });
      if (a.owner_id !== self.id && !sent) throw new ApiError(403, "forbidden");
    } else if (
      a.owner_id !== self.id ||
      !self.roles.some((r) => ["admin", "trainer"].includes(r))
    ) {
      const shared = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM public.organization_exercises WHERE workspace_id=${a.workspace_id}::uuid AND active AND coalesce(data->>'scope','organization')='organization' AND data->>'media_asset'=${a.id} LIMIT 1`;
      const staff = self.roles.some((r) => ["admin", "trainer"].includes(r));
      if (!(staff && shared.length)) {
        // Exact JSON scalar lookup, never substring matching. Only authorized versions/session snapshots qualify.
        const reference = JSON.stringify({ asset: a.id });
        const allowed = await tx.$queryRaw<
          { id: string }[]
        >`SELECT v.id FROM public.organization_versions v JOIN public.organization_programs p ON p.id=v.program_id WHERE v.workspace_id=${a.workspace_id}::uuid AND jsonb_path_exists(v.prescription,'$.**.media_asset ? (@ == $asset)',${reference}::jsonb) AND (${self.roles.includes("admin")} OR p.created_by=${self.id}::uuid AND ${staff} OR p.listed AND NOT p.archived AND ${staff} OR EXISTS(SELECT 1 FROM public.organization_assignments s JOIN public.workspace_members m ON m.id=s.member_id WHERE s.version_id=v.id AND (m.id=${self.id}::uuid OR m.trainer_id=${self.id}::uuid AND ${staff}))) UNION ALL SELECT s.id FROM public.organization_sessions s JOIN public.workspace_members m ON m.id=s.member_id WHERE s.workspace_id=${a.workspace_id}::uuid AND jsonb_path_exists(s.document,'$.**.media_asset ? (@ == $asset)',${reference}::jsonb) AND (${self.roles.includes("admin")} OR m.id=${self.id}::uuid OR m.trainer_id=${self.id}::uuid AND ${staff}) LIMIT 1`;
        if (!allowed.length) throw new ApiError(403, "forbidden");
      }
    }
    return {
      bytes: await readPrivate(assetPath(a)),
      type: a.media_type,
      filename: a.filename,
    };
  });
}
export async function organizationAssets(
  actor: Actor,
  workspace: string,
  q: URLSearchParams,
) {
  const view = role(q.get("view")),
    offset = pageOffset(q.get("offset"));
  if (view === "trainee") throw new ApiError(403, "forbidden");
  return scoped(actor, workspace, [view], async (tx, self) => {
    const search = "%" + (q.get("search") || "").slice(0, 100) + "%";
    const items = await tx.$queryRaw<
      Asset[]
    >`SELECT a.* FROM public.organization_assets a WHERE a.workspace_id=${workspace}::uuid AND a.purpose='exercise' AND a.filename ILIKE ${search} AND a.retired=${q.get("archived") === "true"} AND (a.owner_id=${self.id}::uuid OR EXISTS(SELECT 1 FROM public.organization_exercises e WHERE e.workspace_id=a.workspace_id AND e.active AND coalesce(e.data->>'scope','organization')='organization' AND e.data->>'media_asset'=a.id::text)) ORDER BY a.created_at DESC,a.id LIMIT 25 OFFSET ${offset}`;
    return {
      items: items
        .slice(0, 24)
        .map((a) => ({ ...a, editable: a.owner_id === self.id })),
      next: items.length > 24 ? offset + 24 : null,
    };
  });
}

export async function assetCommand(
  actor: Actor,
  workspace: string,
  input: Record<string, unknown>,
) {
  const view = role(input.view),
    id = uuid(input.id);
  if (
    view === "trainee" ||
    input.action !== "archive" ||
    typeof input.retired !== "boolean"
  )
    throw new ApiError(400, "invalid_request");
  const authorize = async (tx: Tx, self: Self) => {
    const a = (
      await tx.$queryRaw<
        Asset[]
      >`SELECT * FROM public.organization_assets WHERE id=${id}::uuid AND workspace_id=${workspace}::uuid AND purpose='exercise'`
    )[0];
    if (!a || a.owner_id !== self.id) throw new ApiError(403, "forbidden");
    return a;
  };
  return mutation(
    actor,
    workspace,
    [view],
    input,
    async (tx, self) => {
      const a = await authorize(tx, self);
      if (a.revision !== input.revision) throw new ApiError(409, "conflict");
      await tx.$executeRaw`UPDATE public.organization_assets SET retired=${input.retired as boolean},revision=revision+1 WHERE id=${id}::uuid`;
      return { id, retired: input.retired, revision: a.revision! + 1 };
    },
    async (tx, self) => {
      await authorize(tx, self);
    },
  );
}
