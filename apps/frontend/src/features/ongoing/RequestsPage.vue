<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { user, profile } from '../../app/auth'
import { rows, rpc } from '../../lib/backend'
import { language as l, errorMessage, dateLabel } from '../../lib/i18n'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { localDate } from '../../lib/dates'
import type { Relationship, Profile } from '../../lib/domain'
import type { CoachingForm, CoachingRequest } from './types'
import { commandRejected, responseState } from './helpers'
import PageState from '../../components/PageState.vue'
const route = useRoute(),
  coach = route.path.startsWith('/coach'),
  base = coach ? '/coach/checkins' : '/checkins'
const loading = ref(true),
  busy = ref(false),
  error = ref(''),
  notice = ref(''),
  assignedFirst = ref(''),
  view = ref('open')
const requests = ref<CoachingRequest[]>([]),
  forms = ref<CoachingForm[]>([]),
  relationships = ref<Relationship[]>([]),
  people = ref<Profile[]>([])
const relation = ref(String(route.query.client || '')),
  formId = ref(''),
  due = ref(localDate(profile.value?.timezone || 'UTC')),
  count = ref(1),
  interval = ref(7)
const assignmentKey = `form-assignment:${user.value!.id}`
type AssignmentCommand = {
  p_series: string
  p_relationship: string
  p_form: string
  p_revision: number
  p_due: string
  p_count: number
  p_interval: number
}
const pendingAssignment = ref<AssignmentCommand>()
const page = ref(0),
  search = ref(''),
  templateSearch = ref('')
