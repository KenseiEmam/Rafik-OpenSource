import { apiOrigin } from "./test-target.ts";
import { fixtureInstitution } from "./institution-fixture.ts";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { db } from "../server/db.ts";
const base = apiOrigin,
  people: string[] = [],
  spaces: string[] = [];
type Person = { id: string; email: string; cookie: string };
after(async () => {
  await db.institutions.deleteMany({ where: { id: { in: spaces } } });
  await db.users.deleteMany({ where: { id: { in: people } } });
  await db.$disconnect();
});
async function person(): Promise<Person> {
  const id = randomUUID(),
    email = `scope-${id}@rafik.test`,
    token = randomBytes(32).toString("hex");
  people.push(id);
  await db.users.create({
    data: { id, email, email_confirmed_at: new Date() },
  });
  await db.identity_sessions.create({
    data: {
      token_hash: createHash("sha256").update(token).digest("hex"),
      user_id: id,
      expires_at: new Date(Date.now() + 3600000),
    },
  });
  const p = { id, email, cookie: "rafik_session=" + token };
  await call(p, "/v1/commands/ensure_profile", {
    p_name: "Scope " + id.slice(0, 6),
  });
  return p;
}
async function call(p: Person, path: string, input?: unknown) {
  if (path === "/v1/institutions" && input)
    return fixtureInstitution(p, input as Record<string, unknown>);
  const r = await fetch(base + path, {
    method: input === undefined ? "GET" : "POST",
    headers: {
      Cookie: p.cookie,
      "x-rafik-client": "web",
      "Content-Type": "application/json",
    },
    body: input === undefined ? undefined : JSON.stringify(input),
  });
  return { status: r.status, data: await r.json() };
}
async function create(p: Person, name = "Scope organization") {
  const id = randomUUID();
  spaces.push(id);
  const r = await call(p, "/v1/institutions", {
    id,
    kind: "organization",
    name,
  });
  assert.equal(r.status, 200);
  return id;
}
const operation = (action: string, args: object = {}) => ({
  operation: randomUUID(),
  action,
  ...args,
});
async function join(admin: Person, id: string, p: Person, roles: string[]) {
  const token = randomBytes(32).toString("hex"),
    payload = operation("invite", {
      id: randomUUID(),
      email: p.email,
      roles,
      token,
    });
  const r = await call(admin, "/v1/institution", payload);
  assert.equal(r.status, 200, JSON.stringify(r));
  assert.equal((await call(p, "/v1/invitations/" + token, {})).status, 200);
  return payload;
}
const view = (p: Person, id: string, role = "admin") =>
  call(p, `/v1/institution?view=${role}`);
