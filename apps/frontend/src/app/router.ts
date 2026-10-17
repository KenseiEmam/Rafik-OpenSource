import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { ready, user, contexts, refreshContexts } from './auth'
const workspaceScroll = new Map<string, number>()
const legacyCoachSections: Record<string, string> = {
  clients: '/people',
  plans: '/plans',
  exercises: '/exercises',
  analytics: '/analytics',
  review: '/training',
  deliver: '/plans',
  checkins: '/tasks',
  forms: '/tasks',
  messages: '/messages',
  appointments: '/calendar',
  nutrition: '/nutrition',
  resources: '/resources',
  teams: '/groups',
  business: '/settings',
  support: '/more',
  more: '/settings',
}
function organizationRouteForLegacyCoach(path: string, base: string) {
  const parts = path
    .replace(/^\/coach\/?/, '')
    .split('/')
    .filter(Boolean)
  if (!parts.length) return base
  const target = legacyCoachSections[parts[0]!]
  if (!target) return base
  if (parts[0] === 'plans' && parts[1] === 'new') return base + '/plans/new'
  if (parts[0] === 'appointments' && parts[1] === 'new') return base + '/calendar/new'
  if (parts[0] === 'review' && parts[1]) return base + '/review/' + encodeURIComponent(parts[1])
  return base + target
}
let cancelScrollRestore = () => {}
// Returning routes load asynchronously: don't clamp a saved position to the loading skeleton.
function restoreWorkspaceScroll(main: HTMLElement, top: number) {
  cancelScrollRestore()
  if (!top) {
    main.scrollTop = 0
    return
  }
  const controller = new AbortController()
  const observer = new MutationObserver(restore)
  const timeout = window.setTimeout(() => {
    main.scrollTop = top
    cancel()
  }, 10000)
  function cancel() {
    observer.disconnect()
    window.clearTimeout(timeout)
    controller.abort()
  }
  function restore() {
    if (main.scrollHeight - main.clientHeight >= top) {
      main.scrollTop = top
      cancel()
    }
  }
  cancelScrollRestore = cancel
  for (const event of ['wheel', 'pointerdown', 'keydown'])
    window.addEventListener(event, cancel, { once: true, passive: true, signal: controller.signal })
  observer.observe(main, { childList: true, subtree: true, characterData: true })
  restore()
}
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/platform',
      component: () => import('../features/platform/PlatformPage.vue'),
      meta: { private: true },
    },
    {
      path: '/workspaces',
      component: () => import('../features/organizations/WorkspacesPage.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/deliver/:id',
      component: () => import('../features/coaching/DeliverPlan.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/training',
      component: () => import('../features/organizations/OrganizationTraining.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/review/:id',
      component: () => import('../features/coaching/ReviewPage.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/plans',
      component: () => import('../features/coaching/PlansPage.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/plans/:id',
      component: () => import('../features/coaching/PlanEditor.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/feedback',
      component: () => import('../features/organizations/FeedbackPage.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/tasks',
      component: () => import('../features/organizations/OrganizationTasks.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/resources',
      component: () => import('../features/resources/OrganizationResources.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/exercises',
      component: () => import('../features/coaching/ExercisesPage.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/nutrition',
      component: () => import('../features/nutrition/OrganizationNutrition.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/injuries',
      component: () => import('../features/organizations/OrganizationInjuries.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/analytics',
      component: () => import('../features/analytics/AnalyticsPage.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/messages/:channel?',
      component: () => import('../features/organizations/ChannelsPage.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/calendar',
      component: () => import('../features/organizations/OrganizationCalendar.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/calendar/new',
      component: () => import('../features/organizations/EventComposer.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/calendar/:id',
      component: () => import('../features/organizations/EventDetail.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/groups',
      component: () => import('../features/organizations/ServiceCatalog.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/assessment-templates',
      component: () => import('../features/organizations/ServiceCatalog.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/assessments/:member',
      component: () => import('../features/organizations/AssessmentHistory.vue'),
      meta: { private: true },
    },
    {
      path: '/organization/:workspace/:view/:section?',
      component: () => import('../features/organizations/OrganizationPage.vue'),
      meta: { private: true },
    },
    {
      path: '/organization-invite/:token',
      component: () => import('../features/organizations/OrganizationInvite.vue'),
    },
    { path: '/', component: () => import('../features/account/EntryPage.vue') },
    { path: '/setup', component: () => import('../features/account/SetupPage.vue') },
    {
      path: '/password-setup/:token',
      component: () => import('../features/account/PasswordSetupPage.vue'),
    },
    { path: '/routine', component: () => import('../features/training/RoutinePage.vue') },
    {
      path: '/notifications',
      component: () => import('../features/notifications/NotificationsPage.vue'),
      meta: { private: true },
    },
    { path: '/workout/:id', component: () => import('../features/training/WorkoutPage.vue') },
    { path: '/login', component: () => import('../features/account/LoginPage.vue') },
    { path: '/invite/:token', component: () => import('../features/account/InvitePage.vue') },
    {
      path: '/today',
      component: () => import('../features/training/TodayPage.vue'),
      meta: { private: true },
    },
    { path: '/history', component: () => import('../features/training/HistoryPage.vue') },
    {
      path: '/settings',
      component: () => import('../features/account/SettingsPage.vue'),
      meta: { private: true },
    },
    {
      path: '/progress',
      component: () => import('../features/ongoing/ProgressPage.vue'),
      meta: { private: true },
    },
    {
      path: '/checkins',
      component: () => import('../features/ongoing/RequestsPage.vue'),
      meta: { private: true },
    },
    {
      path: '/checkins/:id',
      component: () => import('../features/ongoing/ResponsePage.vue'),
      meta: { private: true },
    },
    {
      path: '/messages/:id?',
      component: () => import('../features/ongoing/MessagesPage.vue'),
      meta: { private: true },
    },
    {
      path: '/more',
      component: () => import('../features/services/MorePage.vue'),
      meta: { private: true },
    },
    {
      path: '/nutrition',
      component: () => import('../features/nutrition/NutritionPage.vue'),
      meta: { private: true },
    },
    {
      path: '/appointments',
      component: () => import('../features/appointments/CalendarPage.vue'),
      meta: { private: true },
    },
    {
      path: '/resources',
      component: () => import('../features/resources/ResourcesPage.vue'),
      meta: { private: true },
    },
    {
      path: '/teams',
      component: () => import('../features/teams/TeamsPage.vue'),
      meta: { private: true },
    },
    {
      path: '/support',
      component: () => import('../features/support/SupportPage.vue'),
      meta: { private: true },
    },
    {
      path: '/team-invite/:token',
      component: () => import('../features/teams/TeamInvitePage.vue'),
    },
    ...(import.meta.env.DEV
      ? [
          {
            path: '/local-preview',
            component: () => import('../features/account/LocalPreview.vue'),
          },
        ]
      : []),
    { path: '/help', component: () => import('../features/account/HelpPage.vue') },
    { path: '/privacy', component: () => import('../features/public/PrivacyPage.vue') },
    {
      path: '/coach/:pathMatch(.*)*',
      component: () => import('../features/public/NotFound.vue'),
      meta: { private: true },
    },
    { path: '/privacy-policy', redirect: '/privacy' },
    { path: '/privacy_policy', redirect: '/privacy' },
    { path: '/:pathMatch(.*)*', component: () => import('../features/public/NotFound.vue') },
  ],
  async scrollBehavior(to, from, saved) {
    await nextTick()
    const main = document.querySelector<HTMLElement>('.dashboard-frame > main')
    if (main && window.matchMedia('(min-width: 1024px)').matches) {
      if (to.hash) document.getElementById(to.hash.slice(1))?.scrollIntoView({ block: 'start' })
      else if (to.path !== from.path)
        restoreWorkspaceScroll(main, saved ? workspaceScroll.get(to.fullPath) || 0 : 0)
      return false
    }
    if (saved) return saved
    if (to.hash) return { el: to.hash, top: 100 }
    if (to.path === from.path) return
    return { top: 0 }
  },
})
router.beforeEach(async (to, from) => {
  cancelScrollRestore()
  const main = document.querySelector<HTMLElement>('.dashboard-frame > main')
  if (main) {
    workspaceScroll.set(from.fullPath, main.scrollTop)
    if (workspaceScroll.size > 100) workspaceScroll.delete(workspaceScroll.keys().next().value!)
  }
  await ready()
  if (to.meta.private && !user.value) return { path: '/login', query: { next: to.fullPath } }
  if (
    user.value &&
    /^\/(today|history|progress|checkins|messages|more|nutrition|appointments|resources|teams|business)(\/|$)/.test(
      to.path,
    )
  ) {
    await refreshContexts().catch(() => {})
    const organization = contexts.value.find((context) => context.kind === 'organization')
    return organization?.path || '/workspaces?start=organization'
  }
  if (user.value && (to.path.startsWith('/coach') || to.path.startsWith('/organization/'))) {
    await refreshContexts().catch(() => {})
    if (to.path.startsWith('/coach')) {
      const staffWorkspace =
        contexts.value.find((c) => c.kind === 'organization' && c.role === 'trainer') ||
        contexts.value.find((c) => c.kind === 'organization' && c.role === 'admin')
      const organization = contexts.value.find((c) => c.kind === 'organization')
      return staffWorkspace
        ? organizationRouteForLegacyCoach(to.path, staffWorkspace.path)
        : organization?.path || '/workspaces?start=organization'
    }
    if (
      to.path.startsWith('/organization/') &&
      !contexts.value.some(
        (context) =>
          context.kind === 'organization' &&
          (to.path === context.path || to.path.startsWith(context.path + '/')),
      )
    )
      return contexts.value[0]?.path || '/workspaces'
  }
})
export const safeNext = (value: unknown, fallback = '/today') =>
  typeof value === 'string' &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.includes('\\')
    ? value
    : fallback
router.afterEach((to, from) => {
  if (from.matched.length && to.path !== from.path)
    void nextTick(() => document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true }))
})
export default router
