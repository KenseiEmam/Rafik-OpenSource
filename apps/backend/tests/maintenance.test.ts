import { apiOrigin } from "./test-target.ts";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { utimesSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { db } from "../server/db.ts";
import { writePrivate, removePrivate } from "../server/private-bytes.ts";
import { organizationFixture, call } from "./organization-fixture.ts";
after(() => db.$disconnect());
test("local recovery restores private bytes with metadata; orphan cleanup honors references and grace period", async () => {
  const f = await organizationFixture(),
    orphan = randomUUID() + "/" + randomUUID(),
    recent = randomUUID() + "/" + randomUUID();
  let path = "";
  try {
    const user = await f.person(),
      id = randomUUID(),
      body = "Synthetic recovery test bytes";
    const registered = await call(user, "/v1/commands/register_resource", {
      p_id: id,
      p_title: "Recovery test",
      p_filename: "recovery.txt",
      p_type: "text/plain",
      p_bytes: Buffer.byteLength(body),
    });
    assert.equal(registered.status, 200, JSON.stringify(registered));
    path = registered.data.object_path;
    const uploaded = await fetch(
      apiOrigin + "/v1/files/" + encodeURIComponent(path),
      {
        method: "PUT",
        headers: {
          Cookie: user.cookie,
          "x-rafik-client": "web",
          "Content-Type": "text/plain",
        },
        body,
      },
    );
    assert.equal(uploaded.status, 200);
    assert.equal(
      (await call(user, "/v1/commands/finish_resource", { p_id: id })).status,
      200,
    );
    const hash = (value: string) =>
        createHash("sha256").update(value).digest("hex"),
      location = (value: string) =>
        resolve(process.env.RAFIK_TEST_FILES || ".local/files", hash(value)),
      old = new Date(Date.now() - 2 * 86400000);
    await writePrivate(orphan, Buffer.from("old unreferenced test file"));
    await writePrivate(recent, Buffer.from("new unreferenced test file"));
    utimesSync(location(orphan), old, old);
    utimesSync(location(path), old, old);
    const run = (...args: string[]) =>
      JSON.parse(
        execFileSync(
          process.execPath,
          ["scripts/prisma/cleanup-private.mjs", ...args],
          { encoding: "utf8" },
        ),
      );
    assert.equal(run("--only=" + hash(orphan)).candidates.length, 1);
    assert.equal(run("--only=" + hash(recent)).candidates.length, 0);
    assert.equal(run("--only=" + hash(path)).candidates.length, 0);
    run("--apply", "--only=" + hash(orphan));
    assert.equal(existsSync(location(orphan)), false);
    assert.equal(existsSync(location(path)), true);
    const recovery = JSON.parse(
      execFileSync(process.execPath, ["scripts/prisma/recovery.mjs"], {
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
      }),
    );
    assert.equal(recovery.restore, "passed");
    assert.ok(recovery.referencedFiles >= 1);
    assert.equal(
      readFileSync(resolve(recovery.backup, "files", hash(path)), "utf8"),
      body,
    );
  } finally {
    if (path) await removePrivate(path);
    await removePrivate(orphan);
    await removePrivate(recent);
    await f.cleanup();
  }
});
