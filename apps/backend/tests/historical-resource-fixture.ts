import { asActor } from "../server/db.ts";
// Fixture-only creation for historical byte/recovery coverage; no runtime creation endpoint.
export async function historicalResource(
  actor: { id: string; email?: string },
  input: { id: string; title: string; filename: string; bytes: number },
) {
  if (
    !process.env.RAFIK_TEST_API ||
    !/\/rafik_browser_\d+$/.test(process.env.DATABASE_URL || "")
  )
    throw Error(
      "Historical resource fixtures require a disposable API database",
    );
  const data = await asActor(
    { ...actor, email: actor.email || null, user_metadata: {} },
    async (tx) => {
      const rows = await tx.$queryRaw<
        { data: unknown }[]
      >`SELECT to_jsonb(public.register_resource(${input.id}::uuid,${input.title},${input.filename},'text/plain',${input.bytes}::bigint)) data`;
      return rows[0].data as { object_path: string };
    },
  );
  return { status: 200, data };
}
