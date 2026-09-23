<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { language as l } from '../../lib/i18n'
const route = useRoute()
const coach = computed(() => route.path.startsWith('/coach'))
const links = computed(() =>
  coach.value
    ? [
        { path: '/coach', label: l('Today', 'اليوم'), primary: true, exact: true },
        { path: '/coach/clients', label: l('Clients', 'المتدربون'), primary: true },
        { path: '/coach/plans', label: l('Plans', 'الخطط') },
        { path: '/coach/exercises', label: l('Exercises', 'التمارين') },
        { path: '/coach/checkins', label: l('Check-ins', 'المتابعات') },
        { path: '/coach/messages', label: l('Messages', 'الرسائل'), primary: true },
      ]
    : [
        { path: '/today', label: l('Today', 'اليوم'), primary: true },
        { path: '/history', label: l('History', 'السجل') },
        { path: '/progress', label: l('Progress', 'التقدم'), primary: true },
        { path: '/checkins', label: l('Check-ins', 'المتابعات') },
        { path: '/messages', label: l('Messages', 'الرسائل'), primary: true },
      ],
)
const moreActive = computed(() =>
  /\/(more|analytics|nutrition|appointments|resources|teams|business|support)(\/|$)/.test(
    route.path,
  ),
)
</script>
<template>
  <div class="workspace-nav-wrap">
    <nav
      class="workspace-nav container"
      :aria-label="l('Workspace navigation', 'تنقل مساحة العمل')"
    >
      <RouterLink
        v-for="link in links"
        :key="link.path"
        :to="link.path"
        :class="{
          'workspace-secondary': !link.primary,
          selected: link.exact ? route.path === link.path : route.path.startsWith(link.path),
        }"
        >{{ link.label }}</RouterLink
      >
      <RouterLink :to="coach ? '/coach/more' : '/more'" :class="{ selected: moreActive }">{{
        l('More', 'المزيد')
      }}</RouterLink>
    </nav>
  </div>
</template>
