import { ApiError, asActor, type Actor } from "./db.ts";
import { scoped, requirePractice, uuid } from "./workspaces.ts";
import { role, recipient } from "./programming.ts";
import { calendarDate, pageOffset } from "./service-definitions.ts";
export async function analyticWindow(actor: Actor, q: URLSearchParams) {
  const from = calendarDate(q.get("from")),
    to = calendarDate(q.get("to"));
  if (to < from || Date.parse(to) - Date.parse(from) > 366 * 86400000)
    throw new ApiError(400, "invalid_date");
  return asActor(actor, async (tx) => {
    const p = await tx.profiles.findUnique({
        where: { id: actor.id },
        select: { timezone: true },
      }),
      zone = p?.timezone || "UTC";
    const [bounds] = await tx.$queryRaw<
      { start: Date; end: Date }[]
    >`SELECT ${from}::date::timestamp AT TIME ZONE ${zone} AS start,(${to}::date+1)::timestamp AT TIME ZONE ${zone} AS end`;
    return { from, to, zone, ...bounds };
  });
}
export async function organizationAnalytics(
  actor: Actor,
  id: string,
  q: URLSearchParams,
) {
  const view = role(q.get("view"));
  if (view === "trainee") throw new ApiError(403, "forbidden");
  const window = await analyticWindow(actor, q);
  return scoped(actor, id, [view], async (tx, self) => {
    const selected = q.get("member") ? uuid(q.get("member")) : null;
    if (selected) await recipient(tx, id, self, view, selected);
    const trainer = view === "trainer" ? self.id : null;
    const [summary] = await tx.$queryRaw<any[]>`WITH roster AS (
   SELECT m.* FROM public.workspace_members m WHERE m.workspace_id=${id}::uuid AND (${trainer}::uuid IS NULL OR m.trainer_id=${trainer}::uuid) AND (${selected}::uuid IS NULL OR m.id=${selected}::uuid)
  ), active AS (SELECT * FROM roster WHERE active AND 'trainee'=ANY(roles)),completed AS (
   SELECT s.* FROM public.organization_sessions s JOIN roster m ON m.id=s.member_id WHERE s.completed_at>=${window.start} AND s.completed_at<${window.end}
  ) SELECT (SELECT count(*)::int FROM active) AS active,(SELECT count(*)::int FROM active WHERE trainer_id IS NULL) AS unassigned,
   (SELECT count(*)::int FROM active m WHERE NOT EXISTS(SELECT 1 FROM public.organization_assignments a WHERE a.member_id=m.id AND a.state='active' AND a.start_date<=(now() AT TIME ZONE ${window.zone})::date AND (a.end_date IS NULL OR a.end_date>=(now() AT TIME ZONE ${window.zone})::date))) AS without_program,
   (SELECT count(*)::int FROM active WHERE joined_at>=${window.start} AND joined_at<${window.end}) AS joined,
   (SELECT count(*)::int FROM completed) AS completed,
   (SELECT count(DISTINCT c.member_id)::int FROM completed c JOIN active a ON a.id=c.member_id) AS participating,
   (SELECT count(*)::int FROM completed WHERE document->>'reviewed_at' IS NULL) AS pending_review`;
    const daily = await tx.$queryRaw<
      any[]
    >`SELECT (s.completed_at AT TIME ZONE ${window.zone})::date::text AS date,count(*)::int AS value FROM public.organization_sessions s JOIN public.workspace_members m ON m.id=s.member_id WHERE s.workspace_id=${id}::uuid AND (${trainer}::uuid IS NULL OR m.trainer_id=${trainer}::uuid) AND (${selected}::uuid IS NULL OR m.id=${selected}::uuid) AND s.completed_at>=${window.start} AND s.completed_at<${window.end} GROUP BY 1 ORDER BY 1`;
    const attendance = await tx.$queryRaw<
      any[]
    >`SELECT p.attendance AS label,count(*)::int AS value FROM public.organization_event_people p JOIN public.organization_events e ON e.id=p.event_id JOIN public.workspace_members m ON m.id=p.member_id WHERE e.workspace_id=${id}::uuid AND p.duty='trainee' AND e.state<>'cancelled' AND e.starts_at>=${window.start} AND e.starts_at<${window.end} AND e.starts_at<=now() AND (${trainer}::uuid IS NULL OR m.trainer_id=${trainer}::uuid) AND (${selected}::uuid IS NULL OR m.id=${selected}::uuid) GROUP BY 1`;
    const workload =
      view === "admin"
        ? await tx.$queryRaw<
            any[]
          >`SELECT t.id,t.name AS label,count(m.id)::int AS value FROM public.workspace_members t LEFT JOIN public.workspace_members m ON m.trainer_id=t.id AND m.active AND 'trainee'=ANY(m.roles) WHERE t.workspace_id=${id}::uuid AND t.active AND 'trainer'=ANY(t.roles) GROUP BY t.id ORDER BY t.name,t.id LIMIT 100`
        : [];
    const programs = await tx.$queryRaw<
      any[]
    >`SELECT v.program_id AS id,v.title AS label,count(*)::int AS value FROM public.organization_assignments a JOIN public.workspace_members m ON m.id=a.member_id JOIN public.organization_versions v ON v.id=a.version_id WHERE a.workspace_id=${id}::uuid AND a.state='active' AND a.start_date<=(now() AT TIME ZONE ${window.zone})::date AND (a.end_date IS NULL OR a.end_date>=(now() AT TIME ZONE ${window.zone})::date) AND m.active AND 'trainee'=ANY(m.roles) AND (${trainer}::uuid IS NULL OR m.trainer_id=${trainer}::uuid) AND (${selected}::uuid IS NULL OR m.id=${selected}::uuid) GROUP BY v.program_id,v.title ORDER BY value DESC,v.title LIMIT 30`;
    const people = await tx.workspace_members.findMany({
      where: {
        workspace_id: id,
        roles: { has: "trainee" },
        ...(trainer ? { trainer_id: trainer } : {}),
        name: {
          contains: (q.get("search") || "").slice(0, 100),
          mode: "insensitive",
        },
      },
      select: { id: true, name: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: 25,
    });
    return { window, summary, daily, attendance, workload, programs, people };
  });
}
export async function independentAnalytics(actor: Actor, q: URLSearchParams) {
  await requirePractice(actor);
  const window = await analyticWindow(actor, q);
  return asActor(actor, async (tx) => {
    const selected = q.get("client") ? uuid(q.get("client")) : null;
    if (
      selected &&
      !(await tx.coach_clients.findFirst({
        where: { id: selected, coach_id: actor.id },
      }))
    )
      throw new ApiError(403, "forbidden");
    const [summary] = await tx.$queryRaw<
      any[]
    >`WITH roster AS (SELECT * FROM public.coach_clients WHERE coach_id=${actor.id}::uuid AND (${selected}::uuid IS NULL OR id=${selected}::uuid)),done AS(SELECT s.* FROM public.sessions s JOIN roster c ON c.client_id=s.client_id WHERE s.coach_id=${actor.id}::uuid AND s.completed_at>=${window.start} AND s.completed_at<${window.end}) SELECT
   (SELECT count(*)::int FROM roster WHERE state='active') AS active,
   (SELECT count(*)::int FROM roster c WHERE state='active' AND NOT EXISTS(SELECT 1 FROM public.assignments a WHERE a.relationship_id=c.id AND a.state='active' AND a.start_date<=(now() AT TIME ZONE ${window.zone})::date AND (a.end_date IS NULL OR a.end_date>=(now() AT TIME ZONE ${window.zone})::date))) AS without_program,
   (SELECT count(*)::int FROM done) AS completed,
   (SELECT count(DISTINCT s.client_id)::int FROM done s JOIN roster c ON c.client_id=s.client_id WHERE c.state='active') AS participating,
   (SELECT count(*)::int FROM done WHERE reviewed_at IS NULL) AS pending_review,
   (SELECT count(*)::int FROM public.coaching_requests r JOIN roster c ON c.id=r.relationship_id WHERE NOT r.cancelled AND r.due_date>=${window.from}::date AND r.due_date<=${window.to}::date) AS requests,
   (SELECT count(*)::int FROM public.coaching_requests r JOIN roster c ON c.id=r.relationship_id WHERE NOT r.cancelled AND r.submitted_at IS NOT NULL AND r.due_date>=${window.from}::date AND r.due_date<=${window.to}::date) AS submitted`;
    const daily = await tx.$queryRaw<
      any[]
    >`SELECT (s.completed_at AT TIME ZONE ${window.zone})::date::text AS date,count(*)::int AS value FROM public.sessions s JOIN public.coach_clients c ON c.coach_id=s.coach_id AND c.client_id=s.client_id WHERE s.coach_id=${actor.id}::uuid AND (${selected}::uuid IS NULL OR c.id=${selected}::uuid) AND s.completed_at>=${window.start} AND s.completed_at<${window.end} GROUP BY 1 ORDER BY 1`;
    const attendance = await tx.$queryRaw<
      any[]
    >`SELECT a.state AS label,count(*)::int AS value FROM public.appointments a JOIN public.coach_clients c ON c.id=a.relationship_id WHERE c.coach_id=${actor.id}::uuid AND (${selected}::uuid IS NULL OR c.id=${selected}::uuid) AND a.state<>'cancelled' AND a.starts_at>=${window.start} AND a.starts_at<${window.end} AND a.starts_at<=now() GROUP BY a.state`;
    const search = "%" + (q.get("search") || "").slice(0, 100) + "%";
    const people = await tx.$queryRaw<
      { id: string; name: string }[]
    >`SELECT c.id,p.display_name AS name FROM public.coach_clients c JOIN public.profiles p ON p.id=c.client_id WHERE c.coach_id=${actor.id}::uuid AND p.display_name ILIKE ${search} ORDER BY p.display_name,c.id LIMIT 25`;
    return {
      window,
      summary,
      daily,
      attendance,
      workload: [],
      programs: [],
      people,
    };
  });
}
export async function assessmentHistory(
  actor: Actor,
  id: string,
  q: URLSearchParams,
) {
  const view = role(q.get("view")),
    window = await analyticWindow(actor, q);
  return scoped(actor, id, [view], async (tx, self) => {
    const member = q.get("member") || self.id;
    const person = await recipient(tx, id, self, view, member);
    const offset = pageOffset(q.get("offset"));
    const results = await tx.$queryRaw<
      any[]
    >`SELECT r.event_id,r.member_id,r.values,r.note,r.revision,r.recorded_at,e.title,e.starts_at,e.template_id,e.template_revision,e.definition,p.attendance FROM public.assessment_results r JOIN public.organization_events e ON e.id=r.event_id JOIN public.organization_event_people p ON p.event_id=r.event_id AND p.member_id=r.member_id WHERE r.workspace_id=${id}::uuid AND r.member_id=${member}::uuid AND e.state<>'cancelled' AND e.starts_at>=${window.start} AND e.starts_at<${window.end} ORDER BY e.starts_at DESC,e.id LIMIT 51 OFFSET ${offset}`;
    return {
      window,
      person: { id: person.id, name: person.name },
      items: results.slice(0, 50),
      next: results.length > 50 ? offset + 50 : null,
    };
  });
}
