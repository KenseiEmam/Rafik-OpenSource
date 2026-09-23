export function assertLocalRelease({
  nodeVersion,
  config,
  linked,
  branches,
  webEnvironment,
}) {
  if (nodeVersion !== "v22.16.0")
    throw Error("Use the pinned Node 22.16.0 before verification.");
  if (!config.includes('project_id = "rafik-revamp-local"') || linked)
    throw Error(
      "Local identity guard failed; no linked remote project is allowed.",
    );
  if (
    branches.length !== 2 ||
    branches.some((branch) => branch !== "codex/revamp")
  )
    throw Error("Both checkouts must be on codex/revamp.");
  if (
    !/^VITE_SUPABASE_URL=http:\/\/127\.0\.0\.1:55321\s*$/m.test(webEnvironment)
  )
    throw Error("Web preview must target the exact local API.");
}
