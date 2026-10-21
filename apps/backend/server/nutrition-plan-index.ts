import { Prisma } from "./generated/prisma/client.ts";
import { ApiError, type Actor } from "./db.ts";
import { scoped, uuid } from "./workspaces.ts";
import { role, recipient } from "./programming.ts";
import { pageOffset } from "./service-definitions.ts";

/** Staff plan summaries only: never include athlete food diaries or sharing details. */
export async function nutritionPlanIndex(
  actor: Actor,
  workspace: string,
  query: URLSearchParams,
) {
  const view = role(query.get("view"));
  if (view === "trainee") throw new ApiError(403, "forbidden");
  const status = query.get("status") || "active";
  if (!["active", "upcoming", "expired", "superseded", "all"].includes(status))
    throw new ApiError(400, "invalid_request");
  const offset = pageOffset(query.get("offset")),
    member = query.get("member");
  if (member) uuid(member);
  const search = "%" + (query.get("search") || "").trim().slice(0, 100) + "%";
  return scoped(actor, workspace, [view], async (tx, self) => {
    if (member) await recipient(tx, workspace, self, view, member);
    const prefix = Prisma.sql`WITH classified AS (
      SELECT p.id, p.member_id, m.name member_name, m.active member_active, p.revision,
        p.effective_on::text, p.expires_on::text,
        CASE WHEN EXISTS (SELECT 1 FROM public.organization_nutrition_plans newer
          WHERE newer.workspace_id=p.workspace_id AND newer.member_id=p.member_id
          AND ((newer.effective_on <= public.organization_member_today(m.id) AND newer.effective_on > p.effective_on)
            OR (newer.effective_on=p.effective_on AND newer.revision>p.revision))) THEN 'superseded'
          WHEN p.effective_on > public.organization_member_today(m.id) THEN 'upcoming'
          WHEN p.expires_on < public.organization_member_today(m.id) THEN 'expired' ELSE 'active' END status
      FROM public.organization_nutrition_plans p
      JOIN public.workspace_members m ON m.id=p.member_id AND m.workspace_id=p.workspace_id
      WHERE p.workspace_id=${workspace}::uuid AND (${view === "admin"} OR m.trainer_id=${self.id}::uuid)
        AND (${!member} OR m.id=${member || self.id}::uuid) AND m.name ILIKE ${search}
    ), filtered AS (SELECT * FROM classified WHERE (${status === "all"} OR status=${status})
      AND (${status !== "active" && status !== "upcoming"} OR member_active))`;
    const [items, counts] = await Promise.all([
      tx.$queryRaw(
        Prisma.sql`${prefix} SELECT * FROM filtered ORDER BY effective_on DESC, member_id, revision DESC, id LIMIT 10 OFFSET ${offset}`,
      ),
      tx.$queryRaw<{ total: number }[]>(
        Prisma.sql`${prefix} SELECT count(*)::int total FROM filtered`,
      ),
    ]);
    const total = counts[0].total;
    return { items, total, next: offset + 10 < total ? offset + 10 : null };
  });
}
