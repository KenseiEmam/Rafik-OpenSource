<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { PhArrowUpRight, PhTranslate, PhCaretDown } from '@phosphor-icons/vue'
import { user, profile, ready } from './app/auth'
import { language, locale, t } from './lib/i18n'
import { localPreview } from './lib/backend'
import { syncPending } from './lib/training'
const route = useRoute()
const coaching = computed(() => route.path.startsWith('/coach'))
const focused = computed(() => route.path.startsWith('/workout/'))
const product = computed(
  () =>
    user.value &&
    !['/', '/login', '/routine', '/privacy', '/help', '/local-preview'].includes(route.path) &&
    !route.path.startsWith('/invite/'),
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
  <header class="site-header" :class="{ compact: focused, 'has-account': user && !focused }">
    <div class="header-inner">
      <RouterLink class="brand" to="/" aria-label="Rafik home"
        ><img src="/brand/rafik.png" alt="" width="38" height="38" /><span
          >rafik<span class="brand-period">.</span></span
        ></RouterLink
      >
      <nav
        v-if="!focused"
        class="main-nav"
        :class="{ authenticated: !!user }"
        :aria-label="language('Main navigation', 'التنقل الرئيسي')"
      >
        <template v-if="user"
          ><RouterLink to="/today">{{ t('training') }}</RouterLink
          ><RouterLink to="/coach">{{ t('coaching') }}</RouterLink></template
        >
        <template v-else
          ><RouterLink to="/routine">{{ language('Try a workout', 'جرّب تمريناً') }}</RouterLink
          ><RouterLink to="/#how-it-works">{{
            language('How it works', 'كيف يعمل')
          }}</RouterLink></template
        >
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
  <div v-if="product && !focused" class="product-nav-wrap">
    <nav
      class="product-nav container"
      :aria-label="language('Workspace navigation', 'تنقل مساحة العمل')"
    >
      <template v-if="coaching"
        ><RouterLink
          to="/coach"
          exact-active-class="selected"
          :class="{ selected: route.path === '/coach' }"
          >{{ t('today') }}</RouterLink
        ><RouterLink
          to="/coach/clients"
          :class="{ selected: route.path.startsWith('/coach/clients') }"
          >{{ t('clients') }}</RouterLink
        ><RouterLink
          to="/coach/plans"
          :class="{ selected: route.path.startsWith('/coach/plans') }"
          >{{ t('plans') }}</RouterLink
        ><RouterLink
          to="/coach/exercises"
          :class="{ selected: route.path.startsWith('/coach/exercises') }"
          >{{ language('Exercises', 'التمارين') }}</RouterLink
        ><RouterLink
          to="/coach/checkins"
          :class="{
            selected:
              route.path.startsWith('/coach/checkins') || route.path.startsWith('/coach/forms'),
          }"
          >{{ language('Check-ins', 'المتابعات') }}</RouterLink
        ><RouterLink
          to="/coach/messages"
          :class="{ selected: route.path.startsWith('/coach/messages') }"
          >{{ language('Messages', 'الرسائل') }}</RouterLink
        ></template
      >
      <template v-else
        ><RouterLink to="/today" active-class="selected">{{ t('today') }}</RouterLink
        ><RouterLink to="/history" active-class="selected">{{ t('history') }}</RouterLink
        ><RouterLink to="/progress" active-class="selected">{{
          language('Progress', 'التقدم')
        }}</RouterLink
        ><RouterLink to="/checkins" active-class="selected">{{
          language('Check-ins', 'المتابعات')
        }}</RouterLink
        ><RouterLink to="/messages" active-class="selected">{{
          language('Messages', 'الرسائل')
        }}</RouterLink></template
      >
      <RouterLink
        :to="coaching ? '/coach/more' : '/more'"
        :class="{
          selected: /\/(more|nutrition|appointments|resources|teams|business|support)(\/|$)/.test(
            route.path,
          ),
        }"
        >{{ language('More', 'المزيد') }}</RouterLink
      >
      <span v-if="localPreview && user?.email?.endsWith('@rafik.test')" class="sample-label">{{
        t('sampleAccount')
      }}</span>
    </nav>
  </div>
  <main id="main" tabindex="-1"><RouterView :key="route.path" /></main>
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
