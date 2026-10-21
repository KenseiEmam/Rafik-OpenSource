import { pageSize } from "./pagination.ts";
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
import { role } from "./programming.ts";
import { pageOffset, calendarDate } from "./service-definitions.ts";
type Self = Awaited<ReturnType<typeof access>>;
type Task = {
  id: string;
  workspace_id: string;
  assigned_to: string;
  created_by: string;
  title: string;
  description: string;
  priority: string;
  due_date: Date | null;
  state: string;
  revision: number;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
};
async function taskAccess(
  tx: Tx,
  id: string,
  self: Self,
  view: Role,
  key: string,
) {
  const task = (
    await tx.$queryRaw<
      Task[]
    >`SELECT * FROM public.organization_tasks WHERE workspace_id=${id}::uuid AND id=${key}::uuid`
  )[0];
  if (!task || (view !== "admin" && task.assigned_to !== self.id))
    throw new ApiError(403, "task_unavailable");
  return task;
}
export async function tasks(actor: Actor, id: string, q: URLSearchParams) {
  const view = role(q.get("view"));
  if (view === "trainee") throw new ApiError(403, "forbidden");
  const state = q.get("state") || "open";
  if (!["open", "completed", "cancelled"].includes(state))
    throw new ApiError(400, "invalid_request");
  const take = pageSize(q, 24);
  const taskId = q.get("id") ? uuid(q.get("id")) : null;
  const offset = pageOffset(q.get("offset")),
    search = "%" + (q.get("search") || "").slice(0, 100) + "%",
    today = calendarDate(
      q.get("today") || new Date().toISOString().slice(0, 10),
    );
  return scoped(actor, id, [view], async (tx, self) => {
    const rows = await tx.$queryRaw<
      (Task & { trainer_name: string; trainer_active: boolean })[]
    >`SELECT t.*,m.name trainer_name,m.active trainer_active FROM public.organization_tasks t JOIN public.workspace_members m ON m.id=t.assigned_to WHERE t.workspace_id=${id}::uuid AND (${view === "admin"} OR t.assigned_to=${self.id}::uuid) AND (${taskId !== null} OR t.state=${state}) AND (${taskId === null} OR t.id=${taskId}::uuid) AND (t.title ILIKE ${search} OR m.name ILIKE ${search}) ORDER BY (t.priority='high') DESC,t.due_date ASC NULLS LAST,t.created_at,t.id LIMIT ${take + 1} OFFSET ${offset}`;
    const counts = (
      await tx.$queryRaw<
        { open: number; overdue: number; completed: number }[]
      >`SELECT count(*) FILTER(WHERE state='open')::int open,count(*) FILTER(WHERE state='open' AND due_date<${today}::date)::int overdue,count(*) FILTER(WHERE state='completed')::int completed FROM public.organization_tasks WHERE workspace_id=${id}::uuid AND (${view === "admin"} OR assigned_to=${self.id}::uuid)`
    )[0];
    const totals = await tx.$queryRaw<
      { total: number }[]
    >`SELECT count(*)::int total FROM public.organization_tasks t JOIN public.workspace_members m ON m.id=t.assigned_to WHERE t.workspace_id=${id}::uuid AND (${view === "admin"} OR t.assigned_to=${self.id}::uuid) AND (${taskId !== null} OR t.state=${state}) AND (${taskId === null} OR t.id=${taskId}::uuid) AND (t.title ILIKE ${search} OR m.name ILIKE ${search})`;
    return {
      total: totals[0].total,
      items: rows.slice(0, take),
      next: rows.length > take ? offset + take : null,
      counts,
    };
  });
}
export async function taskCommand(
  actor: Actor,
  id: string,
  input: Record<string, unknown>,
) {
  const view = role(input.view),
    key = uuid(input.id),
    action = String(input.action);
  if (
    view === "trainee" ||
    !["save", "state"].includes(action) ||
    (action === "save" && view !== "admin")
  )
    throw new ApiError(403, "forbidden");
  const authorize = async (tx: Tx, self: Self) => {
    const found = (
      await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM public.organization_tasks WHERE id=${key}::uuid`
    )[0];
    if (found) await taskAccess(tx, id, self, view, key);
    else if (action !== "save") throw new ApiError(403, "task_unavailable");
    if (action === "save") {
      const trainer = await tx.workspace_members.findFirst({
        where: {
          id: uuid(input.assigned_to),
          workspace_id: id,
          roles: { has: "trainer" },
          active: true,
        },
      });
      if (!trainer) throw new ApiError(400, "trainer_unavailable");
    }
  };
  return mutation(
    actor,
    id,
    [view],
    input,
    async (tx, self) => {
      const old = (
        await tx.$queryRaw<
          Task[]
        >`SELECT * FROM public.organization_tasks WHERE id=${key}::uuid`
      )[0];
      if ((old?.revision || 0) !== input.revision)
        throw new ApiError(409, "conflict");
      if (action === "save") {
        const title = textValue(input.title, 160),
          description =
            typeof input.description === "string"
              ? input.description.trim()
              : "";
        if (
          description.length > 2000 ||
          !["normal", "high"].includes(String(input.priority)) ||
          old?.state === "cancelled"
        )
          throw new ApiError(400, "invalid_request");
        const due = input.due_date ? calendarDate(input.due_date) : null,
          assignee = uuid(input.assigned_to);
        if (old)
          await tx.$executeRaw`UPDATE public.organization_tasks SET title=${title},description=${description},priority=${String(input.priority)},due_date=${due}::date,assigned_to=${assignee}::uuid,revision=revision+1,updated_at=now() WHERE id=${key}::uuid`;
        else
          await tx.$executeRaw`INSERT INTO public.organization_tasks(id,workspace_id,assigned_to,created_by,title,description,priority,due_date) VALUES(${key}::uuid,${id}::uuid,${assignee}::uuid,${self.id}::uuid,${title},${description},${String(input.priority)},${due}::date)`;
      } else {
        const state = String(input.state);
        if (
          !["open", "completed", "cancelled"].includes(state) ||
          (state === "cancelled" && view !== "admin") ||
          (old.state === "cancelled" && (view !== "admin" || state !== "open"))
        )
          throw new ApiError(400, "invalid_request");
        await tx.$executeRaw`UPDATE public.organization_tasks SET state=${state},completed_at=CASE WHEN ${state}='completed' THEN now() ELSE NULL END,revision=revision+1,updated_at=now() WHERE id=${key}::uuid`;
      }
      await event(tx, actor, id, "trainer_task_" + action, key);
      return (
        await tx.$queryRaw<
          Task[]
        >`SELECT * FROM public.organization_tasks WHERE id=${key}::uuid`
      )[0];
    },
    authorize,
  );
}
export async function followUp(actor: Actor, id: string, q: URLSearchParams) {
  const view = role(q.get("view"));
  if (view === "trainee") throw new ApiError(403, "forbidden");
  return scoped(actor, id, [view], async (tx, self) => {
    const review = await tx.$queryRaw<
      {
        id: string;
        name: string;
        completed_at: Date;
        title: string;
        total: bigint;
      }[]
    >`SELECT s.id,m.name,s.completed_at,s.document->>'title' title,count(*) OVER() total FROM public.organization_sessions s JOIN public.workspace_members m ON m.id=s.member_id WHERE s.workspace_id=${id}::uuid AND m.active AND (${view === "admin"} OR m.trainer_id=${self.id}::uuid) AND s.completed_at IS NOT NULL AND nullif(s.document->>'reviewed_at','') IS NULL ORDER BY s.completed_at,s.id LIMIT 8`;
    const outcomes = await tx.$queryRaw<
      { id: string; title: string; ends_at: Date; total: bigint }[]
    >`SELECT e.id,e.title,e.ends_at,count(*) OVER() total FROM public.organization_events e WHERE e.workspace_id=${id}::uuid AND e.state='scheduled' AND e.ends_at<now() AND (${view === "admin"} OR EXISTS(SELECT 1 FROM public.organization_event_people p WHERE p.event_id=e.id AND p.member_id=${self.id}::uuid AND p.duty='staff')) ORDER BY e.ends_at,e.id LIMIT 8`;
    const missed = await tx.$queryRaw<
      {
        id: string;
        member_id: string;
        name: string;
        title: string;
        starts_at: Date;
        total: bigint;
      }[]
    >`SELECT e.id,p.member_id,m.name,e.title,e.starts_at,count(*) OVER() total FROM public.organization_events e JOIN public.organization_event_people p ON p.event_id=e.id JOIN public.workspace_members m ON m.id=p.member_id WHERE e.workspace_id=${id}::uuid AND e.kind='training' AND e.state='completed' AND p.duty='trainee' AND p.attendance IN ('absent','excused') AND m.active AND (${view === "admin"} OR m.trainer_id=${self.id}::uuid) AND NOT EXISTS(SELECT 1 FROM public.organization_event_people replacement JOIN public.organization_events booked ON booked.id=replacement.event_id WHERE replacement.makeup_for=e.id AND replacement.member_id=p.member_id AND booked.state<>'cancelled') ORDER BY e.starts_at,e.id,p.member_id LIMIT 8`;
    const unplanned = await tx.$queryRaw<
      { id: string; name: string; total: bigint }[]
    >`SELECT m.id,m.name,count(*) OVER() total FROM public.workspace_members m WHERE m.workspace_id=${id}::uuid AND m.active AND 'trainee'=ANY(m.roles) AND (${view === "admin"} OR m.trainer_id=${self.id}::uuid) AND NOT EXISTS(SELECT 1 FROM public.organization_assignments a WHERE a.member_id=m.id AND a.state='active') ORDER BY m.name,m.id LIMIT 8`;
    const result = (items: { total: bigint }[]) => ({
      items: items.map(({ total, ...item }) => item),
      total: Number(items[0]?.total || 0),
    });
    return {
      missed: result(missed),
      reviews: result(review),
      outcomes: result(outcomes),
      unplanned: result(unplanned),
    };
  });
}
