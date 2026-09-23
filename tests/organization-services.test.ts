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
const tomorrow = () =>
  new Date(Date.now() + 86400000).toISOString().slice(0, 10) + "T10:00";
const field = () => ({
  key: randomUUID(),
  name: "Controlled repetitions",
  kind: "number",
  unit: "reps",
  min: 0,
  max: 100,
});
test("organization agenda and assessor-led results preserve each participant, corrections and scoped analytics", async () => {
  const f = await organizationFixture();
  try {
    const admin = await f.person(),
      trainer = await f.person(),
      one = await f.person(),
      two = await f.person(),
      outsider = await f.person();
    const id = await f.create(admin),
      other = await f.create(outsider),
      staff = await f.join(admin, id, trainer, ["trainer"]),
      a = await f.join(admin, id, one, ["trainee"]),
      b = await f.join(admin, id, two, ["trainee"]);
    await call(
      admin,
      `/v1/workspaces/${id}`,
      operation("assign-trainer", { id: a.id, revision: 1, trainer: staff.id }),
    );
    const drill = field(),
      template = operation("template", {
        view: "admin",
        id: randomUUID(),
        title: "Movement baseline",
        definition: [drill],
        revision: 0,
        archived: false,
      });
    let r = await call(admin, `/v1/workspaces/${id}/services`, template);
    assert.equal(r.status, 200, JSON.stringify(r));
    const group = operation("group", {
      view: "admin",
      id: randomUUID(),
      name: "Morning group",
      members: [a.id, b.id],
      revision: 0,
      archived: false,
    });
    assert.equal(
      (await call(admin, `/v1/workspaces/${id}/services`, group)).status,
      200,
    );
    const create = operation("create", {
      id: randomUUID(),
      view: "admin",
      title: "Baseline assessment",
      kind: "assessment",
      template: template.id,
      template_revision: 1,
      staff: [staff.id],
      participants: [a.id, b.id],
      local: tomorrow(),
      zone: "UTC",
      minutes: 60,
      count: 2,
      every: 7,
      location: "Training studio",
    });
    r = await call(admin, `/v1/workspaces/${id}/calendar`, create);
    assert.equal(r.status, 200, JSON.stringify(r));
    assert.equal(r.data.length, 2);
    assert.deepEqual(
      (await call(admin, `/v1/workspaces/${id}/calendar`, create)).data,
      r.data,
    );
    const event = r.data[0],
      future = r.data[1];
    const edited = await call(admin, `/v1/workspaces/${id}/services`, {
      ...template,
      operation: randomUUID(),
      revision: 1,
      definition: [{ ...drill, unit: "changed", max: 999 }],
    });
    assert.equal(edited.status, 200);
    assert.equal(
      (
        await call(
          trainer,
          `/v1/workspaces/${id}/calendar?view=trainer&id=${event.id}`,
        )
      ).data.event.definition[0].unit,
      "reps",
    );
    assert.equal(
      (
        await call(
          outsider,
          `/v1/workspaces/${id}/calendar?view=admin&id=${event.id}`,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await call(
          one,
          `/v1/workspaces/${other}/calendar?view=trainee&id=${event.id}`,
        )
      ).status,
      403,
    );
    const personal = await call(
      one,
      `/v1/workspaces/${id}/calendar?view=trainee&id=${event.id}`,
    );
    assert.equal(
      personal.data.people.filter((x: any) => x.duty === "trainee").length,
      1,
    );
    const early = operation("attendance", {
      id: event.id,
      view: "trainer",
      member: a.id,
      revision: 1,
      attendance: "present",
    });
    assert.equal(
      (await call(trainer, `/v1/workspaces/${id}/calendar`, early)).status,
      400,
    );
    // Move only this test-owned event into the past to exercise attendance/results without waiting a day.
    await db.organization_events.update({
      where: { id: event.id },
      data: {
        starts_at: new Date(Date.now() - 7200000),
        ends_at: new Date(Date.now() - 3600000),
      },
    });
    for (const member of [a, b])
      assert.equal(
        (
          await call(
            trainer,
            `/v1/workspaces/${id}/calendar`,
            operation("attendance", {
              id: event.id,
              view: "trainer",
              member: member.id,
              revision: 1,
              attendance: "present",
            }),
          )
        ).status,
        200,
      );
    const result = operation("result", {
      id: event.id,
      view: "trainer",
      member: a.id,
      revision: 0,
      values: { [drill.key]: 12 },
      note: "Steady pace",
    });
    r = await call(trainer, `/v1/workspaces/${id}/calendar`, result);
    assert.equal(r.status, 200, JSON.stringify(r));
    assert.deepEqual(
      (await call(trainer, `/v1/workspaces/${id}/calendar`, result)).data,
      r.data,
    );
    assert.equal(
      (
        await call(
          trainer,
          `/v1/workspaces/${id}/calendar`,
          operation("finish", { id: event.id, view: "trainer", revision: 1 }),
        )
      ).status,
      400,
      "all present trainees require results",
    );
    assert.equal(
      (
        await call(
          trainer,
          `/v1/workspaces/${id}/calendar`,
          operation("result", {
            id: event.id,
            view: "trainer",
            member: b.id,
            revision: 0,
            values: { [drill.key]: 19 },
            note: "",
          }),
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await call(
          trainer,
          `/v1/workspaces/${id}/calendar`,
          operation("finish", { id: event.id, view: "trainer", revision: 1 }),
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await call(trainer, `/v1/workspaces/${id}/calendar`, {
          ...result,
          operation: randomUUID(),
          revision: 1,
          values: { [drill.key]: 14 },
        })
      ).status,
      200,
    );
    const detail = await call(
      admin,
      `/v1/workspaces/${id}/calendar?view=admin&id=${event.id}`,
    );
    assert.equal(detail.data.history.length, 3);
    assert.equal(
      detail.data.results.find((x: any) => x.member_id === b.id).values[
        drill.key
      ],
      19,
    );
    const today = new Date().toISOString().slice(0, 10),
      params = `from=${today}&to=${today}`;
    const adminReport = await call(
        admin,
        `/v1/workspaces/${id}/analytics?view=admin&${params}`,
      ),
      trainerReport = await call(
        trainer,
        `/v1/workspaces/${id}/analytics?view=trainer&${params}`,
      );
    assert.equal(adminReport.status, 200, JSON.stringify(adminReport));
    assert.equal(trainerReport.status, 200, JSON.stringify(trainerReport));
    assert.equal(adminReport.data.summary.active, 2);
    assert.equal(trainerReport.data.summary.active, 1);
    assert.equal(adminReport.data.attendance[0].value, 2);
    assert.equal(trainerReport.data.attendance[0].value, 1);
    assert.equal(trainerReport.data.workload.length, 0);
    const history = await call(
      one,
      `/v1/workspaces/${id}/assessment-history?view=trainee&${params}`,
    );
    assert.equal(history.status, 200, JSON.stringify(history));
    assert.equal(history.data.items[0].values[drill.key], 14);
    assert.equal(
      (
        await call(
          one,
          `/v1/workspaces/${id}/assessment-history?view=trainee&member=${b.id}&${params}`,
        )
      ).status,
      403,
    );
    const exported = await call(one, "/v1/account/organizations");
    assert.equal(exported.status, 200);
    assert.equal(exported.data.results.length, 1);
    assert.equal(exported.data.results[0].member_id, a.id);
    assert.equal(exported.data.corrections.length, 2);
    assert.equal(
      (
        await call(
          admin,
          `/v1/workspaces/${id}/calendar?view=admin&from=${today}&to=${today}&offset=1.5`,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await call(
          admin,
          `/v1/workspaces/${id}/analytics?view=admin&from=2026-02-30&to=2026-03-01`,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await call(
          admin,
          `/v1/workspaces/${id}/analytics?view=admin&member=invalid&${params}`,
        )
      ).status,
      400,
    );
    const replacement = await f.person(),
      replacementMember = await f.join(admin, id, replacement, ["trainer"]);
    const current = await db.workspace_members.findUniqueOrThrow({
      where: { id: a.id },
    });
    assert.equal(
      (
        await call(
          admin,
          `/v1/workspaces/${id}`,
          operation("assign-trainer", {
            id: a.id,
            revision: current.revision,
            trainer: replacementMember.id,
          }),
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await call(
          trainer,
          `/v1/workspaces/${id}/analytics?view=trainer&${params}`,
        )
      ).data.summary.active,
      0,
    );
    assert.equal(
      (
        await call(
          replacement,
          `/v1/workspaces/${id}/assessment-history?view=trainer&member=${a.id}&${params}`,
        )
      ).data.items[0].values[drill.key],
      14,
    );
    assert.equal(
      (
        await call(
          trainer,
          `/v1/workspaces/${id}/assessment-history?view=trainer&member=${a.id}&${params}`,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await call(
          trainer,
          `/v1/workspaces/${id}/calendar?view=trainer&id=${event.id}`,
        )
      ).status,
      200,
      "explicit assessor retains only designated event access",
    );
    assert.equal(
      (
        await call(
          admin,
          `/v1/workspaces/${id}/calendar`,
          operation("cancel", { id: event.id, view: "admin", revision: 2 }),
        )
      ).status,
      400,
    );
    const reschedule = operation("reschedule", {
      id: future.id,
      view: "admin",
      revision: 1,
      local:
        new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10) +
        "T14:00",
      zone: "UTC",
      minutes: 45,
    });
    const moved = await call(
      admin,
      `/v1/workspaces/${id}/calendar`,
      reschedule,
    );
    assert.equal(moved.status, 200);
    assert.equal(moved.data.revision, 2);
    assert.deepEqual(
      (await call(admin, `/v1/workspaces/${id}/calendar`, reschedule)).data,
      moved.data,
    );
    const cancel = operation("cancel", {
      id: future.id,
      view: "admin",
      revision: 2,
      future_series: true,
    });
    assert.equal(
      (await call(admin, `/v1/workspaces/${id}/calendar`, cancel)).status,
      200,
    );
    assert.equal(
      (await call(admin, `/v1/workspaces/${id}/calendar`, cancel)).status,
      200,
    );
    await call(
      admin,
      `/v1/workspaces/${id}`,
      operation("member", {
        id: staff.id,
        revision: staff.revision,
        roles: ["trainer"],
        active: false,
      }),
    );
    assert.equal(
      (await call(trainer, `/v1/workspaces/${id}/calendar`, result)).status,
      403,
      "revoked assessor cannot replay results",
    );
  } finally {
    await f.cleanup();
  }
});
test("calendar collisions are atomic across organizations; calendar preview resolves actual timezone occurrences", async () => {
  const f = await organizationFixture();
  try {
    const admin = await f.person(),
      other = await f.person(),
      trainer = await f.person(),
      client = await f.person(),
      id = await f.create(admin),
      id2 = await f.create(other);
    const s = await f.join(admin, id, trainer, ["trainer"]),
      m = await f.join(admin, id, client, ["trainee"]),
      s2 = await f.join(other, id2, trainer, ["trainer"]),
      m2 = await f.join(other, id2, client, ["trainee"]);
    const base = {
      view: "admin",
      title: "Group training",
      kind: "training",
      local: tomorrow(),
      zone: "UTC",
      minutes: 60,
      count: 1,
      every: 7,
      location: "",
    };
    const results = await Promise.all([
      call(
        admin,
        `/v1/workspaces/${id}/calendar`,
        operation("create", {
          ...base,
          id: randomUUID(),
          staff: [s.id],
          participants: [m.id],
        }),
      ),
      call(
        other,
        `/v1/workspaces/${id2}/calendar`,
        operation("create", {
          ...base,
          id: randomUUID(),
          staff: [s2.id],
          participants: [m2.id],
        }),
      ),
    ]);
    assert.deepEqual(
      results.map((r) => r.status).sort(),
      [200, 400],
      JSON.stringify(results),
    );
    assert.equal(
      await db.organization_events.count({
        where: { workspace_id: { in: [id, id2] } },
      }),
      1,
    );
    const foreign = await call(
      admin,
      `/v1/workspaces/${id}/calendar`,
      operation("create", {
        ...base,
        id: randomUUID(),
        staff: [s.id],
        participants: [m2.id],
      }),
    );
    assert.equal(foreign.status, 403);
    assert.equal(
      (
        await call(admin, `/v1/workspaces/${id}/calendar-preview`, {
          ...base,
          minutes: true,
        })
      ).status,
      400,
    );
    const dst = await call(admin, `/v1/workspaces/${id}/calendar-preview`, {
      ...base,
      local: "2027-03-14T02:30",
      zone: "America/New_York",
    });
    assert.equal(dst.status, 400);
  } finally {
    await f.cleanup();
  }
});
