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
import PageState from '../../components/PageState.vue'
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
    if (!selected.value) people.value = result.members
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
onMounted(async () => {
  if (selected.value) {
    const all = await request<Training>(
      `/v1/workspaces/${context.workspace}/delivery?history=true&view=${context.view}`,
    ).catch(() => undefined)
    people.value = all?.members || []
  }
  await load()
})
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
    <label v-if="context.view !== 'trainee'" class="training-person-select"
      >{{ l('Trainee', 'المتدرب')
      }}<select v-model="selected">
        <option value="">{{ l('All assigned trainees', 'جميع المتدربين المعنيين') }}</option>
        <option v-for="p in people" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select></label
    ><PageState :loading="loading" :error="!data ? error : ''" @retry="load()"
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
        <p v-else-if="context.view === 'trainee' || selected" class="notice">
          {{
            l(
              'There is no active program yet. Your organization can assign one when it is ready.',
              'لا يوجد برنامج نشط بعد. يمكن لمؤسستك تعيينه عندما يصبح جاهزاً.',
            )
          }}
        </p>
        <section>
          <div class="heading-actions">
            <h2>{{ l('Session history', 'سجل الحصص') }}</h2>
            <RouterLink
              v-if="selected || context.view === 'trainee'"
              class="text-link"
              :to="context.base + '/assessments/' + (selected || data.self)"
              >{{ l('Assessment history', 'سجل التقييمات') }} ↗</RouterLink
            >
          </div>
          <p v-if="!data.sessions.length" class="subtle">
            {{
              l(
                'Recorded sessions will appear here, including their coach feedback.',
                'ستظهر الحصص المسجلة هنا مع ملاحظات المدرب.',
              )
            }}
          </p>
          <RouterLink
            v-for="s in data.sessions"
            :key="s.id"
            class="organization-session-row"
            :to="
              context.view === 'trainee'
                ? '/workout/' + s.id + '?workspace=' + context.workspace
                : context.base + '/review/' + s.id
            "
            ><div>
              <strong>{{
                context.view === 'trainee' ? s.prescription.name : name(s.member_id)
              }}</strong>
              <p>{{ s.title }} · {{ dateLabel(s.started_at) }}</p>
            </div>
            <span>{{
              s.status === 'completed'
                ? s.reviewed_at
                  ? l('Reviewed', 'تمت المراجعة')
                  : l('Completed', 'مكتملة')
                : l('In progress', 'قيد التنفيذ')
            }}</span></RouterLink
          >
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
.training-person-select {
  max-width: 560px;
  margin-block: 16px 24px;
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
