import { ApiError, asActor, type Actor } from "./db.ts";
import {
  scoped,
  uuid,
  requirePractice,
  type Tx,
  type Role,
  access,
} from "./workspaces.ts";
import { role } from "./programming.ts";
import { pageOffset } from "./service-definitions.ts";
export async function peoplePage(
  tx: Tx,
  id: string,
  self: Awaited<ReturnType<typeof access>>,
  view: Role,
  q: URLSearchParams,
) {
  const offset = pageOffset(q.get("offset")),
    search = (q.get("search") || "").slice(0, 100),
    kind = q.get("role"),
    includeSelf = q.get("self") === "true";
  if (kind && !["admin", "trainer", "trainee"].includes(kind))
    throw new ApiError(400, "invalid_roles");
  const scope = {
    workspace_id: id,
    ...(view === "trainer"
      ? {
          OR: [
            { trainer_id: self.id },
            ...(includeSelf ? [{ id: self.id }] : []),
          ],
        }
      : view === "trainee"
        ? { id: self.id }
        : {}),
  };
  // Keep scope OR separate from the search expression.
  const filter = {
    AND: [
      scope,
      {
        ...(q.get("state") === "all"
          ? {}
          : { active: q.get("state") !== "inactive" }),
        ...(kind ? { roles: { has: kind } } : {}),
        name: { contains: search, mode: "insensitive" as const },
      },
    ],
  };
  const selected = (q.get("selected") || "").split(",").filter(Boolean);
  if (selected.length > 100) throw new ApiError(400, "invalid_request");
  selected.forEach(uuid);
  const select = {
    id: true,
    user_id: true,
    name: true,
    roles: true,
    active: true,
    revision: true,
    trainer_id: true,
  };
  const [items, total, chosen] = await Promise.all([
    tx.workspace_members.findMany({
      where: filter,
      select,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: offset,
      take: 25,
    }),
    tx.workspace_members.count({ where: filter }),
    selected.length
      ? tx.workspace_members.findMany({
          where: { AND: [scope, { id: { in: selected } }] },
          select,
        })
      : [],
  ]);
  const names = await tx.workspace_members.findMany({
    where: {
      workspace_id: id,
      id: {
        in: [
          ...new Set(
            [...items, ...chosen]
              .map((m) => m.trainer_id)
              .filter((x): x is string => !!x),
          ),
        ],
      },
    },
    select: { id: true, name: true },
  });
  return {
    items,
    selected: chosen,
    names,
    total,
    next: offset + 25 < total ? offset + 25 : null,
  };
}
export async function organizationPeople(
  actor: Actor,
  id: string,
  q: URLSearchParams,
) {
  const view = role(q.get("view"));
  return scoped(actor, id, [view], (tx, self) =>
    peoplePage(tx, id, self, view, q),
  );
}
export async function organizationRecipients(
  actor: Actor,
  id: string,
  q: URLSearchParams,
) {
  const view = role(q.get("view"));
  if (view === "trainee") throw new ApiError(403, "forbidden");
  q.set("role", "trainee");
  return scoped(actor, id, [view], async (tx, self) => {
    const page = await peoplePage(tx, id, self, view, q),
      members = [...page.items, ...page.selected].filter(
        (m) => m.active && m.roles.includes("trainee"),
      );
    const assignments = await tx.organization_assignments.findMany({
      where: {
        workspace_id: id,
        member_id: { in: members.map((m) => m.id) },
        state: "active",
      },
      select: {
        id: true,
        revision: true,
        member_id: true,
        organization_versions: { select: { title: true } },
      },
    });
    const map = (m: (typeof members)[0]) => {
      const a = assignments.find((a) => a.member_id === m.id);
      return {
        id: m.id,
        name: m.name,
        revision: m.revision,
        assignment_id: a?.id || null,
        assignment_revision: a?.revision || null,
        current: a?.organization_versions.title,
      };
    };
    return {
      items: page.items.map(map),
      selected: page.selected
        .filter((m) => m.active && m.roles.includes("trainee"))
        .map(map),
      next: page.next,
    };
  });
}

export async function independentRecipients(actor: Actor, q: URLSearchParams) {
  await requirePractice(actor);
  const offset = pageOffset(q.get("offset")),
    search = "%" + (q.get("search") || "").slice(0, 100) + "%",
    selected = (q.get("selected") || "").split(",").filter(Boolean);
  if (selected.length > 50) throw new ApiError(400, "invalid_request");
  selected.forEach(uuid);
  return asActor(actor, async (tx) => {
    const rows = await tx.$queryRaw<
      any[]
    >`SELECT c.id,p.display_name name,a.id assignment_id,a.revision assignment_revision,v.title current FROM public.coach_clients c JOIN public.profiles p ON p.id=c.client_id LEFT JOIN public.assignments a ON a.relationship_id=c.id AND a.state='active' LEFT JOIN public.plan_versions v ON v.id=a.version_id WHERE c.coach_id=${actor.id}::uuid AND c.state='active' AND p.display_name ILIKE ${search} ORDER BY p.display_name,c.id LIMIT 26 OFFSET ${offset}`;
    const chosen = selected.length
      ? await tx.$queryRaw<
          any[]
        >`SELECT c.id,p.display_name name,a.id assignment_id,a.revision assignment_revision,v.title current FROM public.coach_clients c JOIN public.profiles p ON p.id=c.client_id LEFT JOIN public.assignments a ON a.relationship_id=c.id AND a.state='active' LEFT JOIN public.plan_versions v ON v.id=a.version_id WHERE c.coach_id=${actor.id}::uuid AND c.state='active' AND c.id=ANY(${selected}::uuid[])`
      : [];
    return {
      items: rows.slice(0, 25),
      selected: chosen,
      next: rows.length > 25 ? offset + 25 : null,
    };
  });
}
