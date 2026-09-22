<script setup lang="ts">
import CoachingActivity from '../ongoing/CoachingActivity.vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PhArrowRight, PhBarbell, PhClock, PhCheckCircle } from '@phosphor-icons/vue'
import { user, profile } from '../../app/auth'
import { rows, rpc } from '../../lib/backend'
import {
  type Assignment,
  type Relationship,
  type ScheduledDay,
  type PlanVersion,
  type PlanDay,
  type Profile,
  type Session,
  type LocalSession,
} from '../../lib/domain'
import { language, locale, t, errorMessage, dateLabel } from '../../lib/i18n'
import { localSessions } from '../../lib/storage'
import { startWorkout } from '../../lib/training'
import { localDate, addDays } from '../../lib/dates'
import PageState from '../../components/PageState.vue'
const router = useRouter()
const loading = ref(true)
const error = ref('')
const busy = ref('')
const assignments = ref<Assignment[]>([])
const versions = ref<PlanVersion[]>([])
const people = ref<Profile[]>([])
const history = ref<Session[]>([])
const local = ref<LocalSession[]>([])
const schedules = ref<Record<string, ScheduledDay[]>>({})
const today = computed(() => localDate(profile.value?.timezone || 'UTC'))
const relationships = ref<Relationship[]>([])
const active = computed(() =>
  assignments.value.filter(
    (a) =>
      a.state === 'active' &&
      relationships.value.some((r) => r.id === a.relationship_id && r.state === 'active'),
  ),
)
const open = computed(() => local.value.filter((x) => x.session.status === 'in_progress'))
const latestFeedback = computed(
  () =>
    history.value
      .filter((s) => s.coach_note)
      .sort((a, b) => (b.reviewed_at || '').localeCompare(a.reviewed_at || ''))[0],
)
const plan = (id: string) => versions.value.find((p) => p.id === id)
async function load() {
  loading.value = true
  error.value = ''
  try {
    const id = user.value!.id
    relationships.value = await rows<Relationship>('coach_clients', 'client_id', id)
    ;[assignments.value, versions.value, people.value, history.value, local.value] =
      await Promise.all([
        rows<Assignment>('assignments', 'client_id', id),
        rows<PlanVersion>('plan_versions'),
        rows<Profile>('profiles'),
        rows<Session>('sessions', 'client_id', id),
        localSessions(id),
      ])
    for (const a of active.value)
      if (a.schedule_mode === 'cycle')
        schedules.value[a.id] = await rpc<ScheduledDay[]>('assignment_schedule', {
          p_id: a.id,
          p_from: today.value,
          p_to: addDays(today.value, 13),
        })
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
async function start(a: Assignment, d: PlanDay, scheduledDate?: string) {
  busy.value = a.id + d.id
  error.value = ''
  try {
    const p = plan(a.version_id)!
    const r = await startWorkout(
      d,
      p.title,
      p.id,
      user.value!.id,
      a.id,
      scheduledDate || today.value,
    )
    await router.push('/workout/' + r.id)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = ''
  }
}
onMounted(load)
</script>
<template>
  <div class="container page">
    <div class="page-heading">
      <p class="overline">{{ t('training') }}</p>
      <h1>
        {{ language('A little progress,', 'تقدم بسيط،') }}
        {{ profile?.display_name?.split(' ')[0] || language('at your pace', 'بوتيرتك') }}.
      </h1>
      <p>
        {{
          language(
            'A clear next step. A session you can make your own.',
            'خطوة تالية واضحة. وحصة تناسبك.',
          )
        }}
      </p>
    </div>
    <PageState :loading="loading" :error="loading || !active.length ? error : ''" @retry="load"
      ><div v-if="open.length" class="resume-banner">
        <PhClock :size="25" aria-hidden="true" />
        <div>
          <h2>{{ language('Pick up where you left off.', 'تابع من حيث توقفت.') }}</h2>
          <p>
            {{ open[0]!.session.prescription.name }}
            <span class="subtle">{{ dateLabel(open[0]!.session.started_at) }}</span>
          </p>
        </div>
        <RouterLink class="button small" :to="'/workout/' + open[0]!.id"
          >{{ t('resume') }}<PhArrowRight :size="18" class="directional" aria-hidden="true"
        /></RouterLink>
      </div>
      <CoachingActivity />
      <div v-if="active.length" class="today-layout">
        <section>
          <article v-for="a in active" :key="a.id" class="assigned-plan">
            <div class="section-heading">
              <div>
                <span class="tag">{{ language('Your plan', 'خطتك') }}</span>
                <h2>{{ plan(a.version_id)?.title }}</h2>
                <p>
                  {{ language('With', 'مع') }}
                  {{ people.find((p) => p.id === a.coach_id)?.display_name }}
                </p>
              </div>
              <PhBarbell :size="32" class="accent-icon" aria-hidden="true" />
            </div>
            <template v-if="a.schedule_mode === 'cycle'"
              ><p v-if="!schedules[a.id]?.length">
                {{
                  language(
                    'No scheduled workouts in the next two weeks.',
                    'لا توجد حصص مجدولة في الأسبوعين القادمين.',
                  )
                }}
              </p>
              <div
                v-for="s in schedules[a.id]"
                :key="s.scheduled_date + s.day.id"
                class="day-choice"
              >
                <div class="grow">
                  <span class="overline">{{ dateLabel(s.date) }}</span>
                  <h3>{{ locale === 'ar' ? s.day.nameAr || s.day.name : s.day.name }}</h3>
                  <p v-if="s.state === 'rest'">{{ language('Rest day', 'يوم راحة') }}</p>
                  <p v-else-if="s.state === 'skipped'">
                    {{ language('Skipped by your coach', 'تجاوزها مدربك') }}
                  </p>
                  <p v-else>{{ s.day.exercises.length }} {{ t('exercises') }}</p>
                </div>
                <RouterLink
                  v-if="s.session_id"
                  class="button small secondary"
                  :to="'/workout/' + s.session_id"
                  >{{ s.state === 'completed' ? t('view') : t('resume') }}</RouterLink
                ><button
                  v-else-if="s.state !== 'skipped' && s.state !== 'rest' && s.date === today"
                  class="button small"
                  :disabled="!!busy"
                  @click="start(a, s.day, s.scheduled_date)"
                >
                  {{ t('start') }}
                </button>
              </div></template
            >
            <div
              v-for="(d, index) in a.schedule_mode === 'cycle'
                ? []
                : plan(a.version_id)?.prescription.days.filter((d) => !d.restDay)"
              :key="d.id"
              class="day-choice"
            >
              <span class="day-marker">{{ String(index + 1).padStart(2, '0') }}</span>
              <div>
                <h3>{{ locale === 'ar' ? d.nameAr || d.name : d.name }}</h3>
                <p>
                  {{ d.exercises.length }} {{ t('exercises') }}
                  <span>{{ d.minutes }} {{ t('minutes') }}</span>
                </p>
              </div>
              <button class="button small secondary" :disabled="!!busy" @click="start(a, d)">
                {{ busy === a.id + d.id ? t('loading') : t('start')
                }}<PhArrowRight :size="18" class="directional" aria-hidden="true" />
              </button>
            </div>
          </article>
          <p v-if="error" class="notice error" role="alert">{{ error }}</p>
        </section>
        <aside>
          <section v-if="latestFeedback" class="panel feedback-panel">
            <span class="tag">{{ t('feedback') }}</span>
            <h2>{{ language('A note from your coach', 'ملاحظة من مدربك') }}</h2>
            <p>{{ latestFeedback.coach_note }}</p>
            <RouterLink class="text-link" :to="'/workout/' + latestFeedback.id"
              >{{ t('view') }}<PhArrowRight :size="18" aria-hidden="true"
            /></RouterLink>
          </section>
          <section v-else class="panel subtle-panel">
            <PhCheckCircle :size="30" class="accent-icon" aria-hidden="true" />
            <h2>{{ language('Make the session yours.', 'اجعل الحصة تناسبك.') }}</h2>
            <p>
              {{
                language(
                  'Record what you actually do. Leave a note at the end so your coach knows what to adjust.',
                  'سجّل ما تؤديه فعلاً. اترك ملاحظة في النهاية ليعرف مدربك ما يحتاج إلى تعديل.',
                )
              }}
            </p>
          </section>
          <RouterLink to="/history" class="history-link"
            >{{ language('See your training history', 'شاهد سجل تدريبك')
            }}<PhArrowRight :size="20" class="directional" aria-hidden="true"
          /></RouterLink>
        </aside>
      </div>
      <section v-else class="empty-state panel">
        <p v-if="relationships.some((r) => r.state === 'archived')" class="notice">
          {{
            language(
              'Your coaching relationship is paused. Your training history is still available.',
              'علاقتك التدريبية متوقفة مؤقتاً. سجل تدريبك ما زال متاحاً.',
            )
          }}
        </p>
        <PhBarbell :size="40" weight="light" aria-hidden="true" />
        <h2>{{ language('Your next workout starts here.', 'تمرينك القادم يبدأ هنا.') }}</h2>
        <p>
          {{
            language(
              'Open your coach’s invitation to see your plan. In the meantime, try a full-body sample.',
              'افتح دعوة مدربك لرؤية خطتك. وحتى ذلك الحين، جرّب حصة لكامل الجسم.',
            )
          }}
        </p>
        <RouterLink class="button" to="/routine"
          >{{ t('sample') }}<PhArrowRight :size="20" class="directional" aria-hidden="true"
        /></RouterLink></section
    ></PageState>
  </div>
</template>
