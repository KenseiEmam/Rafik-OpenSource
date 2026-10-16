export function assertLocalRelease({
  nodeVersion,
  config,
  linked,
  branches,
  webEnvironment,
}) {
  if (nodeVersion !== "v22.16.0")
    throw Error("Use the pinned Node 22.16.0 before verification.");
  if (!config.startsWith('name: rafik-prisma-local') || linked)
    throw Error(
      "Local identity guard failed; no linked remote project is allowed.",
    );
  if (
    branches.length !== 2 ||
    branches[0] !== branches[1] ||
    branches[0] === "main"
  )
    throw Error("Web and API checks must use the same non-main monorepo branch.");
  if (
    !/^VITE_API_URL=http:\/\/127\.0\.0\.1:55331\s*$/m.test(webEnvironment)
  )
    throw Error("Web preview must target the exact local API.");
}
