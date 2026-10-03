<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { profile } from '../../app/auth'
import { request } from '../../lib/backend'
import { localDate, addDays } from '../../lib/dates'
import { language as l, errorMessage, locale } from '../../lib/i18n'
import MonthCalendar from '../../components/MonthCalendar.vue'
import PageState from '../../components/PageState.vue'
import OrganizationNav from './OrganizationNav.vue'
import AgendaEvent from './AgendaEvent.vue'
import EmptyState from '../../components/EmptyState.vue'
import { PhCalendarBlank } from '@phosphor-icons/vue'
import type { CalendarEvent } from './service-types'
const route = useRoute(),
  router = useRouter(),
  id = String(route.params.workspace),
  view = String(route.params.view),
  base = `/organization/${id}/${view}`,
  zone = profile.value?.timezone || 'UTC'
const today = localDate(zone),
  start = ref(String(route.query.from || today.slice(0, 7) + '-01')),
  mode = ref('month'),
  selectedDay = ref(''),
  end = computed(() =>
    mode.value === 'week'
      ? addDays(start.value, 6)
      : new Date(Date.UTC(Number(start.value.slice(0, 4)), Number(start.value.slice(5, 7)), 0))
          .toISOString()
          .slice(0, 10),
  ),
  items = ref<CalendarEvent[]>([]),
  next = ref<number | null>(null),
  loading = ref(true),
  error = ref(''),
  showCancelled = ref(false)
const visible = computed(() =>
  items.value.filter(
    (e) =>
      (showCancelled.value || e.state !== 'cancelled') &&
      (!selectedDay.value || localDate(zone, new Date(e.starts_at)) === selectedDay.value),
  ),
)
const date = (value: string) =>
  new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-AE' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: zone,
  }).format(new Date(value))
