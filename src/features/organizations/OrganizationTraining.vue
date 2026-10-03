<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { user, profile } from '../../app/auth'
import { request } from '../../lib/backend'
import { language as l, errorMessage, dateLabel, locale } from '../../lib/i18n'
import type { Assignment, PlanVersion, Session, PlanDay } from '../../lib/domain'
import { programContext } from '../coaching/program-context'
import { startWorkout } from '../../lib/training'
import OrganizationNav from './OrganizationNav.vue'
import MemberPicker from './MemberPicker.vue'
import PageState from '../../components/PageState.vue'
import EmptyState from '../../components/EmptyState.vue'
import { PhBarbell } from '@phosphor-icons/vue'
const route = useRoute(),
  router = useRouter(),
  context = programContext(route)
type Training = {
  next: string | null
  self: string
  members: { id: string; name: string; active: boolean }[]
  assignments: (Assignment & { member_id: string; version: PlanVersion })[]
  sessions: (Session & { member_id: string })[]
}
const data = ref<Training>(),
  people = ref<Training['members']>([]),
  selected = ref(String(route.query.member || '')),
  loading = ref(true),
  error = ref(''),
  busy = ref(false),
  loadingMore = ref(false)
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: profile.value?.timezone || 'UTC',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date())
const current = computed(() =>
  data.value?.assignments.find(
    (a) =>
      a.state === 'active' &&
      a.member_id === (context.view === 'trainee' ? data.value?.self : selected.value),
  ),
)
const setsDone = (s: Session) => s.entries.filter((e) => e.completed).length
const name = (id: string) =>
  people.value.find((m) => m.id === id)?.name || l('Former member', 'عضو سابق')
