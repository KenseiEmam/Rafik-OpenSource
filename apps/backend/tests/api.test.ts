import { historicalResource } from "./historical-resource-fixture.ts";
import { apiOrigin } from "./test-target.ts";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { db } from "../server/db.ts";
import { passwordHash, validatePassword } from "../server/auth.ts";
const origin = apiOrigin;
const identities: string[] = [];
after(async () => {
  for (const id of identities) await db.users.deleteMany({ where: { id } });
  await db.$disconnect();
});
test("new passwords require length and character classes", () => {
  assert.equal(validatePassword("Rafik2026!"), "Rafik2026!");
  for (const value of [
    "Short1!",
    "alllowercase1!",
    "ALLUPPERCASE1!",
    "NoNumber!!",
    "NoSymbol123",
  ])
    assert.throws(() => validatePassword(value));
});
async function person() {
  const id = randomUUID(),
    email = `api-${id}@rafik.test`,
    token = randomBytes(32).toString("hex");
  await db.users.create({
    data: { id, email, email_confirmed_at: new Date() },
  });
  identities.push(id);
  await db.identity_sessions.create({
    data: {
      token_hash: createHash("sha256").update(token).digest("hex"),
      user_id: id,
      expires_at: new Date(Date.now() + 3600000),
    },
  });
  return { id, email, cookie: "rafik_session=" + token };
}
async function call(
  path: string,
  body?: unknown,
  cookie = "",
  headers: Record<string, string> = {},
) {
  const response = await fetch(origin + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "x-rafik-client": "web",
      "Content-Type": "application/json",
      Cookie: cookie,
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: response.status,
    data: await response.json(),
    cookie: response.headers.get("set-cookie") || "",
  };
}
test("password sign-in creates an HttpOnly session and logout revokes it", async () => {
  const email = `password-${randomUUID()}@rafik.test`,
    password = "University test password 2026!";
  const created = await db.users.create({
    data: { email, password_hash: await passwordHash(password) },
  });
  identities.push(created.id);
  assert.equal(
    (
      await call("/v1/auth/password-login", {
        email,
        password: "incorrect password",
      })
    ).status,
    401,
  );
  const result = await call("/v1/auth/password-login", { email, password });
  assert.equal(result.status, 200);
  assert.match(result.cookie, /HttpOnly/);
  const cookie = result.cookie.split(";")[0];
  assert.equal(
    (await call("/v1/auth/session", undefined, cookie)).data.user.email,
    email,
  );
  await call("/v1/auth/logout", {}, cookie);
  assert.equal(
    (await call("/v1/auth/session", undefined, cookie)).data.user,
    null,
  );
});
test("setup status closes registration after an institution exists and a foreign origin cannot mutate", async () => {
  assert.deepEqual((await call("/v1/auth/setup-status")).data, {
    initialized: true,
  });
  assert.equal(
    (
      await call("/v1/auth/setup", {
        email: `setup-${randomUUID()}@rafik.test`,
        name: "Setup Probe",
        institution: "Setup Probe Institution",
        password: "University test password 2026!",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call("/v1/auth/verify-code", {
        email: "nobody@example.test",
        token: "000000",
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await call("/v1/auth/logout", {}, "", {
        Origin: "https://unrelated.example",
      })
    ).status,
    403,
  );
});
test("pooled transactions cannot leak actors; query and command identifiers are bounded", async () => {
  const a = await person(),
    b = await person();
  await Promise.all([
    call("/v1/commands/ensure_profile", { p_name: "First coach" }, a.cookie),
    call("/v1/commands/ensure_profile", { p_name: "Second coach" }, b.cookie),
  ]);
  const results = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      call("/v1/queries/profiles", undefined, i % 2 ? a.cookie : b.cookie),
    ),
  );
  results.forEach((r, i) => {
    assert.equal(r.status, 200);
    assert.equal(r.data.length, 1);
    assert.equal(r.data[0].id, i % 2 ? a.id : b.id);
  });
  assert.equal(
    (await call("/v1/queries/users", undefined, a.cookie)).status,
    400,
  );
  assert.equal(
    (await call("/v1/queries/profiles?column=id%3Bdelete", undefined, a.cookie))
      .status,
    400,
  );
  assert.equal(
    (await call("/v1/commands/apply_business_event", {}, a.cookie)).status,
    403,
  );
  assert.equal(
    (await call("/v1/commands/save_plan", { p_id: randomUUID() })).status,
    403,
  );
  const profile = await call(
    "/v1/commands/update_profile",
    { p_name: "", p_locale: "en", p_units: "kg", p_timezone: "UTC" },
    a.cookie,
  );
  assert.equal(profile.status, 400);
  assert.notEqual(profile.data.message, "service_unavailable");
});
test("private file bytes survive upload retry, stay scoped, and become unavailable on retirement", async () => {
  const a = await person(),
    b = await person();
  for (const p of [a, b])
    await call("/v1/commands/ensure_profile", {}, p.cookie);
  const id = randomUUID(),
    content = Buffer.from("Practice with steady repetitions.");
  const r = await historicalResource(a, {
    id,
    title: "Session guide",
    filename: "guide.txt",
    bytes: content.length,
  });
  assert.equal(r.status, 200);
  const path = "/v1/files/" + encodeURIComponent(r.data.object_path);
  const upload = () =>
    fetch(origin + path, {
      method: "PUT",
      headers: {
        "x-rafik-client": "web",
        "Content-Type": "text/plain",
        Cookie: a.cookie,
      },
      body: content,
    });
  assert.equal((await upload()).status, 200);
  assert.equal((await upload()).status, 409);
  const ready = await call(
    "/v1/commands/finish_resource",
    { p_id: id },
    a.cookie,
  );
  assert.equal(ready.status, 200);
  assert.equal(
    await (
      await fetch(origin + path, { headers: { Cookie: a.cookie } })
    ).text(),
    content.toString(),
  );
  assert.equal(
    (await fetch(origin + path, { headers: { Cookie: b.cookie } })).status,
    404,
  );
  const retired = await call(
    "/v1/commands/retire_resource",
    { p_id: id, p_revision: ready.data.revision },
    a.cookie,
  );
  assert.equal(retired.status, 200);
  assert.equal(
    (await fetch(origin + path, { headers: { Cookie: b.cookie } })).status,
    404,
  );
  assert.equal(
    (
      await fetch(origin + path, {
        method: "DELETE",
        headers: { "x-rafik-client": "web", Cookie: a.cookie },
      })
    ).status,
    200,
  );
  assert.equal(
    (await call("/v1/commands/remove_resource_record", { p_id: id }, a.cookie))
      .status,
    200,
  );
});

test("retired standalone routes and new legacy creation commands are unavailable", async () => {
  const actor = await person();
  await call("/v1/commands/ensure_profile", {}, actor.cookie);
  for (const path of [
    "/v1/coach/recipients",
    "/v1/coach/analytics",
    "/v1/conversations/" + randomUUID(),
    "/v1/appointments/upcoming",
  ])
    assert.equal((await call(path, undefined, actor.cookie)).status, 404, path);
  for (const name of [
    "register_resource",
    "create_team",
    "publish_availability",
    "save_plan",
    "deliver_plan",
    "publish_plan",
    "save_coaching_form",
    "apply_business_event",
  ])
    assert.equal(
      (await call("/v1/commands/" + name, {}, actor.cookie)).status,
      403,
      name,
    );
  assert.equal(
    (
      await call(
        "/v1/queries/notification_preferences",
        undefined,
        actor.cookie,
      )
    ).status,
    400,
  );
});
