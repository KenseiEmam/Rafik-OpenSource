import { asActor, db, ApiError, type Actor } from "./db.ts";
type Command = {
  name: string;
  names: string[];
  types: string[];
  required: number;
  user: boolean;
  guest: boolean;
  many: boolean;
};
const commands = new Map<string, Command[]>();
const tables = new Map<string, Set<string>>();
const quote = (s: string) => '"' + s.replaceAll('"', '""') + '"';
export async function loadContracts() {
  const list = await db.$queryRaw<
    Command[]
  >`SELECT p.proretset many,p.proname name,p.proargnames names,ARRAY(SELECT format_type(t,null) FROM unnest(p.proargtypes::oid[]) t) types,(p.pronargs-p.pronargdefaults)::int required,has_function_privilege('rafik_user',p.oid,'execute') "user",has_function_privilege('rafik_guest',p.oid,'execute') guest FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f' AND (has_function_privilege('rafik_user',p.oid,'execute') OR has_function_privilege('rafik_guest',p.oid,'execute'))`;
  for (const c of list) {
    c.names ||= [];
    if (c.types.length === c.names.length)
      commands.set(c.name, [...(commands.get(c.name) || []), c]);
  }
  const columns = await db.$queryRaw<
    { table_name: string; column_name: string }[]
  >`SELECT c.relname table_name,a.attname column_name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid WHERE n.nspname='public' AND c.relkind='r' AND a.attnum>0 AND NOT a.attisdropped AND has_table_privilege('rafik_user',c.oid,'select')`;
  for (const c of columns) {
    if (!tables.has(c.table_name)) tables.set(c.table_name, new Set());
    tables.get(c.table_name)!.add(c.column_name);
  }
  for (const name of ["set_entries", "session_operations", "runtime_settings"])
    tables.delete(name);
}
export async function command(
  actor: Actor | null,
  name: string,
  args: Record<string, unknown>,
) {
  const keys = Object.keys(args);
  const c = commands
    .get(name)
    ?.find(
      (c) =>
        (actor ? c.user : c.guest) &&
        keys.every((k) => c.names.includes(k)) &&
        c.names.slice(0, c.required).every((k) => keys.includes(k)),
    );
  if (!c) throw new ApiError(403, "command_unavailable");
  const values = keys.map((k) => {
    const v = args[k];
    return c.types[c.names.indexOf(k)].startsWith("json") && v !== null
      ? JSON.stringify(v)
      : v;
  });
  const parameters = keys.map(
    (k, i) => `${quote(k)} => $${i + 1}::${c.types[c.names.indexOf(k)]}`,
  );
  return asActor(actor, async (tx) => {
    const result = await tx.$queryRawUnsafe<{ data: unknown }[]>(
      `SELECT to_jsonb(public.${quote(name)}(${parameters.join(",")})) data`,
      ...values,
    );
    return c.many ? result.map((row) => row.data) : (result[0]?.data ?? null);
  });
}
export async function query(
  actor: Actor | null,
  name: string,
  params: URLSearchParams,
) {
  const allowed = tables.get(name),
    column = params.get("column"),
    value = params.get("value");
  const offset = Number(params.get("offset") || 0),
    limit = Number(params.get("limit") || 500);
  if (
    !allowed ||
    !allowed.has("id") ||
    (column && !allowed.has(column)) ||
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    offset > 100000 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 500
  )
    throw new ApiError(400, "invalid_query");
  if (!actor && !["exercises", "plan_versions"].includes(name))
    throw new ApiError(401, "unauthenticated");
  return asActor(actor, async (tx) => {
    // Names come only from the server contract; values are always parameters. RLS scopes the projection.
    const rows = await tx.$queryRawUnsafe<{ data: unknown }[]>(
      `SELECT to_jsonb(t) data FROM public.${quote(name)} t ${column ? "WHERE " + quote(column) + "::text=$3" : ""} ORDER BY id LIMIT $1 OFFSET $2`,
      limit,
      offset,
      ...(column ? [value] : []),
    );
    return rows.map((r) => r.data);
  });
}
export async function messages(
  actor: Actor | null,
  id: string,
  before: string | null,
) {
  if (!actor) throw new ApiError(401, "unauthenticated");
  if (
    !/^[a-f0-9-]{36}$/.test(id) ||
    (before !== null && !/^\d{1,16}$/.test(before))
  )
    throw new ApiError(400, "invalid_query");
  return asActor(actor, async (tx) =>
    (
      await tx.$queryRaw<
        { data: unknown }[]
      >`SELECT to_jsonb(m) data FROM public.messages m WHERE relationship_id=${id}::uuid AND (${before}::bigint IS NULL OR sequence<${before}::bigint) ORDER BY sequence DESC LIMIT 50`
    ).map((r) => r.data),
  );
}
export async function upcoming(actor: Actor | null, coach: boolean) {
  if (!actor) throw new ApiError(401, "unauthenticated");
  return asActor(actor, async (tx) =>
    (
      await tx.$queryRaw<
        { data: unknown }[]
      >`SELECT to_jsonb(a) data FROM public.appointments a JOIN public.coach_clients c ON c.id=a.relationship_id WHERE (CASE WHEN ${coach} THEN c.coach_id ELSE c.client_id END)=${actor.id}::uuid AND a.state='booked' AND a.starts_at>=now() AND a.starts_at<=now()+interval '7 days' ORDER BY a.starts_at,a.id LIMIT 3`
    ).map((r) => r.data),
  );
}
