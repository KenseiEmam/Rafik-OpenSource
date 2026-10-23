import type { ServerResponse } from "node:http";
import { db, ApiError } from "./db.ts";

const legacyResponses = new WeakSet<ServerResponse>();
// These are transport names, never database aliases or a second institution model.
const fields: Record<string, string> = {
  workspace_id: "institution_id",
  workspace: "institution",
  workspaces: "institutions",
  workspace_members: "institution_members",
  workspace_operations: "institution_operations",
  workspace_events: "institution_audit_events",
  workspace_invitations: "institution_invitations",
};
const opaque = new Set([
  "payload",
  "document",
  "definition",
  "prescription",
  "detail",
  "snapshot",
]);
export function institutionTransport(value: unknown, legacy = false): unknown {
  if (Array.isArray(value))
    return value.map((v) => institutionTransport(v, legacy));
  if (typeof value === "string") {
    const from = legacy ? "/invitation/" : "/organization-invite/";
    if (value.startsWith(from))
      return value.replace(
        from,
        legacy ? "/organization-invite/" : "/invitation/",
      );
  }
  if (
    !value ||
    typeof value !== "object" ||
    value instanceof Date ||
    typeof (value as { toJSON?: unknown }).toJSON === "function"
  )
    return value;
  const names = legacy
    ? Object.fromEntries(Object.entries(fields).map(([a, b]) => [b, a]))
    : fields;
  return Object.fromEntries(
    Object.entries(value).map(([key, v]) => [
      names[key] ||
        (key.startsWith(legacy ? "institution_" : "organization_")
          ? key.replace(
              legacy ? /^institution_/ : /^organization_/,
              legacy ? "organization_" : "institution_",
            )
          : key),
      opaque.has(key)
        ? v
        : key === "kind" && v === (legacy ? "institution" : "organization")
          ? legacy
            ? "organization"
            : "institution"
          : institutionTransport(v, legacy),
    ]),
  );
}
export function responseTransport(res: ServerResponse, value: unknown) {
  // Old acknowledged receipt objects may still carry the old transport names.
  return institutionTransport(
    institutionTransport(value),
    legacyResponses.has(res),
  );
}
export async function institutionRoute(
  url: URL,
  res: ServerResponse,
): Promise<string> {
  let path = url.pathname.replace(/^\/api(?=\/)/, "");
  if (/^\/v1\/institutions(?:\/|$)/.test(path))
    throw new ApiError(404, "unavailable");
  const old = /^\/v1\/workspaces\/([a-f0-9-]{36})(\/.*)?$/.exec(path);
  if (old) {
    legacyResponses.add(res);
    return `/v1/institutions/${old[1]}${old[2] || ""}`;
  }
  if (path === "/v1/contexts") legacyResponses.add(res);
  if (path === "/v1/institution/context") return "/v1/contexts";
  const aliases: [string, string][] = [
    ["/v1/organization-assets/", "/v1/assets/"],
    ["/v1/organization-sessions/", "/v1/workouts/"],
    ["/v1/organization-invitations/", "/v1/invitations/"],
    ["/v1/account/organizations", "/v1/account/institution"],
  ];
  for (const [from, to] of aliases)
    if (path.startsWith(from)) {
      legacyResponses.add(res);
      path = to + path.slice(from.length);
      break;
    }
  const previous = url.searchParams.get("workspace");
  if (previous !== null) {
    if (
      url.searchParams.has("institution") &&
      url.searchParams.get("institution") !== previous
    )
      throw new ApiError(400, "invalid_request");
    url.searchParams.set("institution", previous);
  }
  if (path === "/v1/institution" || path.startsWith("/v1/institution/")) {
    const rows = await db.institutions.findMany({
      where: { kind: "organization" },
      select: { id: true },
      take: 2,
    });
    if (rows.length !== 1) throw new ApiError(404, "institution_unavailable");
    return `/v1/institutions/${rows[0].id}${path.slice("/v1/institution".length)}`;
  }
  return path;
}
