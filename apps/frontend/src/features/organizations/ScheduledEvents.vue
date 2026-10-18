<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { request } from '../../lib/backend'
import { language as l, dateLabel, errorMessage } from '../../lib/i18n'
import OrganizationNav from './OrganizationNav.vue'
import PageState from '../../components/PageState.vue'
import type { CalendarEvent } from './service-types'
const route = useRoute(),
  router = useRouter()
const workspace = String(route.params.workspace),
  view = String(route.params.view)
const base = `/organization/${workspace}/${view}`
type Page = {
  items: (Pick<
    CalendarEvent,
    'id' | 'title' | 'kind' | 'state' | 'starts_at' | 'ends_at' | 'timezone' | 'location'
  > & { athlete_count: number })[]
  total: number
  next: number | null
}
const data = ref<Page>(),
  loading = ref(false),
  error = ref('')
const search = ref(String(route.query.search || '')),
  kind = ref(String(route.query.kind || 'all')),
  state = ref(String(route.query.state || 'all')),
  offset = ref(0)
let generation = 0,
  disposed = false
const stateLabel = (value: string) =>
  value === 'completed'
    ? l('Completed', 'مكتمل')
    : value === 'cancelled'
      ? l('Cancelled', 'ملغى')
      : l('Scheduled', 'مجدول')
