import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { db } from "../server/db.ts";
const origin = "http://127.0.0.1:55331";
const identities: string[] = [];
after(async () => {
  for (const id of identities) await db.users.deleteMany({ where: { id } });
  await db.$disconnect();
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
test("email codes are single-use, sessions are HttpOnly and logout revokes the server session", async () => {
  const email = `verify-${randomUUID()}@rafik.test`;
  assert.equal((await call("/v1/auth/request-code", { email })).status, 200);
  const mail = await db.mail_messages.findFirstOrThrow({ where: { email } });
  const result = await call("/v1/auth/verify-code", {
    email,
    token: mail.body,
  });
  assert.equal(result.status, 200);
  assert.match(result.cookie, /HttpOnly/);
  identities.push(result.data.user.id);
  assert.equal(
    (await call("/v1/auth/verify-code", { email, token: mail.body })).status,
    400,
  );
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
  await db.mail_messages.deleteMany({ where: { email } });
});
test("five incorrect guesses consume the challenge, and a foreign origin cannot mutate", async () => {
  const email = `guess-${randomUUID()}@rafik.test`;
  await call("/v1/auth/request-code", { email });
  const mail = await db.mail_messages.findFirstOrThrow({ where: { email } });
  const wrong = mail.body === "000000" ? "111111" : "000000";
  for (let i = 0; i < 5; i++)
    assert.equal(
      (await call("/v1/auth/verify-code", { email, token: wrong })).status,
      400,
    );
  assert.equal(
    (await call("/v1/auth/verify-code", { email, token: mail.body })).status,
    400,
  );
  assert.equal(
    (
      await call("/v1/auth/logout", {}, "", {
        Origin: "https://unrelated.example",
      })
    ).status,
    403,
  );
  await db.mail_messages.deleteMany({ where: { email } });
  await db.challenges.deleteMany({ where: { email } });
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
  const r = await call(
    "/v1/commands/register_resource",
    {
      p_id: id,
      p_title: "Session guide",
      p_filename: "guide.txt",
      p_type: "text/plain",
      p_bytes: content.length,
    },
    a.cookie,
  );
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
