import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { db } from "../server/db.ts";
import {
  dispatchNotifications,
  localSink,
  defaultCategories,
} from "../server/notifications.ts";
import {
  organizationFixture,
  call,
  operation,
} from "./organization-fixture.ts";
after(() => db.$disconnect());
test("notification intent, scoped inbox, preferences, quiet hours, retry and local interception are distinct from message reads", async () => {
  const f = await organizationFixture();
  try {
    const admin = await f.person(),
      client = await f.person(),
      other = await f.person(),
      id = await f.create(admin),
      trainee = await f.join(admin, id, client, ["trainee"]),
      self = await db.workspace_members.findUniqueOrThrow({
        where: {
          workspace_id_user_id: { workspace_id: id, user_id: admin.id },
        },
      }),
      channel = randomUUID();
    await call(
      admin,
      `/v1/workspaces/${id}/communication`,
      operation("create", {
        id: channel,
        view: "admin",
        title: "Private coaching",
        members: [self.id, trainee.id],
        managers: [self.id],
      }),
    );
    const send = operation("send", {
      id: channel,
      view: "admin",
      message: randomUUID(),
      body: "Private assessment detail must never enter an email preview.",
    });
    assert.equal(
      (await call(admin, `/v1/workspaces/${id}/communication`, send)).status,
      200,
    );
    await call(admin, `/v1/workspaces/${id}/communication`, send);
    let rows = await db.notification_events.findMany({
      where: { user_id: client.id },
    });
    assert.equal(rows.length, 1, "domain retry captures one intent");
    const notification = rows[0];
    const inbox = await call(client, "/v1/notifications");
    assert.equal(inbox.status, 200, JSON.stringify(inbox));
    assert.equal(inbox.data.items.length, 1);
    assert.match(inbox.data.items[0].href, new RegExp(channel));
    assert.equal(
      (await call(other, "/v1/notifications?id=" + notification.id)).status,
      403,
    );
    assert.equal(
      (await call(other, "/v1/notifications", { id: notification.id })).status,
      403,
    );
    const categories = defaultCategories();
    categories.messages.email = true;
    const pref = { categories, quiet_start: 0, quiet_end: 0, revision: 0 };
    let p = await call(client, "/v1/notifications/preferences", pref);
    assert.equal(p.status, 200);
    assert.equal(
      (await call(client, "/v1/notifications/preferences", pref)).status,
      200,
      "lost preference acknowledgment replays without revision churn",
    );
    await dispatchNotifications({
      async accept(tx, n) {
        await localSink.accept(tx, n);
        if (n.id === notification.id)
          throw Error("simulated lost local sink acknowledgment");
      },
    });
    let n = await db.notification_events.findUniqueOrThrow({
      where: { id: notification.id },
    });
    assert.equal(n.state, "pending");
    assert.equal(n.attempts, 1);
    assert.equal(
      await db.notification_intercepts.count({ where: { event_id: n.id } }),
      0,
      "failed sink transaction rolls back its partial local receipt",
    );
    await db.notification_events.update({
      where: { id: n.id },
      data: { not_before: new Date(0) },
    });
    await Promise.all([dispatchNotifications(), dispatchNotifications()]);
    n = await db.notification_events.findUniqueOrThrow({ where: { id: n.id } });
    assert.equal(n.state, "intercepted");
    assert.equal(n.read_at, null, "acceptance is not a read receipt");
    const captures = await db.notification_intercepts.findMany({
      where: { event_id: n.id },
    });
    assert.equal(captures.length, 1);
    assert.ok(!captures[0].body.includes("Private assessment"));
    assert.match(captures[0].body, /\/notifications\?event=/);
    await call(client, "/v1/notifications", { id: n.id });
    assert.ok(
      (await db.notification_events.findUniqueOrThrow({ where: { id: n.id } }))
        .read_at,
    );
    const hour = new Date().getUTCHours();
    await call(client, "/v1/commands/update_profile", {
      p_name: "Notification trainee",
      p_locale: "en",
      p_units: "metric",
      p_timezone: "UTC",
    });
    p = await call(client, "/v1/notifications/preferences", {
      categories,
      quiet_start: hour,
      quiet_end: (hour + 1) % 24,
      revision: 1,
    });
    assert.equal(p.status, 200);
    const second = {
      ...send,
      operation: randomUUID(),
      message: randomUUID(),
      body: "A quiet-hours update",
    };
    await call(admin, `/v1/workspaces/${id}/communication`, second);
    await dispatchNotifications();
    const quiet = await db.notification_events.findFirstOrThrow({
      where: { source_id: second.message },
    });
    assert.equal(quiet.reason, "quiet_hours");
    assert.equal(quiet.state, "pending");
    assert.ok(quiet.not_before > new Date());
    categories.messages.email = false;
    categories.messages.in_app = false;
    assert.equal(
      (
        await call(client, "/v1/notifications/preferences", {
          categories,
          quiet_start: 0,
          quiet_end: 0,
          revision: 2,
        })
      ).status,
      200,
    );
    await db.notification_events.update({
      where: { id: quiet.id },
      data: { not_before: new Date(0) },
    });
    await dispatchNotifications();
    assert.equal(
      (
        await db.notification_events.findUniqueOrThrow({
          where: { id: quiet.id },
        })
      ).reason,
      "opted_out",
    );
    assert.equal(
      (await call(client, "/v1/notifications")).data.items.length,
      0,
    );
    categories.messages.email = true;
    categories.messages.in_app = true;
    await call(client, "/v1/notifications/preferences", {
      categories,
      quiet_start: 0,
      quiet_end: 0,
      revision: 3,
    });
    const third = {
      ...send,
      operation: randomUUID(),
      message: randomUUID(),
      body: "An update before removal",
    };
    await call(admin, `/v1/workspaces/${id}/communication`, third);
    await call(
      admin,
      `/v1/workspaces/${id}`,
      operation("member", {
        id: trainee.id,
        revision: 1,
        roles: ["trainee"],
        active: false,
      }),
    );
    await dispatchNotifications();
    assert.equal(
      (
        await db.notification_events.findFirstOrThrow({
          where: { source_id: third.message },
        })
      ).reason,
      "obsolete",
    );
    assert.equal(
      (await call(client, "/v1/notifications")).data.items.length,
      0,
    );
  } finally {
    await f.cleanup();
  }
});

