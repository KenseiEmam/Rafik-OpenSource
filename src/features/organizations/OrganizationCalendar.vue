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
    <div class="actions">
      <label
        >{{ l('Calendar view', 'عرض التقويم')
        }}<select
          :aria-label="l('Calendar view', 'عرض التقويم')"
          v-model="mode"
          @change="changeMode"
        >
          <option value="month">{{ l('Month', 'شهر') }}</option>
          <option value="week">{{ l('Week agenda', 'جدول الأسبوع') }}</option>
        </select></label
      >
    </div>
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
            : l('Booked sessions & events', 'الحصص والمواعيد المحجوزة')
        }}
      </h2>
      <button v-if="selectedDay" class="text-link" @click="selectedDay = ''">
        {{ l('Show all dates', 'عرض كل التواريخ') }}
      </button>
    </div>
    <PageState :loading="loading" :error="error" @retry="load()"
      ><section v-if="!visible.length" class="empty-state panel">
        <h2>{{ l('No bookings for these dates', 'لا توجد حجوزات لهذه التواريخ') }}</h2>
        <p>
          {{ l('Choose another day or schedule a session.', 'اختر يوماً آخر أو جدول حصة.') }}
        </p>
      </section>
      <ol v-else class="agenda-list">
        <li v-for="e in visible" :key="e.id">
          <RouterLink :to="base + '/calendar/' + e.id + '?from=' + start" class="agenda-event"
            ><div class="agenda-time">
              <strong>{{ date(e.starts_at) }}</strong
              ><span>{{ time(e.starts_at) }} — {{ time(e.ends_at) }}</span>
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
            <span class="event-state"
              >{{
                e.state === 'completed'
                  ? l('Completed', 'مكتمل')
                  : e.state === 'cancelled'
                    ? l('Cancelled', 'ملغي')
                    : l('Open event', 'فتح الموعد')
              }}
              ↗</span
            ></RouterLink
          >
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
.agenda-list {
  list-style: none;
  padding: 0;
  margin: 24px 0;
}
.agenda-event {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) auto;
  align-items: center;
  gap: 24px;
  padding: 24px 0;
  border-block-start: 1px solid var(--line);
}
.agenda-time {
  display: grid;
  gap: 8px;
  font-size: 0.85rem;
}
.agenda-time span,
.event-state {
  color: var(--muted);
  font-size: 0.85rem;
}
.agenda-content {
  min-width: 0;
  overflow-wrap: anywhere;
}
.agenda-content h2 {
  font-size: 1.2rem;
  margin: 8px 0;
}
.agenda-content p {
  margin: 4px 0;
}
.attention-label {
  color: var(--accent);
  font-weight: 650;
}
@media (max-width: 650px) {
  .agenda-event {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
  .agenda-time {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
  }
  .calendar-controls {
    gap: 10px;
  }
  .calendar-controls label {
    order: -1;
    flex-basis: 100%;
  }
  .calendar-controls button {
    flex: 1;
    font-size: 0.8rem;
  }
}
</style>
