import { ApiError, asActor, type Actor } from "./db.ts";
import { scoped, uuid } from "./workspaces.ts";
import {
  role,
  recipient,
  coachedBy,
  supportingLinks,
  assignmentScope,
} from "./programming.ts";
import { pageOffset } from "./service-definitions.ts";

/** Staff assignment index. Dates classify assignments without rewriting their lifecycle. */
export async function athletePlans(
  actor: Actor,
  workspace: string,
  query: URLSearchParams,
) {
  const view = role(query.get("view"));
  if (view === "trainee") throw new ApiError(403, "forbidden");
  const status = query.get("status") || "active";
  if (!["active", "upcoming", "expired", "ended", "all"].includes(status))
    throw new ApiError(400, "invalid_request");
  const offset = pageOffset(query.get("offset"));
  const member = query.get("member");
  const assignment = query.get("assignment");
  if (member) uuid(member);
  if (assignment) uuid(assignment);
  const search = (query.get("search") || "").trim().slice(0, 100);
  const profile = await asActor(actor, (tx) =>
    tx.profiles.findUnique({
      where: { id: actor.id },
      select: { timezone: true },
    }),
  );
  return scoped(actor, workspace, [view], async (tx, self) => {
    if (member)
      await recipient(tx, workspace, self, view, member, false, "training");

    const zone = profile?.timezone || "UTC";
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const day = new Date(today + "T00:00:00Z");
    const peopleScope = {
      workspace_id: workspace,
      ...(view === "trainer" ? coachedBy(self.id) : {}),
      ...(member ? { id: member } : {}),
    };
    const stateWhere =
      status === "all"
        ? {}
        : status === "ended"
          ? { state: { not: "active" } }
          : {
              state: "active",
              ...(status === "expired"
                ? { end_date: { lt: day } }
                : {
                    workspace_members_organization_assignments_workspace_id_member_idToworkspace_members:
                      { ...peopleScope, active: true },
                    start_date:
                      status === "upcoming" ? { gt: day } : { lte: day },
                    OR: [{ end_date: null }, { end_date: { gte: day } }],
                  }),
            };
    const scope = {
      workspace_id: workspace,
      workspace_members_organization_assignments_workspace_id_member_idToworkspace_members:
        peopleScope,
      // Supporting coaches see only plans labelled with their linked sport.
      ...(view === "trainer"
        ? assignmentScope(
            self.id,
            await supportingLinks(tx, workspace, self.id),
          )
        : {}),
    };
    const where = assignment
      ? { ...scope, id: assignment }
      : {
          ...scope,
          ...stateWhere,
          ...(search
            ? {
                AND: [
                  {
                    OR: [
                      {
                        organization_versions: {
                          title: {
                            contains: search,
                            mode: "insensitive" as const,
                          },
                        },
                      },
                      {
                        workspace_members_organization_assignments_workspace_id_member_idToworkspace_members:
                          {
                            name: {
                              contains: search,
                              mode: "insensitive" as const,
                            },
                          },
                      },
                    ],
                  },
                ],
              }
            : {}),
        };
    const [rows, total] = await Promise.all([
      tx.organization_assignments.findMany({
        where,
        skip: assignment ? 0 : offset,
        take: assignment ? 1 : 24,
        orderBy: [{ created_at: "desc" }, { id: "asc" }],
        include: {
          organization_versions: {
            select: {
              id: true,
              title: true,
              revision: true,
              program_id: true,
              ...(assignment ? { prescription: true } : {}),
            },
          },
          workspace_members_organization_assignments_workspace_id_member_idToworkspace_members:
            { select: { id: true, name: true, active: true } },
          organization_sports: { select: { name: true } },
        },
      }),
      tx.organization_assignments.count({ where }),
    ]);
    if (assignment && !rows.length)
      throw new ApiError(404, "program_unavailable");
    return {
      today,
      zone,
      total,
      next: !assignment && offset + 24 < total ? offset + 24 : null,
      items: rows.map((row) => {
        const person =
          row.workspace_members_organization_assignments_workspace_id_member_idToworkspace_members;
        const derived =
          row.state !== "active"
            ? "ended"
            : row.end_date && row.end_date < day
              ? "expired"
              : row.start_date > day
                ? "upcoming"
                : "active";
        return {
          id: row.id,
          member_id: row.member_id,
          member_name: person.name,
          member_active: person.active,
          start_date: row.start_date.toISOString().slice(0, 10),
          end_date: row.end_date?.toISOString().slice(0, 10) || null,
          state: row.state,
          status: derived,
          schedule_mode: row.schedule_mode,
          goal: row.goal,
          sport: row.organization_sports?.name || null,
          revision: row.revision,
          version: row.organization_versions,
        };
      }),
    };
  });
}
