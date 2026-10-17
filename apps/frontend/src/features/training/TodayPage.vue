<script setup lang="ts">
import UpcomingAppointments from '../appointments/UpcomingAppointments.vue'
import CoachingActivity from '../ongoing/CoachingActivity.vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PhArrowRight, PhBarbell, PhClock, PhCheckCircle } from '@phosphor-icons/vue'
import { user, profile } from '../../app/auth'
import { rpc } from '../../lib/backend'
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
const showSchedule = ref<Record<string, boolean>>({})
const visibleSchedule = (id: string) =>
  (schedules.value[id] || []).filter((s) => showSchedule.value[id] || s.date === today.value)
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
    const [data, saved] = await Promise.all([
      rpc<{
        relationships: Relationship[]
        assignments: Assignment[]
        versions: PlanVersion[]
        people: Profile[]
        feedback: Session[]
      }>('client_today'),
      localSessions(id),
    ])
    relationships.value = data.relationships
    assignments.value = data.assignments
    versions.value = data.versions
    people.value = data.people
    history.value = data.feedback
    local.value = saved
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
    <div class="work-heading">
      <div>
        <p class="overline">{{ t('training') }}</p>
        <h1>
          {{ language('Your training,', 'تدريبك،') }}
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
            <template v-if="a.schedule_mode === 'cycle'">
              <div v-if="!schedules[a.id]?.some((s) => s.date === today)" class="today-status">
                <h3>{{ language('No workout scheduled today.', 'لا توجد حصة مجدولة اليوم.') }}</h3>
                <p>
                  {{
                    language('Your next dates are in your schedule.', 'مواعيدك القادمة في الجدول.')
                  }}
                </p>
              </div>
              <button
                v-if="schedules[a.id]?.some((s) => s.date !== today)"
                class="text-link"
                :aria-expanded="!!showSchedule[a.id]"
                @click="showSchedule[a.id] = !showSchedule[a.id]"
              >
                {{
                  showSchedule[a.id]
                    ? language('Show today only', 'عرض اليوم فقط')
                    : language('See upcoming schedule', 'عرض الجدول القادم')
                }}
              </button>
              <p v-if="!schedules[a.id]?.length">
                {{
                  language(
                    'No scheduled workouts in the next two weeks.',
                    'لا توجد حصص مجدولة في الأسبوعين القادمين.',
                  )
                }}
              </p>
              <div
                v-for="s in visibleSchedule(a.id)"
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
          <UpcomingAppointments />
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
      <section v-else class="empty-state panel training-empty">
        <span class="training-empty-icon"><PhBarbell :size="28" aria-hidden="true" /></span>
        <div>
          <span v-if="relationships.some((r) => r.state === 'archived')" class="tag">
            {{ language('Training paused', 'التدريب متوقف مؤقتاً') }}
          </span>
          <h2>
            {{
              relationships.some((r) => r.state === 'archived')
                ? language('Your training relationship is paused.', 'علاقتك التدريبية متوقفة مؤقتاً.')
                : language('Your next program will appear here.', 'سيظهر برنامجك التالي هنا.')
            }}
          </h2>
          <p>
            {{
              relationships.some((r) => r.state === 'archived')
                ? language(
                    'Your training history is still available. Contact your coach when you are ready to resume.',
                    'ما زال سجل تدريبك متاحاً. تواصل مع مدربك عندما تكون مستعداً للعودة.',
                  )
                : language(
                    'When your coach assigns a program, your sessions and next steps will show here.',
                    'عندما يعيّن مدربك برنامجاً، ستظهر حصصك وخطواتك التالية هنا.',
                  )
            }}
          </p>
          <RouterLink v-if="relationships.some((r) => r.state === 'archived')" to="/history" class="text-link">
            {{ language('View training history', 'عرض سجل التدريب') }}
            <PhArrowRight :size="18" class="directional" aria-hidden="true" />
          </RouterLink>
        </div>
      </section>
      <CoachingActivity
    /></PageState>
  </div>
</template>
<style scoped>
.training-empty {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  align-items: start;
  gap: 20px;
  max-width: 780px;
  margin-inline: 0;
  padding: 28px;
}
.training-empty-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  color: var(--accent);
  background: var(--surface-soft);
  border-radius: 50%;
}
.training-empty h2 {
  margin: 0 0 8px;
}
.training-empty p {
  margin: 0;
}
.training-empty .text-link {
  margin-top: 16px;
}
@media (max-width: 600px) {
  .training-empty {
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 14px;
    padding: 20px;
  }
  .training-empty-icon {
    width: 44px;
    height: 44px;
  }
}
</style>
