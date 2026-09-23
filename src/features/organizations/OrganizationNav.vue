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
  ...(route.params.view === 'trainee' ? [] : [{ path: '/people', name: l('People', 'الأشخاص') }]),
  { path: '/plans', name: l('Programs', 'البرامج') },
  { path: '/training', name: l('Training', 'التدريب') },
  ...(route.params.view === 'trainee'
    ? []
    : [{ path: '/exercises', name: l('Exercises', 'التمارين') }]),
  ...(route.params.view === 'admin'
    ? [
        { path: '/activity', name: l('Activity', 'النشاط') },
        { path: '/settings', name: l('Settings', 'الإعدادات') },
      ]
    : []),
])
const navPath = computed(() =>
  route.path.replace('/deliver/', '/plans/').replace('/review/', '/training/'),
)
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
        v-for="item in items"
        :key="item.path"
        :to="base + item.path"
        :class="{ selected: current === item.path }"
        >{{ item.name }}</RouterLink
      >
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
