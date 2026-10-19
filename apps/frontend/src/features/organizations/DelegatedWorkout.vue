<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { AthletePlanPage } from '@rafik/shared/contracts'
import { request } from '../../lib/backend'
import { language as l, errorMessage, dateLabel, locale } from '../../lib/i18n'
import { exerciseName } from '../../lib/prescriptions'
import type { Entry, PlanDay, Prescription, Session } from '../../lib/domain'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import OrganizationNav from './OrganizationNav.vue'

/**
 * A coach records a workout on an athlete's behalf. Every write uses the coach's own session
 * and is attributed to the coach; the athlete sees who recorded it and can correct it.
 * Online only: unlike the athlete's own workout screen, there is no device queue here.
 */
type Delegated = Session & {
  member_id: string
  member_name?: string
  recorded_mode?: 'self' | 'delegated'
  recorded_by_name?: string | null
}
type Version = {
  version: number
  action: 'start' | 'save'
  created_at: string
  actor_name: string
  by: 'athlete' | 'coach'
  completed: boolean
}
const route = useRoute(),
  router = useRouter(),
  workspace = String(route.params.workspace),
  view = String(route.params.view),
  base = `/organization/${workspace}/${view}`,
  ws = `/v1/workspaces/${workspace}`
const sessionId = computed(() => String(route.params.session))
const loading = ref(true),
  error = ref(''),
  plan = ref<AthletePlanPage['items'][number] & { version: { prescription?: Prescription } }>(),
  session = ref<Delegated>(),
  entries = ref<Entry[]>([]),
  note = ref(''),
  history = ref<Version[]>([])
