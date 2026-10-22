<script setup lang="ts">
import { institutionContext } from '../../app/institution'

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { contexts } from '../../app/auth'
import { language as l } from '../../lib/i18n'
import './institution.css'
const route = useRoute(),
  router = useRouter()
const base = computed(() => '')
const allowed = computed(() => contexts.value.some((c) => c.kind === 'organization'))
const items = computed(() => [
  { path: '/dashboard', name: l('Overview', 'نظرة عامة') },
  ...(institutionContext().view === 'trainee'
    ? []
    : [{ path: '/people', name: l('People', 'الأشخاص') }]),
  { path: '/plans', name: l('Programs', 'البرامج') },
  {
    path: '/training',
    name:
      institutionContext().view === 'trainee'
        ? l('Training', 'التدريب')
        : l('Athlete plans', 'خطط الرياضيين'),
  },
  { path: '/workouts', name: l('Workout history', 'سجل التمارين') },
  {
    path: '/nutrition',
    name:
      institutionContext().view === 'trainee'
        ? l('Nutrition', 'التغذية')
        : l('Nutrition plans', 'خطط التغذية'),
  },
  { path: '/injuries', name: l('Injury status', 'حالة الإصابة') },
  { path: '/messages', name: l('Messages', 'الرسائل') },
  { path: '/schedule', name: l('Schedule', 'الجدول') },
  ...(institutionContext().view !== 'admin'
    ? [{ path: '/feedback', name: l('My feedback', 'تقييماتي') }]
    : []),
  ...(institutionContext().view === 'trainee'
    ? []
    : [
        { path: '/analytics', name: l('Analytics', 'التحليلات') },
        { path: '/groups', name: l('Groups', 'المجموعات') },
        { path: '/assessment-templates', name: l('Assessment templates', 'قوالب التقييم') },
      ]),
  ...(institutionContext().view === 'trainee'
    ? []
    : [
        { path: '/exercises', name: l('Exercises', 'التمارين') },
        { path: '/resources', name: l('Resources', 'الموارد') },
      ]),
  ...(institutionContext().view === 'admin'
    ? [
        { path: '/activity', name: l('Activity', 'النشاط') },
        { path: '/institution-settings', name: l('Settings', 'الإعدادات') },
      ]
    : []),
])
const navPath = computed(() =>
  route.path
    .replace('/events', '/schedule')
    .replace('/deliver/', '/plans/')
    .replace('/review/', '/workouts/')
    .replace('/assessments/', '/training/'),
)
const secondary = new Set([
  '/groups',
  '/assessment-templates',
  '/exercises',
  '/resources',
  '/activity',
  '/institution-settings',
])
const current = computed(
  () =>
    items.value
      .filter(
        (i) =>
          navPath.value === base.value + i.path ||
          (i.path && navPath.value.startsWith(base.value + i.path + '/')),
      )
      .at(-1)?.path || '',
)
</script>
<template>
  <nav
    v-if="allowed"
    class="institution-nav container"
    :aria-label="l('Institution navigation', 'تنقل المؤسسة')"
  >
    <div class="organization-nav-links">
      <RouterLink
        v-for="item in items.filter((item) => !secondary.has(item.path))"
        :key="item.path"
        :to="base + item.path"
        :class="{ selected: current === item.path }"
        >{{ item.name }}</RouterLink
      >
      <details v-if="items.some((item) => secondary.has(item.path))" class="organization-tools">
        <summary :class="{ selected: secondary.has(current) }">{{ l('More', 'المزيد') }}</summary>
        <div>
          <RouterLink
            v-for="item in items.filter((item) => secondary.has(item.path))"
            :key="item.path"
            :to="base + item.path"
            :class="{ selected: current === item.path }"
            >{{ item.name }}</RouterLink
          >
        </div>
      </details>
    </div>
    <label class="organization-nav-select"
      ><span class="sr-only">{{ l('Institution section', 'قسم المؤسسة') }}</span
      ><select
        :value="current"
        @change="router.push(base + ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="item in items" :key="item.path" :value="item.path">{{ item.name }}</option>
      </select></label
    >
  </nav>
</template>

<style scoped>
.organization-tools {
  position: relative;
}
.organization-tools summary {
  padding-block: 16px;
  font-size: 0.85rem;
  min-height: 54px;
  cursor: pointer;
}
.organization-tools summary.selected {
  color: var(--accent);
  font-weight: 700;
}
.organization-tools > div {
  position: absolute;
  inset-inline-end: 0;
  top: 100%;
  z-index: 20;
  min-width: 220px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px;
  box-shadow: 0 8px 24px #0002;
}
.organization-tools a {
  display: block;
  padding: 12px 16px;
  border: 0;
}
.organization-tools a:hover {
  background: var(--tint);
}
</style>