test("independent reminders suppress answered forms and cancelled appointments; message bursts coalesce and failed delivery is bounded", async () => {
  const f = await organizationFixture();
  let practice = "";
  try {
    const coach = await f.person(),
      client = await f.person(),
      rel = randomUUID();
    practice = randomUUID();
    assert.equal(
      (
        await call(coach, "/v1/workspaces", {
          id: practice,
          kind: "independent",
          name: "Notification test practice",
        })
      ).status,
      200,
    );
    execFileSync(
      "docker",
      [
        "compose",
        "exec",
        "-T",
        "db",
        "psql",
        "-U",
        "rafik_migrate",
        "-d",
        "rafik",
        "-v",
        "ON_ERROR_STOP=1",
      ],
      {
        input: `insert into public.coach_clients(id,coach_id,client_id) values('${rel}','${coach.id}','${client.id}');`,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    const cmd = async (
      p: typeof coach,
      name: string,
      args: Record<string, unknown>,
    ) => {
      const r = await call(p, "/v1/commands/" + name, args);
      assert.equal(r.status, 200, JSON.stringify(r));
      return r.data;
    };
    const categories = defaultCategories();
    for (const k of Object.keys(categories) as (keyof typeof categories)[])
      categories[k].email = true;
    assert.equal(
      (
        await call(client, "/v1/notifications/preferences", {
          categories,
          quiet_start: 0,
          quiet_end: 0,
          revision: 0,
        })
      ).status,
      200,
    );
    const form = randomUUID();
    await cmd(coach, "save_coaching_form", {
      p_id: form,
      p_title: "Weekly reflection",
      p_kind: "checkin",
      p_fields: [
        { id: "note", label: "How did it go?", type: "text", required: true },
      ],
      p_revision: 0,
    });
    const requests = await cmd(coach, "assign_coaching_form", {
      p_series: randomUUID(),
      p_relationship: rel,
      p_form: form,
      p_revision: 1,
      p_due: new Date().toISOString().slice(0, 10),
      p_count: 1,
      p_interval: 7,
    });
    const local = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 16),
      slots = await cmd(coach, "publish_availability", {
        p_series: randomUUID(),
        p_local: local,
        p_zone: "UTC",
        p_minutes: 30,
        p_count: 1,
        p_every: 7,
        p_title: "Technique review",
        p_location: "Local fixture",
      });
    const appointment = await cmd(client, "book_appointment", {
      p_id: randomUUID(),
      p_relationship: rel,
      p_slot: slots[0].id,
    });
    // Capture due intents while quiet; then make their source obsolete before delivery.
    const hour = new Date().getUTCHours();
    await call(client, "/v1/notifications/preferences", {
      categories,
      quiet_start: hour,
      quiet_end: (hour + 1) % 24,
      revision: 1,
    });
    await dispatchNotifications();
    const due = await db.notification_events.findFirstOrThrow({
        where: { user_id: client.id, source_kind: "checkin_due" },
      }),
      reminder = await db.notification_events.findFirstOrThrow({
        where: { user_id: client.id, source_kind: "appointment_reminder" },
      });
    await cmd(client, "save_coaching_response", {
      p_id: requests[0].id,
      p_answers: { note: "Good" },
      p_revision: 1,
      p_submit: true,
    });
    await cmd(client, "change_appointment", {
      p_id: appointment.id,
      p_revision: 1,
      p_action: "cancelled",
    });
    await db.notification_events.updateMany({
      where: { id: { in: [due.id, reminder.id] } },
      data: { not_before: new Date(0) },
    });
    await dispatchNotifications();
    assert.equal(
      (
        await db.notification_events.findUniqueOrThrow({
          where: { id: due.id },
        })
      ).reason,
      "obsolete",
    );
    assert.equal(
      (
        await db.notification_events.findUniqueOrThrow({
          where: { id: reminder.id },
        })
      ).reason,
      "obsolete",
    );
    await call(client, "/v1/notifications/preferences", {
      categories,
      quiet_start: 0,
      quiet_end: 0,
      revision: 2,
    });
    const first = randomUUID(),
      second = randomUUID();
    await cmd(coach, "send_message", {
      p_id: first,
      p_relationship: rel,
      p_body: "First useful update",
    });
    await cmd(coach, "send_message", {
      p_id: second,
      p_relationship: rel,
      p_body: "Second useful update",
    });
    assert.equal(
      (await call(client, "/v1/notifications")).data.items.filter(
        (x: any) => x.category === "messages",
      ).length,
      1,
    );
    await dispatchNotifications({
      async accept(tx, n) {
        if (n.source_id === second) throw Error("provider unavailable");
        await localSink.accept(tx, n);
      },
    });
    assert.equal(
      (
        await db.notification_events.findFirstOrThrow({
          where: { source_id: first },
        })
      ).reason,
      "coalesced",
    );
    const latest = await db.notification_events.findFirstOrThrow({
      where: { source_id: second },
    });
    for (let i = 1; i < 5; i++) {
      await db.notification_events.update({
        where: { id: latest.id },
        data: { not_before: new Date(0) },
      });
      await dispatchNotifications({
        async accept(tx, n) {
          if (n.id === latest.id) throw Error("provider unavailable");
          await localSink.accept(tx, n);
        },
      });
    }
    const failed = await db.notification_events.findUniqueOrThrow({
      where: { id: latest.id },
    });
    assert.equal(failed.state, "failed");
    assert.equal(failed.attempts, 5);
    assert.equal(
      (await call(client, "/v1/conversations/" + rel)).data.length,
      2,
      "notification failure never removes messages",
    );
    const inbox = await call(client, "/v1/notifications");
    assert.ok(
      inbox.data.items.some(
        (n: any) => n.id === failed.id && n.state === "failed",
      ),
    );
  } finally {
    if (practice) await db.workspaces.deleteMany({ where: { id: practice } });
    await f.cleanup();
  }
});