test("organization ownership, single-role contexts, cross-scope denial and stable trainer reassignment", async () => {
  const admin = await person(),
    trainer = await person(),
    trainee = await person(),
    otherAdmin = await person(),
    replacement = await person(),
    id = await create(admin),
    other = await create(otherAdmin);
  await join(admin, id, trainer, ["trainer"]);
  await join(admin, id, trainee, ["trainee"]);
  await join(admin, id, replacement, ["trainer"]);
  await join(otherAdmin, other, trainer, ["trainer"]);
  const initial = (await view(admin, id)).data,
    member = initial.members.find((m: any) => m.user_id === trainee.id),
    staff = initial.members.find((m: any) => m.user_id === trainer.id),
    next = initial.members.find((m: any) => m.user_id === replacement.id);
  const assigned = operation("assign-trainer", {
    id: member.id,
    revision: member.revision,
    trainer: staff.id,
  });
  assert.equal((await call(admin, "/v1/institution", assigned)).status, 200);
  assert.equal((await call(admin, "/v1/institution", assigned)).status, 200);
  assert.equal((await view(trainer, id, "admin")).status, 403);
  assert.equal((await view(trainee, id, "trainer")).status, 403);
  assert.equal((await view(otherAdmin, id)).status, 403);
  assert.equal(
    (await view(trainer, id, "trainer")).data.members.filter(
      (m: any) => m.id === member.id,
    ).length,
    1,
  );
  assert.equal((await view(trainer, id, "trainee")).status, 403);
  const foreign = (await view(otherAdmin, other)).data.members.find(
    (m: any) => m.user_id === trainer.id,
  );
  assert.equal(
    (
      await call(
        admin,
        "/v1/institution",
        operation("assign-trainer", {
          id: member.id,
          revision: 2,
          trainer: foreign.id,
        }),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await call(
        admin,
        "/v1/institution",
        operation("assign-trainer", {
          id: member.id,
          revision: 2,
          trainer: next.id,
        }),
      )
    ).status,
    200,
  );
  assert.equal(
    (await view(trainer, id, "trainer")).data.members.some(
      (m: any) => m.id === member.id,
    ),
    false,
  );
  assert.equal(
    (await view(replacement, id, "trainer")).data.members.find(
      (m: any) => m.id === member.id,
    ).revision,
    3,
  );
  assert.equal(
    (await view(trainee, id, "trainee")).data.members[0].id,
    member.id,
  );
  const context = (await call(trainer, "/v1/institution/context")).data
    .contexts;
  assert.equal(context.filter((c: any) => c.institution_id === id).length, 1);
  assert.equal(
    context.filter((c: any) => c.institution_id === other).length,
    1,
  );
  assert.equal(
    context.some((c: any) => c.kind === "personal"),
    false,
  );
  const multipleRoles = await call(
    admin,
    "/v1/institution",
    operation("invite", {
      id: randomUUID(),
      email: `multi-${randomUUID()}@rafik.test`,
      roles: ["admin", "trainer"],
      token: randomBytes(32).toString("hex"),
    }),
  );
  assert.equal(multipleRoles.status, 400);
  assert.equal((await call(trainee, "/v1/commands/save_plan", {})).status, 403);
  assert.equal(
    (await call(admin, "/v1/queries/institution_members")).status,
    400,
  );
});
test("token-scoped invitation preview, intended-account acceptance, last admin protection and revocation before receipt replay", async () => {
  const a = await person(),
    b = await person(),
    outsider = await person(),
    id = await create(a),
    token = randomBytes(32).toString("hex");
  const invite = operation("invite", {
    id: randomUUID(),
    email: b.email,
    roles: ["admin"],
    token,
  });
  assert.equal((await call(a, "/v1/institution", invite)).status, 200);
  const preview = await call(outsider, "/v1/invitations/" + token);
  assert.equal(preview.status, 200);
  // Possession of the unguessable link pre-fills signup; accepting it still
  // requires the intended account. Email verification is not a product rule.
  assert.equal(preview.data.email, b.email);
  assert.equal(
    (await call(outsider, "/v1/invitations/" + randomBytes(32).toString("hex")))
      .status,
    404,
  );
  assert.equal(
    (await call(outsider, "/v1/invitations/" + token, {})).status,
    403,
  );
  const self = (await view(a, id)).data.members[0];
  assert.equal(
    (
      await call(
        a,
        "/v1/institution",
        operation("member", {
          id: self.id,
          revision: 1,
          roles: ["trainee"],
          active: true,
        }),
      )
    ).data.message,
    "last_admin",
  );
  assert.equal(
    (await call(a, "/v1/commands/account_deletion_ready", {})).data.message,
    "last_admin",
  );
  assert.equal((await call(b, "/v1/invitations/" + token, {})).status, 200);
  assert.equal((await call(b, "/v1/invitations/" + token, {})).status, 200);
  assert.equal(
    (
      await call(
        b,
        "/v1/institution",
        operation("member", {
          id: self.id,
          revision: 1,
          roles: ["admin"],
          active: false,
        }),
      )
    ).status,
    200,
  );
  assert.equal((await call(a, "/v1/institution", invite)).status, 403);
  assert.equal((await view(a, id)).status, 403);
  assert.equal(
    (await call(a, "/v1/institution/context")).data.contexts.some(
      (c: any) => c.institution_id === id,
    ),
    false,
  );
});
test("departure releases trainee responsibility; closure replay confirms once without reopening access", async () => {
  const a = await person(),
    trainer = await person(),
    trainee = await person(),
    id = await create(a);
  await join(a, id, trainer, ["trainer"]);
  await join(a, id, trainee, ["trainee"]);
  const members = (await view(a, id)).data.members,
    t = members.find((m: any) => m.user_id === trainer.id),
    c = members.find((m: any) => m.user_id === trainee.id);
  await call(
    a,
    "/v1/institution",
    operation("assign-trainer", { id: c.id, revision: 1, trainer: t.id }),
  );
  await call(
    a,
    "/v1/institution",
    operation("member", {
      id: t.id,
      revision: 1,
      roles: ["trainer"],
      active: false,
    }),
  );
  assert.equal(
    (await view(a, id)).data.members.find((m: any) => m.id === c.id).trainer_id,
    null,
  );
  assert.equal((await view(trainer, id, "trainer")).status, 403);
  const close = operation("close", {
    confirm: "Scope organization",
    revision: 1,
  });
  assert.equal((await call(a, "/v1/institution", close)).status, 200);
  assert.equal((await call(a, "/v1/institution", close)).status, 200);
  assert.equal((await view(a, id)).status, 403);
  assert.equal(
    await db.institution_audit_events.count({
      where: { institution_id: id, kind: "organization_closed" },
    }),
    1,
  );
});
test("deleting a departed person preserves their membership record without retaining account identity", async () => {
  const a = await person(),
    p = await person(),
    id = await create(a);
  await join(a, id, p, ["trainer"]);
  const member = (await view(a, id)).data.members.find(
    (m: any) => m.user_id === p.id,
  );
  assert.equal(
    (
      await call(p, "/v1/commands/delete_my_account", {
        p_confirmation: "DELETE",
      })
    ).status,
    200,
  );
  const retained = await db.institution_members.findUniqueOrThrow({
    where: { id: member.id },
  });
  assert.equal(retained.user_id, null);
  assert.equal(retained.active, false);
  assert.equal(retained.name, "Former member");
});

test("legacy independent memberships stay hidden and two concurrent admins cannot both leave", async () => {
  const a = await person(),
    b = await person();
  assert.equal(
    (await call(a, "/v1/institution/context")).data.contexts.length,
    0,
  );
  const practice = randomUUID();
  spaces.push(practice);
  assert.equal(
    (
      await call(a, "/v1/institutions", {
        id: practice,
        kind: "independent",
        name: "Own coaching",
      })
    ).status,
    200,
  );
  assert.equal(
    (await call(a, "/v1/institution/context")).data.contexts.filter(
      (c: any) => c.kind === "independent",
    ).length,
    0,
  );
  const id = await create(a);
  await join(a, id, b, ["admin"]);
  const members = (await view(a, id)).data.members;
  const results = await Promise.all(
    [a, b].map((p) => {
      const m = members.find((m: any) => m.user_id === p.id);
      return call(
        p,
        "/v1/institution",
        operation("member", {
          id: m.id,
          revision: 1,
          roles: ["admin"],
          active: false,
        }),
      );
    }),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  assert.equal(
    await db.institution_members.count({
      where: { institution_id: id, active: true, roles: { has: "admin" } },
    }),
    1,
  );
});

test("runtime institution creation and Tasks endpoints are removed", async () => {
  const p = await person();
  for (const path of ["/v1/institutions", "/v1/institution/tasks"]) {
    const response = await fetch(base + path, {
      method: "POST",
      headers: {
        Cookie: p.cookie,
        "x-rafik-client": "web",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: randomUUID(),
        kind: "organization",
        name: "Forbidden creation",
      }),
    });
    assert.equal(response.status, 404);
  }
});
