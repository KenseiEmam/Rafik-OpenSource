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
  const [assignments, sessions, calendar, results, corrections] =
    await Promise.all([
      db.organization_assignments.findMany({
        where: { member_id: { in: ids } },
        include: { organization_versions: true },
        orderBy: { created_at: "asc" },
      }),
      db.organization_sessions.findMany({
        where: { member_id: { in: ids } },
        orderBy: { started_at: "asc" },
      }),
      db.organization_event_people.findMany({
        where: { member_id: { in: ids } },
        include: { organization_events: true },
      }),
      db.assessment_results.findMany({ where: { member_id: { in: ids } } }),
      db.assessment_result_history.findMany({
        where: { member_id: { in: ids } },
        orderBy: { recorded_at: "asc" },
      }),
    ]);
  const [messages, notificationPreferences, notifications] = await Promise.all([
    db.organization_messages.findMany({
      where: { sender_id: { in: ids } },
      select: {
        id: true,
        channel_id: true,
        workspace_id: true,
        body: true,
        asset_id: true,
        created_at: true,
      },
      orderBy: { created_at: "asc" },
    }),
    db.notification_preferences.findUnique({ where: { user_id: actor.id } }),
    db.notification_events.findMany({
      where: { user_id: actor.id },
      select: {
        id: true,
        category: true,
        source_kind: true,
        created_at: true,
        read_at: true,
        state: true,
      },
    }),
  ]);
  const [nutritionPlans, nutritionSharing, nutritionMeals] = await Promise.all([
    db.organization_nutrition_plans.findMany({
      where: { member_id: { in: ids } },
      orderBy: { created_at: "asc" },
    }),
    db.organization_nutrition_sharing.findMany({
      where: { member_id: { in: ids } },
    }),
    db.organization_meals.findMany({
      where: { member_id: { in: ids } },
      include: { organization_meal_history: true },
      orderBy: { created_at: "asc" },
    }),
  ]);
  const assets =
    await db.$queryRaw`SELECT id,workspace_id,purpose,channel_id,filename,media_type,bytes,retired,created_at FROM public.organization_assets WHERE owner_id=ANY(${ids}::uuid[])`;
  const tasks =
    await db.$queryRaw`SELECT * FROM public.organization_tasks WHERE assigned_to=ANY(${ids}::uuid[]) OR created_by=ANY(${ids}::uuid[])`;
  const sessionFeedback =
    await db.$queryRaw`SELECT * FROM public.organization_session_feedback WHERE member_id=ANY(${ids}::uuid[])`;
  const workplaceFeedback =
    await db.$queryRaw`SELECT * FROM public.organization_workplace_feedback WHERE member_id=ANY(${ids}::uuid[])`;
  return {
    sessionFeedback,
    workplaceFeedback,
    tasks,
    assets,
    nutritionPlans,
    nutritionSharing,
    nutritionMeals,
    messages,
    notificationPreferences,
    notifications,
    calendar,
    results,
    corrections,
    memberships,
    assignments,
    sessions: sessions.map((s) => s.document),
  };
}
