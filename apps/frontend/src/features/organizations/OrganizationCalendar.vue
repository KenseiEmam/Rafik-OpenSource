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
const weekDays = computed(() =>
  Array.from({ length: 7 }, (_, index) => addDays(start.value, index)),
)
const bookingsOn = (day: string) =>
  items.value.filter(
    (event) =>
      (showCancelled.value || event.state !== 'cancelled') &&
      localDate(zone, new Date(event.starts_at)) === day,
  ).length
const date = (value: string) =>
  new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-AE' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: zone,
  }).format(new Date(value))
const time = (value: string) =>
  new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-AE' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: zone,
  }).format(new Date(value))
const missingStaff = (e: CalendarEvent) =>
  !e.people?.some((p) => p.duty === 'staff' && p.active && p.roles.includes('trainer'))
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
  <div class="container page institution-calendar">
    <header class="work-heading">
      <div>
        <p class="overline">{{ l('Plan the training day', 'خطّط ليوم التدريب') }}</p>
        <h1>{{ l('Calendar', 'التقويم') }}</h1>
        <p>
          {{
            view === 'trainee'
              ? l('Your institution sessions and assessments.', 'حصصك وتقييماتك في المؤسسة.')
              : l(
                  'Coordinate people, review attendance, and keep assessments moving.',
                  'نسّق الأشخاص وراجع الحضور وتابع التقييمات.',
                )
          }}
        </p>
      </div>
      <div class="actions">
        <RouterLink v-if="view !== 'trainee'" class="button secondary" :to="base + '/events'">{{
          l('Events & assessments', 'المواعيد والتقييمات')
        }}</RouterLink>
        <RouterLink v-if="view !== 'trainee'" class="button" :to="base + '/calendar/new'">{{
          l('Schedule event', 'جدولة موعد')
        }}</RouterLink>
      </div>
    </header>
    <form class="calendar-toolbar" @submit.prevent="load()">
      <label class="view-control">
        <span>{{ l('View', 'العرض') }}</span>
        <select :aria-label="l('Calendar view', 'عرض التقويم')" v-model="mode" @change="changeMode">
          <option value="month">{{ l('Month', 'شهر') }}</option>
          <option value="week">{{ l('Week agenda', 'جدول الأسبوع') }}</option>
        </select>
      </label>
      <button type="button" class="button secondary" @click="move(-7)" :disabled="loading">
        {{
          mode === 'month'
            ? l('Previous month', 'الشهر السابق')
            : l('Previous week', 'الأسبوع السابق')
        }}
      </button>
      <label class="date-control">
        <span>{{ mode === 'month' ? l('Month', 'الشهر') : l('Week starting', 'أسبوع يبدأ') }}</span>
        <input type="date" v-model="start" required @change="changeMode()" />
      </label>
      <button type="button" class="button secondary" @click="move(7)" :disabled="loading">
        {{ mode === 'month' ? l('Next month', 'الشهر التالي') : l('Next week', 'الأسبوع التالي') }}
      </button>
      <label class="check-label">
        <input type="checkbox" v-model="showCancelled" />
        {{ l('Show cancelled', 'عرض الملغى') }}
      </label>
      <span class="date-range">{{ start }} — {{ end }} · {{ zone }}</span>
    </form>
    <div class="calendar-layout">
      <section class="calendar-surface" :aria-label="l('Calendar dates', 'تواريخ التقويم')">
        <MonthCalendar
          v-if="mode === 'month'"
          :month="start"
          :selected="selectedDay"
          :zone="zone"
          :events="items.filter((e) => showCancelled || e.state !== 'cancelled')"
          @select="selectedDay = $event"
        />
        <div v-else class="week-agenda">
          <button
            v-for="day in weekDays"
            :key="day"
            type="button"
            class="week-day"
            :class="{ selected: selectedDay === day }"
            :aria-pressed="selectedDay === day"
            @click="selectedDay = day"
          >
            <strong>{{ date(day + 'T12:00:00') }}</strong>
            <span>{{ bookingsOn(day) }} {{ l('bookings', 'حجوزات') }}</span>
          </button>
        </div>
        <p v-if="next !== null" class="notice">
          {{
            l(
              'More events are available in the booked list.',
              'تتوفر مواعيد أخرى في قائمة الحجوزات.',
            )
          }}
        </p>
      </section>
      <aside class="bookings-panel">
        <div class="section-heading">
          <div>
            <p class="overline">
              {{ selectedDay ? date(selectedDay + 'T12:00:00') : l('Schedule', 'الجدول') }}
            </p>
            <h2>{{ l('Booked sessions', 'الحصص المحجوزة') }}</h2>
          </div>
          <button v-if="selectedDay" class="text-link" @click="selectedDay = ''">
            {{ l('All dates', 'كل التواريخ') }}
          </button>
        </div>
        <PageState :loading="loading" :error="error" @retry="load()">
          <section v-if="!visible.length" class="empty-state panel">
            <h3>{{ l('No bookings for these dates', 'لا توجد حجوزات لهذه التواريخ') }}</h3>
            <p>
              {{ l('Choose another day or schedule a session.', 'اختر يوماً آخر أو جدول حصة.') }}
            </p>
          </section>
          <ol v-else class="agenda-list">
            <li
              v-for="e in visible"
              :key="e.id"
              :class="{ 'assessment-booking': e.kind === 'assessment' }"
            >
              <RouterLink :to="base + '/calendar/' + e.id + '?from=' + start" class="agenda-event">
                <div class="agenda-time">
                  <strong>{{ date(e.starts_at) }}</strong>
                  <span>{{ time(e.starts_at) }} — {{ time(e.ends_at) }}</span>
                </div>
                <div class="agenda-content">
                  <span class="tag">{{
                    e.kind === 'assessment' ? l('Assessment', 'تقييم') : l('Training', 'تدريب')
                  }}</span>
                  <h2>{{ e.title }}</h2>
                  <p>{{ e.location || l('Location to be agreed', 'الموقع يحدد لاحقاً') }}</p>
                  <p class="small-print">
                    {{
                      e.people
                        ?.filter((p) => p.duty === 'staff')
                        .map((p) => p.name)
                        .join(' · ')
                    }}
                  </p>
                  <p v-if="e.state === 'scheduled' && missingStaff(e)" class="attention-label">
                    {{ l('Trainer reassignment needed', 'يلزم إعادة تعيين المدرب') }}
                  </p>
                </div>
                <span class="event-state">
                  {{
                    e.state === 'completed'
                      ? l('Completed', 'مكتمل')
                      : e.state === 'cancelled'
                        ? l('Cancelled', 'ملغي')
                        : l('Open event', 'فتح الموعد')
                  }}
                  ↗
                </span>
              </RouterLink>
            </li>
          </ol>
          <button
            v-if="next !== null"
            class="button secondary load-more"
            :disabled="loading"
            @click="load(true)"
          >
            {{ l('Load more events', 'تحميل مواعيد أخرى') }}
          </button>
        </PageState>
      </aside>
    </div>
  </div>
