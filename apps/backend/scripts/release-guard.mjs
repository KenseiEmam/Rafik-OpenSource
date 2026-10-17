export function assertLocalRelease({
  nodeVersion,
  config,
  linked,
  branch,
  webEnvironment,
}) {
  const [major, minor] = nodeVersion.replace(/^v/, "").split(".").map(Number);
  if (!((major === 22 && minor >= 16) || major === 24))
    throw Error("Use Node 22.16 or Node 24 before verification.");
  if (!config.startsWith('name: ${RAFIK_INSTANCE_ID:-rafik-prisma-local}') || linked)
    throw Error(
      "Local identity guard failed; no linked remote project is allowed.",
    );
  if (!branch || branch === "main")
    throw Error("Checks must use the approved non-main monorepo branch.");
  if (
    !/^VITE_API_URL=http:\/\/127\.0\.0\.1:55331\s*$/m.test(webEnvironment)
  )
    throw Error("Web preview must target the exact local API.");
}
