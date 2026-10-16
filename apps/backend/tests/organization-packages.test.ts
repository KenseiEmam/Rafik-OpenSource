import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../server/db.ts";
import {
  organizationFixture,
  call,
  operation,
} from "./organization-fixture.ts";
after(() => db.$disconnect());
const day = (n: number) =>
  new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
async function setup() {
  const f = await organizationFixture(),
    admin = await f.person(),
    trainer = await f.person(),
    client = await f.person(),
    peer = await f.person(),
    workspace = await f.create(admin),
    staff = await f.join(admin, workspace, trainer, ["trainer"]),
    member = await f.join(admin, workspace, client, ["trainee"]),
    other = await f.join(admin, workspace, peer, ["trainer"]);
  await call(
    admin,
    `/v1/workspaces/${workspace}`,
    operation("assign-trainer", {
      id: member.id,
      revision: 1,
      trainer: staff.id,
    }),
  );
  return {
    f,
    admin,
    trainer,
    client,
    peer,
    workspace,
    staff,
    member,
    other,
    packages: `/v1/workspaces/${workspace}/packages`,
    calendar: `/v1/workspaces/${workspace}/calendar`,
  };
}
const packageInput = (member: string, allowance = 2) =>
  operation("create", {
    id: randomUUID(),
    view: "admin",
    member,
    title: "Personal training",
    allowance,
    starts_on: day(-3),
    ends_on: day(60),
    timezone: "UTC",
  });
const booking = (
  f: Awaited<ReturnType<typeof setup>>,
  key: string | null,
  hour = 10,
  reason = "trial",
) =>
  operation("create", {
    id: randomUUID(),
    view: "trainer",
    title: "Personal training session",
    kind: "training",
    staff: [f.staff.id],
    participants: [f.member.id],
    local: day(1) + `T${String(hour).padStart(2, "0")}:00`,
    zone: "UTC",
    minutes: 60,
    count: 1,
    every: 7,
    funding: [
      {
        member: f.member.id,
        package_id: key,
        makeup_for: null as string | null,
        independent_reason: key ? "" : reason,
      },
    ],
  });
