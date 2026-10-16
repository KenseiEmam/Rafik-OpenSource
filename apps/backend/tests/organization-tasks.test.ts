import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { db } from "../server/db.ts";
import {
  organizationFixture,
  call,
  operation,
} from "./organization-fixture.ts";
after(() => db.$disconnect());
test("admin assigns tasks; trainers complete only their own work and reassignment revokes replay", async () => {
  const f = await organizationFixture();
  try {
    const admin = await f.person(),
      trainer = await f.person(),
      peer = await f.person(),
      trainee = await f.person(),
      foreign = await f.person(),
      workspace = await f.create(admin),
      other = await f.create(foreign);
    const staff = await f.join(admin, workspace, trainer, ["trainer"]),
      second = await f.join(admin, workspace, peer, ["trainer"]);
    await f.join(admin, workspace, trainee, ["trainee"]);
    const endpoint = `/v1/workspaces/${workspace}/tasks`,
      key = randomUUID(),
      create = operation("save", {
        id: key,
        view: "admin",
        revision: 0,
        title: "Review technique before next session",
        description: "Check last session notes and follow up.",
        priority: "high",
        due_date: "2026-09-01",
        assigned_to: staff.id,
      });
    let r = await call(admin, endpoint, create);
    assert.equal(r.status, 200, JSON.stringify(r));
    assert.equal((await call(admin, endpoint, create)).data.id, key);
    assert.equal(
      (
        await call(trainer, endpoint, {
          ...create,
          operation: randomUUID(),
          id: randomUUID(),
          view: "trainer",
        })
      ).status,
      403,
    );
    assert.equal((await call(trainee, endpoint + "?view=trainee")).status, 403);
    assert.equal(
      (await call(peer, endpoint + "?view=trainer")).data.items.length,
      0,
    );
    const list = await call(
      trainer,
      endpoint + "?view=trainer&today=2026-09-28",
    );
    assert.equal(list.data.items[0].id, key);
    assert.equal(list.data.counts.overdue, 1);
    const done = operation("state", {
      id: key,
      view: "trainer",
      revision: 1,
      state: "completed",
    });
    r = await call(trainer, endpoint, done);
    assert.equal(r.status, 200);
    assert.equal(r.data.revision, 2);
    assert.equal((await call(peer, endpoint, done)).status, 403);
    assert.equal(
      (
        await call(foreign, `/v1/workspaces/${other}/tasks`, {
          ...done,
          view: "admin",
        })
      ).status,
      403,
    );
    assert.equal((await call(trainer, endpoint, done)).data.revision, 2);
    const reopen = operation("state", {
      id: key,
      view: "admin",
      revision: 2,
      state: "open",
    });
    assert.equal((await call(admin, endpoint, reopen)).status, 200);
    const edits = await Promise.all([
      call(admin, endpoint, {
        ...create,
        operation: randomUUID(),
        revision: 3,
        assigned_to: second.id,
      }),
      call(admin, endpoint, {
        ...create,
        operation: randomUUID(),
        revision: 3,
        assigned_to: second.id,
      }),
    ]);
    assert.deepEqual(edits.map((x) => x.status).sort(), [200, 409]);
    assert.equal(
      (await call(trainer, endpoint, done)).status,
      403,
      "reassigned trainer cannot replay previous success",
    );
    assert.equal(
      (await call(peer, endpoint + "?view=trainer")).data.items[0].id,
      key,
    );
    assert.equal(
      (
        await call(
          peer,
          endpoint,
          operation("state", {
            id: key,
            view: "trainer",
            revision: 4,
            state: "cancelled",
          }),
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await call(
          admin,
          endpoint,
          operation("state", {
            id: key,
            view: "admin",
            revision: 4,
            state: "cancelled",
          }),
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await call(
          admin,
          endpoint,
          operation("state", {
            id: key,
            view: "admin",
            revision: 5,
            state: "open",
          }),
        )
      ).status,
      200,
    );
    await db.workspace_members.update({
      where: { id: second.id },
      data: { active: false },
    });
    assert.equal((await call(peer, endpoint + "?view=trainer")).status, 403);
    assert.equal(
      (
        await call(admin, endpoint, {
          ...create,
          operation: randomUUID(),
          revision: 6,
          assigned_to: second.id,
        })
      ).status,
      400,
      "cannot assign to inactive staff",
    );
  } finally {
    await f.cleanup();
  }
});
test("follow-up queues show actual scope and do not infer no-shows from past scheduled events", async () => {
  const f = await organizationFixture();
  try {
    const admin = await f.person(),
      trainer = await f.person(),
      peer = await f.person(),
      client = await f.person(),
      workspace = await f.create(admin),
      staff = await f.join(admin, workspace, trainer, ["trainer"]);
    await f.join(admin, workspace, peer, ["trainer"]);
    const member = await f.join(admin, workspace, client, ["trainee"]);
    await call(
      admin,
      `/v1/workspaces/${workspace}`,
      operation("assign-trainer", {
        id: member.id,
        revision: 1,
        trainer: staff.id,
      }),
    );
    let r = await call(
      trainer,
      `/v1/workspaces/${workspace}/follow-up?view=trainer`,
    );
    assert.equal(r.status, 200, JSON.stringify(r));
    assert.equal(r.data.unplanned.total, 1);
    assert.equal(r.data.unplanned.items[0].id, member.id);
    assert.equal(r.data.reviews.total, 0);
    assert.equal(r.data.outcomes.total, 0);
    const eventId = randomUUID();
    const booking = await call(
      admin,
      `/v1/workspaces/${workspace}/calendar`,
      operation("create", {
        id: eventId,
        view: "admin",
        title: "Session awaiting outcome",
        kind: "training",
        staff: [staff.id],
        participants: [member.id],
        local: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        zone: "UTC",
        minutes: 60,
        count: 1,
        every: 7,
        location: "Studio",
      }),
    );
    assert.equal(booking.status, 200, JSON.stringify(booking));
    // Move only the owned fixture's booking into the past to exercise the time-based queue.
    await db.organization_events.update({
      where: { id: eventId },
      data: {
        starts_at: new Date(Date.now() - 7200000),
        ends_at: new Date(Date.now() - 3600000),
      },
    });
    r = await call(
      trainer,
      `/v1/workspaces/${workspace}/follow-up?view=trainer`,
    );
    assert.equal(r.data.outcomes.total, 1);
    assert.equal(r.data.outcomes.items[0].id, eventId);
    assert.equal(
      (
        await db.organization_events.findUniqueOrThrow({
          where: { id: eventId },
        })
      ).state,
      "scheduled",
      "queue is read-only; no automatic no-show state",
    );
    const plan = JSON.parse(
      readFileSync(new URL("../content/starter.json", import.meta.url), "utf8"),
    ).prescription;
    const published = await call(
      trainer,
      `/v1/workspaces/${workspace}/programs`,
      operation("publish", {
        view: "trainer",
        id: randomUUID(),
        title: "Follow-up plan",
        draft: plan,
        revision: null,
      }),
    );
    assert.equal(published.status, 200, JSON.stringify(published));
    const delivery = await call(
      trainer,
      `/v1/workspaces/${workspace}/delivery`,
      operation("assign", {
        view: "trainer",
        version_id: published.data.version.id,
        start_date: "2026-01-01",
        schedule_mode: "flexible",
        members: [{ id: member.id, revision: 2 }],
      }),
    );
    assert.equal(delivery.status, 200, JSON.stringify(delivery));
    const session = randomUUID(),
      started = await call(
        client,
        `/v1/workspaces/${workspace}/sessions`,
        operation("start", {
          view: "trainee",
          id: session,
          assignment_id: delivery.data[0].id,
          day_id: plan.days[0].id,
        }),
      );
    assert.equal(started.status, 200, JSON.stringify(started));
    const completed = await call(
      client,
      `/v1/workspaces/${workspace}/sessions`,
      operation("save", {
        view: "trainee",
        id: session,
        revision: 1,
        entries: started.data.entries.map((e: any) => ({
          ...e,
          completed: true,
        })),
        note: "Completed practice",
        complete: true,
      }),
    );
    assert.equal(completed.status, 200, JSON.stringify(completed));
    r = await call(
      trainer,
      `/v1/workspaces/${workspace}/follow-up?view=trainer`,
    );
    assert.equal(r.data.reviews.total, 1);
    assert.equal(r.data.reviews.items[0].id, session);
    assert.equal(r.data.unplanned.total, 0);
    const reviewed = await call(
      trainer,
      `/v1/workspaces/${workspace}/sessions`,
      operation("review", {
        view: "trainer",
        id: session,
        revision: 2,
        note: "Reviewed the technique",
      }),
    );
    assert.equal(reviewed.status, 200, JSON.stringify(reviewed));
    assert.equal(
      (
        await call(
          trainer,
          `/v1/workspaces/${workspace}/follow-up?view=trainer`,
        )
      ).data.reviews.total,
      0,
    );
    r = await call(peer, `/v1/workspaces/${workspace}/follow-up?view=trainer`);
    assert.equal(r.data.unplanned.total, 0);
    assert.equal(
      (await call(client, `/v1/workspaces/${workspace}/follow-up?view=trainee`))
        .status,
      403,
    );
  } finally {
    await f.cleanup();
  }
});
