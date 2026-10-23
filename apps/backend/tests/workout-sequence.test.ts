import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { db } from "../server/db.ts";
import type { Prisma } from "../server/generated/prisma/client.ts";
import { apiOrigin } from "./test-target.ts";
const workspace = "12000000-0000-4000-8000-000000000001";
const coach = "13000000-0000-4000-8000-000000000002",
  athlete = "13000000-0000-4000-8000-000000000003";
const assignment = "16000000-0000-4000-8000-000000000001";
const base = apiOrigin + "/v1/workspaces/" + workspace;
const operation = (action: string, fields: object = {}) => ({
  operation: randomUUID(),
  action,
  view: "trainer",
  ...fields,
});
async function cookie(user: string) {
  const token = randomBytes(32).toString("hex");
  await db.identity_sessions.create({
    data: {
      user_id: user,
      token_hash: createHash("sha256").update(token).digest("hex"),
      expires_at: new Date(Date.now() + 3600000),
    },
  });
  return "rafik_session=" + token;
}
async function call(auth: string, path: string, input: object) {
  const response = await fetch(base + path, {
    method: "POST",
    headers: {
      Cookie: auth,
      "x-rafik-client": "web",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return { status: response.status, data: await response.json() };
}
const slot = (days: number) => {
  const start = new Date(Date.now() + days * 86400000);
  return {
    starts_at: start.toISOString(),
    ends_at: new Date(start.getTime() + 1800000).toISOString(),
    timezone: "UTC",
  };
};
after(async () => {
  await db.$disconnect();
});

test("individual sequence: concurrent binding, independent plans, exact resolution, correction, repeat, restrictions and end policy", async () => {
  const auth = await cookie("11000000-0000-4000-8000-000000000002");
  const athleteAuth = await cookie("11000000-0000-4000-8000-000000000003");
  const startDate = new Date(Date.now() - 14 * 86400000);
  await db.organization_assignments.update({
    where: { id: assignment },
    data: { start_date: startDate },
  });
  const version = await db.organization_versions.findUniqueOrThrow({
    where: { id: "15000000-0000-4000-8000-000000000001" },
  });
  const otherVersion = await db.organization_versions.create({
    data: {
      ...version,
      prescription: version.prescription as Prisma.InputJsonValue,
      id: randomUUID(),
      revision: 2,
    },
  });
  const other = await db.organization_assignments.create({
    data: {
      id: randomUUID(),
      workspace_id: workspace,
      member_id: athlete,
      version_id: otherVersion.id,
      created_by: coach,
      start_date: startDate,
      schedule_mode: "flexible",
    },
  });
  const firstInput = operation("schedule-workout", {
    assignment_id: assignment,
    cursor: 0,
    ...slot(-3),
  });
  const [first, competing] = await Promise.all([
    call(auth, "/workout-scheduling", firstInput),
    call(auth, "/workout-scheduling", {
      ...firstInput,
      operation: randomUUID(),
    }),
  ]);
  assert.deepEqual(
    [first.status, competing.status].sort(),
    [200, 409],
    JSON.stringify({ first, competing }),
  );
  const firstResult = first.status === 200 ? first : competing;
  const winningInput =
    first.status === 200
      ? firstInput
      : await db.workspace_operations
          .findFirstOrThrow({
            where: {
              result: {
                path: ["occurrence", "id"],
                equals: firstResult.data.occurrence.id,
              },
            },
          })
          .then((x) => x.payload);
  assert.deepEqual(
    (await call(auth, "/workout-scheduling", winningInput as object)).data,
    firstResult.data,
  );
  const a = firstResult.data;
  assert.equal(a.position.position, 0);
  assert.equal(
    (
      await db.organization_assignments.findUniqueOrThrow({
        where: { id: assignment },
      })
    ).sequence_cursor,
    0,
    "scheduling does not consume progress",
  );
  const independent = await call(
    auth,
    "/workout-scheduling",
    operation("schedule-workout", {
      assignment_id: other.id,
      cursor: 0,
      ...slot(1),
    }),
  );
  assert.equal(independent.status, 200, JSON.stringify(independent));
  const early = await call(
    auth,
    "/sessions",
    operation("start", {
      id: randomUUID(),
      assignment_id: other.id,
      day_id: independent.data.position.day_id,
      occurrence_id: independent.data.occurrence.id,
    }),
  );
  assert.equal(early.status, 409);
  assert.equal(early.data.message, "workout_not_started_yet");
  const calendarBypass = await call(
    auth,
    "/calendar",
    operation("finish", { id: a.occurrence.id, revision: 1 }),
  );
  assert.equal(calendarBypass.status, 409);
  assert.equal(calendarBypass.data.message, "use_workout_scheduling");

  assert.equal(
    (
      await call(
        athleteAuth,
        "/workout-scheduling",
        operation("skip-workout", {
          view: "trainee",
          assignment_id: assignment,
          occurrence_id: a.occurrence.id,
          revision: 1,
          reason: "No",
        }),
      )
    ).status,
    403,
  );
  const initial = await call(
    auth,
    "/sessions",
    operation("start", {
      id: randomUUID(),
      assignment_id: assignment,
      day_id: a.position.day_id,
    }),
  );
  assert.equal(
    initial.status,
    409,
    "old arbitrary-day start cannot bypass bound work",
  );
  const begin = operation("start", {
    id: randomUUID(),
    assignment_id: assignment,
    day_id: a.position.day_id,
    occurrence_id: a.occurrence.id,
  });
  const started = await call(auth, "/sessions", begin);
  assert.equal(started.status, 200, JSON.stringify(started));
  const save = operation("save", {
    id: started.data.id,
    revision: 1,
    entries: started.data.entries.map((entry: any) => ({
      ...entry,
      completed: true,
    })),
    note: "Actual training",
    complete: true,
  });
  const saved = await call(auth, "/sessions", save);
  assert.equal(saved.status, 200, JSON.stringify(saved));
  assert.deepEqual((await call(auth, "/sessions", save)).data, saved.data);
  assert.equal(
    (
      await db.organization_assignments.findUniqueOrThrow({
        where: { id: assignment },
      })
    ).sequence_cursor,
    1,
  );
  const correction = await call(auth, "/sessions", {
    ...save,
    operation: randomUUID(),
    revision: 2,
    note: "Corrected actuals",
  });
  assert.equal(correction.status, 200, JSON.stringify(correction));
  assert.equal(
    (
      await db.organization_assignments.findUniqueOrThrow({
        where: { id: assignment },
      })
    ).sequence_cursor,
    1,
    "corrections never advance twice",
  );
  const next = await call(
    auth,
    "/workout-scheduling",
    operation("schedule-workout", {
      assignment_id: assignment,
      cursor: 1,
      ...slot(-2),
    }),
  );
  assert.equal(next.status, 200, JSON.stringify(next));
  assert.notEqual(next.data.position.day_id, a.position.day_id);
  assert.equal(
    (
      await call(
        auth,
        "/workout-scheduling",
        operation("skip-workout", {
          assignment_id: assignment,
          occurrence_id: next.data.occurrence.id,
          revision: 1,
          reason: " ",
        }),
      )
    ).status,
    400,
  );
  const skip = operation("skip-workout", {
    assignment_id: assignment,
    occurrence_id: next.data.occurrence.id,
    revision: 1,
    reason: "Coach agreed recovery day",
  });
  const skipped = await call(auth, "/workout-scheduling", skip);
  assert.equal(skipped.status, 200, JSON.stringify(skipped));
  assert.deepEqual(
    (await call(auth, "/workout-scheduling", skip)).data,
    skipped.data,
  );
  assert.equal(skipped.data.cursor, 2);
  const repeated = await call(
    auth,
    "/workout-scheduling",
    operation("schedule-workout", {
      assignment_id: assignment,
      cursor: 2,
      ...slot(-1),
    }),
  );
  assert.equal(repeated.status, 200, JSON.stringify(repeated));
  assert.equal(repeated.data.position.day_id, a.position.day_id);
  assert.equal(repeated.data.position.cycle, 1);
  const reschedule = await call(
    auth,
    "/workout-scheduling",
    operation("reschedule-workout", {
      assignment_id: assignment,
      occurrence_id: repeated.data.occurrence.id,
      revision: 1,
      ...slot(-1.1),
    }),
  );
  assert.equal(reschedule.status, 200, JSON.stringify(reschedule));
  assert.equal(reschedule.data.position.id, repeated.data.position.id);
  assert.equal(
    (
      await db.organization_assignments.findUniqueOrThrow({
        where: { id: assignment },
      })
    ).sequence_cursor,
    2,
  );
  const pausedStart = await call(
    auth,
    "/sessions",
    operation("start", {
      id: randomUUID(),
      assignment_id: assignment,
      day_id: repeated.data.position.day_id,
      occurrence_id: repeated.data.occurrence.id,
    }),
  );
  assert.equal(pausedStart.status, 200, JSON.stringify(pausedStart));
  const ended = await call(
    auth,
    "/delivery",
    operation("end", { assignment, revision: 1 }),
  );
  assert.equal(ended.status, 200, JSON.stringify(ended));
  assert.equal(
    (
      await db.organization_workout_positions.findUniqueOrThrow({
        where: { id: repeated.data.position.id },
      })
    ).state,
    "paused",
  );
  assert.ok(
    await db.organization_sessions.findUnique({
      where: { id: pausedStart.data.id },
    }),
    "in-progress data survives ending",
  );
  const endOther = await call(
    auth,
    "/delivery",
    operation("end", { assignment: other.id, revision: 1 }),
  );
  assert.equal(endOther.status, 200, JSON.stringify(endOther));
  assert.equal(
    (
      await db.organization_events.findUniqueOrThrow({
        where: { id: independent.data.occurrence.id },
      })
    ).state,
    "cancelled",
  );
  // A current cannot-train flag blocks scheduling with a general explanation only.
  await db.organization_assignments.update({
    where: { id: other.id },
    data: { state: "active" },
  });
  const restriction = await db.organization_injury_records.create({
    data: {
      id: randomUUID(),
      workspace_id: workspace,
      athlete_member_id: athlete,
      participation: "unavailable",
      effective_from: startDate,
    },
  });
  const blocked = await call(
    auth,
    "/workout-scheduling",
    operation("schedule-workout", {
      assignment_id: other.id,
      cursor: 0,
      ...slot(1),
    }),
  );
  assert.equal(blocked.status, 409);
  assert.equal(blocked.data.message, "participation_unavailable");
  assert.ok(!JSON.stringify(blocked).includes(restriction.id));
  await db.workspace_members.update({
    where: { id: coach },
    data: { active: false },
  });
  assert.equal(
    (await call(auth, "/workout-scheduling", winningInput as object)).status,
    403,
    "revocation is checked before receipt replay",
  );
});