async function load() {
  const stamp = ++generation
  loading.value = true
  error.value = ''
  const page = Math.max(0, Number(route.query.offset) || 0)
  const query = new URLSearchParams({
    view,
    kind: String(route.query.kind || 'all'),
    state: String(route.query.state || 'all'),
    search: String(route.query.search || ''),
    offset: String(page),
  })
  try {
    const result = await request<Page>(`/v1/workspaces/${workspace}/scheduled-events?${query}`)
    if (disposed || stamp !== generation) return
    data.value = result
    offset.value = page
  } catch (e) {
    if (!disposed && stamp === generation) {
      error.value = errorMessage(e)
      if ((e as { statusCode?: number }).statusCode === 403) data.value = undefined
    }
  } finally {
    if (!disposed && stamp === generation) loading.value = false
  }
}
function navigate(page = 0) {
  return router.push({
    query: {
      ...(search.value.trim() ? { search: search.value.trim() } : {}),
      ...(kind.value !== 'all' ? { kind: kind.value } : {}),
      ...(state.value !== 'all' ? { state: state.value } : {}),
      ...(page ? { offset: page } : {}),
    },
  })
}
watch(
  () => route.fullPath,
  () => {
    search.value = String(route.query.search || '')
    kind.value = String(route.query.kind || 'all')
    state.value = String(route.query.state || 'all')
    void load()
  },
)
onMounted(load)
onUnmounted(() => {
  disposed = true
  generation++
})
</script>
<template>
  <OrganizationNav />
  <div class="container page scheduled-events-page">
    <header class="work-heading">
      <div>
        <p class="overline">{{ l('Scheduled activity', 'النشاط المجدول') }}</p>
        <h1>{{ l('Events & assessments', 'المواعيد والتقييمات') }}</h1>
        <p>
          {{
            l(
              'Group training and assessments, newest scheduled date first. Open an event for attendance, results and correction history.',
              'التدريبات الجماعية والتقييمات، بدءاً بأحدث موعد. افتح الموعد لعرض الحضور والنتائج وتاريخ التصحيحات.',
            )
          }}
        </p>
      </div>
      <div class="actions">
        <RouterLink class="button secondary" :to="base + '/calendar'">{{
          l('Calendar', 'التقويم')
        }}</RouterLink
        ><RouterLink class="button" :to="base + '/calendar/new'">{{
          l('Schedule event', 'جدولة موعد')
        }}</RouterLink>
      </div>
    </header>
    <form class="event-filters" @submit.prevent="navigate()">
      <label
        >{{ l('Search events', 'البحث في المواعيد') }}<input v-model="search" type="search"
      /></label>
      <label
        >{{ l('Activity type', 'نوع النشاط')
        }}<select v-model="kind" @change="navigate()">
          <option value="all">{{ l('All activities', 'جميع الأنشطة') }}</option>
          <option value="training">{{ l('Training sessions', 'حصص التدريب') }}</option>
          <option value="assessment">{{ l('Assessments', 'التقييمات') }}</option>
        </select></label
      >
      <label
        >{{ l('Status', 'الحالة')
        }}<select v-model="state" @change="navigate()">
          <option value="all">{{ l('All statuses', 'جميع الحالات') }}</option>
          <option
            v-for="value in ['scheduled', 'completed', 'cancelled']"
            :key="value"
            :value="value"
          >
            {{ stateLabel(value) }}
          </option>
        </select></label
      >
      <button class="button secondary" :disabled="loading">{{ l('Search', 'بحث') }}</button>
    </form>
    <p v-if="loading && data" role="status" class="small-print">
      {{ l('Updating events…', 'جارٍ تحديث المواعيد…') }}
    </p>
    <p v-if="error && data" role="alert">
      {{ error }}
      <button class="text-link" @click="load">{{ l('Retry', 'إعادة المحاولة') }}</button>
    </p>
    <PageState :loading="loading && !data" :error="!data ? error : ''" @retry="load">
      <template v-if="data">
        <p class="small-print">{{ data.total }} {{ l('matching events', 'مواعيد مطابقة') }}</p>
        <section v-if="!data.items.length" class="empty-state panel">
          <h2>{{ l('No events match this view.', 'لا توجد مواعيد مطابقة لهذا العرض.') }}</h2>
          <p>
            {{
              l(
                'Adjust the search or filters, or schedule a training session or assessment.',
                'عدّل البحث أو المرشحات، أو جدول حصة تدريب أو تقييماً.',
              )
            }}
          </p>
        </section>
        <ol v-else class="event-list">
          <li
            v-for="event in data.items"
            :key="event.id"
            :class="{ assessment: event.kind === 'assessment' }"
          >
            <div>
              <p class="overline">
                {{
                  event.kind === 'assessment'
                    ? l('Assessment', 'تقييم')
                    : l('Training session', 'حصة تدريب')
                }}
              </p>
              <h2 dir="auto">
                <RouterLink :to="base + '/calendar/' + event.id">{{ event.title }}</RouterLink>
              </h2>
              <p>{{ dateLabel(event.starts_at) }} — {{ dateLabel(event.ends_at) }}</p>
              <p class="small-print">
                {{ event.athlete_count }} {{ l('athletes', 'رياضيين')
                }}<span v-if="event.location" dir="auto"> · {{ event.location }}</span>
              </p>
            </div>
            <span class="tag">{{ stateLabel(event.state) }}</span>
          </li>
        </ol>
        <nav
          v-if="data.total > 24 || offset"
          class="event-pagination"
          :aria-label="l('Event pages', 'صفحات المواعيد')"
        >
          <button
            class="button secondary"
            :disabled="loading || !offset"
            @click="navigate(Math.max(0, offset - 24))"
          >
            {{ l('Previous', 'السابق') }}</button
          ><span
            >{{ Math.min(offset + 1, data.total) }}–{{ Math.min(offset + 24, data.total) }} /
            {{ data.total }}</span
          ><button
            class="button secondary"
            :disabled="loading || data.next === null"
            @click="navigate(data.next!)"
          >
            {{ l('Next', 'التالي') }}
          </button>
        </nav>
      </template>
    </PageState>
    <p class="small-print">
      <RouterLink :to="base + '/session-history'">{{
        l(
          'Looking for athletes’ recorded workouts? Open Session history.',
          'هل تبحث عن تمارين الرياضيين المسجلة؟ افتح سجل الحصص.',
        )
      }}</RouterLink>
    </p>
  </div>
</template>
<style scoped>
.event-filters {
  display: grid;
  grid-template-columns: minmax(0, 2fr) repeat(2, minmax(0, 1fr)) auto;
  gap: 16px;
  align-items: end;
}
.event-filters label {
  min-width: 0;
  margin: 0;
}
.event-list {
  list-style: none;
  margin: 20px 0;
  padding: 0;
  display: grid;
  gap: 16px;
}
.event-list li {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid var(--line);
  border-inline-start: 4px solid var(--accent);
  border-radius: 16px;
  padding: 22px;
  background: var(--surface);
}
.event-list li.assessment {
  background: var(--surface-soft);
}
.event-list li > div {
  min-width: 0;
  overflow-wrap: anywhere;
}
.event-list h2 {
  font-size: 1.15rem;
  margin: 4px 0 12px;
}
.event-list .tag {
  flex-shrink: 0;
}
.event-pagination {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-block: 24px;
}
@media (max-width: 700px) {
  .event-filters {
    grid-template-columns: minmax(0, 1fr);
  }
  .event-list li {
    flex-direction: column;
    padding: 18px;
  }
}
</style>
