<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { user } from '../../app/auth'
import { rows, rpc } from '../../lib/backend'
import type {
  Assignment,
  ClientContext,
  PlanVersion,
  Profile,
  Relationship,
  ScheduledDay,
  Session,
} from '../../lib/domain'
import { language, dateLabel, errorMessage, t, locale } from '../../lib/i18n'
import { addDays, localDate } from '../../lib/dates'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import PageState from '../../components/PageState.vue'
const id = String(useRoute().params.id),
  draftKey = `client-context:${user.value!.id}:${id}`
const person = ref<Profile>(),
  relationship = ref<Relationship>(),
  assignment = ref<Assignment>()
const versions = ref<PlanVersion[]>([]),
  history = ref<Session[]>([]),
  schedule = ref<ScheduledDay[]>([])
const context = ref<ClientContext>({ id, goals: '', constraints: '', notes: '', revision: 0 })
const tab = ref('overview'),
  loading = ref(true),
  busy = ref(false),
  confirmArchive = ref(false),
  restored = ref(false)
const error = ref(''),
  message = ref(''),
  version = ref(''),
  start = ref(''),
  end = ref(''),
  mode = ref('flexible')
const moves = ref<Record<string, string>>({})
watch(locale, () => {
  message.value = ''
  error.value = ''
})
let ready = false
const today = computed(() => localDate(person.value?.timezone || 'UTC'))
const completed = computed(() => history.value.filter((s) => s.status === 'completed'))
const last = computed(() => completed.value[0])
const currentPlan = computed(() =>
  versions.value.find((v) => v.id === assignment.value?.version_id),
)
async function load() {
  loading.value = true
  error.value = ''
  ready = false
  try {
    const rel = (await rows<Relationship>('coach_clients', 'id', id))[0]
    if (!rel || rel.coach_id !== user.value!.id) throw Error('forbidden')
    relationship.value = rel
    const [people, contexts, assigned, plans, sessions] = await Promise.all([
      rows<Profile>('profiles', 'id', rel.client_id),
      rows<ClientContext>('client_context', 'id', id),
      rows<Assignment>('assignments', 'relationship_id', id),
      rows<PlanVersion>('plan_versions', 'coach_id', user.value!.id),
      rows<Session>('sessions', 'client_id', rel.client_id),
    ])
    person.value = people[0]
    context.value = contexts[0] || { id, goals: '', constraints: '', notes: '', revision: 0 }
    const saved = await getDraft<ClientContext>(draftKey)
    if (saved) {
      context.value = saved
      restored.value = true
    }
    assignment.value = assigned.find((a) => a.state === 'active')
    versions.value = plans
    history.value = sessions
      .filter((s) => s.coach_id === user.value!.id)
      .sort((a, b) => b.started_at.localeCompare(a.started_at))
    version.value = assignment.value?.version_id || plans[0]?.id || ''
    start.value = assignment.value?.start_date || today.value
    end.value = assignment.value?.end_date || ''
    mode.value = assignment.value?.schedule_mode || 'flexible'
    await loadSchedule()
    ready = true
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
async function loadSchedule() {
  schedule.value = assignment.value
    ? await rpc<ScheduledDay[]>('assignment_schedule', {
        p_id: assignment.value.id,
        p_from: today.value,
        p_to: addDays(today.value, 20),
      })
    : []
  for (const d of schedule.value) moves.value[d.scheduled_date + d.day.id] = d.date
}
watch(
  context,
  () => {
    if (ready)
      void storeDraft(draftKey, context.value).catch(() => {
        error.value = language(
          'Could not keep a device draft. Save before leaving.',
          'تعذر حفظ مسودة على الجهاز. احفظ قبل المغادرة.',
        )
      })
  },
  { deep: true },
)
async function saveContext() {
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    const r = await rpc<ClientContext>('save_client_context', {
      p_id: id,
      p_goals: context.value.goals,
      p_constraints: context.value.constraints,
      p_notes: context.value.notes,
      p_revision: context.value.revision,
    })
    ready = false
    context.value = r
    await removeDraft(draftKey)
    restored.value = false
    ready = true
    message.value = language(
      'Client notes saved. Visible only to you.',
      'حُفظت ملاحظات المتدرب. تظهر لك فقط.',
    )
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function state() {
  busy.value = true
  error.value = ''
  try {
    relationship.value = await rpc<Relationship>('set_client_state', {
      p_id: id,
      p_state: relationship.value?.state === 'active' ? 'archived' : 'active',
    })
    confirmArchive.value = false
    message.value = language(
      'Client status updated. Existing records are preserved.',
      'تم تحديث حالة المتدرب. السجلات السابقة محفوظة.',
    )
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function assign() {
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    if (!assignment.value)
      assignment.value = await rpc<Assignment>('assign_plan', {
        p_relationship_id: id,
        p_version_id: version.value,
      })
    assignment.value = await rpc<Assignment>('configure_assignment', {
      p_id: assignment.value.id,
      p_version_id: version.value,
      p_start: start.value,
      p_end: end.value || null,
      p_mode: mode.value,
      p_revision: assignment.value.revision,
    })
    await loadSchedule()
    message.value = language(
      'Assignment updated. Started workouts keep their original prescription.',
      'تم تحديث الخطة. تحتفظ الحصص التي بدأت بتفاصيلها الأصلية.',
    )
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function changeDay(d: ScheduledDay, state: string) {
  busy.value = true
  error.value = ''
  try {
    await rpc('change_scheduled_day', {
      p_id: assignment.value!.id,
      p_day_id: d.day.id,
      p_date: d.scheduled_date,
      p_target: state === 'moved' ? moves.value[d.scheduled_date + d.day.id] : d.scheduled_date,
      p_state: state,
    })
    await loadSchedule()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function discard() {
  await removeDraft(draftKey)
  restored.value = false
  await load()
}
onMounted(load)
</script>
<template>
  <div class="container page">
    <RouterLink class="back-link" to="/coach/clients">← {{ t('clients') }}</RouterLink>
    <PageState :loading="loading" :error="!relationship ? error : ''" @retry="load">
      <template v-if="relationship && person">
        <header class="page-heading heading-actions">
          <div>
            <p class="overline">{{ language('Client workspace', 'مساحة المتدرب') }}</p>
            <h1>{{ person.display_name }}</h1>
            <p>
              {{ relationship.state === 'active' ? t('active') : language('Archived', 'مؤرشف') }} ·
              {{ person.timezone }}
            </p>
          </div>
          <button
            class="button secondary small"
            :disabled="busy"
            @click="relationship.state === 'active' ? (confirmArchive = true) : state()"
          >
            {{
              relationship.state === 'active'
                ? language('Archive client', 'أرشفة المتدرب')
                : language('Reactivate client', 'إعادة تفعيل المتدرب')
            }}
          </button>
        </header>
        <div v-if="confirmArchive" class="notice">
          <p>
            {{
              language(
                'Archive this relationship? New workouts will be paused. History, notes and already started workouts remain available.',
                'أرشفة العلاقة؟ سيتوقف بدء حصص جديدة. تبقى السجلات والملاحظات والحصص التي بدأت متاحة.',
              )
            }}
          </p>
          <div class="actions">
            <button class="button small" :disabled="busy" @click="state">
              {{ language('Confirm archive', 'تأكيد الأرشفة') }}</button
            ><button class="text-link" @click="confirmArchive = false">{{ t('cancel') }}</button>
          </div>
        </div>
        <p v-if="error" class="notice error" role="alert">{{ error }}</p>
        <p v-if="message" class="notice success" role="status">{{ message }}</p>
        <nav class="workspace-tabs" :aria-label="language('Client sections', 'أقسام المتدرب')">
          <button
            v-for="item in [
              ['overview', 'Overview', 'نظرة عامة'],
              ['plan', 'Plan & schedule', 'الخطة والجدول'],
              ['history', 'Training history', 'سجل التدريب'],
            ]"
            :key="item[0]"
            :class="{ selected: tab === item[0] }"
            :aria-current="tab === item[0] ? 'page' : undefined"
            @click="tab = item[0]!"
          >
            {{ language(item[1]!, item[2]!) }}
          </button>
          <RouterLink :to="'/coach/clients/' + id + '/progress'">{{
            language('Progress', 'التقدم')
          }}</RouterLink
          ><RouterLink :to="'/coach/checkins?client=' + id">{{
            language('Check-ins', 'المتابعات')
          }}</RouterLink
          ><RouterLink :to="'/coach/messages/' + id">{{
            language('Messages', 'الرسائل')
          }}</RouterLink>
        </nav>
        <div v-if="tab === 'overview'" class="client-workspace">
          <section>
            <div class="actions">
              <RouterLink class="text-link" :to="'/coach/nutrition?client=' + id">{{
                language('Nutrition guidance', 'إرشادات التغذية')
              }}</RouterLink
              ><RouterLink class="text-link" :to="'/coach/appointments?client=' + id">{{
                language('Appointments', 'المواعيد')
              }}</RouterLink
              ><RouterLink class="text-link" to="/coach/resources">{{
                language('Resources', 'الملفات')
              }}</RouterLink>
            </div>
            <div class="workspace-facts">
              <div>
                <strong>{{ completed.length }}</strong
                ><span>{{ language('Completed sessions', 'حصص مكتملة') }}</span>
              </div>
              <div>
                <strong>{{ last ? dateLabel(last.completed_at!) : '—' }}</strong
                ><span>{{ language('Last completed', 'آخر إكمال') }}</span>
              </div>
            </div>
            <form class="panel context-form" @submit.prevent="saveContext">
              <h2>{{ language('The person behind the plan', 'المتدرب وراء الخطة') }}</h2>
              <p>
                {{
                  language(
                    'Your coaching context. These notes are private to you; your client does not see them.',
                    'سياق التدريب الخاص بك. هذه الملاحظات خاصة ولا تظهر للمتدرب.',
                  )
                }}
              </p>
              <p v-if="restored" class="notice">
                {{ language('Device draft restored.', 'تم استرداد مسودة الجهاز.') }}
                <button type="button" class="text-link" @click="discard">
                  {{ language('Discard draft', 'تجاهل المسودة') }}
                </button>
              </p>
              <label
                >{{ language('Goals', 'الأهداف')
                }}<textarea
                  dir="auto"
                  v-model="context.goals"
                  rows="3"
                  maxlength="2000"
                  :disabled="busy"
                /></label
              ><label
                >{{ language('Preferences and constraints', 'التفضيلات والقيود')
                }}<textarea
                  dir="auto"
                  v-model="context.constraints"
                  rows="3"
                  maxlength="2000"
                  :disabled="busy"
                /></label
              ><label
                >{{ language('Private coach notes', 'ملاحظات المدرب الخاصة')
                }}<textarea
                  dir="auto"
                  v-model="context.notes"
                  rows="5"
                  maxlength="5000"
                  :disabled="busy"
                /></label
              ><button class="button" :disabled="busy">
                {{ language('Save client notes', 'حفظ ملاحظات المتدرب') }}
              </button>
            </form>
          </section>
          <aside>
            <section class="panel">
              <span class="tag">{{ language('Current plan', 'الخطة الحالية') }}</span>
              <h2>{{ currentPlan?.title || language('No assigned plan', 'لا توجد خطة') }}</h2>
              <p v-if="assignment">
                {{ dateLabel(assignment.start_date) }} ·
                {{
                  assignment.schedule_mode === 'cycle'
                    ? language('Repeating cycle', 'دورة متكررة')
                    : language('Flexible days', 'أيام مرنة')
                }}
              </p>
              <button class="text-link" @click="tab = 'plan'">
                {{ language('Manage plan and schedule', 'إدارة الخطة والجدول') }} →
              </button>
            </section>
            <section v-if="completed.some((s) => !s.reviewed_at)" class="panel">
              <h2>{{ language('Ready for your review', 'بانتظار مراجعتك') }}</h2>
              <RouterLink
                v-for="s in completed.filter((s) => !s.reviewed_at).slice(0, 3)"
                :key="s.id"
                class="workspace-row"
                :to="'/coach/review/' + s.id"
                >{{ s.prescription.name }} →</RouterLink
              >
            </section>
          </aside>
        </div>
        <section v-if="tab === 'plan'" class="client-workspace">
          <form class="panel context-form" @submit.prevent="assign">
            <h2>{{ language('Shape the next weeks', 'خطط للأسابيع القادمة') }}</h2>
            <label
              >{{ language('Published plan', 'الخطة المنشورة')
              }}<select v-model="version" required>
                <option v-for="v in versions" :key="v.id" :value="v.id">
                  {{ v.title }} · {{ v.revision }}
                </option>
              </select></label
            ><RouterLink
              class="text-link"
              :to="currentPlan ? '/coach/plans/' + currentPlan.plan_id : '/coach/plans/new'"
              >{{ language('Open plan editor', 'فتح محرر الخطة') }} →</RouterLink
            >
            <div class="field-pair">
              <label
                >{{ language('Start date', 'تاريخ البدء')
                }}<input v-model="start" type="date" required /></label
              ><label
                >{{ language('End date (optional)', 'تاريخ الانتهاء (اختياري)')
                }}<input v-model="end" type="date" :min="start"
              /></label>
            </div>
            <label
              >{{ language('Schedule', 'الجدول')
              }}<select v-model="mode">
                <option value="flexible">
                  {{ language('Flexible — client chooses the day', 'مرن — يختار المتدرب اليوم') }}
                </option>
                <option
                  value="cycle"
                  :disabled="versions.find((v) => v.id === version)?.prescription.schema !== 2"
                >
                  {{ language('Repeat the plan cycle', 'تكرار دورة الخطة') }}
                </option>
              </select></label
            >
            <p class="small-print">
              {{
                language(
                  'Cycle day 1 is the start date. Changes apply to future starts and clear schedule exceptions. Started and completed workouts stay unchanged.',
                  'اليوم الأول للدورة هو تاريخ البدء. تؤثر التعديلات على الحصص القادمة وتزيل استثناءات الجدول. تبقى الحصص التي بدأت أو اكتملت كما هي.',
                )
              }}
            </p>
            <button class="button" :disabled="busy || relationship.state !== 'active' || !version">
              {{ language('Apply assignment', 'تطبيق الخطة') }}
            </button>
          </form>
          <section>
            <h2>{{ language('Next three weeks', 'الأسابيع الثلاثة القادمة') }}</h2>
            <p v-if="!schedule.length">
              {{
                language(
                  'Flexible plans let the client choose a training day. Use a cycle to schedule specific days.',
                  'تتيح الخطط المرنة للمتدرب اختيار يوم التدريب. استخدم دورة لجدولة أيام محددة.',
                )
              }}
            </p>
            <article v-for="d in schedule" :key="d.scheduled_date + d.day.id" class="schedule-row">
              <div>
                <strong>{{ dateLabel(d.date) }} · {{ d.day.name }}</strong>
                <p>
                  {{
                    d.state === 'rest'
                      ? language('Rest day', 'يوم راحة')
                      : d.state === 'skipped'
                        ? language('Skipped', 'متجاوز')
                        : d.state === 'completed'
                          ? t('completed')
                          : d.state === 'in_progress'
                            ? language('In progress', 'قيد التنفيذ')
                            : language('Planned', 'مخطط')
                  }}
                </p>
              </div>
              <div v-if="!d.session_id && !d.day.restDay" class="schedule-actions">
                <label
                  ><span class="sr-only">{{ language('Move to date', 'النقل إلى تاريخ') }}</span
                  ><input v-model="moves[d.scheduled_date + d.day.id]" type="date" /></label
                ><button class="text-link" :disabled="busy" @click="changeDay(d, 'moved')">
                  {{ language('Move', 'نقل') }}</button
                ><button
                  class="text-link"
                  :disabled="busy"
                  @click="changeDay(d, d.state === 'skipped' ? 'planned' : 'skipped')"
                >
                  {{
                    d.state === 'skipped'
                      ? language('Restore', 'استعادة')
                      : language('Skip', 'تجاوز')
                  }}
                </button>
              </div>
            </article>
          </section>
        </section>
        <section v-if="tab === 'history'">
          <h2>{{ language('Training, as it happened', 'التدريب كما حدث') }}</h2>
          <p v-if="!history.length">
            {{
              language(
                'Completed and in-progress workouts will appear here.',
                'ستظهر الحصص المكتملة والجارية هنا.',
              )
            }}
          </p>
          <RouterLink
            v-for="s in history"
            :key="s.id"
            :to="'/coach/review/' + s.id"
            class="workspace-row"
            ><div>
              <strong>{{ s.prescription.name }}</strong>
              <p>{{ dateLabel(s.started_at) }} · {{ s.title }}</p>
            </div>
            <span
              >{{
                s.status === 'completed' ? t('completed') : language('In progress', 'قيد التنفيذ')
              }}
              →</span
            ></RouterLink
          >
        </section>
      </template>
    </PageState>
  </div>
</template>