const pageSize = 12
const requestList = ref<HTMLElement>()
async function changePage(delta: number) {
  page.value += delta
  await nextTick()
  requestList.value?.scrollIntoView({ block: 'start' })
  requestList.value?.focus({ preventScroll: true })
}
watch([relation, view, search], () => {
  page.value = 0
})
const visibleRequests = computed(() =>
  filtered.value.slice(page.value * pageSize, (page.value + 1) * pageSize),
)
const visibleForms = computed(() =>
  forms.value
    .filter((f) => f.title.toLocaleLowerCase().includes(templateSearch.value.toLocaleLowerCase()))
    .slice(0, 12),
)
const today = computed(() => localDate(profile.value?.timezone || 'UTC'))
const filtered = computed(() =>
  requests.value
    .filter(
      (q) =>
        q.title.toLocaleLowerCase().includes(search.value.toLocaleLowerCase()) &&
        (!relation.value || q.relationship_id === relation.value) &&
        (view.value === 'all' || view.value === 'history'
          ? view.value === 'all' || !!q.submitted_at || q.cancelled
          : !q.cancelled && (coach ? !q.reviewed_at : !q.submitted_at)),
    )
    .sort((a, b) =>
      view.value === 'history'
        ? b.due_date.localeCompare(a.due_date)
        : a.due_date.localeCompare(b.due_date),
    ),
)
const name = (id: string) => {
  const r = relationships.value.find((x) => x.id === id)
  return people.value.find((p) => p.id === (coach ? r?.client_id : r?.coach_id))?.display_name || ''
}
function state(q: CoachingRequest) {
  const s = responseState(q, today.value)
  return {
    cancelled: l('Cancelled', 'ملغي'),
    reviewed: l('Reviewed', 'تمت المراجعة'),
    submitted: l('Ready for review', 'جاهز للمراجعة'),
    overdue: l('Overdue', 'متأخر'),
    due: l('To complete', 'للإكمال'),
  }[s]
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    relationships.value = await rows<Relationship>(
      'coach_clients',
      coach ? 'coach_id' : 'client_id',
      user.value!.id,
    )
    const ids = new Set(relationships.value.map((r) => r.id))
    requests.value = (await rows<CoachingRequest>('coaching_requests')).filter((q) =>
      ids.has(q.relationship_id),
    )
    people.value = await rows<Profile>('profiles')
    if (coach) {
      forms.value = await rows<CoachingForm>('coaching_forms', 'coach_id', user.value!.id)
      formId.value ||= forms.value[0]?.id || ''
    }
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
async function assign() {
  busy.value = true
  error.value = ''
  try {
    const f = forms.value.find((x) => x.id === formId.value)!
    const args = {
      p_relationship: relation.value,
      p_form: f.id,
      p_revision: f.revision,
      p_due: due.value,
      p_count: count.value,
      p_interval: interval.value,
    }
    if (!pendingAssignment.value) {
      pendingAssignment.value = { ...args, p_series: crypto.randomUUID() }
      await storeDraft(assignmentKey, pendingAssignment.value)
    }
    const assigned = await rpc<CoachingRequest[]>('assign_coaching_form', pendingAssignment.value)
    assignedFirst.value = assigned[0]?.id || ''
    await removeDraft(assignmentKey)
    pendingAssignment.value = undefined
    await load()
    search.value = f.title
    view.value = 'all'
    page.value = 0
    notice.value = l(
      'Assigned. Each date has its own response; questions are preserved.',
      'تم التكليف. لكل تاريخ إجابة مستقلة، وتُحفظ الأسئلة كما هي.',
    )
  } catch (e) {
    if (commandRejected(e)) {
      pendingAssignment.value = undefined
      await removeDraft(assignmentKey)
    }
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
onMounted(async () => {
  await load()
  if (coach) {
    const saved = await getDraft<AssignmentCommand>(assignmentKey)
    if (saved) {
      pendingAssignment.value = saved
      relation.value = saved.p_relationship
      formId.value = saved.p_form
      due.value = saved.p_due
      count.value = saved.p_count
      interval.value = saved.p_interval
    }
  }
})
</script>
<template>
  <div class="container page">
    <header class="page-heading heading-actions">
      <div>
        <p class="overline">
          {{ coach ? l('Ongoing coaching', 'متابعة التدريب') : l('With your coach', 'مع مدربك') }}
        </p>
        <h1>{{ l('Check-ins & assessments', 'المتابعات والتقييمات') }}</h1>
        <p>
          {{
            coach
              ? l('A useful question. A clear next step.', 'سؤال مفيد. وخطوة تالية واضحة.')
              : l(
                  'Share what matters, then find your coach’s feedback here.',
                  'شارك ما يهمك، واطلع على ملاحظات مدربك هنا.',
                )
          }}
        </p>
      </div>
      <div v-if="coach" class="actions">
        <a class="button secondary" href="#schedule-checkin">{{
          l('Schedule a check-in', 'جدولة متابعة')
        }}</a
        ><RouterLink class="button" to="/coach/forms/new">{{
          l('Create template', 'إنشاء قالب')
        }}</RouterLink>
      </div>
    </header>
    <PageState :loading="loading" :error="loading ? error : ''" @retry="load">
      <p v-if="error" class="notice error" role="alert">
        {{ error }} <button class="text-link" @click="load">{{ l('Refresh', 'تحديث') }}</button>
      </p>
      <p v-if="notice" class="notice success" role="status">
        {{ notice }}
        <RouterLink v-if="assignedFirst" :to="base + '/' + assignedFirst" class="text-link">{{
          l('View scheduled request', 'عرض الطلب المجدول')
        }}</RouterLink>
      </p>
      <div class="ongoing-layout">
        <section ref="requestList" tabindex="-1" :aria-label="l('Requests', 'الطلبات')">
          <div class="roster-tools">
            <label
              >{{ coach ? l('Athlete', 'الرياضي') : l('Coach', 'المدرب')
              }}<select v-model="relation" :disabled="!!pendingAssignment">
                <option value="">{{ l('Everyone', 'الجميع') }}</option>
                <option v-for="r in relationships" :key="r.id" :value="r.id">
                  {{ name(r.id) }}{{ r.state === 'archived' ? l(' · archived', ' · مؤرشف') : '' }}
                </option>
              </select></label
            ><label
              >{{ l('Show', 'عرض')
              }}<select v-model="view">
                <option value="open">{{ l('Open requests', 'طلبات مفتوحة') }}</option>
                <option value="history">{{ l('Response history', 'سجل الإجابات') }}</option>
                <option value="all">{{ l('All assignments', 'كل التكليفات') }}</option>
              </select></label
            >
          </div>
          <label
            >{{ l('Find a request', 'ابحث عن طلب')
            }}<input
              v-model="search"
              type="search"
              :placeholder="l('Search by title', 'ابحث بالعنوان')"
          /></label>
          <p class="request-total subtle">{{ filtered.length }} {{ l('requests', 'طلبات') }}</p>
          <div v-if="!filtered.length" class="empty-review">
            <h2>{{ l('Nothing waiting here.', 'لا شيء بانتظارك هنا.') }}</h2>
            <p>
              {{
                coach
                  ? l(
                      'Choose a template and athlete to schedule the next conversation.',
                      'اختر قالباً ومتدرباً لجدولة المتابعة القادمة.',
                    )
                  : l(
                      'Your coach’s requests will appear here. You can message them at any time.',
                      'ستظهر طلبات مدربك هنا. يمكنك مراسلته في أي وقت.',
                    )
              }}
            </p>
          </div>
          <RouterLink
            v-for="q in visibleRequests"
            :key="q.id"
            :to="base + '/' + q.id"
            class="review-row request-row"
            ><div class="grow">
              <span class="overline"
                >{{
                  q.kind === 'assessment' ? l('Assessment', 'تقييم') : l('Check-in', 'متابعة')
                }}
                · {{ name(q.relationship_id) }}</span
              >
              <h2>{{ q.title }}</h2>
              <p>
                {{ l('Due', 'الموعد') }} {{ dateLabel(q.due_date) }} · {{ q.fields.length }}
                {{ l('questions', 'أسئلة') }}
              </p>
            </div>
            <span class="tag">{{ state(q) }}</span></RouterLink
          >
          <nav
            v-if="filtered.length > pageSize"
            class="list-pagination"
            :aria-label="l('Request pages', 'صفحات الطلبات')"
          >
            <button class="button small secondary" :disabled="page === 0" @click="changePage(-1)">
              {{ l('Previous', 'السابق') }}</button
            ><span aria-live="polite"
              >{{ page * pageSize + 1 }}–{{ Math.min((page + 1) * pageSize, filtered.length) }} /
              {{ filtered.length }}</span
            ><button
              class="button small secondary"
              :disabled="(page + 1) * pageSize >= filtered.length"
              @click="changePage(1)"
            >
              {{ l('Next', 'التالي') }}
            </button>
          </nav>
        </section>
        <aside v-if="coach" class="form-stack">
          <form id="schedule-checkin" class="panel form-stack" @submit.prevent="assign">
            <h2>{{ l('Schedule a check-in', 'جدولة متابعة') }}</h2>
            <p v-if="pendingAssignment" class="notice">
              {{
                l(
                  'The last assignment is not confirmed. Retry it before creating another.',
                  'لم يتأكد التكليف السابق. أعد المحاولة قبل إنشاء تكليف آخر.',
                )
              }}
            </p>
            <p>
              {{
                l(
                  'Due dates use the athlete calendar. Repeat only as often as useful.',
                  'المواعيد حسب تقويم المتدرب. كرر فقط بالقدر المفيد.',
                )
              }}
            </p>
            <label
              >{{ l('Assign to', 'تكليف')
              }}<select v-model="relation" :disabled="!!pendingAssignment" required>
                <option disabled value="">{{ l('Choose an athlete', 'اختر رياضياً') }}</option>
                <option
                  v-for="r in relationships.filter((x) => x.state === 'active')"
                  :key="r.id"
                  :value="r.id"
                >
                  {{ name(r.id) }}
                </option>
              </select></label
            >
            <label
              >{{ l('Template', 'القالب')
              }}<select v-model="formId" :disabled="!!pendingAssignment" required>
                <option disabled value="">
                  {{ l('Create a template first', 'أنشئ قالباً أولاً') }}
                </option>
                <option v-for="f in forms" :key="f.id" :value="f.id">
                  {{ f.title }} · v{{ f.revision }}
                </option>
              </select></label
            >
            <label
              >{{ l('First due date', 'أول موعد')
              }}<input type="date" v-model="due" :disabled="!!pendingAssignment" required
            /></label>
            <div class="field-pair">
              <label
                >{{ l('Occurrences', 'عدد المرات')
                }}<input
                  v-model.number="count"
                  :disabled="!!pendingAssignment"
                  type="number"
                  min="1"
                  max="12"
                  required /></label
              ><label v-if="count > 1"
                >{{ l('Repeat every', 'التكرار كل')
                }}<select v-model.number="interval" :disabled="!!pendingAssignment">
                  <option :value="7">{{ l('Week', 'أسبوع') }}</option>
                  <option :value="14">{{ l('Two weeks', 'أسبوعين') }}</option>
                </select></label
              >
            </div>
            <button class="button" :disabled="busy || !forms.length || !relation">
              {{ busy ? l('Assigning…', 'جارٍ التكليف…') : l('Assign form', 'تكليف بالنموذج') }}
            </button>
          </form>
          <section class="panel">
            <h2>{{ l('Your templates', 'قوالبك') }}</h2>
            <p v-if="!forms.length">
              {{
                l('Start with a reflection or a simple assessment.', 'ابدأ بمتابعة أو تقييم بسيط.')
              }}
            </p>
            <label v-if="forms.length > 6"
              >{{ l('Find a template', 'ابحث عن قالب')
              }}<input v-model="templateSearch" type="search"
            /></label>
            <p v-if="forms.length > 12" class="subtle">
              {{
                l(
                  'Showing up to 12 templates. Search to find another.',
                  'يُعرض حتى 12 قالباً. ابحث للعثور على المزيد.',
                )
              }}
            </p>
            <RouterLink
              v-for="f in visibleForms"
              :key="f.id"
              class="template-link"
              :to="'/coach/forms/' + f.id"
              ><span>{{ f.title }}</span
              ><small
                >v{{ f.revision }} · {{ f.fields.length }} {{ l('questions', 'أسئلة') }}</small
              ></RouterLink
            >
          </section>
        </aside>
      </div></PageState
    >
  </div>
</template>
