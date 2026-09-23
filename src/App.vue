<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WorkspaceNav from './features/workspace/WorkspaceNav.vue'
import { PhArrowUpRight, PhTranslate, PhCaretDown, PhBell } from '@phosphor-icons/vue'
import { user, profile, ready, contexts } from './app/auth'
import { language, locale, t } from './lib/i18n'
import { localPreview } from './lib/backend'
import { syncPending } from './lib/training'
const route = useRoute()
const router = useRouter()
watch(
  () => route.path,
  (path) => {
    if (
      user.value &&
      (path.startsWith('/organization/') ||
        path.startsWith('/coach') ||
        ['/today', '/history', '/progress', '/messages', '/checkins', '/more'].some((p) =>
          path.startsWith(p),
        ))
    )
      localStorage.setItem(
        'rafik.workspace:' + user.value.id,
        path.startsWith('/organization/')
          ? path.split('/').slice(0, 4).join('/')
          : path.startsWith('/coach')
            ? '/coach'
            : '/today',
      )
  },
)
const currentContext = computed(
  () =>
    [...contexts.value]
      .sort((a, b) => b.path.length - a.path.length)
      .find((c) => route.path === c.path || route.path.startsWith(c.path + '/')) ||
    contexts.value.find(
      (c) => c.path === localStorage.getItem('rafik.workspace:' + user.value?.id),
    ) ||
    contexts.value[0],
)
const coaching = computed(() => route.path.startsWith('/coach'))
const messaging = computed(
  () =>
    /^(\/coach)?\/messages(\/|$)/.test(route.path) ||
    /^\/organization\/[^/]+\/[^/]+\/messages(\/|$)/.test(route.path),
)
const focused = computed(() => route.path.startsWith('/workout/'))
const product = computed(
  () =>
    user.value &&
    !['/', '/login', '/routine', '/privacy', '/help', '/local-preview'].includes(route.path) &&
    !route.path.startsWith('/invite/') &&
    !route.path.startsWith('/team-invite/') &&
    !route.path.startsWith('/organization-invite/'),
)
const theme = ref(localStorage.getItem('rafik.theme') || 'system')
function setTheme() {
  localStorage.setItem('rafik.theme', theme.value)
  document.documentElement.dataset.theme = theme.value
}
watch(theme, setTheme, { immediate: true })
const online = () => {
  if (user.value) void syncPending(user.value.id)
}
onMounted(async () => {
  await ready()
  window.addEventListener('online', online)
  online()
})
onUnmounted(() => window.removeEventListener('online', online))
</script>
<template>
  <a class="skip-link" href="#main">{{ language('Skip to content', 'انتقل إلى المحتوى') }}</a>
  <header class="site-header" :class="{ compact: focused, 'workspace-header': user && !focused }">
    <div class="header-inner">
      <RouterLink
        class="brand"
        :to="user ? currentContext?.path || '/today' : '/'"
        aria-label="Rafik home"
        ><img src="/brand/rafik.png" alt="" width="38" height="38" /><span
          >rafik<span class="brand-period">.</span></span
        ></RouterLink
      >
      <label v-if="user && !focused" class="workspace-switch"
        ><span class="sr-only">{{ language('Workspace', 'مساحة العمل') }}</span
        ><select
          :aria-label="language('Workspace', 'مساحة العمل')"
          :value="route.path === '/workspaces' ? '/workspaces' : currentContext?.path"
          @change="router.push(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="context in contexts" :key="context.id" :value="context.path">
            {{
              context.kind === 'personal'
                ? t('training')
                : context.kind === 'independent'
                  ? t('coaching')
                  : context.name +
                    ' · ' +
                    language(
                      { admin: 'Administration', trainer: 'Coaching', trainee: 'My training' }[
                        context.role
                      ],
                      { admin: 'الإدارة', trainer: 'التدريب', trainee: 'تدريبي' }[context.role],
                    )
            }}
          </option>
          <option value="/workspaces">
            {{ language('Manage workspaces', 'إدارة مساحات العمل') }}
          </option>
        </select></label
      >
      <nav
        v-else-if="!focused"
        class="main-nav"
        :aria-label="language('Main navigation', 'التنقل الرئيسي')"
      >
        <RouterLink to="/routine">{{ language('Try a workout', 'جرّب تمريناً') }}</RouterLink
        ><RouterLink to="/#how-it-works">{{ language('How it works', 'كيف يعمل') }}</RouterLink>
      </nav>
      <div class="header-actions">
        <button
          class="icon-button language-button"
          @click="locale = locale === 'en' ? 'ar' : 'en'"
          :aria-label="language('Switch to Arabic', 'التبديل إلى الإنجليزية')"
        >
          <PhTranslate :size="20" aria-hidden="true" /><span>{{
            locale === 'en' ? 'العربية' : 'EN'
          }}</span>
        </button>
        <RouterLink
          v-if="user && !focused"
          to="/notifications"
          class="icon-button notification-entry"
          :aria-label="language('Notifications', 'الإشعارات')"
          :title="language('Notifications', 'الإشعارات')"
          ><PhBell :size="20" aria-hidden="true"
        /></RouterLink>
        <RouterLink v-if="user && !focused" class="account-link" to="/settings"
          ><span class="avatar small">{{ (profile?.display_name || 'R').slice(0, 1) }}</span
          ><span class="account-name">{{
            profile?.display_name?.split(' ')[0] || t('settings')
          }}</span
          ><PhCaretDown :size="14" aria-hidden="true"
        /></RouterLink>
        <RouterLink v-if="!user && !focused" class="button small secondary" to="/login"
          >{{ t('signIn') }}<PhArrowUpRight :size="17" aria-hidden="true"
        /></RouterLink>
      </div>
    </div>
  </header>
  <WorkspaceNav
    v-if="
      product &&
      !focused &&
      !route.path.startsWith('/organization/') &&
      !['/workspaces', '/notifications'].includes(route.path)
    "
  />
  <main id="main" :class="{ 'messages-main': messaging }" tabindex="-1">
    <RouterView
      :key="
        route.path +
        (route.path.endsWith('/plans/new')
          ? JSON.stringify([route.query.source, route.query.member])
          : '')
      "
    />
  </main>
  <footer v-if="!focused" class="footer container">
    <span class="footer-brand">{{
      language('A little clarity. Every session.', 'وضوح أكثر. في كل حصة.')
    }}</span>
    <nav :aria-label="language('Footer', 'أسفل الصفحة')">
      <RouterLink to="/help">{{ t('help') }}</RouterLink
      ><RouterLink to="/privacy">{{ t('privacy') }}</RouterLink
      ><RouterLink v-if="localPreview" to="/local-preview">{{ t('localPreview') }}</RouterLink>
    </nav>
    <label class="theme-select"
      ><span class="sr-only">{{ language('Appearance', 'المظهر') }}</span
      ><select v-model="theme">
        <option value="system">{{ language('System theme', 'مظهر النظام') }}</option>
        <option value="light">{{ language('Light', 'فاتح') }}</option>
        <option value="dark">{{ language('Dark', 'داكن') }}</option>
      </select></label
    >
  </footer>
</template>