function scheduled(day: PlanDay) {
  const a = current.value
  if (
    !a ||
    a.start_date.slice(0, 10) > today ||
    (a.end_date && a.end_date.slice(0, 10) < today) ||
    day.restDay
  )
    return false
  if (a.schedule_mode === 'flexible') return true
  const delta = Math.floor((Date.parse(today) - Date.parse(a.start_date.slice(0, 10))) / 86400000)
  return (
    delta % (7 * (a.version.prescription.cycleWeeks || 1)) ===
    ((day.week || 1) - 1) * 7 + (day.weekday || 0)
  )
}
let generation = 0
async function load(append = false) {
  const seq = ++generation
  if (append) loadingMore.value = true
  else loading.value = true
  error.value = ''
  try {
    const result = await request<Training>(
      `/v1/workspaces/${context.workspace}/delivery?history=true&view=${context.view}${append && data.value?.next ? '&before=' + data.value.next : ''}${selected.value ? '&member=' + selected.value : ''}`,
    )
    if (seq !== generation) return
    if (append && data.value) result.sessions = [...data.value.sessions, ...result.sessions]
    data.value = result
    people.value = Array.from(
      new Map([...people.value, ...result.members].map((m) => [m.id, m])).values(),
    )
  } catch (e) {
    if (!append) data.value = undefined
    error.value = errorMessage(e)
  } finally {
    if (seq === generation) {
      loading.value = false
      loadingMore.value = false
    }
  }
}
watch(selected, async () => {
  await router.replace({ query: selected.value ? { member: selected.value } : {} })
  await load()
})
async function begin(day: PlanDay) {
  if (!current.value) return
  busy.value = true
  error.value = ''
  try {
    const a = current.value,
      s = await startWorkout(
        day,
        a.version.title,
        a.version_id,
        user.value!.id,
        a.id,
        today,
        context.workspace,
      )
    await router.push(`/workout/${s.id}?workspace=${context.workspace}`)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
onMounted(() => load())
</script>
<template>
  <OrganizationNav />
  <div class="container page">
    <header class="work-heading">
      <div>
        <p class="overline">{{ l('Organization training', 'تدريب المؤسسة') }}</p>
        <h1>
          {{
            context.view === 'trainee'
              ? l('Your next session.', 'حصتك القادمة.')
              : l('Training, person by person.', 'التدريب، شخصاً بشخص.')
          }}
        </h1>
      </div>
      <RouterLink
        v-if="context.view !== 'trainee'"
        class="button secondary"
        :to="context.base + '/plans'"
        >{{ l('Choose a program', 'اختيار برنامج') }}</RouterLink
      >
    </header>
    <section v-if="context.view !== 'trainee'" class="training-filter panel">
      <div class="training-filter-heading">
        <h2>
          {{
            selected
              ? l('Showing', 'عرض') + ' · ' + name(selected)
              : l('Showing all trainees', 'عرض كل المتدربين')
          }}
        </h2>
        <button v-if="selected" type="button" class="text-link" @click="selected = ''">
          {{ l('Show everyone', 'عرض الجميع') }}
        </button>
      </div>
      <details>
        <summary>{{ l('Focus on one trainee', 'التركيز على متدرب واحد') }}</summary>
        <MemberPicker
          :workspace="context.workspace!"
          :view="context.view"
          single
          :model-value="selected ? [selected] : []"
          :label="l('Find a trainee', 'البحث عن متدرب')"
          @update:model-value="selected = $event[0] || ''"
          @options="
            people = Array.from(new Map([...people, ...$event].map((m) => [m.id, m])).values())
          "
        />
      </details>
    </section>
    <PageState :loading="loading" :error="!data ? error : ''" @retry="load()"
      ><p v-if="error && data" class="notice error" role="alert">{{ error }}</p>
      <template v-if="data"
        ><section v-if="current" class="panel">
          <p class="overline">{{ l('Current program', 'البرنامج الحالي') }}</p>
          <h2>{{ current.version.title }}</h2>
          <p>
            {{
              current.schedule_mode === 'cycle'
                ? l('Follow your program cycle', 'اتبع دورة البرنامج')
                : l('Choose a session that fits today', 'اختر الحصة المناسبة لليوم')
            }}
            · {{ current.start_date.slice(0, 10) }}
          </p>
          <div
            v-for="day in current.version.prescription.days"
            :key="day.id"
            class="organization-session-row"
          >
            <div>
              <strong>{{ locale === 'ar' ? day.nameAr || day.name : day.name }}</strong>
              <p>
                {{
                  day.restDay ? l('Recovery', 'تعافٍ') : day.minutes + ' ' + l('minutes', 'دقيقة')
                }}
                · {{ l('Week', 'الأسبوع') }} {{ day.week || 1 }} · {{ l('Day', 'اليوم') }}
                {{ (day.weekday || 0) + 1 }}
              </p>
            </div>
            <button
              v-if="context.view === 'trainee' && scheduled(day)"
              class="button small"
              :disabled="busy"
              @click="begin(day)"
            >
              {{ l('Open session', 'فتح الحصة') }}
            </button>
          </div>
          <RouterLink
            v-if="context.view !== 'trainee'"
            class="text-link"
            :to="
              context.base +
              '/plans/new?source=' +
              (current.version as PlanVersion & { program_id: string }).program_id +
              '&member=' +
              selected
            "
            >{{ l('Adapt this program', 'تكييف هذا البرنامج') }}</RouterLink
          >
        </section>
        <p v-else-if="context.view !== 'trainee' && !selected" class="subtle training-hint">
          {{
            l(
              'Focus on one trainee to see their current program and adapt it.',
              'ركّز على متدرب واحد لرؤية برنامجه الحالي وتكييفه.',
            )
          }}
        </p>
        <p v-else class="notice">
          {{
            l(
              'There is no active program yet. Your organization can assign one when it is ready.',
              'لا يوجد برنامج نشط بعد. يمكن لمؤسستك تعيينه عندما يصبح جاهزاً.',
            )
          }}
        </p>
        <section>
          <div class="heading-actions">
            <h2>
              {{ l('Recent sessions', 'الحصص الأخيرة') }}
              <span class="section-count"
                >· {{ data.sessions.length }}{{ data.next ? '+' : '' }}</span
              >
            </h2>
            <RouterLink
              v-if="selected || context.view === 'trainee'"
              class="text-link"
              :to="context.base + '/assessments/' + (selected || data.self)"
              >{{ l('Assessment history', 'سجل التقييمات') }} ↗</RouterLink
            >
          </div>
          <EmptyState
            v-if="!data.sessions.length"
            :icon="PhBarbell"
            :title="
              selected
                ? l('No sessions recorded for', 'لا حصص مسجلة لـ') + ' ' + name(selected)
                : l('No sessions recorded yet', 'لا حصص مسجلة بعد')
            "
            :text="
              context.view === 'trainee'
                ? l(
                    'Open a session from your current program. Once you record it, it appears here with your trainer’s feedback.',
                    'افتح حصة من برنامجك الحالي. بعد تسجيلها تظهر هنا مع ملاحظات مدربك.',
                  )
                : l(
                    'Sessions appear here as soon as trainees start recording workouts from an assigned program.',
                    'تظهر الحصص هنا بمجرد أن يبدأ المتدربون تسجيل تمارين من برنامج معيّن.',
                  )
            "
            ><button
              v-if="selected"
              type="button"
              class="button secondary small"
              @click="selected = ''"
            >
              {{ l('Show everyone’s sessions', 'عرض حصص الجميع') }}</button
            ><RouterLink
              v-if="context.view !== 'trainee'"
              class="button small"
              :to="context.base + '/plans'"
              >{{ l('Assign a program', 'تعيين برنامج') }}</RouterLink
            ></EmptyState
          >
          <ol v-else class="session-history">
            <li v-for="s in data.sessions" :key="s.id">
              <RouterLink
                class="organization-session-row"
                :to="
                  context.view === 'trainee'
                    ? '/workout/' + s.id + '?workspace=' + context.workspace
                    : context.base + '/review/' + s.id
                "
                ><div>
                  <strong dir="auto">{{
                    context.view === 'trainee' ? s.prescription.name : name(s.member_id)
                  }}</strong>
                  <p>
                    <span dir="auto">{{
                      context.view === 'trainee' ? s.title : s.prescription.name
                    }}</span>
                    · {{ dateLabel(s.completed_at || s.started_at) }} · {{ setsDone(s) }} /
                    {{ s.entries.length }} {{ l('sets', 'مجموعات') }}
                  </p>
                </div>
                <span class="session-status" :class="s.status"
                  >{{
                    s.status === 'completed'
                      ? s.reviewed_at
                        ? l('Reviewed', 'تمت المراجعة')
                        : l('Completed', 'مكتملة')
                      : l('In progress', 'قيد التنفيذ')
                  }}
                  · {{ l('View', 'عرض') }}
                  <span aria-hidden="true" class="directional">→</span></span
                ></RouterLink
              >
            </li>
          </ol>
          <button
            v-if="data.next"
            class="button secondary"
            :disabled="loadingMore"
            @click="load(true)"
          >
            {{
              loadingMore
                ? l('Loading…', 'جارٍ التحميل…')
                : l('Load earlier sessions', 'تحميل الحصص السابقة')
            }}
          </button>
        </section></template
      ></PageState
    >
  </div>
</template>
<style scoped>
.training-filter {
  margin-bottom: 24px;
}
.training-filter-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
}
.training-filter h2 {
  font-size: 1rem;
  margin: 0;
}
.training-filter details {
  margin-top: 10px;
}
.training-filter summary {
  cursor: pointer;
  color: var(--accent);
  font-weight: 600;
  font-size: 0.9rem;
}
.training-hint {
  margin-bottom: 24px;
}
.section-count {
  color: var(--muted);
  font-weight: 500;
}
.session-history {
  list-style: none;
  padding: 0;
  margin: 8px 0 20px;
}
.organization-session-row {
  color: inherit;
  text-decoration: none;
}
a.organization-session-row:hover strong {
  text-decoration: underline;
}
.session-status {
  font-size: 0.85rem;
  color: var(--accent);
  font-weight: 650;
  white-space: nowrap;
}
.session-status.in_progress {
  color: var(--muted);
}
.session-status .directional {
  display: inline-block;
}
.organization-session-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}
.organization-session-row > div {
  min-width: 0;
  flex: 1;
  overflow-wrap: anywhere;
}
.organization-session-row p {
  color: var(--muted);
  font-size: 0.85rem;
  margin-top: 5px;
}
.panel {
  margin-bottom: 28px;
}
.panel h2 {
  margin-bottom: 12px;
}
</style>
