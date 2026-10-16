import { ApiError, type Actor } from "./db.ts";
import {
  scoped,
  mutation,
  event,
  uuid,
  textValue,
  type Tx,
  type Role,
  access,
} from "./workspaces.ts";
import { role, recipient } from "./programming.ts";
import { calendarDate, pageOffset } from "./service-definitions.ts";
type Self = Awaited<ReturnType<typeof access>>;
export type Package = {
  id: string;
  workspace_id: string;
  member_id: string;
  title: string;
  allowance: number;
  starts_on: Date;
  ends_on: Date;
  timezone: string;
  archived: boolean;
  revision: number;
  reserved: number;
  used: number;
  available: number;
};
export async function packageRecord(tx: Tx, workspace: string, key: string) {
  const row = (
    await tx.$queryRaw<
      Package[]
    >`SELECT p.*,m.name member_name,m.active member_active,(SELECT id FROM public.organization_packages n WHERE n.renewed_from=p.id) renewal_id FROM public.organization_package_balances p JOIN public.workspace_members m ON m.id=p.member_id WHERE p.workspace_id=${workspace}::uuid AND p.id=${uuid(key)}::uuid`
  )[0];
  if (!row) throw new ApiError(403, "package_unavailable");
  return row;
}
async function packageAccess(
  tx: Tx,
  workspace: string,
  self: Self,
  view: Role,
  key: string,
) {
  const row = await packageRecord(tx, workspace, key);
  await recipient(tx, workspace, self, view, row.member_id);
  return row;
}
export async function packages(
  actor: Actor,
  workspace: string,
  q: URLSearchParams,
) {
  const view = role(q.get("view"));
  return scoped(actor, workspace, [view], async (tx, self) => {
    if (q.get("id")) {
      const item = await packageAccess(tx, workspace, self, view, q.get("id")!);
      const offset = pageOffset(q.get("offset"));
      const items = await tx.$queryRaw<
        unknown[]
      >`SELECT e.id,e.title,e.starts_at,e.ends_at,e.timezone,e.state,ep.attendance,ep.charge_absence,ep.independent_reason,CASE WHEN e.state='scheduled' THEN 'reserved' WHEN e.state='completed' AND (ep.attendance='present' OR (ep.attendance='absent' AND ep.charge_absence=true)) THEN 'used' ELSE 'released' END allocation FROM public.organization_event_people ep JOIN public.organization_events e ON e.id=ep.event_id WHERE ep.package_id=${item.id}::uuid ORDER BY e.starts_at DESC,e.id LIMIT 25 OFFSET ${offset}`;
      return {
        item,
        items: items.slice(0, 24),
        next: items.length > 24 ? offset + 24 : null,
      };
    }
    const member = q.get("member") ? uuid(q.get("member")) : null;
    if (member) await recipient(tx, workspace, self, view, member);
    const status = q.get("status") || "active";
    if (!["active", "expired", "archived", "all"].includes(status))
      throw new ApiError(400, "invalid_request");
    const search = "%" + (q.get("search") || "").slice(0, 100) + "%",
      offset = pageOffset(q.get("offset"));
    const rows = await tx.$queryRaw<
      (Package & { member_name: string })[]
    >`SELECT p.*,m.name member_name,m.active member_active,(SELECT id FROM public.organization_packages n WHERE n.renewed_from=p.id) renewal_id FROM public.organization_package_balances p JOIN public.workspace_members m ON m.id=p.member_id WHERE p.workspace_id=${workspace}::uuid AND (${view === "admin"} OR (${view === "trainer"} AND m.trainer_id=${self.id}::uuid) OR (${view === "trainee"} AND m.id=${self.id}::uuid)) AND (${member}::uuid IS NULL OR p.member_id=${member}::uuid) AND (p.title ILIKE ${search} OR m.name ILIKE ${search}) AND (${status === "all"} OR (${status === "archived"} AND p.archived) OR (${status === "active"} AND NOT p.archived AND p.ends_on>=(now() AT TIME ZONE p.timezone)::date) OR (${status === "expired"} AND NOT p.archived AND p.ends_on<(now() AT TIME ZONE p.timezone)::date)) ORDER BY p.ends_on,p.created_at,p.id LIMIT 25 OFFSET ${offset}`;
    return {
      items: rows.slice(0, 24),
      next: rows.length > 24 ? offset + 24 : null,
    };
  });
}
export async function packageCommand(
  actor: Actor,
  workspace: string,
  input: Record<string, unknown>,
) {
  const view = role(input.view),
    key = uuid(input.id),
    action = String(input.action);
  if (view !== "admin" || !["create", "adjust", "archive"].includes(action))
    throw new ApiError(403, "forbidden");
  return mutation(
    actor,
    workspace,
    [view],
    input,
    async (tx, self) => {
      if (action === "create") {
        const member = await recipient(
            tx,
            workspace,
            self,
            view,
            uuid(input.member),
            true,
          ),
          title = textValue(input.title, 160),
          starts = calendarDate(input.starts_on),
          ends = calendarDate(input.ends_on),
          zone = String(input.timezone);
        if (
          ends < starts ||
          !Number.isSafeInteger(input.allowance) ||
          Number(input.allowance) < 1 ||
          Number(input.allowance) > 1000
        )
          throw new ApiError(400, "invalid_request");
        const zones = await tx.$queryRaw<
          unknown[]
        >`SELECT name FROM pg_timezone_names WHERE name=${zone}`;
        if (!zones.length) throw new ApiError(400, "invalid_timezone");
        const renewed = input.renewed_from ? uuid(input.renewed_from) : null;
        if (renewed) {
          const source = await packageAccess(
            tx,
            workspace,
            self,
            view,
            renewed,
          );
          if (source.member_id !== member.id)
            throw new ApiError(403, "package_unavailable");
          const successors = await tx.$queryRaw<
            unknown[]
          >`SELECT id FROM public.organization_packages WHERE renewed_from=${renewed}::uuid`;
          if (successors.length)
            throw new ApiError(409, "package_already_renewed");
        }
        const existing = await tx.$queryRaw<
          unknown[]
        >`SELECT id FROM public.organization_packages WHERE id=${key}::uuid`;
        if (existing.length) throw new ApiError(409, "conflict");
        await tx.$executeRaw`INSERT INTO public.organization_packages(id,workspace_id,member_id,created_by,title,allowance,starts_on,ends_on,timezone,renewed_from) VALUES(${key}::uuid,${workspace}::uuid,${member.id}::uuid,${self.id}::uuid,${title},${Number(input.allowance)},${starts}::date,${ends}::date,${zone},${renewed}::uuid)`;
        await event(tx, actor, workspace, "package_created", key, {
          member: member.id,
          allowance: Number(input.allowance),
          renewed_from: renewed,
          starts,
          ends,
          zone,
        });
      } else {
        const old = await packageAccess(tx, workspace, self, view, key);
        if (old.revision !== input.revision)
          throw new ApiError(409, "conflict");
        if (action === "archive") {
          if (
            typeof input.archived !== "boolean" ||
            (input.archived && old.reserved > 0)
          )
            throw new ApiError(400, "package_has_reservations");
          await tx.$executeRaw`UPDATE public.organization_packages SET archived=${input.archived},revision=revision+1,updated_at=now() WHERE id=${key}::uuid`;
          await event(tx, actor, workspace, "package_archived", key, {
            archived: input.archived,
          });
        } else {
          const allowance = Number(input.allowance),
            reason = textValue(input.reason, 500);
          if (
            !Number.isSafeInteger(input.allowance) ||
            allowance < 1 ||
            allowance > 1000 ||
            allowance < old.used + old.reserved ||
            old.archived
          )
            throw new ApiError(400, "package_capacity");
          await tx.$executeRaw`UPDATE public.organization_packages SET allowance=${allowance},revision=revision+1,updated_at=now() WHERE id=${key}::uuid`;
          await event(tx, actor, workspace, "package_allowance_adjusted", key, {
            before: old.allowance,
            after: allowance,
            reason,
          });
        }
      }
      return packageRecord(tx, workspace, key);
    },
    async (tx, self) => {
      if (action === "create")
        await recipient(tx, workspace, self, view, uuid(input.member), true);
      else await packageAccess(tx, workspace, self, view, key);
    },
  );
}
// Called inside the existing per-organization transaction, after the tentative
// booking/correction. Failure rolls back all occurrences, attendance and receipts.
export async function assertPackageCapacity(
  tx: Tx,
  workspace: string,
  keys: string[],
) {
  for (const key of new Set(keys))
    if ((await packageRecord(tx, workspace, key)).available < 0)
      throw new ApiError(409, "package_capacity");
}
export async function validatePackageDate(
  tx: Tx,
  workspace: string,
  key: string,
  member: string,
  start: Date,
) {
  const item = await packageRecord(tx, workspace, key);
  if (item.member_id !== member || item.archived)
    throw new ApiError(403, "package_unavailable");
  const valid = (
    await tx.$queryRaw<
      { valid: boolean }[]
    >`SELECT (${start}::timestamptz AT TIME ZONE ${item.timezone})::date BETWEEN starts_on AND ends_on valid FROM public.organization_packages WHERE id=${key}::uuid`
  )[0]?.valid;
  if (!valid) throw new ApiError(400, "package_date");
  return item;
}
export function participantFunding(input: unknown, participants: string[]) {
  if (input === undefined)
    return new Map(
      participants.map((member) => [
        member,
        {
          member,
          package_id: null as string | null,
          independent_reason: "other",
          makeup_for: null as string | null,
        },
      ]),
    );
  if (!Array.isArray(input) || input.length !== participants.length)
    throw new ApiError(400, "invalid_funding");
  const found = new Map<
    string,
    {
      member: string;
      package_id: string | null;
      independent_reason: string;
      makeup_for: string | null;
    }
  >();
  for (const value of input) {
    if (!value || typeof value !== "object")
      throw new ApiError(400, "invalid_funding");
    const row = value as Record<string, unknown>,
      member = uuid(row.member);
    if (!participants.includes(member) || found.has(member))
      throw new ApiError(400, "invalid_funding");
    const package_id = row.package_id ? uuid(row.package_id) : null,
      independent_reason = package_id ? "" : String(row.independent_reason);
    if (
      !package_id &&
      !["trial", "makeup", "prize", "other"].includes(independent_reason)
    )
      throw new ApiError(400, "invalid_funding");
    const makeup_for = row.makeup_for ? uuid(row.makeup_for) : null;
    if (makeup_for && !package_id && independent_reason !== "makeup")
      throw new ApiError(400, "invalid_funding");
    found.set(member, { member, package_id, independent_reason, makeup_for });
  }
  return found;
}