const ok = (r: any) => {
  assert.equal(r.status, 200, JSON.stringify(r));
  return r.data;
};
async function past(id: string) {
  await db.organization_events.update({
    where: { id },
    data: {
      starts_at: new Date(Date.now() - 7200000),
      ends_at: new Date(Date.now() - 3600000),
    },
  });
}
test("package reservations are atomic; standalone sessions never deduct and each no-show needs a decision", async () => {
  const f = await setup();
  try {
    const create = packageInput(f.member.id, 1),
      pack = ok(await call(f.admin, f.packages, create));
    assert.equal(ok(await call(f.admin, f.packages, create)).id, pack.id);
    const read = async () =>
      ok(await call(f.admin, f.packages + `?view=admin&id=${pack.id}`)).item;
    const one = booking(f, pack.id, 10),
      two = booking(f, pack.id, 12),
      race = await Promise.all([
        call(f.trainer, f.calendar, one),
        call(f.trainer, f.calendar, two),
      ]);
    assert.deepEqual(race.map((r) => r.status).sort(), [200, 409]);
    assert.equal((await read()).reserved, 1);
    assert.equal((await read()).available, 0);
    const successful = race[0].status === 200 ? one : two,
      event = ok(race.find((r) => r.status === 200))[0];
    assert.equal(
      ok(await call(f.trainer, f.calendar, successful))[0].id,
      event.id,
    );
    assert.equal((await read()).reserved, 1);
    assert.equal(
      (
        await call(
          f.admin,
          f.packages,
          operation("archive", {
            view: "admin",
            id: pack.id,
            revision: 1,
            archived: true,
          }),
        )
      ).status,
      400,
    );
    ok(
      await call(
        f.trainer,
        f.calendar,
        operation("cancel", { view: "trainer", id: event.id, revision: 1 }),
      ),
    );
    assert.equal((await read()).available, 1);
    assert.equal((await read()).reserved, 0);
    for (const [i, reason] of ["trial", "makeup", "prize"].entries()) {
      const independent = ok(
        await call(f.trainer, f.calendar, booking(f, null, 14 + i * 2, reason)),
      )[0];
      await past(independent.id);
      ok(
        await call(
          f.trainer,
          f.calendar,
          operation("attendance", {
            view: "trainer",
            id: independent.id,
            member: f.member.id,
            revision: 1,
            attendance: "present",
          }),
        ),
      );
      ok(
        await call(
          f.trainer,
          f.calendar,
          operation("finish", {
            view: "trainer",
            id: independent.id,
            revision: 1,
          }),
        ),
      );
      assert.equal((await read()).available, 1);
      assert.equal((await read()).used, 0);
    }
    const booked = ok(
      await call(f.trainer, f.calendar, {
        ...booking(f, pack.id, 10),
        operation: randomUUID(),
        id: randomUUID(),
      }),
    )[0];
    await past(booked.id);
    assert.equal(
      (
        await call(
          f.trainer,
          f.calendar,
          operation("attendance", {
            view: "trainer",
            id: booked.id,
            member: f.member.id,
            revision: 1,
            attendance: "absent",
          }),
        )
      ).status,
      400,
    );
    ok(
      await call(
        f.trainer,
        f.calendar,
        operation("attendance", {
          view: "trainer",
          id: booked.id,
          member: f.member.id,
          revision: 1,
          attendance: "absent",
          charge_absence: false,
        }),
      ),
    );
    assert.equal(
      (await read()).reserved,
      1,
      "allowance remains reserved until session outcome is completed",
    );
    const finish = operation("finish", {
      view: "trainer",
      id: booked.id,
      revision: 1,
    });
    ok(await call(f.trainer, f.calendar, finish));
    ok(await call(f.trainer, f.calendar, finish));
    assert.equal((await read()).available, 1);
    assert.equal((await read()).used, 0);
    const correction = operation("attendance", {
      view: "trainer",
      id: booked.id,
      member: f.member.id,
      revision: 2,
      attendance: "absent",
      charge_absence: true,
      reason: "Staff reviewed the attendance policy with the client",
    });
    ok(await call(f.trainer, f.calendar, correction));
    ok(await call(f.trainer, f.calendar, correction));
    assert.equal((await read()).used, 1);
    assert.equal((await read()).available, 0);
    ok(
      await call(
        f.trainer,
        f.calendar,
        operation("attendance", {
          view: "trainer",
          id: booked.id,
          member: f.member.id,
          revision: 3,
          attendance: "excused",
          reason: "Approved exception",
        }),
      ),
    );
    assert.equal((await read()).used, 0);
    assert.equal((await read()).available, 1);
    const active = ok(
      await call(f.trainer, f.calendar, booking(f, pack.id, 12)),
    )[0];
    await past(active.id);
    ok(
      await call(
        f.trainer,
        f.calendar,
        operation("attendance", {
          view: "trainer",
          id: active.id,
          member: f.member.id,
          revision: 1,
          attendance: "present",
        }),
      ),
    );
    ok(
      await call(
        f.trainer,
        f.calendar,
        operation("finish", { view: "trainer", id: active.id, revision: 1 }),
      ),
    );
    assert.equal((await read()).used, 1);
    assert.equal(
      (
        await call(f.trainer, f.calendar, {
          ...correction,
          operation: randomUUID(),
          revision: 4,
        })
      ).status,
      409,
      "correction cannot overspend remaining allowance",
    );
    assert.equal((await read()).used, 1);
    const history = ok(
      await call(f.admin, f.packages + `?view=admin&id=${pack.id}`),
    );
    assert.equal(
      history.items.length,
      3,
      "independent bookings are excluded from package history",
    );
  } finally {
    await f.f.cleanup();
  }
});
test("packages enforce member and organization scope, date coverage and atomic repeated booking", async () => {
  const f = await setup();
  try {
    const create = packageInput(f.member.id, 2),
      pack = ok(await call(f.admin, f.packages, create));
    assert.equal(
      (
        await call(f.trainer, f.packages, {
          ...create,
          operation: randomUUID(),
          id: randomUUID(),
          view: "trainer",
        })
      ).status,
      403,
    );
    assert.equal(
      (await call(f.peer, f.packages + `?view=trainer&id=${pack.id}`)).status,
      403,
    );
    assert.equal(
      ok(await call(f.client, f.packages + `?view=trainee&id=${pack.id}`)).item
        .id,
      pack.id,
    );
    const outsider = await f.f.person(),
      foreign = await f.f.create(outsider);
    assert.equal(
      (
        await call(
          outsider,
          `/v1/workspaces/${foreign}/packages?view=admin&id=${pack.id}`,
        )
      ).status,
      403,
    );
    const tooMany = { ...booking(f, pack.id), count: 3 };
    assert.equal((await call(f.trainer, f.calendar, tooMany)).status, 409);
    assert.equal(
      await db.organization_events.count({
        where: { workspace_id: f.workspace },
      }),
      0,
    );
    const outside = { ...booking(f, pack.id), local: day(65) + "T10:00" };
    assert.equal((await call(f.trainer, f.calendar, outside)).status, 400);
    assert.equal(
      await db.organization_events.count({
        where: { workspace_id: f.workspace },
      }),
      0,
    );
    const series = { ...booking(f, pack.id), count: 2 };
    const events = ok(await call(f.trainer, f.calendar, series));
    assert.equal(events.length, 2);
    assert.equal(ok(await call(f.trainer, f.calendar, series)).length, 2);
    assert.equal(
      (
        await call(
          f.trainer,
          f.calendar,
          operation("reschedule", {
            view: "trainer",
            id: events[0].id,
            revision: 1,
            local: day(65) + "T10:00",
            zone: "UTC",
            minutes: 60,
          }),
        )
      ).status,
      400,
    );
    ok(
      await call(
        f.trainer,
        f.calendar,
        operation("cancel", {
          view: "trainer",
          id: events[0].id,
          revision: 1,
          future_series: true,
        }),
      ),
    );
    assert.equal(
      ok(await call(f.admin, f.packages + `?view=admin&id=${pack.id}`)).item
        .available,
      2,
    );
    ok(
      await call(
        f.admin,
        `/v1/workspaces/${f.workspace}`,
        operation("assign-trainer", {
          id: f.member.id,
          revision: 2,
          trainer: f.other.id,
        }),
      ),
    );
    assert.equal(
      (await call(f.trainer, f.calendar, series)).status,
      403,
      "current roster is checked before receipt replay",
    );
    assert.equal(
      (await call(f.trainer, f.packages + `?view=trainer&id=${pack.id}`))
        .status,
      403,
    );
    assert.equal(
      ok(await call(f.peer, f.packages + `?view=trainer&id=${pack.id}`)).item
        .id,
      pack.id,
    );
  } finally {
    await f.f.cleanup();
  }
});

