<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { contexts } from '../../app/auth'
import { language as l } from '../../lib/i18n'
import './organization.css'
const route = useRoute(),
  router = useRouter()
const base = computed(() => `/organization/${route.params.workspace}/${route.params.view}`)
const allowed = computed(() => contexts.value.some((c) => c.path === base.value))
const items = computed(() => [
  { path: '', name: l('Overview', 'نظرة عامة') },
  ...(route.params.view === 'trainee'
    ? []
    : [
        { path: '/people', name: l('People', 'الأشخاص') },
        { path: '/tasks', name: l('Tasks', 'المهام') },
      ]),
  { path: '/plans', name: l('Programs', 'البرامج') },
  { path: '/training', name: l('Training', 'التدريب') },
  { path: '/nutrition', name: l('Nutrition', 'التغذية') },
  { path: '/messages', name: l('Messages', 'الرسائل') },
  { path: '/calendar', name: l('Calendar', 'التقويم') },
  { path: '/packages', name: l('Packages', 'الباقات') },
  ...(route.params.view === 'trainee'
    ? []
    : [
        { path: '/analytics', name: l('Analytics', 'التحليلات') },
        { path: '/groups', name: l('Groups', 'المجموعات') },
        { path: '/assessment-templates', name: l('Assessment templates', 'قوالب التقييم') },
      ]),
  ...(route.params.view === 'trainee'
    ? []
    : [
        { path: '/exercises', name: l('Exercises', 'التمارين') },
        { path: '/resources', name: l('Resources', 'الموارد') },
      ]),
  ...(route.params.view === 'admin'
    ? [
        { path: '/activity', name: l('Activity', 'النشاط') },
        { path: '/settings', name: l('Settings', 'الإعدادات') },
      ]
    : []),
])
const navPath = computed(() =>
  route.path
    .replace('/deliver/', '/plans/')
    .replace('/review/', '/training/')
    .replace('/assessments/', '/training/'),
)
const secondary = new Set([
  '/groups',
  '/assessment-templates',
  '/exercises',
  '/resources',
  '/activity',
  '/settings',
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
    class="organization-nav container"
    :aria-label="l('Organization navigation', 'تنقل المؤسسة')"
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
      ><span class="sr-only">{{ l('Organization section', 'قسم المؤسسة') }}</span
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