</template>
<style scoped>
.institution-calendar {
  max-width: 1440px;
}
.calendar-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-block: 24px 16px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
}
.calendar-toolbar label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--muted);
  font-size: 0.82rem;
}
.calendar-toolbar select,
.calendar-toolbar input[type='date'] {
  min-height: 40px;
  max-width: 190px;
}
.date-range {
  margin-inline-start: auto;
  color: var(--muted);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
}
.calendar-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(280px, 1fr);
  align-items: start;
  gap: 24px;
}
.calendar-surface,
.bookings-panel {
  min-width: 0;
}
.bookings-panel {
  padding-inline-start: 20px;
  border-inline-start: 1px solid var(--line);
}
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.section-heading h2 {
  margin: 4px 0 0;
  font-size: 1.25rem;
}
.week-agenda {
  display: grid;
  gap: 8px;
}
.week-day {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  text-align: start;
  padding: 12px;
  background: var(--surface);
}
.week-day span {
  color: var(--muted);
  font-size: 0.85rem;
}
.week-day.selected {
  border-color: var(--accent);
  background: var(--tint);
}
.agenda-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.agenda-event {
  display: block;
  padding: 16px;
  margin-block: 10px;
  border: 1px solid var(--line);
  border-inline-start: 4px solid var(--accent);
  border-radius: 12px;
  background: var(--surface);
  color: inherit;
  text-decoration: none;
}
.assessment-booking .agenda-event {
  background: var(--surface-soft);
}
.agenda-event:hover {
  border-color: var(--accent);
}
.agenda-time {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  margin-bottom: 10px;
  font-size: 0.85rem;
}
.agenda-time span,
.event-state {
  color: var(--muted);
  font-size: 0.8rem;
}
.agenda-content {
  min-width: 0;
  overflow-wrap: anywhere;
}
.agenda-content h2 {
  font-size: 1.05rem;
  margin: 6px 0;
}
.agenda-content p {
  margin: 4px 0;
}
.attention-label {
  color: var(--accent);
  font-weight: 650;
}
.event-state {
  display: block;
  margin-top: 12px;
}
.load-more {
  width: 100%;
}
@media (max-width: 900px) {
  .calendar-layout {
    grid-template-columns: minmax(0, 1.5fr) minmax(240px, 1fr);
    gap: 16px;
  }
  .bookings-panel {
    padding-inline-start: 14px;
  }
}
@media (max-width: 720px) {
  .calendar-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .bookings-panel {
    padding: 18px 0 0;
    border-inline-start: 0;
    border-block-start: 1px solid var(--line);
  }
}
@media (max-width: 650px) {
  .calendar-toolbar {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    padding: 10px;
  }
  .calendar-toolbar .view-control,
  .calendar-toolbar .date-control,
  .date-range {
    grid-column: 1 / -1;
  }
  .calendar-toolbar label {
    justify-content: space-between;
  }
  .calendar-toolbar select,
  .calendar-toolbar input[type='date'] {
    max-width: 65%;
    flex: 1;
  }
  .calendar-toolbar button {
    min-width: 0;
    padding-inline: 8px;
    font-size: 0.78rem;
  }
  .date-range {
    margin-inline-start: 0;
  }
  .agenda-event {
    padding: 12px;
  }
  .agenda-content h2 {
    font-size: 1rem;
  }
}
@media (max-width: 380px) {
  .calendar-toolbar .check-label {
    grid-column: 1 / -1;
  }
  .week-day {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
