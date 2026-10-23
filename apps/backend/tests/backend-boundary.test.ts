import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { db } from "../server/db.ts";
import { apiOrigin } from "./test-target.ts";
async function auth(user: string) {
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
async function get(path: string, cookie: string) {
  const response = await fetch(apiOrigin + path, {
    headers: { Cookie: cookie },
  });
  return { status: response.status, data: await response.json() };
}
const owned = {
  session: randomUUID(),
  occurrence: randomUUID(),
  recurrence: randomUUID(),
};
after(async () => {
  try {
    await db.organization_workout_positions.deleteMany({
      where: { occurrence_id: owned.occurrence },
    });
    await db.organization_workout_recurrences.deleteMany({
      where: { id: owned.recurrence },
    });
    await db.organization_sessions.deleteMany({ where: { id: owned.session } });
    await db.organization_events.deleteMany({
      where: { id: owned.occurrence },
    });
  } finally {
    await db.$disconnect();
  }
});
test("own export includes workout history/sequence metadata without granting institution admins another athlete's export", async () => {
  const workspace = "12000000-0000-4000-8000-000000000001",
    member = "13000000-0000-4000-8000-000000000003",
    coach = "13000000-0000-4000-8000-000000000002",
    assignment = "16000000-0000-4000-8000-000000000001";
  const { session, occurrence } = owned;
  await db.organization_events.create({
    data: {
      id: occurrence,
      workspace_id: workspace,
      created_by: coach,
      series_id: randomUUID(),
      title: "Export fixture",
      kind: "training",
      timezone: "UTC",
      starts_at: new Date(),
      ends_at: new Date(Date.now() + 3600000),
    },
  });
  await db.organization_event_people.create({
    data: {
      workspace_id: workspace,
      event_id: occurrence,
      member_id: member,
      duty: "trainee",
    },
  });
  await db.organization_sessions.create({
    data: {
      id: session,
      workspace_id: workspace,
      member_id: member,
      assignment_id: assignment,
      day_id: "export-day",
      local_date: new Date(),
      document: { prescription: { id: "export-day", exercises: [] } },
      occurrence_id: occurrence,
    },
  });
  const history = await db.organization_session_history.create({
    data: {
      id: randomUUID(),
      workspace_id: workspace,
      session_id: session,
      version: 1,
      actor_member_id: coach,
      action: "start",
      entries: [],
      note: "Private actual history",
      completed: false,
    },
  });
  const position = await db.organization_workout_positions.create({
    data: {
      workspace_id: workspace,
      assignment_id: assignment,
      position: 0,
      cycle: 0,
      day_id: "export-day",
      occurrence_id: occurrence,
      session_id: session,
    },
  });
  const recurrence = await db.organization_workout_recurrences.create({
    data: {
      id: owned.recurrence,
      workspace_id: workspace,
      assignment_id: assignment,
      created_by: coach,
      starts_on: new Date(),
      ends_on: new Date(Date.now() + 7 * 86400000),
      weekdays: [1],
      timezone: "UTC",
    },
  });
  const athleteAuth = await auth("11000000-0000-4000-8000-000000000003");
  const own = await get("/v1/account/organizations", athleteAuth);
  assert.equal(own.status, 200, JSON.stringify(own));
  assert.ok(
    own.data.workoutHistory.some((r: { id: string }) => r.id === history.id),
  );
  assert.ok(
    own.data.workoutPositions.some((r: { id: string }) => r.id === position.id),
  );
  assert.ok(
    own.data.workoutRecurrences.some(
      (r: { id: string }) => r.id === recurrence.id,
    ),
  );
  const admin = await get(
    "/v1/account/organizations",
    await auth("11000000-0000-4000-8000-000000000001"),
  );
  assert.equal(admin.status, 200);
  assert.ok(!JSON.stringify(admin.data).includes(session));
  const contexts = await get("/v1/contexts", athleteAuth);
  assert.equal(contexts.data.contexts[0].path, "/dashboard");
  assert.equal(contexts.data.contexts[0].workspace_id, workspace);
  assert.equal(contexts.data.contexts[0].id, workspace + ":trainee");
});