test("renewals, adjustments, notes and makeup references preserve scope and accounting history", async () => {
  const f = await setup();
  try {
    const pack = ok(
      await call(f.admin, f.packages, packageInput(f.member.id, 2)),
    );
    const adjust = operation("adjust", {
      view: "admin",
      id: pack.id,
      revision: 1,
      allowance: 3,
      reason: "Additional entitlement approved",
    });
    assert.equal(ok(await call(f.admin, f.packages, adjust)).allowance, 3);
    assert.equal(ok(await call(f.admin, f.packages, adjust)).revision, 2);
    assert.equal(
      (await call(f.admin, f.packages, { ...adjust, operation: randomUUID() }))
        .status,
      409,
    );
    const renewal = { ...packageInput(f.member.id, 4), renewed_from: pack.id };
    const next = ok(await call(f.admin, f.packages, renewal));
    assert.equal(ok(await call(f.admin, f.packages, renewal)).id, next.id);
    assert.equal(
      (
        await call(f.admin, f.packages, {
          ...renewal,
          id: randomUUID(),
          operation: randomUUID(),
        })
      ).status,
      409,
    );
    assert.equal(
      ok(await call(f.admin, f.packages + `?view=admin&id=${pack.id}`)).item
        .renewal_id,
      next.id,
    );
    assert.equal(next.available, 4);
    const e = ok(await call(f.trainer, f.calendar, booking(f, pack.id)))[0];
    const note = operation("session-note", {
      view: "trainer",
      id: e.id,
      member: f.member.id,
      revision: 1,
      note: "Client requested a lighter session.",
    });
    assert.equal((await call(f.trainer, f.calendar, note)).status, 400);
    await past(e.id);
    ok(await call(f.trainer, f.calendar, note));
    ok(await call(f.trainer, f.calendar, note));
    assert.equal(
      (await call(f.peer, f.calendar, { ...note, operation: randomUUID() }))
        .status,
      403,
    );
    const own = ok(
      await call(f.client, f.calendar + `?view=trainee&id=${e.id}`),
    );
    assert.equal(
      own.people.find((p: any) => p.member_id === f.member.id).session_note,
      note.note,
    );
    assert.equal(
      own.people.find((p: any) => p.member_id === f.member.id).revision,
      2,
    );
    ok(
      await call(
        f.trainer,
        f.calendar,
        operation("attendance", {
          view: "trainer",
          id: e.id,
          member: f.member.id,
          revision: 2,
          attendance: "excused",
        }),
      ),
    );
    ok(
      await call(
        f.trainer,
        f.calendar,
        operation("finish", { view: "trainer", id: e.id, revision: 1 }),
      ),
    );
    let queue = ok(
      await call(
        f.trainer,
        `/v1/workspaces/${f.workspace}/follow-up?view=trainer`,
      ),
    );
    assert.equal(queue.missed.total, 1);
    const makeup = booking(f, null, 12, "makeup");
    makeup.funding[0].makeup_for = e.id;
    const replacement = ok(await call(f.trainer, f.calendar, makeup))[0];
    assert.equal(
      ok(
        await call(
          f.trainer,
          `/v1/workspaces/${f.workspace}/follow-up?view=trainer`,
        ),
      ).missed.total,
      0,
    );
    assert.equal(
      ok(await call(f.admin, f.packages + `?view=admin&id=${pack.id}`)).item
        .available,
      3,
    );
    ok(
      await call(
        f.trainer,
        f.calendar,
        operation("cancel", {
          view: "trainer",
          id: replacement.id,
          revision: 1,
        }),
      ),
    );
    assert.equal(
      ok(
        await call(
          f.trainer,
          `/v1/workspaces/${f.workspace}/follow-up?view=trainer`,
        ),
      ).missed.total,
      1,
    );
    ok(
      await call(
        f.admin,
        f.packages,
        operation("archive", {
          view: "admin",
          id: pack.id,
          revision: 2,
          archived: true,
        }),
      ),
    );
    assert.equal(
      (await call(f.trainer, f.calendar, booking(f, pack.id, 14))).status,
      403,
    );
    const exported = await import("../server/account-data.ts");
    const data = await exported.organizationAccountData({
      id: f.client.id,
    } as any);
    assert.equal(
      (data.packages as any[]).filter((p) => p.workspace_id === f.workspace)
        .length,
      2,
    );
  } finally {
    await f.f.cleanup();
  }
});
