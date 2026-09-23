// Local test/operator access only. The running browser API has no administrator endpoint.
import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync } from "node:fs";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "../..");
if (
  !readFileSync(resolve(root, "compose.yaml"), "utf8").startsWith(
    "name: rafik-prisma-local",
  )
)
  throw Error("Local fixture guard failed");
export const quote = (value) => "'" + String(value).replaceAll("'", "''") + "'";
export const sql = (text) =>
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
      "-Atq",
    ],
    {
      cwd: root,
      input: text,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
export function createActor(prefix) {
  if (!/^[a-z0-9-]+$/.test(prefix)) throw Error("Invalid prefix");
  const id = randomUUID(),
    email = `${prefix}-${id}@rafik.test`,
    token = randomBytes(32).toString("hex");
  sql(
    `insert into identity.users(id,email,email_confirmed_at) values('${id}','${email}',now());insert into identity.sessions(token_hash,user_id,expires_at) values('${createHash("sha256").update(token).digest("hex")}','${id}',now()+interval '1 hour');`,
  );
  sql(`insert into public.workspaces(id,kind,name,created_by) values('${id}','independent','Test practice','${id}');insert into public.workspace_members(id,workspace_id,user_id,roles) values('${randomUUID()}','${id}','${id}',array['trainer']);`);
  return { id, email, token };
}
export function deleteActor(id) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw Error("Invalid actor");
  sql(`delete from public.workspaces where created_by='${id}' and kind='independent';delete from identity.users where id='${id}';`);
}
export async function call(
  path,
  token,
  method = "GET",
  body,
  type = "application/json",
) {
  const response = await fetch("http://127.0.0.1:55331" + path, {
    method,
    headers: {
      Cookie: "rafik_session=" + token,
      "x-rafik-client": "web",
      "Content-Type": type,
    },
    body:
      body === undefined
        ? undefined
        : type === "application/json"
          ? JSON.stringify(body)
          : body,
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { ok: response.ok, status: response.status, data };
}
export const rpc = (actor, name, args) =>
  call("/v1/commands/" + name, actor.token, "POST", args);
export function operator(name, args) {
  const signatures = {
    apply_business_event: {
      p_id: "uuid",
      p_account: "uuid",
      p_sequence: "bigint",
      p_payload: "jsonb",
    },
    operator_support_reply: {
      p_id: "uuid",
      p_revision: "integer",
      p_reply: "text",
    },
  };
  const spec = signatures[name];
  if (!spec || Object.keys(args).some((k) => !spec[k]))
    throw Error("Invalid operator command");
  const params = Object.entries(args)
    .map(
      ([k, v]) =>
        k +
        "=>" +
        quote(spec[k] === "jsonb" ? JSON.stringify(v) : v) +
        "::" +
        spec[k],
    )
    .join(",");
  return JSON.parse(
    sql(
      `begin;set local role rafik_service;select to_jsonb(public.${name}(${params}));commit;`,
    ),
  );
}
export function cleanupFile(path) {
  if (!/^[a-f0-9-]{36}\/[a-f0-9-]{36}$/.test(path))
    throw Error("Invalid fixture path");
  try {
    unlinkSync(
      resolve(
        root,
        ".local/files",
        createHash("sha256").update(path).digest("hex"),
      ),
    );
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  sql(
    `delete from file_store.objects where bucket_id='rafik-private' and name=${quote(path)};`,
  );
}
