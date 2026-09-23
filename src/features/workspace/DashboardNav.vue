<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  PhHouse,
  PhUsers,
  PhBarbell,
  PhCalendarBlank,
  PhChartLine,
  PhChatCircle,
  PhClipboardText,
  PhListChecks,
  PhFolder,
  PhGear,
  PhLifebuoy,
  PhReceipt,
  PhBowlFood,
  PhClockCounterClockwise,
} from '@phosphor-icons/vue'
import { language as l } from '../../lib/i18n'
const props = defineProps<{ base: string; role: string }>()
const emit = defineEmits<{ navigate: [] }>()
const route = useRoute()
const organization = computed(() => props.base.startsWith('/organization'))
const groups = computed(() =>
  organization.value
    ? [
        {
          name: l('Workspace', 'مساحة العمل'),
          items: [
            ['', l('Overview', 'نظرة عامة'), PhHouse],
            ['/people', l('People', 'الأشخاص'), PhUsers],
            ['/training', l('Training', 'التدريب'), PhBarbell],
            ['/calendar', l('Calendar', 'التقويم'), PhCalendarBlank],
            ['/messages', l('Messages', 'الرسائل'), PhChatCircle],
            ['/analytics', l('Analytics', 'التحليلات'), PhChartLine],
          ],
        },
        {
          name: l('Library', 'المكتبة'),
          items: [
            ['/plans', l('Programs', 'البرامج'), PhClipboardText],
            ['/exercises', l('Exercises', 'التمارين'), PhBarbell],
            ['/groups', l('Groups', 'المجموعات'), PhUsers],
            ['/assessment-templates', l('Assessment templates', 'قوالب التقييم'), PhListChecks],
          ],
        },
        ...(props.role === 'admin'
          ? [
              {
                name: l('Administration', 'الإدارة'),
                items: [
                  ['/activity', l('Activity', 'النشاط'), PhClockCounterClockwise],
                  ['/settings', l('Settings', 'الإعدادات'), PhGear],
                ],
              },
            ]
          : []),
      ]
    : [
        {
          name: l('Workspace', 'مساحة العمل'),
          items: [
            ['', l('Today', 'اليوم'), PhHouse],
            ['/clients', l('Clients', 'المتدربون'), PhUsers],
            ['/appointments', l('Appointments', 'المواعيد'), PhCalendarBlank],
            ['/checkins', l('Check-ins', 'المتابعات'), PhListChecks],
            ['/messages', l('Messages', 'الرسائل'), PhChatCircle],
            ['/analytics', l('Analytics', 'التحليلات'), PhChartLine],
          ],
        },
        {
          name: l('Library & services', 'المكتبة والخدمات'),
          items: [
            ['/plans', l('Plans', 'الخطط'), PhClipboardText],
            ['/exercises', l('Exercises', 'التمارين'), PhBarbell],
            ['/nutrition', l('Nutrition', 'التغذية'), PhBowlFood],
            ['/resources', l('Resources', 'الموارد'), PhFolder],
          ],
        },
        {
          name: l('Practice', 'الممارسة'),
          items: [
            ['/teams', l('Teams', 'الفرق'), PhUsers],
            ['/business', l('Business', 'الاشتراك'), PhReceipt],
            ['/support', l('Support', 'الدعم'), PhLifebuoy],
          ],
        },
      ],
)
function selected(path: string) {
  const current = route.path
    .replace('/deliver/', '/plans/')
    .replace('/review/', organization.value ? '/training/' : '/clients/')
    .replace('/assessments/', '/training/')
  return path
    ? current === props.base + path || current.startsWith(props.base + path + '/')
    : current === props.base
}
</script>
<template>
  <nav class="dashboard-navigation" :aria-label="l('Workspace navigation', 'تنقل مساحة العمل')">
    <section v-for="group in groups" :key="group.name">
      <h2>{{ group.name }}</h2>
      <RouterLink
        v-for="item in group.items"
        :key="String(item[0])"
        :to="base + String(item[0])"
        :class="{ selected: selected(String(item[0])) }"
        :aria-current="selected(String(item[0])) ? 'page' : undefined"
        @click="emit('navigate')"
        ><component :is="item[2]" :size="18" aria-hidden="true" /><span>{{
          item[1]
        }}</span></RouterLink
      >
    </section>
  </nav>
</template>
<style scoped>
.dashboard-navigation {
  display: grid;
  gap: 22px;
  padding: 20px 12px;
}
section {
  min-width: 0;
}
h2 {
  margin: 0 12px 8px;
  color: var(--muted);
  font-size: 0.68rem;
  letter-spacing: 0.035em;
  font-weight: 650;
}
a {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 9px 12px;
  min-height: 40px;
  font-size: 0.8rem;
  border-radius: 7px;
  color: var(--muted);
}
a svg {
  flex-shrink: 0;
}
a:hover {
  background: var(--surface-soft);
  color: var(--ink);
}
a.selected {
  background: var(--tint);
  color: var(--accent);
  font-weight: 750;
}
a span {
  overflow-wrap: anywhere;
}
</style>
