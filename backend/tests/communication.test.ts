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
test("organization conversation scope, participation, read cursors and replay remain private across staff changes", async () => {
  const f = await organizationFixture();
  try {
    const admin = await f.person(),
      trainer = await f.person(),
      client = await f.person(),
      foreign = await f.person(),
      secondClient = await f.person(),
      id = await f.create(admin),
      other = await f.create(foreign),
      staff = await f.join(admin, id, trainer, ["trainer"]),
      trainee = await f.join(admin, id, client, ["trainee"]),
      second = await f.join(admin, id, secondClient, ["trainee"]);
    await call(
      admin,
      `/v1/workspaces/${id}`,
      operation("assign-trainer", {
        id: second.id,
        revision: 1,
        trainer: staff.id,
      }),
    );
    await call(
      admin,
      `/v1/workspaces/${id}`,
      operation("assign-trainer", {
        id: trainee.id,
        revision: 1,
        trainer: staff.id,
      }),
    );
    const channel = randomUUID(),
      create = operation("create", {
        id: channel,
        view: "trainer",
        title: "Thursday training",
        members: [staff.id, trainee.id, second.id],
        managers: [staff.id],
      });
    let r = await call(trainer, `/v1/workspaces/${id}/communication`, create);
    assert.equal(r.status, 200, JSON.stringify(r));
    assert.deepEqual(
      (await call(trainer, `/v1/workspaces/${id}/communication`, create)).data,
      r.data,
    );
    const send = operation("send", {
      id: channel,
      view: "trainer",
      message: randomUUID(),
      body: "We will review the technique together.",
    });
    r = await call(trainer, `/v1/workspaces/${id}/communication`, send);
    assert.equal(r.status, 200, JSON.stringify(r));
    const message = r.data;
    assert.deepEqual(
      (await call(trainer, `/v1/workspaces/${id}/communication`, send)).data,
      message,
    );
    assert.equal(
      (
        await call(
          admin,
          `/v1/workspaces/${id}/communication?view=admin&id=${channel}`,
        )
      ).status,
      403,
      "admin must explicitly join before reading",
    );
    const discovery = await call(
      admin,
      `/v1/workspaces/${id}/communication?view=admin&manage=true`,
    );
    assert.equal(discovery.data.items[0].last_body, null);
    assert.equal(discovery.data.items[0].unread, 0);
    const inbox = await call(
      client,
      `/v1/workspaces/${id}/communication?view=trainee`,
    );
    assert.equal(inbox.data.items[0].unread, 1);
    assert.equal(
      (
        await call(
          client,
          `/v1/workspaces/${id}/communication`,
          operation("read", {
            id: channel,
            view: "trainee",
            sequence: message.sequence,
          }),
        )
      ).status,
      200,
    );
    assert.equal(
      (await call(client, `/v1/workspaces/${id}/communication?view=trainee`))
        .data.items[0].unread,
      0,
    );
    assert.equal(
      (
        await call(
          foreign,
          `/v1/workspaces/${other}/communication?view=admin&id=${channel}`,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await call(
          client,
          `/v1/workspaces/${id}/communication`,
          operation("archive", {
            id: channel,
            view: "trainee",
            revision: 1,
            archived: true,
          }),
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await call(
          admin,
          `/v1/workspaces/${id}/communication`,
          operation("join", { id: channel, view: "admin" }),
        )
      ).status,
      200,
    );
    const joined = await call(
      admin,
      `/v1/workspaces/${id}/communication?view=admin&id=${channel}`,
    );
    assert.equal(joined.data.people.length, 4);
    assert.equal(joined.data.messages.length, 1);
    const me = joined.data.self;
    assert.equal(
      (
        await call(
          admin,
          `/v1/workspaces/${id}/communication`,
          operation("members", {
            id: channel,
            view: "admin",
            revision: 1,
            members: [me, trainee.id],
            managers: [me],
          }),
        )
      ).status,
      200,
    );
    assert.equal(
      (await call(trainer, `/v1/workspaces/${id}/communication`, send)).status,
      403,
      "removed sender cannot replay or read",
    );
    assert.equal(
      (
        await call(
          admin,
          `/v1/workspaces/${id}/communication`,
          operation("archive", {
            id: channel,
            view: "admin",
            revision: 2,
            archived: true,
          }),
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await call(
          client,
          `/v1/workspaces/${id}/communication`,
          operation("send", {
            id: channel,
            view: "trainee",
            message: randomUUID(),
            body: "not allowed",
          }),
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await call(
          client,
          `/v1/workspaces/${id}/communication?view=trainee&id=${channel}`,
        )
      ).data.messages.length,
      1,
    );
    await call(
      admin,
      `/v1/workspaces/${id}`,
      operation("member", {
        id: trainee.id,
        revision: 2,
        roles: ["trainee"],
        active: false,
      }),
    );
    assert.equal(
      (
        await call(
          client,
          `/v1/workspaces/${id}/communication?view=trainee&id=${channel}`,
        )
      ).status,
      403,
    );
  } finally {
    await f.cleanup();
  }
});