const get = <T,>(path: string) => request<T>(path, { feedback: 'none' })
async function load() {
  loading.value = true
  error.value = ''
  try {
    if (sessionId.value === 'new') {
      const page = await get<AthletePlanPage>(
        `${ws}/athlete-plans?view=${view}&assignment=${encodeURIComponent(String(route.query.assignment))}`,
      )
      plan.value = page.items[0] as typeof plan.value
    } else {
      session.value = await get<Delegated>(
        `/v1/organization-sessions/${sessionId.value}?view=${view}`,
      )
      entries.value = session.value.entries.map((e) => ({ ...e }))
      note.value = session.value.note
      history.value = (
        await get<{ items: Version[] }>(
          `/v1/organization-sessions/${sessionId.value}/history?view=${view}`,
        )
      ).items
    }
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
const days = computed(
  () => plan.value?.version.prescription?.days.filter((d: PlanDay) => !d.restDay) || [],
)
// Navigate only after the start command has fully settled: the page may remount on a route
// change, and a new instance must not adopt the still-saved start command as pending.
const started = ref('')
const starting = useCommand<'start'>(
  `delegated-start:${workspace}`,
  async (_, result) => {
    started.value = (result as Session).id
  },
  (_, args) => request(`${ws}/sessions`, { method: 'POST', body: JSON.stringify(args) }),
)
const saving = useCommand<'save'>(
  `delegated-save:${workspace}:${sessionId.value}`,
  async () => {
    await load()
  },
  (_, args) => request(`${ws}/sessions`, { method: 'POST', body: JSON.stringify(args) }),
  { successMessage: l('Saved on the athlete’s record.', 'حُفظ في سجل الرياضي.') },
)
const locked = computed(
  () =>
    saving.state.busy ||
    !!saving.state.pending ||
    !saving.state.ready ||
    starting.state.busy ||
    !!starting.state.pending,
)
async function start(day: PlanDay) {
  const id = crypto.randomUUID()
  started.value = ''
  await starting.run('start', {
    operation: id,
    action: 'start',
    view,
    id,
    assignment_id: plan.value!.id,
    day_id: day.id,
  })
  if (started.value && !starting.state.pending)
    await router.replace(`${base}/record/${started.value}`)
}
watch(sessionId, load)
const save = (complete: boolean) =>
  saving.run('save', {
    operation: crypto.randomUUID(),
    action: 'save',
    view,
    id: session.value!.id,
    revision: session.value!.version,
    entries: entries.value,
    note: note.value,
    complete,
  })
const exercises = computed(() => session.value?.prescription.exercises || [])
const dayName = (d: PlanDay) => (locale.value === 'ar' ? d.nameAr || d.name : d.name)
onMounted(load)
</script>
<template>
  <OrganizationNav />
  <div class="container page delegated-workout">
    <RouterLink class="back-link" :to="base + '/training'">{{
      l('Back to athlete plans', 'العودة إلى خطط الرياضيين')
    }}</RouterLink>
    <p v-if="loading" role="status">{{ l('Loading…', 'جارٍ التحميل…') }}</p>
    <p v-else-if="error" role="alert" class="notice error">
      {{ error }}
      <button type="button" class="text-link" @click="load">
        {{ l('Retry', 'إعادة المحاولة') }}
      </button>
    </p>
    <template v-else-if="sessionId === 'new' && plan">
      <header class="work-heading">
        <div>
          <p class="recording-for">{{ l('Record on behalf of', 'تسجيل نيابة عن') }}</p>
          <h1 dir="auto">{{ plan.member_name }}</h1>
          <p dir="auto">{{ plan.version.title }}</p>
        </div>
      </header>
      <p class="notice">
        {{
          l(
            'You are recording for the athlete under your own name. They will see that you recorded it and can correct it.',
            'تسجّل للرياضي باسمك. سيرى أنك سجّلت الحصة ويمكنه تصحيحها.',
          )
        }}
      </p>
      <CommandStatus :command="starting" />
      <section class="panel">
        <h2>{{ l('Which session?', 'أي حصة؟') }}</h2>
        <div v-for="day in days" :key="day.id" class="organization-session-row">
          <div>
            <strong dir="auto">{{ dayName(day) }}</strong>
            <p>{{ day.minutes }} {{ l('minutes', 'دقيقة') }}</p>
          </div>
          <button
            type="button"
            class="button small"
            :disabled="locked"
            :aria-label="l('Record ', 'تسجيل ') + dayName(day)"
            @click="start(day)"
          >
            {{ l('Record', 'تسجيل') }}
          </button>
        </div>
      </section>
    </template>
    <template v-else-if="session">
      <header class="work-heading">
        <div>
          <p class="recording-for">
            {{
              session.recorded_mode === 'delegated'
                ? l('Recorded on behalf of', 'مسجّلة نيابة عن')
                : l('Athlete-recorded session', 'حصة سجّلها الرياضي')
            }}
          </p>
          <h1 dir="auto">{{ session.member_name }}</h1>
          <p dir="auto">{{ session.title }} · {{ session.prescription.name }}</p>
        </div>
      </header>
      <p v-if="session.recorded_mode !== 'delegated'" class="notice">
        {{
          l(
            'The athlete recorded this session. Coaches can review it but not edit it.',
            'سجّل الرياضي هذه الحصة. يمكن للمدربين مراجعتها دون تعديلها.',
          )
        }}
      </p>
      <form v-else class="form-stack" @submit.prevent="save(true)">
        <CommandStatus :command="saving" />
        <fieldset class="command-fields" :disabled="locked">
          <section v-for="exercise in exercises" :key="exercise.key" class="panel">
            <h2 dir="auto">{{ exerciseName(exercise) }}</h2>
            <div
              v-for="entry in entries.filter((e) => e.exercise_key === exercise.key)"
              :key="entry.set_index"
              class="delegated-set"
            >
              <span>{{ l('Set', 'المجموعة') }} {{ entry.set_index + 1 }}</span>
              <label
                >{{ l('Reps', 'التكرارات')
                }}<input v-model.number="entry.reps" type="number" min="0" inputmode="numeric"
              /></label>
              <label
                >{{ l('Load', 'الحمل') }} ({{ entry.unit }})<input
                  v-model.number="entry.load"
                  type="number"
                  min="0"
                  step="0.5"
                  inputmode="decimal"
              /></label>
              <label class="check-label"
                ><input v-model="entry.completed" type="checkbox" />{{ l('Done', 'تمت') }}</label
              >
            </div>
          </section>
          <label
            >{{ l('Note', 'ملاحظة') }}<textarea v-model="note" maxlength="2000" rows="2" />
          </label>
          <div class="actions">
            <button type="button" class="button secondary" @click="save(false)">
              {{ l('Save progress', 'حفظ التقدم') }}</button
            ><button class="button" :disabled="!entries.some((e) => e.completed)">
              {{ l('Finish session', 'إنهاء الحصة') }}
            </button>
          </div>
        </fieldset>
      </form>
      <section class="panel" aria-labelledby="record-history">
        <h2 id="record-history">{{ l('Record history', 'سجل التعديلات') }}</h2>
        <ol class="record-history">
          <li v-for="item in history" :key="item.version">
            <strong dir="auto">{{ item.actor_name }}</strong>
            ·
            {{
              item.action === 'start'
                ? l('started', 'بدأ')
                : item.by === 'athlete'
                  ? l('corrected (athlete)', 'صحّح (الرياضي)')
                  : item.completed
                    ? l('saved as completed', 'حفظ كمكتملة')
                    : l('saved progress', 'حفظ التقدم')
            }}
            · {{ dateLabel(item.created_at) }}
          </li>
        </ol>
      </section>
    </template>
  </div>
</template>
<style scoped>
.delegated-workout {
  max-width: 880px;
}
.recording-for {
  margin: 0 0 4px;
  font-weight: 650;
}
.delegated-workout .panel {
  margin-bottom: 16px;
}
.delegated-set {
  display: grid;
  grid-template-columns: minmax(64px, auto) repeat(2, minmax(0, 1fr)) auto;
  gap: 10px 14px;
  align-items: end;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}
.delegated-set input[type='number'] {
  width: 100%;
  min-width: 0;
}
@media (max-width: 520px) {
  .delegated-set {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.record-history {
  margin: 0;
  padding-inline-start: 20px;
  display: grid;
  gap: 6px;
  overflow-wrap: anywhere;
}
</style>
