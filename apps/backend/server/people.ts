import { pageSize } from "./pagination.ts";
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
  const take = pageSize(q, 25);
  const offset = pageOffset(q.get("offset")),
    search = (q.get("search") || "").slice(0, 100),
    kind = q.get("role"),
    sport = q.get("sport") ? uuid(q.get("sport")) : null,
    includeSelf = q.get("self") === "true";
  if (kind && !["admin", "trainer", "trainee"].includes(kind))
    throw new ApiError(400, "invalid_roles");
  const scope = {
    workspace_id: id,
    ...(view === "trainer"
      ? {
          // Training scope: primary athletes plus active supporting links.
          OR: [
            { trainer_id: self.id },
            {
              coaching_as_athlete: {
                some: { coach_member_id: self.id, ended_at: null },
              },
            },
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
        ...(sport
          ? { organization_member_sports: { some: { sport_id: sport } } }
          : {}),
        // Administrators may also match account email (opt-in per request);
        // coaches never see member email, so they search names only.
        ...(view === "admin" && q.get("email") === "true" && search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                {
                  users: {
                    email: { contains: search, mode: "insensitive" as const },
                  },
                },
              ],
            }
          : { name: { contains: search, mode: "insensitive" as const } }),
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
    ...(view === "admin" ? { users: { select: { email: true } } } : {}),
    organization_member_sports: {
      select: { sport_id: true },
      orderBy: { sport_id: "asc" as const },
    },
    coaching_as_athlete: {
      where: { ended_at: null },
      select: {
        id: true,
        coach_member_id: true,
        kind: true,
        sport_id: true,
        revision: true,
      },
      orderBy: [{ kind: "asc" as const }, { created_at: "asc" as const }],
    },
  };
  const [items, total, chosen] = await Promise.all([
    tx.workspace_members.findMany({
      where: filter,
      select,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: offset,
      take,
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
              .flatMap((m) => [
                m.trainer_id,
                ...m.coaching_as_athlete.map((l) => l.coach_member_id),
              ])
              .filter((x): x is string => !!x),
          ),
        ],
      },
    },
    select: { id: true, name: true },
  });
  const withSports = (list: typeof items) =>
    list.map((row) => {
      const { organization_member_sports, coaching_as_athlete, users, ...m } =
        row as typeof row & { users?: { email: string | null } | null };
      return {
        ...m,
        // Selected only for administrators; flattened so no nested identity row leaks.
        ...(users !== undefined ? { email: users?.email ?? null } : {}),
        sports: organization_member_sports.map((x) => x.sport_id),
        // Active coaching team; supporting coaches carry the sport/specialty they cover.
        coaches: coaching_as_athlete.map((l) => ({
          id: l.id,
          coach: l.coach_member_id,
          kind: l.kind,
          sport: l.sport_id,
          revision: l.revision,
        })),
      };
    });
  return {
    items: withSports(items),
    selected: withSports(chosen),
    names,
    total,
    next: offset + take < total ? offset + take : null,
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
        goal: true,
        sport_id: true,
        start_date: true,
        end_date: true,
        organization_versions: {
          select: { id: true, program_id: true, revision: true, title: true },
        },
      },
      orderBy: { start_date: "asc" },
    });
    const map = (m: (typeof members)[0]) => {
      const plans = assignments.filter((a) => a.member_id === m.id),
        a = plans[0];
      return {
        id: m.id,
        name: m.name,
        revision: m.revision,
        // Administrators can tell same-named athletes apart by account email.
        ...("email" in m ? { email: m.email } : {}),
        // Every active plan; replacing one is an explicit choice.
        plans: plans.map((p) => ({
          id: p.id,
          revision: p.revision,
          title: p.organization_versions.title,
          // Lets the assignment page mark athletes already on this program/version.
          version_id: p.organization_versions.id,
          program_id: p.organization_versions.program_id,
          version_revision: p.organization_versions.revision,
          goal: p.goal,
          sport: p.sport_id,
          start_date: p.start_date,
          end_date: p.end_date,
        })),
        // Compatibility fields for older clients: the earliest active plan.
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

/** Member identity uses the same roster scope; staff analytics are administrator-only. */
export async function organizationMemberProfile(
  actor: Actor,
  id: string,
  memberId: string,
  q: URLSearchParams,
) {
  const view = role(q.get("view"));
  uuid(memberId);
  return scoped(actor, id, [view], async (tx, self) => {
    const page = await peoplePage(
      tx,
      id,
      self,
      view,
      new URLSearchParams({ selected: memberId, state: "all", self: "true" }),
    );
    const member = page.selected[0];
    if (!member) throw new ApiError(403, "forbidden");
    const details = await tx.workspace_members.findFirstOrThrow({
      where: { workspace_id: id, id: member.id },
      select: {
        joined_at: true,
        ...(view === "admin" ? { users: { select: { email: true } } } : {}),
      },
    });
    let analytics = null;
    if (view === "admin" && member.roles.includes("trainer")) {
      const from = new Date(Date.now() - 30 * 86400000),
        to = new Date();
      const [
        primary,
        supporting,
        completedEvents,
        upcomingEvents,
        recordedWorkouts,
      ] = await Promise.all([
        tx.workspace_members.count({
          where: {
            workspace_id: id,
            active: true,
            roles: { has: "trainee" },
            trainer_id: member.id,
          },
        }),
        tx.organization_coaching_links.count({
          where: {
            workspace_id: id,
            coach_member_id: member.id,
            kind: "supporting",
            ended_at: null,
          },
        }),
        tx.organization_event_people.count({
          where: {
            workspace_id: id,
            member_id: member.id,
            duty: "staff",
            organization_events: {
              state: "completed",
              ends_at: { gte: from, lte: to },
            },
          },
        }),
        tx.organization_event_people.count({
          where: {
            workspace_id: id,
            member_id: member.id,
            duty: "staff",
            organization_events: { state: "scheduled", starts_at: { gte: to } },
          },
        }),
        tx.organization_sessions.count({
          where: {
            workspace_id: id,
            recorded_by: member.id,
            recorded_mode: "delegated",
            completed_at: { gte: from, lte: to },
          },
        }),
      ]);
      analytics = {
        from: from.toISOString(),
        to: to.toISOString(),
        primary_athletes: primary,
        supporting_links: supporting,
        completed_events: completedEvents,
        upcoming_events: upcomingEvents,
        recorded_workouts: recordedWorkouts,
      };
    }
    return {
      member: {
        ...member,
        joined_at: details.joined_at,
        ...(view === "admin" ? { email: details.users?.email } : {}),
      },
      names: page.names,
      self: self.id,
      analytics,
    };
  });
}
