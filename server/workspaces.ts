import { createHash, randomUUID } from "node:crypto";
import { db, asActor, ApiError, type Actor } from "./db.ts";
import type { Prisma } from "./generated/prisma/client.ts";
export type Tx = Prisma.TransactionClient;
export type Role = "admin" | "trainer" | "trainee";
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export function uuid(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      value,
    )
  )
    throw new ApiError(400, "invalid_request");
  return value;
}
export function textValue(value: unknown, max = 100) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new ApiError(400, "invalid_request");
  return value.trim();
}
function roleList(value: unknown): Role[] {
  if (
    !Array.isArray(value) ||
    !value.length ||
    value.length > 3 ||
    value.some((r) => !["admin", "trainer", "trainee"].includes(r))
  )
    throw new ApiError(400, "invalid_roles");
  return [...new Set(value)].sort() as Role[];
}
export async function access(
  tx: Tx,
  actor: Actor,
  id: string,
  roles: Role[] = [],
  allowArchived = false,
) {
  const member = await tx.workspace_members.findUnique({
    where: { workspace_id_user_id: { workspace_id: id, user_id: actor.id } },
    include: { workspaces: true },
  });
  if (
    !member?.active ||
    (member.workspaces.archived && !allowArchived) ||
    member.workspaces.kind !== "organization" ||
    (roles.length && !roles.some((r) => member.roles.includes(r)))
  )
    throw new ApiError(403, "workspace_unavailable");
  return member;
}
export async function event(
  tx: Tx,
  actor: Actor,
  id: string,
  kind: string,
  subject: string | null,
  detail: Prisma.InputJsonValue = {},
) {
  await tx.workspace_events.create({
    data: {
      workspace_id: id,
      actor_id: actor.id,
      kind,
      subject_id: subject,
      detail,
    },
  });
}
export async function scoped<T>(
  actor: Actor,
  id: string,
  roles: Role[],
  run: (tx: Tx, member: Awaited<ReturnType<typeof access>>) => Promise<T>,
  allowArchived = false,
) {
  uuid(id);
  return db.$transaction(
    async (tx) => {
      // Membership and command updates share one per-organization lock; revocation wins before replay.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${id},73))::text`;
      return run(tx, await access(tx, actor, id, roles, allowArchived));
    },
    { timeout: 15000 },
  );
}
export async function mutation(
  actor: Actor,
  id: string,
  roles: Role[],
  input: Record<string, unknown>,
  run: (tx: Tx, member: Awaited<ReturnType<typeof access>>) => Promise<unknown>,
) {
  const operation = uuid(input.operation);
  return scoped(
    actor,
    id,
    roles,
    async (tx, member) => {
      const existing = await tx.workspace_operations.findUnique({
        where: { id: operation },
      });
      // Canonical object ordering makes retries stable across serialization implementations.
      const canonical = (v: unknown): unknown =>
        Array.isArray(v)
          ? v.map(canonical)
          : v && typeof v === "object"
            ? Object.fromEntries(
                Object.entries(v)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([k, x]) => [k, canonical(x)]),
              )
            : v;
      const payload = canonical(input) as Prisma.InputJsonValue;
      if (existing) {
        if (
          existing.workspace_id !== id ||
          existing.actor_id !== actor.id ||
          JSON.stringify(canonical(existing.payload)) !==
            JSON.stringify(payload)
        )
          throw new ApiError(409, "operation_reused");
        return existing.result;
      }
      if (member.workspaces.archived)
        throw new ApiError(403, "workspace_unavailable");
      const result = JSON.parse(
        JSON.stringify(await run(tx, member)),
      ) as Prisma.InputJsonValue;
      await tx.workspace_operations.create({
        data: {
          id: operation,
          workspace_id: id,
          actor_id: actor.id,
          payload,
          result,
        },
      });
      return result;
    },
    input.action === "close",
  );
}
export async function contexts(actor: Actor) {
  const memberships = await db.workspace_members.findMany({
    where: { user_id: actor.id, active: true, workspaces: { archived: false } },
    include: { workspaces: true },
    orderBy: { joined_at: "asc" },
  });
  return {
    contexts: [
      {
        id: "personal",
        kind: "personal",
        name: "My training",
        role: "trainee",
        path: "/today",
      },
      ...memberships.flatMap((m) =>
        m.roles.map((role) => ({
          id: m.workspace_id + ":" + role,
          workspace_id: m.workspace_id,
          kind: m.workspaces.kind,
          name: m.workspaces.name,
          role,
          path:
            m.workspaces.kind === "independent"
              ? "/coach"
              : `/organization/${m.workspace_id}/${role}`,
        })),
      ),
    ],
    platform: !!(await db.platform_grants.findUnique({
      where: { user_id: actor.id },
    })),
  };
}
async function ownName(actor: Actor) {
  return asActor(
    actor,
    async (tx) =>
      (
        await tx.profiles.findUnique({
          where: { id: actor.id },
          select: { display_name: true },
        })
      )?.display_name ||
      actor.email?.split("@")[0] ||
      "Member",
  );
}
export async function createWorkspace(
  actor: Actor,
  input: Record<string, unknown>,
) {
  const id = uuid(input.id),
    kind =
      input.kind === "independent"
        ? "independent"
        : input.kind === "organization"
          ? "organization"
          : null;
  if (!kind) throw new ApiError(400, "invalid_request");
  const name = textValue(input.name);
  const memberName = await ownName(actor);
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${actor.id},74))::text`;
    const prior = await tx.workspaces.findUnique({ where: { id } });
    if (prior) {
      if (
        prior.created_by !== actor.id ||
        prior.kind !== kind ||
        prior.name !== name
      )
        throw new ApiError(409, "operation_reused");
      if (
        prior.archived ||
        !(await tx.workspace_members.findFirst({
          where: { workspace_id: id, user_id: actor.id, active: true },
        }))
      )
        throw new ApiError(403, "workspace_unavailable");
      return prior;
    }
    if (
      kind === "independent" &&
      (await tx.workspace_members.findFirst({
        where: {
          user_id: actor.id,
          active: true,
          workspaces: { kind, archived: false },
        },
      }))
    )
      throw new ApiError(409, "practice_exists");
    const workspace = await tx.workspaces.create({
      data: { id, kind, name, created_by: actor.id },
    });
    await tx.workspace_members.create({
      data: {
        id: randomUUID(),
        workspace_id: id,
        user_id: actor.id,
        roles: [kind === "independent" ? "trainer" : "admin"],
        name: memberName,
      },
    });
    await event(tx, actor, id, "organization_created", null, { name });
    return workspace;
  });
}
export async function workspaceView(actor: Actor, id: string, view: string) {
  if (!["admin", "trainer", "trainee"].includes(view))
    throw new ApiError(400, "invalid_request");
  return scoped(actor, id, [view as Role], async (tx, self) => {
    const filter =
      view === "admin"
        ? {}
        : view === "trainer"
          ? { trainer_id: self.id }
          : { id: self.id };
    const members = await tx.workspace_members.findMany({
      where: { workspace_id: id, ...filter },
      include: {
        users: {
          select: { email: true },
        },
      },
      orderBy: [{ active: "desc" }, { joined_at: "asc" }],
    });
    const ids = new Set(members.map((m) => m.id));
    ids.add(self.id);
    if (self.trainer_id) ids.add(self.trainer_id);
    const names = await tx.workspace_members.findMany({
      where: { workspace_id: id, id: { in: [...ids] } },
      select: {
        id: true,
        name: true,
      },
    });
    const invitations =
      view === "admin"
        ? await tx.workspace_invitations.findMany({
            where: {
              workspace_id: id,
              state: "pending",
              expires_at: { gt: new Date() },
            },
            select: { id: true, email: true, roles: true, expires_at: true },
            orderBy: { created_at: "desc" },
            take: 100,
          })
        : [];
    const events =
      view === "admin"
        ? await tx.workspace_events.findMany({
            where: { workspace_id: id },
            orderBy: [{ created_at: "desc" }, { id: "desc" }],
            take: 30,
          })
        : [];
    return {
      workspace: {
        id,
        name: self.workspaces.name,
        revision: self.workspaces.revision,
      },
      self: { id: self.id, roles: self.roles },
      members: members.map(({ users, ...m }) => ({
        ...m,
        name: m.name,
        email: view === "admin" ? users?.email : undefined,
      })),
      names: names.map((m) => ({
        id: m.id,
        name: m.name,
      })),
      invitations,
      events,
    };
  });
}
export async function workspaceCommand(
  actor: Actor,
  id: string,
  input: Record<string, unknown>,
) {
  return mutation(actor, id, ["admin"], input, async (tx, self) => {
    const action = input.action;
    if (action === "invite") {
      const email = textValue(input.email, 254).toLowerCase(),
        roles = roleList(input.roles),
        token = textValue(input.token, 128),
        invite = uuid(input.id);
      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !/^[a-f0-9]{64}$/.test(token)
      )
        throw new ApiError(400, "invalid_request");
      if (
        await tx.workspace_members.findFirst({
          where: { workspace_id: id, active: true, users: { email } },
        })
      )
        throw new ApiError(409, "already_member");
      if (
        await tx.workspace_invitations.findFirst({
          where: {
            workspace_id: id,
            email,
            state: "pending",
            expires_at: { gt: new Date() },
          },
        })
      )
        throw new ApiError(409, "invitation_pending");
      const result = await tx.workspace_invitations.create({
        data: {
          id: invite,
          workspace_id: id,
          email,
          roles,
          token_hash: hash(token),
          created_by: actor.id,
        },
      });
      await event(tx, actor, id, "member_invited", invite, { roles });
      return { id: result.id };
    }
    if (action === "revoke-invite") {
      const invite = await tx.workspace_invitations.findFirst({
        where: { id: uuid(input.id), workspace_id: id, state: "pending" },
      });
      if (!invite) throw new ApiError(404, "invitation_unavailable");
      await tx.workspace_invitations.update({
        where: { id: invite.id },
        data: { state: "revoked" },
      });
      await event(tx, actor, id, "invitation_revoked", invite.id);
      return { saved: true };
    }
    if (action === "member" || action === "assign-trainer") {
      const member = await tx.workspace_members.findFirst({
        where: { id: uuid(input.id), workspace_id: id },
      });
      if (!member) throw new ApiError(404, "member_unavailable");
      if (member.revision !== input.revision)
        throw new ApiError(409, "conflict");
      if (action === "assign-trainer") {
        if (!member.active || !member.roles.includes("trainee"))
          throw new ApiError(400, "invalid_trainee");
        const trainer =
          input.trainer === null
            ? null
            : await tx.workspace_members.findFirst({
                where: {
                  id: uuid(input.trainer),
                  workspace_id: id,
                  active: true,
                  roles: { has: "trainer" },
                },
              });
        if ((input.trainer !== null && !trainer) || trainer?.id === member.id)
          throw new ApiError(400, "invalid_trainer");
        const result = await tx.workspace_members.update({
          where: { id: member.id },
          data: { trainer_id: trainer?.id || null, revision: { increment: 1 } },
        });
        await event(tx, actor, id, "trainer_assigned", member.id, {
          previous: member.trainer_id,
          trainer: trainer?.id || null,
        });
        return result;
      }
      if (typeof input.active !== "boolean")
        throw new ApiError(400, "invalid_request");
      const roles = roleList(input.roles),
        active = input.active;
      if (
        member.roles.includes("admin") &&
        (!active || !roles.includes("admin")) &&
        (await tx.workspace_members.count({
          where: { workspace_id: id, active: true, roles: { has: "admin" } },
        })) <= 1
      )
        throw new ApiError(409, "last_admin");
      // Departure leaves visible unassigned duties, without transferring or deleting any trainee record.
      if (!active || !roles.includes("trainer"))
        await tx.workspace_members.updateMany({
          where: { workspace_id: id, trainer_id: member.id },
          data: { trainer_id: null, revision: { increment: 1 } },
        });
      const result = await tx.workspace_members.update({
        where: { id: member.id },
        data: {
          roles,
          active,
          trainer_id:
            active && roles.includes("trainee") ? member.trainer_id : null,
          revision: { increment: 1 },
        },
      });
      await event(
        tx,
        actor,
        id,
        active ? "member_roles_changed" : "member_removed",
        member.id,
        { roles },
      );
      return result;
    }
    if (action === "rename" || action === "close") {
      if (self.workspaces.revision !== input.revision)
        throw new ApiError(409, "conflict");
      if (action === "close" && input.confirm !== self.workspaces.name)
        throw new ApiError(400, "name_confirmation_required");
      const result = await tx.workspaces.update({
        where: { id },
        data:
          action === "close"
            ? { archived: true, revision: { increment: 1 } }
            : { name: textValue(input.name), revision: { increment: 1 } },
      });
      await event(
        tx,
        actor,
        id,
        action === "close" ? "organization_closed" : "organization_renamed",
        null,
      );
      return result;
    }
    throw new ApiError(400, "invalid_command");
  });
}
export async function invitation(
  token: string,
  actor: Actor | null,
  accept = false,
) {
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new ApiError(404, "invitation_unavailable");
  const invite = await db.workspace_invitations.findUnique({
    where: { token_hash: hash(token) },
    include: { workspaces: true },
  });
  if (
    !invite ||
    invite.workspaces.archived ||
    invite.state === "revoked" ||
    (invite.state === "pending" && invite.expires_at < new Date())
  )
    throw new ApiError(404, "invitation_unavailable");
  if (!accept)
    return {
      organization: invite.workspaces.name,
      roles: invite.roles,
      state: invite.state,
      expires_at: invite.expires_at,
    };
  if (!actor) throw new ApiError(401, "unauthenticated");
  const memberName = await ownName(actor);
  if (actor.email !== invite.email) throw new ApiError(403, "wrong_email");
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${invite.workspace_id},73))::text`;
    const current = await tx.workspace_invitations.findUniqueOrThrow({
      where: { id: invite.id },
      include: { workspaces: true },
    });
    if (
      current.workspaces.archived ||
      current.state === "revoked" ||
      (current.state === "pending" && current.expires_at < new Date())
    )
      throw new ApiError(404, "invitation_unavailable");
    const prior = await tx.workspace_members.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: invite.workspace_id,
          user_id: actor.id,
        },
      },
    });
    if (current.state === "accepted") {
      if (!prior?.active) throw new ApiError(403, "workspace_unavailable");
      return {
        workspace_id: invite.workspace_id,
        role: ["admin", "trainer", "trainee"].find((r) =>
          prior.roles.includes(r),
        ),
      };
    }
    // An invitation is enrollment, never a silent edit to an already active member's roles.
    if (prior?.active) throw new ApiError(409, "already_member");
    await tx.workspace_members.upsert({
      where: {
        workspace_id_user_id: {
          workspace_id: invite.workspace_id,
          user_id: actor.id,
        },
      },
      create: {
        id: randomUUID(),
        workspace_id: invite.workspace_id,
        user_id: actor.id,
        roles: invite.roles,
        name: memberName,
      },
      update: {
        active: true,
        roles: invite.roles,
        trainer_id: null,
        revision: { increment: 1 },
      },
    });
    await tx.workspace_invitations.update({
      where: { id: invite.id },
      data: { state: "accepted", accepted_by: actor.id },
    });
    await event(tx, actor, invite.workspace_id, "member_joined", actor.id, {
      roles: invite.roles,
    });
    return {
      workspace_id: invite.workspace_id,
      role: ["admin", "trainer", "trainee"].find((r) =>
        invite.roles.includes(r),
      ),
    };
  });
}
export async function requirePractice(actor: Actor | null) {
  if (
    !actor ||
    !(await db.workspace_members.findFirst({
      where: {
        user_id: actor.id,
        active: true,
        workspaces: { kind: "independent", archived: false },
        roles: { has: "trainer" },
      },
    }))
  )
    throw new ApiError(403, "coaching_not_enabled");
}
