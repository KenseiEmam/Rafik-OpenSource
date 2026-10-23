import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { db, ensureProfileInTransaction } from "../server/db.ts";
import { apiOrigin } from "./test-target.ts";
import { institutionTransport } from "../server/institution-compatibility.ts";
const institution = "12000000-0000-4000-8000-000000000001";
const user = randomUUID(),
  member = randomUUID(),
  event = randomUUID();
after(async () => {
  try {
    await db.institution_events.deleteMany({ where: { id: event } });
    await db.institution_operations.deleteMany({ where: { actor_id: user } });
    await db.institution_members.deleteMany({ where: { id: member } });
    await db.users.deleteMany({ where: { id: user } });
  } finally {
    await db.$disconnect();
  }
});
test("canonical institution API and published Android paths share IDs, exact receipts and revocation", async () => {
  await db.users.create({
    data: { id: user, email: `rename-${user}@rafik.test` },
  });
  await db.$transaction((tx) =>
    ensureProfileInTransaction(
      tx,
      { id: user, email: `rename-${user}@rafik.test`, user_metadata: {} },
      "Rename coach",
    ),
  );
  await db.institution_members.create({
    data: {
      id: member,
      institution_id: institution,
      user_id: user,
      name: "Rename coach",
      roles: ["trainer"],
    },
  });
  const token = randomBytes(32).toString("hex");
  await db.identity_sessions.create({
    data: {
      user_id: user,
      token_hash: createHash("sha256").update(token).digest("hex"),
      expires_at: new Date(Date.now() + 3600000),
    },
  });
  const call = async (path: string, payload?: object) => {
    const r = await fetch(apiOrigin + path, {
      method: payload ? "POST" : "GET",
      headers: {
        Cookie: `rafik_session=${token}`,
        "X-Rafik-Client": "web",
        "Content-Type": "application/json",
      },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    return { status: r.status, data: await r.json() };
  };
  const current = await call("/v1/institution/context"),
    previous = await call("/v1/contexts");
  assert.equal(current.status, 200);
  assert.equal(previous.status, 200);
  assert.equal(current.data.contexts[0].institution_id, institution);
  assert.equal(previous.data.contexts[0].workspace_id, institution);
  assert.equal(current.data.contexts[0].id, previous.data.contexts[0].id);
  assert.equal(current.data.contexts[0].kind, "institution");
  assert.equal(previous.data.contexts[0].kind, "organization");
  assert.equal((await call(`/v1/institutions/${institution}`)).status, 404);
  assert.equal(
    (await call(`/v1/workspaces/${randomUUID()}?view=trainer`)).status,
    403,
  );
  await db.institution_events.create({
    data: {
      id: event,
      institution_id: institution,
      created_by: member,
      series_id: randomUUID(),
      title: "Compatibility",
      kind: "training",
      timezone: "UTC",
      starts_at: new Date(Date.now() - 3600000),
      ends_at: new Date(Date.now() + 3600000),
    },
  });
  await db.institution_event_people.createMany({
    data: [
      {
        institution_id: institution,
        event_id: event,
        member_id: member,
        duty: "staff",
      },
      {
        institution_id: institution,
        event_id: event,
        member_id: "13000000-0000-4000-8000-000000000003",
        duty: "trainee",
      },
    ],
  });
  const payload = {
    operation: randomUUID(),
    view: "trainer",
    action: "attendance",
    id: event,
    member: "13000000-0000-4000-8000-000000000003",
    attendance: "present",
    revision: 1,
  };
  const oldPath = `/v1/workspaces/${institution}/calendar`,
    newPath = "/v1/institution/calendar";
  const first = await call(oldPath, payload);
  assert.equal(first.status, 200, JSON.stringify(first.data));
  const receipt = await db.institution_operations.findUniqueOrThrow({
    where: { id: payload.operation },
  });
  assert.deepEqual((await call(oldPath, payload)).data, first.data);
  assert.deepEqual(
    (await call(newPath, payload)).data,
    institutionTransport(first.data),
  );
  assert.deepEqual(
    (
      await db.institution_operations.findUniqueOrThrow({
        where: { id: payload.operation },
      })
    ).payload,
    receipt.payload,
  );
  assert.equal(
    (await call(newPath, { ...payload, attendance: "absent" })).status,
    409,
  );
  await db.institution_members.update({
    where: { id: member },
    data: { active: false },
  });
  assert.equal((await call(oldPath, payload)).status, 403);
  assert.equal((await call(newPath, payload)).status, 403);
});
test("transport aliases preserve frozen documents and receipt payloads", () => {
  const frozen = {
    workspace_id: "historical",
    definition: { workspace_id: "snapshot" },
  };
  assert.deepEqual(
    institutionTransport({
      workspace_id: institution,
      document: frozen,
      payload: frozen,
    }),
    { institution_id: institution, document: frozen, payload: frozen },
  );
});
