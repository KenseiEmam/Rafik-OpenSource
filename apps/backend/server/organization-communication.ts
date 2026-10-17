import { ApiError, type Actor } from "./db.ts";
import {
  scoped,
  mutation,
  event,
  uuid,
  textValue,
  type Tx,
  type Role,
  access,
} from "./workspaces.ts";
import { role, recipient } from "./programming.ts";
import { ids, pageOffset } from "./service-definitions.ts";
type Self = Awaited<ReturnType<typeof access>>;
export async function channelAccess(
  tx: Tx,
  id: string,
  self: Self,
  key: string,
  view: Role,
  manage = false,
) {
  const channel = await tx.organization_channels.findUnique({
    where: { id: uuid(key) },
    include: {
      organization_channel_members: {
        include: {
          workspace_members: {
            select: {
              id: true,
              name: true,
              active: true,
              roles: true,
              user_id: true,
            },
          },
        },
      },
    },
  });
  if (!channel || channel.workspace_id !== id)
    throw new ApiError(403, "conversation_unavailable");
  const own = channel.organization_channel_members.find(
    (m) => m.member_id === self.id,
  );
  if (channel.private_pair && !own)
    throw new ApiError(403, "conversation_unavailable");
  if (manage ? view !== "admin" && (view !== "trainer" || !own?.manager) : !own)
    throw new ApiError(403, "conversation_unavailable");
  return channel;
}
export async function communication(
  actor: Actor,
  id: string,
  q: URLSearchParams,
) {
  const view = role(q.get("view"));
  return scoped(actor, id, [view], async (tx, self) => {
    if (q.get("id")) {
      const c = await channelAccess(tx, id, self, q.get("id")!, view),
        before = q.get("before");
      if (before !== null && !/^\d{1,15}$/.test(before))
        throw new ApiError(400, "invalid_request");
      const messages = await tx.organization_messages.findMany({
        where: {
          channel_id: c.id,
          ...(before ? { sequence: { lt: BigInt(before) } } : {}),
        },
        include: { workspace_members: { select: { name: true } } },
        orderBy: { sequence: "desc" },
        take: 51,
      });
      return {
        channel: {
          id: c.id,
          title: c.title,
          revision: c.revision,
          archived: c.archived,
          private_pair: c.private_pair,
        },
        self: self.id,
        canManage:
          view === "admin" ||
          (view === "trainer" &&
            c.organization_channel_members.some(
              (m) => m.member_id === self.id && m.manager,
            )),
        people: c.organization_channel_members.map((m) => ({
          id: m.member_id,
          manager: m.manager,
          name: m.workspace_members.name,
          active: m.workspace_members.active,
        })),
        messages: messages
          .slice(0, 50)
          .reverse()
          .map((m) => ({
            ...m,
            sequence: Number(m.sequence),
            workspace_members: undefined,
            name: m.workspace_members.name,
          })),
        more: messages.length > 50,
      };
    }
    const offset = pageOffset(q.get("offset")),
      search = "%" + (q.get("search") || "").slice(0, 100) + "%",
      manage = q.get("manage") === "true" && view === "admin";
    const list = await tx.$queryRaw<
      {
        id: string;
        title: string;
        revision: number;
        archived: boolean;
        last_body: string | null;
        last_sequence: bigint | null;
        unread: bigint;
      }[]
    >`SELECT c.id,c.title,c.revision,c.archived,last.body last_body,last.sequence last_sequence,(SELECT count(*) FROM public.organization_messages m WHERE m.channel_id=c.id AND m.sender_id<>${self.id}::uuid AND m.sequence>coalesce(r.sequence,0)) unread FROM public.organization_channels c LEFT JOIN public.organization_channel_reads r ON r.channel_id=c.id AND r.member_id=${self.id}::uuid LEFT JOIN LATERAL(SELECT body,sequence FROM public.organization_messages WHERE channel_id=c.id ORDER BY sequence DESC LIMIT 1) last ON true WHERE c.workspace_id=${id}::uuid AND (c.title ILIKE ${search} OR EXISTS(SELECT 1 FROM public.organization_channel_members search_member JOIN public.workspace_members search_person ON search_person.id=search_member.member_id WHERE search_member.channel_id=c.id AND search_member.member_id<>${self.id}::uuid AND c.private_pair AND search_person.name ILIKE ${search})) AND ((${manage} AND NOT c.private_pair) OR EXISTS(SELECT 1 FROM public.organization_channel_members p WHERE p.channel_id=c.id AND p.member_id=${self.id}::uuid)) ORDER BY last.sequence DESC NULLS LAST,c.id LIMIT 26 OFFSET ${offset}`;
    const directPeople = await tx.$queryRaw<{ member_id: string }[]>`
      SELECT DISTINCT other.member_id
      FROM public.organization_channels c
      JOIN public.organization_channel_members own
        ON own.channel_id = c.id AND own.member_id = ${self.id}::uuid
      JOIN public.organization_channel_members other
        ON other.channel_id = c.id AND other.member_id <> ${self.id}::uuid
      WHERE c.workspace_id = ${id}::uuid AND c.private_pair = true`;
    // Management discovery exposes channel metadata only; it cannot disclose message previews/counts before joining.
    return {
      self: self.id,
      directPeople: directPeople.map((person) => person.member_id),
      items: list.slice(0, 25).map((c) => ({
        ...c,
        last_body: manage ? null : c.last_body,
        last_sequence: manage ? null : Number(c.last_sequence || 0),
        unread: manage ? 0 : Number(c.unread),
      })),
      next: list.length > 25 ? offset + 25 : null,
    };
  });
}
async function selectedPeople(
  tx: Tx,
  id: string,
  self: Self,
  view: Role,
  input: Record<string, unknown>,
) {
  const members = ids(input.members, 100),
    managers = ids(input.managers, 8);
  if (managers.some((m) => !members.includes(m)))
    throw new ApiError(400, "invalid_recipients");
  const people = await tx.workspace_members.findMany({
    where: { workspace_id: id, id: { in: members }, active: true },
  });
  if (
    people.length !== members.length ||
    managers.some(
      (m) =>
        !people.some(
          (p) =>
            p.id === m &&
            (p.roles.includes("admin") || p.roles.includes("trainer")),
        ),
    )
  )
    throw new ApiError(400, "invalid_recipients");
  if (
    view === "trainer" &&
    (!members.includes(self.id) || !managers.includes(self.id))
  )
    throw new ApiError(400, "invalid_recipients");
  if (view === "trainer")
    for (const m of people)
      if (m.id !== self.id) await recipient(tx, id, self, view, m.id, true);
  return { members, managers };
}
export async function communicationCommand(
  actor: Actor,
  id: string,
  input: Record<string, unknown>,
) {
  const view = role(input.view),
    key = uuid(input.id),
    action = String(input.action);
  if (action === "read")
    return scoped(actor, id, [view], async (tx, self) => {
      await channelAccess(tx, id, self, key, view);

      if (
        typeof input.sequence !== "number" ||
        !Number.isSafeInteger(input.sequence) ||
        input.sequence < 1
      )
        throw new ApiError(400, "invalid_request");
      if (
        !(await tx.organization_messages.findFirst({
          where: { channel_id: key, sequence: BigInt(input.sequence) },
        }))
      )
        throw new ApiError(400, "invalid_request");
      await tx.$executeRaw`INSERT INTO public.organization_channel_reads(channel_id,workspace_id,member_id,sequence) VALUES(${key}::uuid,${id}::uuid,${self.id}::uuid,${BigInt(input.sequence)}) ON CONFLICT(channel_id,member_id) DO UPDATE SET sequence=greatest(organization_channel_reads.sequence,excluded.sequence)`;
      return { read: true };
    });
  const authorize = async (tx: Tx, self: Self) => {
    if (action === "open-group") {
      const group = await tx.organization_groups.findFirst({
        where: {
          id: key,
          workspace_id: id,
          archived: false,
          ...(view === "admin" ? {} : { created_by: self.id }),
        },
        include: {
          organization_group_members: {
            include: { workspace_members: { select: { active: true } } },
          },
        },
      });
      if (!group) throw new ApiError(404, "group_unavailable");
      const members = [
        self.id,
        ...group.organization_group_members
          .filter((member) => member.workspace_members.active)
          .map((member) => member.member_id),
      ];
      if (new Set(members).size < 2)
        throw new ApiError(400, "invalid_recipients");
      await selectedPeople(tx, id, self, view, {
        members,
        managers: [self.id],
      });
      return;
    }
    if (action === "create") {
      if (view === "trainee") throw new ApiError(403, "forbidden");
      await selectedPeople(tx, id, self, view, input);
    } else
      await channelAccess(
        tx,
        id,
        self,
        key,
        view,
        ["members", "archive", "rename", "join"].includes(action),
      );
  };
  return mutation(
    actor,
    id,
    [view],
    input,
    async (tx, self) => {
      if (action === "open-group") {
        const group = await tx.organization_groups.findFirst({
          where: {
            id: key,
            workspace_id: id,
            archived: false,
            ...(view === "admin" ? {} : { created_by: self.id }),
          },
          include: {
            organization_group_members: {
              include: {
                workspace_members: { select: { active: true } },
              },
            },
          },
        });
        if (!group) throw new ApiError(404, "group_unavailable");
        const members = [
            self.id,
            ...group.organization_group_members
              .filter((member) => member.workspace_members.active)
              .map((member) => member.member_id),
          ],
          { managers } = await selectedPeople(tx, id, self, view, {
            members,
            managers: [self.id],
          });
        const pairKey =
          members.length === 2 ? [...members].sort().join(":") : null;
        let channel = await tx.organization_channels.findFirst({
          where: { workspace_id: id, conversation_group_id: group.id },
        });
        if (!channel && pairKey)
          channel = await tx.organization_channels.findFirst({
            where: { workspace_id: id, private_pair_key: pairKey },
          });
        if (channel) {
          if (
            channel.archived ||
            (!channel.conversation_group_id && !channel.private_pair_key)
          )
            channel = await tx.organization_channels.update({
              where: { id: channel.id },
              data: {
                archived: false,
                ...(channel.conversation_group_id
                  ? {}
                  : { conversation_group_id: group.id }),
                revision: { increment: 1 },
              },
            });
          return channel;
        }
        const channelId = uuid(input.id),
          inserted = await tx.$queryRaw<{ id: string }[]>`
            INSERT INTO public.organization_channels
              (id, workspace_id, title, created_by, private_pair, private_pair_key, conversation_group_id)
            VALUES
              (${channelId}::uuid, ${id}::uuid, ${group.name}, ${self.id}::uuid,
               ${!!pairKey}, ${pairKey}, ${group.id}::uuid)
            ON CONFLICT DO NOTHING
            RETURNING id`;
        if (inserted.length) {
          await tx.organization_channel_members.createMany({
            data: members.map((member_id) => ({
              channel_id: channelId,
              workspace_id: id,
              member_id,
              manager: managers.includes(member_id),
            })),
          });
          await event(tx, actor, id, "conversation_created", channelId, {
            group: group.id,
            members,
            managers,
          });
          return tx.organization_channels.findUniqueOrThrow({
            where: { id: channelId },
          });
        }
        channel = await tx.organization_channels.findFirst({
          where: {
            workspace_id: id,
            OR: [
              { conversation_group_id: group.id },
              ...(pairKey ? [{ private_pair_key: pairKey }] : []),
            ],
          },
        });
        if (!channel) throw new ApiError(409, "conversation_conflict");
        if (channel.archived)
          channel = await tx.organization_channels.update({
            where: { id: channel.id },
            data: { archived: false, revision: { increment: 1 } },
          });
        return channel;
      }
      if (action === "create") {
        const { members, managers } = await selectedPeople(
          tx,
          id,
          self,
          view,
          input,
        );
        if (!members.includes(self.id) || !managers.includes(self.id))
          throw new ApiError(400, "invalid_recipients");
        const privatePair = members.length === 2,
          pairKey = privatePair ? [...members].sort().join(":") : null;
        if (pairKey) {
          const title = textValue(input.title),
            inserted = await tx.$queryRaw<{ id: string }[]>`
              INSERT INTO public.organization_channels
                (id, workspace_id, title, created_by, private_pair, private_pair_key)
              VALUES
                (${key}::uuid, ${id}::uuid, ${title}, ${self.id}::uuid, true, ${pairKey})
              ON CONFLICT (workspace_id, private_pair_key) DO NOTHING
              RETURNING id`;
          let channel = await tx.organization_channels.findFirst({
            where: { workspace_id: id, private_pair_key: pairKey },
          });
          if (inserted.length) {
            await tx.organization_channel_members.createMany({
              data: members.map((member_id) => ({
                channel_id: key,
                workspace_id: id,
                member_id,
                manager: managers.includes(member_id),
              })),
            });
            await event(tx, actor, id, "conversation_created", key, {
              members,
              managers,
            });
            channel = await tx.organization_channels.findUnique({
              where: { id: key },
            });
          } else if (channel?.archived) {
            channel = await tx.organization_channels.update({
              where: { id: channel.id },
              data: { archived: false, revision: { increment: 1 } },
            });
          }
          if (!channel) throw new ApiError(500, "conversation_unavailable");
          return channel;
        }
        const channel = await tx.organization_channels.create({
          data: {
            id: key,
            workspace_id: id,
            title: textValue(input.title),
            private_pair: false,
            created_by: self.id,
          },
        });
        await tx.organization_channel_members.createMany({
          data: members.map((member_id) => ({
            channel_id: key,
            workspace_id: id,
            member_id,
            manager: managers.includes(member_id),
          })),
        });
        await event(tx, actor, id, "conversation_created", key, {
          members,
          managers,
        });
        return channel;
      }
      const c = await channelAccess(
        tx,
        id,
        self,
        key,
        view,
        ["members", "archive", "rename", "join"].includes(action),
      );
      if (action === "join") {
        if (view !== "admin") throw new ApiError(403, "forbidden");
        if (
          !c.organization_channel_members.some(
            (m) => m.member_id === self.id,
          ) &&
          c.organization_channel_members.length >= 100
        )
          throw new ApiError(400, "invalid_recipients");
        await tx.organization_channel_members.upsert({
          where: {
            channel_id_member_id: { channel_id: key, member_id: self.id },
          },
          create: {
            workspace_id: id,
            channel_id: key,
            member_id: self.id,
            manager: false,
          },
          update: {},
        });
        await event(tx, actor, id, "conversation_admin_joined", key);
        return { joined: true };
      }
      if (action === "send") {
        const asset = input.asset_id ? uuid(input.asset_id) : null;
        if (asset) {
          const found = await tx.$queryRaw<
            { id: string }[]
          >`SELECT id FROM public.organization_assets WHERE id=${asset}::uuid AND workspace_id=${id}::uuid AND channel_id=${key}::uuid AND owner_id=${self.id}::uuid AND purpose='message' AND NOT retired`;
          if (!found.length) throw new ApiError(403, "resource_unavailable");
        }
        if (c.archived) throw new ApiError(400, "conversation_unavailable");
        const message = await tx.organization_messages.create({
          data: {
            id: uuid(input.message),
            workspace_id: id,
            channel_id: key,
            sender_id: self.id,
            body: textValue(input.body, 4000),
            asset_id: asset,
          },
        });
        return { ...message, sequence: Number(message.sequence) };
      }
      if (c.revision !== input.revision) throw new ApiError(409, "conflict");
      if (action === "members") {
        if (c.private_pair)
          throw new ApiError(403, "private_conversation_members");
        const { members, managers } = await selectedPeople(
          tx,
          id,
          self,
          view,
          input,
        );
        await tx.organization_channel_members.deleteMany({
          where: { channel_id: key },
        });
        await tx.organization_channel_members.createMany({
          data: members.map((member_id) => ({
            channel_id: key,
            workspace_id: id,
            member_id,
            manager: managers.includes(member_id),
          })),
        });
        await event(tx, actor, id, "conversation_participants_changed", key, {
          members,
          managers,
        });
        return tx.organization_channels.update({
          where: { id: key },
          data: { revision: { increment: 1 } },
        });
      }
      if (action === "rename" || action === "archive") {
        if (action === "archive" && typeof input.archived !== "boolean")
          throw new ApiError(400, "invalid_request");
        const channel = await tx.organization_channels.update({
          where: { id: key },
          data: {
            ...(action === "rename"
              ? { title: textValue(input.title) }
              : { archived: input.archived as boolean }),
            revision: { increment: 1 },
          },
        });
        await event(tx, actor, id, "conversation_" + action, key);
        return channel;
      }
      throw new ApiError(400, "invalid_request");
    },
    authorize,
  );
}
