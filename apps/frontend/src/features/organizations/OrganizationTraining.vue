<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
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
const route = useRoute(),
  router = useRouter(),
  context = programContext(route)
type Training = {
  next: string | null
  self: string
  members: { id: string; name: string; active: boolean }[]
  assignments: (Assignment & {
    member_id: string
    version: PlanVersion
    goal?: string | null
    sport_id?: string | null
  })[]
  sessions: (Session & { member_id: string })[]
}
const data = ref<Training>(),
  people = ref<Training['members']>([]),
  selected = ref(String(route.query.member || '')),
  loading = ref(true),
  error = ref(''),
  busy = ref(false),
  loadingMore = ref(false),
  athleteFilter = ref<HTMLDetailsElement>()
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: profile.value?.timezone || 'UTC',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date())
type Plan = Training['assignments'][number]
// An athlete can follow several goal-specific plans at once.
const plans = computed(
  () =>
    data.value?.assignments.filter(
      (a) =>
        a.state === 'active' &&
        a.member_id === (context.view === 'trainee' ? data.value?.self : selected.value),
    ) || [],
)
const sports = ref<{ id: string; name: string }[]>([])
const planLabel = (plan: Plan) =>
  [plan.goal, sports.value.find((s) => s.id === plan.sport_id)?.name].filter(Boolean).join(' · ')
const plansToday = computed(() =>
  plans.value.filter((plan) => plan.version.prescription.days.some((d) => scheduled(d, plan))),
)
const name = (id: string) =>
  people.value.find((m) => m.id === id)?.name || l('Former member', 'عضو سابق')
