import { db, type Actor } from "./db.ts";
// Subject access for a personal export, including former memberships; never another trainee's records.
export async function organizationAccountData(actor: Actor) {
  const memberships = await db.workspace_members.findMany({
    where: { user_id: actor.id, workspaces: { kind: "organization" } },
    select: {
      id: true,
      workspace_id: true,
      name: true,
      roles: true,
      active: true,
      joined_at: true,
      workspaces: { select: { name: true, archived: true } },
    },
  });
  const ids = memberships.map((m) => m.id);
  const [assignments, sessions] = await Promise.all([
    db.organization_assignments.findMany({
      where: { member_id: { in: ids } },
      include: { organization_versions: true },
      orderBy: { created_at: "asc" },
    }),
    db.organization_sessions.findMany({
      where: { member_id: { in: ids } },
      orderBy: { started_at: "asc" },
    }),
  ]);
  return {
    memberships,
    assignments,
    sessions: sessions.map((s) => s.document),
  };
}
