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
  PhCaretDown,
} from '@phosphor-icons/vue'
import { language as l } from '../../lib/i18n'
const props = defineProps<{ base: string; role: string }>()
const emit = defineEmits<{ navigate: [] }>()
const route = useRoute()
const organization = computed(() => props.base.startsWith('/organization'))
const groups = computed(() =>
  organization.value
    ? props.role === 'trainee'
      ? [
          {
            name: l('My training', 'تدريبي'),
            items: [
              ['', l('Overview', 'نظرة عامة'), PhHouse],
              ['/plans', l('Programs', 'البرامج'), PhClipboardText],
              ['/training', l('Training', 'التدريب'), PhBarbell],
              ['/calendar', l('Calendar', 'التقويم'), PhCalendarBlank],
            ],
          },
          {
            name: l('My support', 'الدعم الخاص بي'),
            items: [
              ['/nutrition', l('Nutrition', 'التغذية'), PhBowlFood],
              ['/injuries', l('Injury status', 'حالة الإصابة'), PhListChecks],
              ['/feedback', l('My feedback', 'تقييماتي'), PhClipboardText],
              ['/messages', l('Messages', 'الرسائل'), PhChatCircle],
            ],
          },
        ]
      : props.role === 'admin'
        ? [
            {
              name: l('Administration', 'الإدارة'),
              items: [
                ['', l('Overview', 'نظرة عامة'), PhHouse],
                ['/people', l('People & access', 'الأشخاص والصلاحيات'), PhUsers],
                ['/analytics', l('Analytics', 'التحليلات'), PhChartLine],
                ['/plans', l('Programs', 'البرامج'), PhClipboardText],
                ['/activity', l('Activity', 'النشاط'), PhClockCounterClockwise],
                ['/settings', l('Institution settings', 'إعدادات المؤسسة'), PhGear],
              ],
            },
            {
              name: l('Institution workspace', 'مساحة المؤسسة'),
              items: [
                ['/tasks', l('Tasks', 'المهام'), PhListChecks],
                ['/training', l('Training review', 'مراجعة التدريب'), PhBarbell],
                ['/nutrition', l('Nutrition', 'التغذية'), PhBowlFood],
                ['/calendar', l('Calendar', 'التقويم'), PhCalendarBlank],
                ['/messages', l('Messages', 'الرسائل'), PhChatCircle],
              ],
            },
            {
              name: l('Library', 'المكتبة'),
              items: [
                ['/exercises', l('Exercises', 'التمارين'), PhBarbell],
                ['/resources', l('Resources', 'الموارد'), PhFolder],
                ['/groups', l('Groups', 'المجموعات'), PhUsers],
                ['/assessment-templates', l('Assessment templates', 'قوالب التقييم'), PhListChecks],
              ],
            },
          ]
        : [
            {
              name: l('Workspace', 'مساحة العمل'),
              items: [
                ['', l('Overview', 'نظرة عامة'), PhHouse],
                ['/people', l('People', 'الأشخاص'), PhUsers],
                ['/tasks', l('Tasks', 'المهام'), PhListChecks],
                ['/training', l('Training', 'التدريب'), PhBarbell],
                ['/nutrition', l('Nutrition', 'التغذية'), PhBowlFood],
                ['/calendar', l('Calendar', 'التقويم'), PhCalendarBlank],
                ['/messages', l('Messages', 'الرسائل'), PhChatCircle],
                ['/analytics', l('Analytics', 'التحليلات'), PhChartLine],
                ...(props.role === 'trainer'
                  ? [['/feedback', l('My feedback', 'تقييماتي'), PhClipboardText]]
                  : []),
              ],
            },
            {
              name: l('Library', 'المكتبة'),
              items: [
                ['/plans', l('Programs', 'البرامج'), PhClipboardText],
                ['/exercises', l('Exercises', 'التمارين'), PhBarbell],
                ['/resources', l('Resources', 'الموارد'), PhFolder],
                ['/groups', l('Groups', 'المجموعات'), PhUsers],
                ['/assessment-templates', l('Assessment templates', 'قوالب التقييم'), PhListChecks],
              ],
            },
          ]
    : [
        {
          name: l('Workspace', 'مساحة العمل'),
          items: [
            ['', l('Today', 'اليوم'), PhHouse],
            ['/clients', l('Athletes', 'الرياضيون'), PhUsers],
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
function closeOtherGroups(event: Event) {
  const opened = event.currentTarget as HTMLDetailsElement
  if (!opened.open) return
  opened.parentElement
    ?.querySelectorAll<HTMLDetailsElement>('details[open]')
    .forEach((group) => {
      if (group !== opened) group.open = false
    })
}
</script>
<template>
  <nav class="dashboard-navigation" :aria-label="l('Workspace navigation', 'تنقل مساحة العمل')">
    <details
      v-for="group in groups"
      :key="group.name"
      :open="group.items.some((item) => selected(String(item[0])))"
      @toggle="closeOtherGroups"
    >
      <summary>
        <span>{{ group.name }}</span
        ><PhCaretDown :size="15" aria-hidden="true" />
      </summary>
      <div class="dashboard-navigation-links">
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
      </div>
    </details>
  </nav>
</template>
<style scoped>
.dashboard-navigation {
  display: grid;
  gap: 8px;
  padding: 16px 12px;
}
details {
  min-width: 0;
}
summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 8px 12px;
  border-radius: 7px;
  color: var(--muted);
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  list-style: none;
}
summary::-webkit-details-marker {
  display: none;
}
summary svg {
  flex: 0 0 auto;
  transition: transform 150ms ease;
}
details[open] > summary svg {
  transform: rotate(180deg);
}
.dashboard-navigation-links {
  display: grid;
  gap: 2px;
  padding-inline-start: 8px;
}
a {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 9px 12px;
  min-height: 36px;
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