function scheduled(day: PlanDay, a: Plan) {
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
      `/v1/workspaces/${context.workspace}/delivery?view=${context.view}${context.view === 'trainee' || selected.value ? '&history=true' : ''}${append && data.value?.next ? '&before=' + data.value.next : ''}${selected.value ? '&member=' + selected.value : ''}`,
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
async function openAthletePicker() {
  if (athleteFilter.value) athleteFilter.value.open = true
  await nextTick()
  athleteFilter.value?.querySelector<HTMLInputElement>('input[type="search"]')?.focus()
}
watch(selected, async () => {
  await router.replace({ query: selected.value ? { member: selected.value } : {} })
  await load()
})
async function begin(day: PlanDay, a: Plan) {
  busy.value = true
  error.value = ''
  try {
    const s = await startWorkout(
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
onMounted(() => {
  void load()
  // Sport names label plans for staff; athletes see the goal only.
  if (context.view !== 'trainee')
    void request<{ items: { id: string; name: string }[] }>(
      `/v1/workspaces/${context.workspace}/sports?view=${context.view}`,
    )
      .then((r) => (sports.value = r.items))
      .catch(() => {})
})
</script>
<template>
  <OrganizationNav />
  <div class="container page">
    <header class="work-heading">
      <div>
        <p class="overline">{{ l('Institution training', 'تدريب المؤسسة') }}</p>
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
        >{{ l('Programs', 'البرامج') }}</RouterLink
      >
    </header>
    <details v-if="context.view !== 'trainee'" ref="athleteFilter" class="training-filter">
      <summary>
        {{ l('Filter by athlete', 'تصفية حسب الرياضي')
        }}{{ selected ? ' · ' + name(selected) : '' }}
      </summary>
      <MemberPicker
        :workspace="context.workspace!"
        :view="context.view"
        single
        :model-value="selected ? [selected] : []"
        :label="l('Find an athlete', 'البحث عن رياضي')"
        @update:model-value="selected = $event[0] || ''"
        @options="
          people = Array.from(new Map([...people, ...$event].map((m) => [m.id, m])).values())
        "
      />
    </details>
    <PageState :loading="loading" :error="!data ? error : ''" @retry="load()"
      ><p v-if="error && data" class="notice error" role="alert">{{ error }}</p>
      <template v-if="data"
        ><section
          v-if="context.view !== 'trainee' && !selected"
          class="empty-state panel training-empty"
        >
          <span class="training-empty-icon"><PhBarbell :size="26" aria-hidden="true" /></span>
          <div class="training-empty-copy">
            <h2>
              {{ l('Choose an athlete to review their training.', 'اختر رياضياً لمراجعة تدريبه.') }}
            </h2>
            <p>
              {{
                l(
                  'Select an athlete to see their active program, session history and assessment history.',
                  'اختر رياضياً لعرض برنامجه النشط وسجل الحصص والتقييمات.',
                )
              }}
            </p>
          </div>
          <button class="button" type="button" @click="openAthletePicker">
            {{ l('Choose an athlete', 'اختيار رياضي') }}
          </button>
        </section>
        <template v-else>
          <p v-if="plansToday.length > 1" class="notice" role="status">
            {{
              context.view === 'trainee'
                ? l(
                    'You have sessions from more than one plan today. Check the combined load with your coach.',
                    'لديك حصص من أكثر من خطة اليوم. راجع الحمل الإجمالي مع مدربك.',
                  )
                : l(
                    'This athlete has sessions from more than one plan today. Review the combined load.',
                    'لدى هذا الرياضي حصص من أكثر من خطة اليوم. راجع الحمل الإجمالي.',
                  )
            }}
          </p>
          <section v-for="plan in plans" :key="plan.id" class="panel">
            <p class="overline">
              {{
                plans.length > 1
                  ? l('Active plan', 'خطة نشطة')
                  : l('Current program', 'البرنامج الحالي')
              }}
            </p>
            <h2 dir="auto">{{ plan.version.title }}</h2>
            <p v-if="planLabel(plan)" class="tag plan-label" dir="auto">{{ planLabel(plan) }}</p>
            <p>
              {{
                plan.schedule_mode === 'cycle'
                  ? l('Follow your program cycle', 'اتبع دورة البرنامج')
                  : l('Choose a session that fits today', 'اختر الحصة المناسبة لليوم')
              }}
              ·
              <bdi dir="ltr" class="plan-dates"
                >{{ plan.start_date.slice(0, 10)
                }}{{ plan.end_date ? ' → ' + plan.end_date.slice(0, 10) : '' }}</bdi
              >
            </p>
            <div
              v-for="day in plan.version.prescription.days"
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
                v-if="context.view === 'trainee' && scheduled(day, plan)"
                class="button small"
                :disabled="busy"
                :aria-label="
                  l('Open session ', 'فتح الحصة ') +
                  (locale === 'ar' ? day.nameAr || day.name : day.name) +
                  ' · ' +
                  plan.version.title
                "
                @click="begin(day, plan)"
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
                (plan.version as PlanVersion & { program_id: string }).program_id +
                '&member=' +
                selected
              "
              >{{ l('Adapt this program', 'تكييف هذا البرنامج') }}</RouterLink
            >
          </section>
          <section v-if="!plans.length" class="empty-state panel training-empty">
            <span class="training-empty-icon"><PhBarbell :size="26" aria-hidden="true" /></span>
            <div class="training-empty-copy">
              <h2>
                {{
                  context.view === 'trainee'
                    ? l('No active program yet.', 'لا يوجد برنامج نشط بعد.')
                    : l('No active program for this athlete.', 'لا يوجد برنامج نشط لهذا الرياضي.')
                }}
              </h2>
              <p>
                {{
                  context.view === 'trainee'
                    ? l(
                        'Your institution will show your training here when a program is assigned.',
                        'ستظهر تدريباتك هنا عندما تعيّن مؤسستك برنامجاً لك.',
                      )
                    : l(
                        'Choose a published program to assign. Session history will appear here after the athlete starts training.',
                        'اختر برنامجاً منشوراً لتعيينه. سيظهر سجل الحصص هنا بعد أن يبدأ الرياضي التدريب.',
                      )
                }}
              </p>
            </div>
            <RouterLink
              v-if="context.view !== 'trainee'"
              class="button secondary"
              :to="context.base + '/plans'"
            >
              {{ l('Browse programs', 'استعراض البرامج') }}
            </RouterLink>
          </section>
          <section v-if="plans.length || data.sessions.length">
            <div class="heading-actions">
              <h2>{{ l('Session history', 'سجل الحصص') }}</h2>
              <RouterLink
                v-if="selected || context.view === 'trainee'"
                class="text-link"
                :to="context.base + '/assessments/' + (selected || data.self)"
                >{{ l('Assessment history', 'سجل التقييمات') }} ↗</RouterLink
              >
            </div>
            <p v-if="!data.sessions.length" class="empty-state-note">
              {{
                l(
                  plans.length
                    ? 'No sessions have been recorded for these plans yet.'
                    : 'No sessions have been recorded for this athlete yet.',
                  plans.length
                    ? 'لم تُسجّل حصص لهذه الخطط بعد.'
                    : 'لم تُسجّل حصص لهذا الرياضي بعد.',
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
        ></template
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
.training-empty {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 20px;
  max-width: none;
  margin: 0 0 28px;
  padding: 24px 28px;
}
.training-empty-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  color: var(--accent);
  background: var(--surface-soft);
  border-radius: 50%;
}
.training-empty-copy h2 {
  margin: 0 0 6px;
}
.training-empty-copy p {
  margin: 0;
}
.training-empty .button {
  margin: 0;
}
@media (max-width: 680px) {
  .training-empty {
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 12px;
    padding: 20px;
  }
  .training-empty-icon {
    width: 40px;
    height: 40px;
  }
  .training-empty .button {
    grid-column: 2;
    justify-self: start;
  }
}

.plan-label {
  display: inline-block;
  margin: 0 0 8px;
}
.plan-dates {
  white-space: nowrap;
}
</style>
