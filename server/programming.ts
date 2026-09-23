import media from "../content/exercise-media.json" with { type: "json" };
import videos from "../content/exercise-videos.json" with { type: "json" };
import { isDeepStrictEqual } from "node:util";
import { ApiError, db, asActor, type Actor } from "./db.ts";
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
import type { Prisma } from "./generated/prisma/client.ts";
type Member = Awaited<ReturnType<typeof access>>;
type Input = Record<string, unknown>;
const json = (v: unknown) => v as Prisma.InputJsonValue;
const bodyAreas = new Set([
  "waist",
  "upper legs",
  "back",
  "lower legs",
  "chest",
  "upper arms",
  "cardio",
  "shoulders",
  "lower arms",
  "neck",
]);
export const role = (v: unknown): Role => {
  if (!["admin", "trainer", "trainee"].includes(String(v)))
    throw new ApiError(400, "invalid_roles");
  return v as Role;
};
const date = (v: unknown) => {
  if (
    typeof v !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
    (Number.isNaN(Date.parse(v + "T00:00:00Z"))
      ? ""
      : new Date(v + "T00:00:00Z").toISOString()
    ).slice(0, 10) !== v
  )
    throw new ApiError(400, "invalid_date");
  return new Date(v + "T00:00:00Z");
};
export async function catalog(tx: Tx, id: string) {
  const [shared, own] = await Promise.all([
    tx.exercises.findMany({
      where: { owner_id: null },
      orderBy: { name: "asc" },
    }),
    tx.organization_exercises.findMany({
      where: { workspace_id: id },
      orderBy: { id: "asc" },
    }),
  ]);
  return [
    ...shared,
    ...own.map((e) => ({
      ...(e.data as object),
      id: e.id,
      workspace_id: id,
      created_by: e.created_by,
      revision: e.revision,
      active: e.active,
    })),
  ];
}
async function programAccess(
  tx: Tx,
  id: string,
  self: Member,
  view: Role,
  programId: string,
  write = false,
) {
  const p = await tx.organization_programs.findUnique({
    where: { id: uuid(programId) },
  });
  if (
    !p ||
    p.workspace_id !== id ||
    (view !== "admin" &&
      (p.created_by !== self.id || view === "trainee") &&
      (write || !p.listed))
  )
    throw new ApiError(403, "program_unavailable");
  if (write && view === "trainee") throw new ApiError(403, "forbidden");
  return p;
}
export async function recipient(
  tx: Tx,
  id: string,
  self: Member,
  view: Role,
  memberId: string,
  active = false,
) {
  const m = await tx.workspace_members.findUnique({
    where: { id: uuid(memberId) },
  });
  if (
    !m ||
    m.workspace_id !== id ||
    (active && !m.roles.includes("trainee")) ||
    (active && !m.active) ||
    (view === "trainer" && m.trainer_id !== self.id) ||
    (view === "trainee" && m.id !== self.id)
  )
    throw new ApiError(403, "trainee_unavailable");
  return m;
}
async function snapshot(tx: Tx, id: string, draft: unknown) {
  const items = JSON.stringify(await catalog(tx, id)),
    p = JSON.stringify(draft);
  await tx.$queryRaw`SELECT public.validate_program_presentation(${p}::jsonb,${id}::uuid)::text`;
  await tx.$queryRaw`SELECT public.validate_prescription_catalog(${p}::jsonb,${items}::jsonb)::text`;
  return (
    await tx.$queryRaw<
      { value: Prisma.InputJsonValue }[]
    >`SELECT public.snapshot_prescription_catalog(${p}::jsonb,${items}::jsonb) value`
  )[0].value;
}
export async function programs(
  actor: Actor,
  id: string,
  query: URLSearchParams,
) {
  const view = role(query.get("view"));
  return scoped(actor, id, [view], async (tx, self) => {
    const requestedVersion = query.get("version")
      ? await tx.organization_versions.findUnique({
          where: { id: uuid(query.get("version")) },
        })
      : null;
    if (
      query.get("version") &&
      (!requestedVersion || requestedVersion.workspace_id !== id)
    )
      throw new ApiError(403, "program_unavailable");
    const programId = query.get("program") || requestedVersion?.program_id;
    if (programId) {
      const p = await programAccess(tx, id, self, view, programId),
        editable =
          view === "admin" || (view === "trainer" && p.created_by === self.id);
      const versions = await tx.organization_versions.findMany({
        where: { program_id: p.id },
        orderBy: { revision: "desc" },
        take: editable ? 50 : 1,
      });
      if (!editable && !versions.length)
        throw new ApiError(404, "program_unavailable");
      return {
        version: requestedVersion,
        program: editable
          ? p
          : { ...p, draft: versions[0].prescription, title: versions[0].title },
        editable,
        versions,
        catalog: view === "trainee" ? [] : await catalog(tx, id),
      };
    }
    const take = 24,
      offset = Math.max(0, Math.min(100000, Number(query.get("offset")) || 0));
    const where = {
      workspace_id: id,
      archived: false,
      title: {
        contains: (query.get("search") || "").slice(0, 100),
        mode: "insensitive" as const,
      },
      ...(view === "admin"
        ? {}
        : view === "trainer"
          ? { OR: [{ created_by: self.id }, { listed: true }] }
          : { listed: true, organization_versions: { some: {} } }),
    };
    const [list, total] = await Promise.all([
      tx.organization_programs.findMany({
        where,
        orderBy: [{ updated_at: "desc" }, { id: "asc" }],
        skip: offset,
        take,
        include: {
          organization_versions: { orderBy: { revision: "desc" }, take: 1 },
        },
      }),
      tx.organization_programs.count({ where }),
    ]);
    return {
      items: list.map((p) => {
        const v = p.organization_versions[0],
          editable =
            view === "admin" ||
            (view === "trainer" && p.created_by === self.id);
        return {
          id: p.id,
          title: editable ? p.title : v?.title,
          updated_at: p.updated_at,
          draft: editable ? p.draft : v?.prescription,
          draft_version: p.draft_version,
          listed: p.listed,
          editable,
          version: v || null,
        };
      }),
      total,
      next: offset + take < total ? offset + take : null,
    };
  });
}
export async function programCommand(actor: Actor, id: string, input: Input) {
  const view = role(input.view);
  if (view === "trainee") throw new ApiError(403, "forbidden");
  const action = String(input.action),
    programId = String(input.id || "");
  const authorize = async (tx: Tx, self: Member) => {
    if (["save", "publish", "archive", "listing"].includes(action)) {
      const existing = await tx.organization_programs.findUnique({
        where: { id: uuid(programId) },
      });
      if (existing) await programAccess(tx, id, self, view, programId, true);
      else if (action !== "save" && action !== "publish")
        throw new ApiError(404, "program_unavailable");
    } else if (["exercise", "exercise-active"].includes(action)) {
      const e = await tx.organization_exercises.findUnique({
        where: {
          workspace_id_id: { workspace_id: id, id: textValue(input.id, 100) },
        },
      });
      if (e && view !== "admin" && e.created_by !== self.id)
        throw new ApiError(403, "forbidden");
    } else throw new ApiError(400, "invalid_request");
  };
  return mutation(
    actor,
    id,
    [view],
    input,
    async (tx, self) => {
      if (action === "exercise" || action === "exercise-active") {
        const eid = textValue(input.id, 100);
        if (!/^org-[a-f0-9-]{36}$/.test(eid))
          throw new ApiError(400, "invalid_exercise");
        const old = await tx.organization_exercises.findUnique({
          where: { workspace_id_id: { workspace_id: id, id: eid } },
        });
        if ((old?.revision || 0) !== input.revision)
          throw new ApiError(409, "conflict");
        let data: Input = {};
        if (action === "exercise") {
          if (!input.data || typeof input.data !== "object")
            throw new ApiError(400, "invalid_exercise");
          const x = input.data as Input;
          for (const [key, max] of Object.entries({
            name: 100,
            name_ar: 100,
            instructions: 2000,
            instructions_ar: 2000,
            equipment: 100,
            equipment_ar: 100,
            movement: 60,
            media_url: 500,
            media_ref: 100,
          })) {
            const v = String(x[key] || "").trim();
            if (v.length > max) throw new ApiError(400, "invalid_exercise");
            data[key] = v;
          }
          for (const key of ["category", "body_part", "target_muscle"]) {
            if (x[key] !== undefined && typeof x[key] !== "string")
              throw new ApiError(400, "invalid_exercise");
            data[key] = String(x[key] || "").trim();
          }
          if (
            String(data.target_muscle).length > 100 ||
            (data.category && !bodyAreas.has(String(data.category))) ||
            (data.body_part && !bodyAreas.has(String(data.body_part)))
          )
            throw new ApiError(400, "invalid_exercise");
          data.category ||= data.body_part;
          data.body_part ||= data.category;
          if (data.category !== data.body_part)
            throw new ApiError(400, "invalid_exercise");
          if (
            !data.name ||
            !data.instructions ||
            !["strength", "timed", "distance"].includes(String(x.kind))
          )
            throw new ApiError(400, "invalid_exercise");
          if (data.media_url && !/^https:\/\//.test(String(data.media_url)))
            throw new ApiError(400, "invalid_exercise");
          if (
            data.media_ref &&
            !media.items.some((item) => item.id === data.media_ref) &&
            !videos.items.some((item) => item.id === data.media_ref)
          )
            throw new ApiError(400, "invalid_exercise");
          data.kind = x.kind;
          data.name_ar ||= data.name;
          data.instructions_ar ||= data.instructions;
        } else if (!old || typeof input.active !== "boolean")
          throw new ApiError(400, "invalid_request");
        const result = old
          ? await tx.organization_exercises.update({
              where: { workspace_id_id: { workspace_id: id, id: eid } },
              data: {
                ...(action === "exercise"
                  ? { data: json(data) }
                  : { active: input.active as boolean }),
                revision: { increment: 1 },
              },
            })
          : await tx.organization_exercises.create({
              data: {
                workspace_id: id,
                id: eid,
                data: json(data),
                created_by: self.id,
              },
            });
        await event(tx, actor, id, "exercise_updated", null, { exercise: eid });
        return result;
      }
      let p = await tx.organization_programs.findUnique({
        where: { id: programId },
      });
      if ((p?.draft_version || null) !== input.revision)
        throw new ApiError(409, "conflict");
      if (
        (action === "archive" || action === "listing") &&
        p?.revision !== input.record_revision
      )
        throw new ApiError(409, "conflict");
      if (action === "archive" || action === "listing") {
        if (typeof input.value !== "boolean")
          throw new ApiError(400, "invalid_request");
        if (
          action === "listing" &&
          input.value &&
          !(await tx.organization_versions.count({
            where: { program_id: programId },
          }))
        )
          throw new ApiError(400, "publish_first");
        p = await tx.organization_programs.update({
          where: { id: programId },
          data: {
            ...(action === "listing"
              ? { listed: input.value }
              : { archived: input.value }),
            revision: { increment: 1 },
            updated_at: new Date(),
          },
        });
        await event(tx, actor, id, "program_" + action, programId);
        return { plan: p };
      }
      const title = textValue(input.title, 100),
        prescription = await snapshot(tx, id, input.draft);
      const same =
        p && p.title === title && isDeepStrictEqual(p.draft, input.draft);
      if (!same)
        p = p
          ? await tx.organization_programs.update({
              where: { id: programId },
              data: {
                title,
                draft: json(input.draft),
                draft_version: { increment: 1 },
                updated_at: new Date(),
              },
            })
          : await tx.organization_programs.create({
              data: {
                id: programId,
                workspace_id: id,
                created_by: self.id,
                title,
                draft: json(input.draft),
              },
            });
      if (!p) throw new ApiError(500, "service_unavailable");
      let version = null;
      if (action === "publish") {
        version =
          (await tx.organization_versions.findUnique({
            where: {
              program_id_revision: {
                program_id: p.id,
                revision: p.draft_version,
              },
            },
          })) ||
          (await tx.organization_versions.create({
            data: {
              workspace_id: id,
              program_id: p.id,
              revision: p.draft_version,
              title,
              prescription,
              created_by: self.id,
            },
          }));
      }
      await event(
        tx,
        actor,
        id,
        action === "publish" ? "program_published" : "program_saved",
        p.id,
      );
      return { plan: p, version };
    },
    authorize,
  );
}
export async function delivery(
  actor: Actor,
  id: string,
  query: URLSearchParams,
) {
  const view = role(query.get("view"));
  return scoped(actor, id, [view], async (tx, self) => {
    const selected = query.get("member");
    if (selected) await recipient(tx, id, self, view, selected);
    if (query.get("history") === "true") {
      const scope = {
        workspace_id: id,
        ...(selected
          ? { id: selected }
          : view === "trainer"
            ? { trainer_id: self.id }
            : view === "trainee"
              ? { id: self.id }
              : {}),
      };
      const cursor = query.get("before");
      if (
        cursor &&
        !(await tx.organization_sessions.findFirst({
          where: {
            id: uuid(cursor),
            workspace_id: id,
            workspace_members: scope,
          },
        }))
      )
        throw new ApiError(400, "invalid_request");
      const page = await tx.organization_sessions.findMany({
        where: { workspace_id: id, workspace_members: scope },
        include: {
          workspace_members: { select: { id: true, name: true, active: true } },
        },
        orderBy: [{ started_at: "desc" }, { id: "asc" }],
        take: 51,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      const sessions = page.slice(0, 50),
        member = selected || (view === "trainee" ? self.id : null);
      const assignments = member
        ? await tx.organization_assignments.findMany({
            where: { workspace_id: id, member_id: member, state: "active" },
            include: { organization_versions: true },
          })
        : [];
      return {
        members: Array.from(
          new Map(
            sessions.map((s) => [s.member_id, s.workspace_members]),
          ).values(),
        ),
        assignments: assignments.map((a) => ({
          ...a,
          version: a.organization_versions,
          organization_versions: undefined,
        })),
        sessions: sessions.map((s) => ({
          ...(s.document as object),
          version: s.version,
          member_id: s.member_id,
          completed_at: s.completed_at,
        })),
        self: self.id,
        next: page.length > 50 ? sessions.at(-1)!.id : null,
      };
    }
    const members = await tx.workspace_members.findMany({
      where: {
        workspace_id: id,
        ...(query.get("history") === "true"
          ? {
              OR: [
                { roles: { has: "trainee" } },
                { organization_sessions: { some: {} } },
              ],
            }
          : { roles: { has: "trainee" } }),
        ...(selected
          ? { id: selected }
          : view === "trainer"
            ? { trainer_id: self.id }
            : view === "trainee"
              ? { id: self.id }
              : {}),
        ...(selected || query.get("history") === "true"
          ? {}
          : { active: true }),
      },
      select: { id: true, name: true, active: true, revision: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
    const assignments = await tx.organization_assignments.findMany({
      where: {
        workspace_id: id,
        member_id: { in: members.map((m) => m.id) },
        ...(selected ? {} : { state: "active" }),
      },
      include: { organization_versions: true },
      orderBy: { created_at: "desc" },
    });
    const cursor = query.get("before");
    if (cursor) {
      const previous = await tx.organization_sessions.findUnique({
        where: { id: uuid(cursor) },
      });
      if (
        !previous ||
        previous.workspace_id !== id ||
        !members.some((m) => m.id === previous.member_id)
      )
        throw new ApiError(400, "invalid_request");
    }
    const page = await tx.organization_sessions.findMany({
      where: { workspace_id: id, member_id: { in: members.map((m) => m.id) } },
      orderBy: [{ started_at: "desc" }, { id: "asc" }],
      take: 51,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const sessions = page.slice(0, 50);
    return {
      members,
      assignments: assignments.map((a) => ({
        ...a,
        version: a.organization_versions,
        organization_versions: undefined,
      })),
      sessions: sessions.map((s) => ({
        ...(s.document as object),
        version: s.version,
        member_id: s.member_id,
        completed_at: s.completed_at,
      })),
      self: self.id,
      next: page.length > 50 ? sessions.at(-1)!.id : null,
    };
  });
}
export async function deliveryCommand(actor: Actor, id: string, input: Input) {
  const view = role(input.view),
    action = String(input.action);
  if (view === "trainee") throw new ApiError(403, "forbidden");
  const selected = input.members;
  if (
    !Array.isArray(selected) ||
    !selected.length ||
    selected.length > 50 ||
    new Set(selected.map((x) => (x as Input).id)).size !== selected.length
  )
    throw new ApiError(400, "invalid_recipients");
  const authorize = async (tx: Tx, self: Member) => {
    for (const x of selected)
      await recipient(tx, id, self, view, uuid((x as Input).id), true);
  };
  return mutation(
    actor,
    id,
    [view],
    input,
    async (tx, self) => {
      if (action !== "assign") throw new ApiError(400, "invalid_request");
      const v = await tx.organization_versions.findUnique({
        where: { id: uuid(input.version_id) },
      });
      if (!v || v.workspace_id !== id)
        throw new ApiError(403, "program_unavailable");
      const p = await programAccess(tx, id, self, view, v.program_id);
      if (p.archived) throw new ApiError(400, "program_unavailable");
      const start = date(input.start_date),
        end = input.end_date ? date(input.end_date) : null;
      if (
        (end && end < start) ||
        !["cycle", "flexible"].includes(String(input.schedule_mode))
      )
        throw new ApiError(400, "invalid_schedule");
      const results = [];
      for (const raw of selected) {
        const x = raw as Input,
          m = await recipient(tx, id, self, view, String(x.id), true);
        if (m.revision !== x.revision) throw new ApiError(409, "conflict");
        const current = await tx.organization_assignments.findFirst({
          where: { workspace_id: id, member_id: m.id, state: "active" },
        });
        if (
          (current?.id || null) !== (x.assignment_id || null) ||
          (current?.revision || null) !== (x.assignment_revision || null)
        )
          throw new ApiError(409, "conflict");
        if (current)
          await tx.organization_assignments.update({
            where: { id: current.id },
            data: { state: "archived", revision: { increment: 1 } },
          });
        results.push(
          await tx.organization_assignments.create({
            data: {
              workspace_id: id,
              member_id: m.id,
              version_id: v.id,
              created_by: self.id,
              start_date: start,
              end_date: end,
              schedule_mode: String(input.schedule_mode),
            },
          }),
        );
      }
      await event(tx, actor, id, "program_assigned", v.program_id, {
        members: selected.map((x) => String((x as Input).id)),
        version: v.id,
      });
      return results;
    },
    authorize,
  );
}
export async function organizationSession(
  actor: Actor,
  sessionId: string,
  view: Role = "trainee",
) {
  const s = await db.organization_sessions.findUnique({
    where: { id: uuid(sessionId) },
  });
  if (!s) throw new ApiError(404, "session_missing");
  return scoped(actor, s.workspace_id, [view], async (tx, self) => {
    const m = await recipient(tx, s.workspace_id, self, view, s.member_id);
    return {
      ...(s.document as object),
      client_id: m.user_id,
      member_name: m.name,
      version: s.version,
      completed_at: s.completed_at,
    };
  });
}
export async function sessionCommand(actor: Actor, id: string, input: Input) {
  const view = role(input.view),
    action = String(input.action),
    sessionId = uuid(input.id);
  let today = "";
  if (action === "start") {
    const profile = await asActor(actor, (tx) =>
      tx.profiles.findUnique({
        where: { id: actor.id },
        select: { timezone: true },
      }),
    );
    today = new Intl.DateTimeFormat("en-CA", {
      timeZone: profile?.timezone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }
  const authorize = async (tx: Tx, self: Member) => {
    if (action === "start") {
      if (view !== "trainee") throw new ApiError(403, "forbidden");
      return;
    }
    const s = await tx.organization_sessions.findUnique({
      where: { id: sessionId },
    });
    if (!s || s.workspace_id !== id) throw new ApiError(403, "session_missing");
    await recipient(tx, id, self, view, s.member_id);
    if (
      (action === "save" && view !== "trainee") ||
      (action === "review" && view === "trainee") ||
      !["save", "review"].includes(action)
    )
      throw new ApiError(403, "forbidden");
  };
  return mutation(
    actor,
    id,
    [view],
    input,
    async (tx, self) => {
      if (action === "start") {
        const assignment = await tx.organization_assignments.findUnique({
          where: { id: uuid(input.assignment_id) },
          include: { organization_versions: true },
        });
        if (
          !assignment ||
          assignment.workspace_id !== id ||
          assignment.member_id !== self.id
        )
          throw new ApiError(403, "trainee_unavailable");
        const existing = await tx.organization_sessions.findUnique({
          where: { id: sessionId },
        });
        if (existing) {
          if (
            existing.assignment_id !== assignment.id ||
            existing.day_id !== input.day_id
          )
            throw new ApiError(409, "operation_reused");
          return existing.document;
        }
        const nowDate = date(today);
        if (
          assignment.state !== "active" ||
          assignment.start_date > nowDate ||
          (assignment.end_date && assignment.end_date < nowDate)
        )
          throw new ApiError(400, "assignment_unavailable");
        const plan = assignment.organization_versions.prescription as any,
          day = plan.days.find((d: any) => d.id === input.day_id);
        if (!day || day.restDay) throw new ApiError(400, "invalid_day");
        const delta = Math.floor(
          (nowDate.getTime() - assignment.start_date.getTime()) / 86400000,
        );
        if (
          assignment.schedule_mode === "cycle" &&
          delta % (7 * (plan.cycleWeeks || 1)) !==
            ((day.week || 1) - 1) * 7 + day.weekday
        )
          throw new ApiError(400, "not_scheduled_today");
        const occurrence = await tx.organization_sessions.findUnique({
          where: {
            assignment_id_local_date_day_id: {
              assignment_id: assignment.id,
              local_date: nowDate,
              day_id: day.id,
            },
          },
        });
        if (occurrence) return occurrence.document;
        const document = {
          id: sessionId,
          workspace_id: id,
          member_id: self.id,
          client_id: actor.id,
          coach_id: null,
          assignment_id: assignment.id,
          version_id: assignment.version_id,
          day_id: day.id,
          occurrence_key: `${assignment.id}:${today}:${day.id}`,
          local_date: today,
          title: assignment.organization_versions.title,
          prescription: day,
          status: "in_progress",
          entries: day.exercises.flatMap((e: any) =>
            Array.from({ length: e.sets }, (_, i) => {
              const t = e.targets?.[i] || e;
              return {
                exercise_key: e.key,
                set_index: i,
                reps: t.reps,
                load: t.load,
                unit: e.unit,
                seconds: t.seconds ?? null,
                metres: t.metres ?? null,
                effort: t.effort ?? null,
                completed: false,
              };
            }),
          ),
          note: "",
          coach_note: "",
          reviewed_at: null,
          started_at: new Date().toISOString(),
          completed_at: null,
          version: 1,
        };
        await tx.organization_sessions.create({
          data: {
            id: sessionId,
            workspace_id: id,
            member_id: self.id,
            assignment_id: assignment.id,
            day_id: day.id,
            local_date: nowDate,
            document: json(document),
          },
        });
        return document;
      }
      const s = await tx.organization_sessions.findUniqueOrThrow({
        where: { id: sessionId },
      });
      if (s.version !== input.revision) throw new ApiError(409, "conflict");
      const current = s.document as any;
      let document: any,
        completed = s.completed_at;
      if (action === "save") {
        if (
          typeof input.complete !== "boolean" ||
          typeof input.note !== "string"
        )
          throw new ApiError(400, "invalid_session");
        await tx.$queryRaw`SELECT public.validate_session_actuals(${JSON.stringify(current.prescription)}::jsonb,${JSON.stringify(input.entries)}::jsonb,${input.note},${input.complete})::text`;
        completed = completed || (input.complete ? new Date() : null);
        document = {
          ...current,
          entries: input.entries,
          note: input.note,
          status: completed ? "completed" : "in_progress",
          completed_at: completed?.toISOString() || null,
          reviewed_at: null,
          reviewed_by: null,
          coach_note: "",
          version: s.version + 1,
        };
      } else {
        if (!completed) throw new ApiError(400, "session_not_completed");
        const note = typeof input.note === "string" ? input.note.trim() : "";
        if (!note || note.length > 2000)
          throw new ApiError(400, "invalid_feedback");
        document = {
          ...current,
          coach_note: note,
          reviewed_at: new Date().toISOString(),
          reviewed_by: self.id,
          version: s.version + 1,
        };
      }
      await tx.organization_sessions.update({
        where: { id: sessionId },
        data: {
          document: json(document),
          completed_at: completed,
          version: { increment: 1 },
        },
      });
      return document;
    },
    authorize,
  );
}
export async function previousOrganizationPerformance(
  actor: Actor,
  sessionId: string,
) {
  const s = await db.organization_sessions.findUnique({
    where: { id: uuid(sessionId) },
  });
  if (!s) throw new ApiError(404, "session_missing");
  return scoped(actor, s.workspace_id, ["trainee"], async (tx, self) => {
    if (s.member_id !== self.id) throw new ApiError(403, "forbidden");
    const wanted = (s.document as any).prescription.exercises.flatMap(
      (e: any) => [
        e.exerciseId,
        ...(e.alternatives || []).map((a: any) => a.exerciseId),
      ],
    );
    return tx.$queryRaw<unknown[]>`WITH actual AS (
   SELECT h.id,h.completed_at,e.value AS original,coalesce(nullif((SELECT x->>'exercise_id' FROM jsonb_array_elements(h.document->'entries') x WHERE x->>'exercise_key'=e.value->>'key' LIMIT 1),''),e.value->>'exerciseId') AS exercise_id,
    (SELECT jsonb_agg(x ORDER BY (x->>'set_index')::int) FROM jsonb_array_elements(h.document->'entries') x WHERE x->>'exercise_key'=e.value->>'key' AND (x->>'completed')::boolean) AS entries
   FROM public.organization_sessions h CROSS JOIN LATERAL jsonb_array_elements(h.document->'prescription'->'exercises') e(value)
   WHERE h.workspace_id=${s.workspace_id}::uuid AND h.member_id=${self.id}::uuid AND h.completed_at<${s.started_at}
  ) SELECT DISTINCT ON(exercise_id) exercise_id,completed_at,coalesce((SELECT original||jsonb_build_object('exerciseId',alt->>'exerciseId','info',alt->'info') FROM jsonb_array_elements(coalesce(original->'alternatives','[]')) alt WHERE alt->>'exerciseId'=exercise_id),original) AS prescription,entries
    FROM actual WHERE entries IS NOT NULL AND exercise_id=ANY(${wanted}::text[]) ORDER BY exercise_id,completed_at DESC,id DESC LIMIT 48`;
  });
}
