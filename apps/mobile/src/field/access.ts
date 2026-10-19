/** Keep saved work reviewable, but never strand selection in a removed empty workspace. */
export function selectedWorkspace(
  current: string,
  available: readonly { workspace_id: string }[],
  saved: readonly string[],
) {
  const ids = [...new Set([...available.map((c) => c.workspace_id), ...saved])]
  return ids.includes(current) ? current : ids[0] || ''
}
