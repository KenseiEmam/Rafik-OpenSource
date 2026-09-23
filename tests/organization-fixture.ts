import { randomUUID, randomBytes, createHash } from "node:crypto";
import assert from "node:assert/strict";
import { removePrivate } from "../server/private-bytes.ts";
import { db } from "../server/db.ts";
export type Person = { id: string; email: string; cookie: string };
export const operation = <T extends object>(action: string, args: T) => ({
  operation: randomUUID(),
  action,
  ...args,
});
export async function call(p: Person, path: string, input?: unknown) {
  const r = await fetch("http://127.0.0.1:55331" + path, {
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
export async function organizationFixture() {
  const people: string[] = [],
    spaces: string[] = [];
  const person = async () => {
    const id = randomUUID(),
      email = `program-${id}@rafik.test`,
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
    assert.equal(
      (
        await call(p, "/v1/commands/ensure_profile", {
          p_name: "Program " + id.slice(0, 6),
        })
      ).status,
      200,
    );
    return p;
  };
  const create = async (p: Person) => {
    const id = randomUUID();
    spaces.push(id);
    assert.equal(
      (
        await call(p, "/v1/workspaces", {
          id,
          name: "Program organization",
          kind: "organization",
        })
      ).status,
      200,
    );
    return id;
  };
  const join = async (
    admin: Person,
    id: string,
    p: Person,
    roles: string[],
  ) => {
    const token = randomBytes(32).toString("hex");
    assert.equal(
      (
        await call(
          admin,
          "/v1/workspaces/" + id,
          operation("invite", {
            id: randomUUID(),
            email: p.email,
            roles,
            token,
          }),
        )
      ).status,
      200,
    );
    assert.equal(
      (await call(p, "/v1/organization-invitations/" + token, {})).status,
      200,
    );
    return await db.workspace_members.findUniqueOrThrow({
      where: { workspace_id_user_id: { workspace_id: id, user_id: p.id } },
    });
  };
  const cleanup = async () => {
    const media = await db.$queryRaw<
      { id: string; workspace_id: string }[]
    >`SELECT id,workspace_id FROM public.program_media WHERE workspace_id=ANY(${spaces}::uuid[])`;
    for (const m of media)
      await removePrivate(`program/${m.workspace_id}/${m.id}`);
    await db.workspaces.deleteMany({ where: { id: { in: spaces } } });
    await db.users.deleteMany({ where: { id: { in: people } } });
  };
  return { person, create, join, cleanup };
}