const eventLink = (e: CalendarEvent) => base + '/calendar/' + e.id + '?from=' + start.value
// When the chosen range is empty, show the nearest real sessions instead of a dead end.
const nearby = ref<{ upcoming: CalendarEvent[]; recent: CalendarEvent[] }>({
  upcoming: [],
  recent: [],
})
async function loadNearby(current: number) {
  const later = addDays(end.value, 1) > today ? addDays(end.value, 1) : today
  const range = (from: string, to: string) =>
    request<{ items: CalendarEvent[] }>(
      `/v1/workspaces/${id}/calendar?view=${view}&from=${from}&to=${to}&zone=${encodeURIComponent(zone)}`,
    ).then((r) => r.items.filter((e) => e.state !== 'cancelled'))
  const [upcoming, recent] = await Promise.all([
    range(later, addDays(later, 30)).catch(() => []),
    start.value > addDays(today, -1)
      ? range(addDays(today, -30), addDays(today, -1)).catch(() => [])
      : Promise.resolve([] as CalendarEvent[]),
  ])
  if (current !== generation) return
  nearby.value = {
    upcoming: upcoming.filter((e) => Date.parse(e.ends_at) > Date.now()).slice(0, 4),
    recent: recent.reverse().slice(0, 4),
  }
}
let generation = 0
onUnmounted(() => generation++)
async function load(append = false) {
  const current = ++generation
  loading.value = true
  error.value = ''
  try {
    const result = await request<{ items: CalendarEvent[]; next: number | null }>(
      `/v1/workspaces/${id}/calendar?view=${view}&from=${start.value}&to=${end.value}&zone=${encodeURIComponent(zone)}&offset=${append ? next.value || 0 : 0}`,
    )
    if (current !== generation) return
    items.value = append ? [...items.value, ...result.items] : result.items
    next.value = result.next
    nearby.value = { upcoming: [], recent: [] }
    if (!append && !items.value.some((e) => e.state !== 'cancelled')) void loadNearby(current)
    await router.replace({ query: { from: start.value } })
  } catch (e) {
    if (current === generation) error.value = errorMessage(e)
  } finally {
    if (current === generation) loading.value = false
  }
}
function move(days: number) {
  selectedDay.value = ''
  start.value =
    mode.value === 'week'
      ? addDays(start.value, days)
      : new Date(
          Date.UTC(
            Number(start.value.slice(0, 4)),
            Number(start.value.slice(5, 7)) - 1 + Math.sign(days),
            1,
          ),
        )
          .toISOString()
          .slice(0, 10)
  void load()
}
function changeMode() {
  selectedDay.value = ''
  if (mode.value === 'month') start.value = start.value.slice(0, 7) + '-01'
  void load()
}
onMounted(() => load())
</script>
<template>
  <OrganizationNav />
  <div class="container page organization-calendar">
    <header class="work-heading">
      <div>
        <p class="overline">{{ l('Plan the training day', 'خطّط ليوم التدريب') }}</p>
        <h1>{{ l('Calendar', 'التقويم') }}</h1>
        <p>
          {{
            view === 'trainee'
              ? l('Your organization sessions and assessments.', 'حصصك وتقييماتك في المؤسسة.')
              : l(
                  'Coordinate people, review attendance, and keep assessments moving.',
                  'نسّق الأشخاص وراجع الحضور وتابع التقييمات.',
                )
          }}
        </p>
      </div>
      <RouterLink v-if="view !== 'trainee'" class="button" :to="base + '/calendar/new'">{{
        l('Schedule event', 'جدولة موعد')
      }}</RouterLink>
    </header>
    <form class="calendar-controls" @submit.prevent="load()">
      <button type="button" class="button secondary" @click="move(-7)" :disabled="loading">
        {{
          mode === 'month'
            ? l('Previous month', 'الشهر السابق')
            : l('Previous week', 'الأسبوع السابق')
        }}</button
      ><label
        >{{ mode === 'month' ? l('Month', 'الشهر') : l('Week starting', 'أسبوع يبدأ')
        }}<input type="date" v-model="start" required @change="changeMode()" /></label
      ><button type="button" class="button secondary" @click="move(7)" :disabled="loading">
        {{ mode === 'month' ? l('Next month', 'الشهر التالي') : l('Next week', 'الأسبوع التالي') }}
      </button>
      <label class="calendar-view-choice"
        >{{ l('Calendar view', 'عرض التقويم')
        }}<select
          v-model="mode"
          :aria-label="l('Calendar view', 'عرض التقويم')"
          :disabled="loading"
          @change="changeMode"
        >
          <option value="month">{{ l('Month', 'شهر') }}</option>
          <option value="week">{{ l('Week agenda', 'جدول الأسبوع') }}</option>
        </select></label
      >
    </form>
    <p class="small-print">{{ start }} — {{ end }} · {{ zone }}</p>
    <label class="check-label"
      ><input type="checkbox" v-model="showCancelled" />{{
        l('Show cancelled events', 'عرض المواعيد الملغاة')
      }}</label
    >
    <MonthCalendar
      v-if="mode === 'month'"
      :month="start"
      :selected="selectedDay"
      :zone="zone"
      :events="items.filter((e) => showCancelled || e.state !== 'cancelled')"
      @select="selectedDay = $event"
    />
    <p v-if="next !== null" class="notice">
      {{
        l(
          'Showing loaded events. Load more below to include the rest of this month.',
          'تظهر المواعيد المحمّلة. حمّل المزيد أدناه لعرض بقية الشهر.',
        )
      }}
    </p>
    <div class="section-heading">
      <h2>
        {{
          selectedDay
            ? date(selectedDay + 'T12:00:00')
            : l('Sessions & events', 'الجلسات والمواعيد')
        }}
        <span v-if="!loading" class="section-count">· {{ visible.length }}</span>
      </h2>
      <button v-if="selectedDay" class="text-link" @click="selectedDay = ''">
        {{ l('Show all dates', 'عرض كل التواريخ') }}
      </button>
    </div>
    <PageState :loading="loading" :error="error" @retry="load()"
      ><template v-if="!visible.length"
        ><EmptyState
          :icon="PhCalendarBlank"
          :title="
            selectedDay
              ? l('Nothing booked on this day', 'لا حجوزات في هذا اليوم')
              : mode === 'week'
                ? l('No sessions this week', 'لا جلسات هذا الأسبوع')
                : l('No sessions this month', 'لا جلسات هذا الشهر')
          "
          :text="
            view === 'trainee'
              ? l(
                  'When your organization books you into a session or assessment, it appears here.',
                  'عندما تحجز لك مؤسستك جلسة أو تقييماً سيظهر هنا.',
                )
              : l(
                  'Pick another date, or schedule a session for your trainees.',
                  'اختر تاريخاً آخر أو جدول جلسة لمتدربيك.',
                )
          "
          ><button v-if="selectedDay" class="button secondary small" @click="selectedDay = ''">
            {{ l('Show the whole month', 'عرض الشهر كاملاً') }}</button
          ><RouterLink
            v-if="view !== 'trainee'"
            class="button small"
            :to="base + '/calendar/new'"
            >{{ l('Schedule a session', 'جدولة جلسة') }}</RouterLink
          ></EmptyState
        >
        <section
          v-if="!selectedDay && (nearby.upcoming.length || nearby.recent.length)"
          class="calendar-nearby"
          :aria-label="l('Other sessions', 'جلسات أخرى')"
        >
          <template v-if="nearby.upcoming.length">
            <h3>{{ l('Next scheduled', 'المجدولة التالية') }}</h3>
            <ol class="agenda-list">
              <li v-for="e in nearby.upcoming" :key="e.id">
                <AgendaEvent :event="e" :zone="zone" :to="eventLink(e)" />
              </li>
            </ol>
          </template>
          <template v-if="nearby.recent.length">
            <h3>{{ l('Recently held', 'عُقدت مؤخراً') }}</h3>
            <ol class="agenda-list">
              <li v-for="e in nearby.recent" :key="e.id">
                <AgendaEvent :event="e" :zone="zone" :to="eventLink(e)" />
              </li>
            </ol>
          </template></section
      ></template>
      <ol v-else class="agenda-list">
        <li v-for="e in visible" :key="e.id">
          <AgendaEvent :event="e" :zone="zone" :to="eventLink(e)" />
        </li>
      </ol>
      <button v-if="next !== null" class="button secondary" :disabled="loading" @click="load(true)">
        {{ l('Load more events', 'تحميل مواعيد أخرى') }}
      </button></PageState
    >
  </div>
</template>
<style scoped>
.organization-calendar {
  max-width: 1180px;
}
.calendar-controls {
  display: flex;
  align-items: end;
  gap: 16px;
  flex-wrap: wrap;
  margin-block: 24px 12px;
}
.calendar-controls label {
  min-width: 0;
}
.calendar-view-choice {
  margin-inline-start: auto;
}
.calendar-view-choice select {
  min-width: 170px;
}
.agenda-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 24px;
}
.section-count {
  color: var(--muted);
  font-weight: 500;
}
.calendar-nearby h3 {
  font-size: 0.95rem;
  margin-top: 24px;
  color: var(--muted);
}
@media (max-width: 650px) {
  .calendar-controls {
    gap: 10px;
  }
  .calendar-controls label {
    order: -1;
    flex: 1 1 140px;
  }
  .calendar-view-choice {
    margin-inline-start: 0;
  }
  .calendar-view-choice select {
    min-width: 0;
  }
  .calendar-controls button {
    flex: 1;
    font-size: 0.8rem;
  }
}
</style>
