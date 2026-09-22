import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { ready, user } from './auth'
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('../features/public/HomePage.vue') },
    { path: '/routine', component: () => import('../features/training/RoutinePage.vue') },
    { path: '/workout/:id', component: () => import('../features/training/WorkoutPage.vue') },
    { path: '/login', component: () => import('../features/account/LoginPage.vue') },
    { path: '/auth/callback', component: () => import('../features/account/CallbackPage.vue') },
    { path: '/invite/:token', component: () => import('../features/account/InvitePage.vue') },
    {
      path: '/today',
      component: () => import('../features/training/TodayPage.vue'),
      meta: { private: true },
    },
    { path: '/history', component: () => import('../features/training/HistoryPage.vue') },
    {
      path: '/coach',
      component: () => import('../features/coaching/CoachHome.vue'),
      meta: { private: true },
    },
    {
      path: '/coach/plans',
      component: () => import('../features/coaching/PlansPage.vue'),
      meta: { private: true },
    },
    {
      path: '/coach/plans/:id',
      component: () => import('../features/coaching/PlanEditor.vue'),
      meta: { private: true },
    },
    {
      path: '/coach/clients',
      component: () => import('../features/coaching/ClientsPage.vue'),
      meta: { private: true },
    },
    {
      path: '/coach/clients/:id',
      component: () => import('../features/coaching/ClientPage.vue'),
      meta: { private: true },
    },
    {
      path: '/coach/exercises',
      component: () => import('../features/coaching/ExercisesPage.vue'),
      meta: { private: true },
    },
    {
      path: '/coach/review/:id',
      component: () => import('../features/coaching/ReviewPage.vue'),
      meta: { private: true },
    },
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
      path: '/coach/clients/:id/progress',
      component: () => import('../features/ongoing/ProgressPage.vue'),
      meta: { private: true },
    },
    {
      path: '/checkins',
      component: () => import('../features/ongoing/RequestsPage.vue'),
      meta: { private: true },
    },
    {
      path: '/coach/checkins',
      component: () => import('../features/ongoing/RequestsPage.vue'),
      meta: { private: true },
    },
    {
      path: '/checkins/:id',
      component: () => import('../features/ongoing/ResponsePage.vue'),
      meta: { private: true },
    },
    {
      path: '/coach/checkins/:id',
      component: () => import('../features/ongoing/ResponsePage.vue'),
      meta: { private: true },
    },
    {
      path: '/coach/forms/:id',
      component: () => import('../features/ongoing/FormEditor.vue'),
      meta: { private: true },
    },
    {
      path: '/messages/:id?',
      component: () => import('../features/ongoing/MessagesPage.vue'),
      meta: { private: true },
    },
    {
      path: '/coach/messages/:id?',
      component: () => import('../features/ongoing/MessagesPage.vue'),
      meta: { private: true },
    },
    { path: '/local-preview', component: () => import('../features/account/LocalPreview.vue') },
    { path: '/help', component: () => import('../features/account/HelpPage.vue') },
    { path: '/privacy', component: () => import('../features/public/PrivacyPage.vue') },
    { path: '/privacy-policy', redirect: '/privacy' },
    { path: '/privacy_policy', redirect: '/privacy' },
    { path: '/:pathMatch(.*)*', component: () => import('../features/public/NotFound.vue') },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, top: 100 }
    if (to.path === from.path) return
    return { top: 0 }
  },
})
router.beforeEach(async (to) => {
  await ready()
  if (to.meta.private && !user.value) return { path: '/login', query: { next: to.fullPath } }
})
export const safeNext = (value: unknown, fallback = '/today') =>
  typeof value === 'string' &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.includes('\\')
    ? value
    : fallback
router.afterEach((_to, from) => {
  if (from.matched.length)
    void nextTick(() => document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true }))
})
export default router
