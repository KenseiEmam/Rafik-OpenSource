<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { profile } from '../../app/auth'
import { request } from '../../lib/backend'
import { language as l, errorMessage } from '../../lib/i18n'
import { localDate, addDays } from '../../lib/dates'
import PageState from '../../components/PageState.vue'
import OrganizationNav from '../organizations/OrganizationNav.vue'
import MetricChart from './MetricChart.vue'
const route = useRoute(),
  workspace = String(route.params.workspace || ''),
  view = String(route.params.view || 'coach'),
  base = workspace ? `/organization/${workspace}/${view}` : '/coach'
const from = ref(addDays(localDate(profile.value?.timezone || 'UTC'), -27)),
  to = ref(localDate(profile.value?.timezone || 'UTC')),
  loading = ref(true),
  error = ref(''),
  selected = ref(''),
  search = ref('')
type Report = {
  people: { id: string; name: string }[]
  window: { zone: string; from: string; to: string }
  summary: Record<string, number>
  daily: { date: string; value: number }[]
  attendance: { label: string; value: number }[]
  workload: { id: string; label: string; value: number }[]
  programs: { id: string; label: string; value: number }[]
}
const data = ref<Report>()
async function load() {
  loading.value = true
  error.value = ''
  try {
    data.value = await request<Report>(
      `${workspace ? '/v1/workspaces/' + workspace + '/analytics' : '/v1/coach/analytics'}?view=${view}&from=${from.value}&to=${to.value}&${workspace ? 'member' : 'client'}=${selected.value}&search=${encodeURIComponent(search.value)}`,
    )
  } catch (e) {
    error.value = errorMessage(e)
    data.value = undefined
  } finally {
    loading.value = false
  }
}
const trend = computed(() => {
  if (!data.value || !data.value.daily.length) return []
  const values = new Map(data.value.daily.map((x) => [x.date, x.value])),
    result = []
  for (let day = data.value.window.from; day <= data.value.window.to; day = addDays(day, 1))
    result.push({
      label: day,
      value: values.get(day) || 0,
      href: base + (workspace ? '/training' : '/clients'),
    })
  return result
})
const attendance = computed(
  () =>
    data.value?.attendance.map((a) => ({
      ...a,
      label: l(
        (
          {
            present: 'Present',
            absent: 'Absent',
            excused: 'Excused',
            unmarked: 'Not recorded',
            booked: 'Not recorded',
            attended: 'Attended',
            missed: 'Missed',
          } as Record<string, string>
        )[a.label] || a.label,
        (
          {
            present: 'حاضر',
            absent: 'غائب',
            excused: 'بعذر',
            unmarked: 'لم يسجل',
            booked: 'لم يسجل',
            attended: 'حضر',
            missed: 'لم يحضر',
          } as Record<string, string>
        )[a.label] || a.label,
      ),
    })) || [],
)
onMounted(load)
</script>
<template>
  <OrganizationNav v-if="workspace" />
  <div class="container page analytics-page">
    <header class="work-heading">
      <div>
        <p class="overline">{{ l('Understand the work', 'فهم العمل') }}</p>
        <h1>
          {{
            view === 'admin'
              ? l('Organization analytics', 'تحليلات المؤسسة')
              : l('Coaching analytics', 'تحليلات التدريب')
          }}
        </h1>
        <p>
          {{
            view === 'admin'
              ? l(
                  'Find gaps in delivery and see how your organization participates.',
                  'تعرّف على فجوات التدريب ومشاركة مؤسستك.',
                )
              : l(
                  'See participation and follow-up for the people you coach.',
                  'تابع مشاركة من تدربهم وما يحتاج المتابعة.',
                )
          }}
        </p>
      </div>
    </header>
    <details class="analytics-person-filter">
      <summary>{{ l('Focus on one trainee', 'التركيز على متدرب واحد') }}</summary>
      <form class="analytics-filters" @submit.prevent="load">
        <label
          >{{ l('Find a trainee', 'البحث عن متدرب')
          }}<input type="search" v-model="search" maxlength="100"
        /></label>
        <button class="button secondary" :disabled="loading">{{ l('Find', 'بحث') }}</button>
        <label
          >{{ l('Trainee', 'المتدرب')
          }}<select v-model="selected" @change="load">
            <option value="">{{ l('Everyone in this scope', 'الجميع في هذا النطاق') }}</option>
            <option v-for="person in data?.people || []" :key="person.id" :value="person.id">
              {{ person.name }}
            </option>
          </select></label
        >
      </form>
      <p class="small-print">
        {{
          l(
            'Up to 25 matching people. Search by name to narrow the list. Trainer workload always describes the whole organization.',
            'حتى 25 شخصاً مطابقاً. ابحث بالاسم لتقليل النتائج. حجم عمل المدربين يصف المؤسسة كاملة دائماً.',
          )
        }}
      </p>
    </details>
    <form class="analytics-filters" @submit.prevent="load">
      <label>{{ l('From', 'من') }}<input type="date" v-model="from" :max="to" required /></label
      ><label
        >{{ l('Through', 'حتى') }}<input type="date" v-model="to" :min="from" required /></label
      ><button class="button secondary" :disabled="loading">
        {{ l('Update view', 'تحديث العرض') }}
      </button>
    </form>
    <PageState :loading="loading" :error="error" @retry="load">
      <template v-if="data">
        <p class="small-print">
          {{ data.window.from }} — {{ data.window.to }} · {{ data.window.zone }}.
          {{
            l(
              'Each completion is counted once. Corrections do not add another session.',
              'تحتسب كل حصة مرة واحدة؛ التصحيحات لا تضيف حصة أخرى.',
            )
          }}
        </p>
        <div class="analytics-numbers">
          <RouterLink :to="base + '/people'" v-if="workspace"
            ><strong>{{ data.summary.active }}</strong
            ><span>{{ l('Active trainees now', 'المتدربون النشطون الآن') }}</span></RouterLink
          >
          <RouterLink :to="base + '/clients'" v-else
            ><strong>{{ data.summary.active }}</strong
            ><span>{{ l('Active clients now', 'المتدربون النشطون الآن') }}</span></RouterLink
          >
          <RouterLink :to="base + (workspace ? '/training' : '/clients')"
            ><strong>{{ data.summary.completed }}</strong
            ><span>{{ l('Completed sessions', 'الحصص المكتملة') }}</span></RouterLink
          >
          <div>
            <strong dir="ltr"
              >{{ data.summary.participating }}<small> / {{ data.summary.active }}</small></strong
            ><span>{{ l('Current trainees who trained', 'متدربون حاليون تدربوا') }}</span>
          </div>
          <RouterLink :to="base + (workspace ? '/training' : '/clients')"
            ><strong>{{ data.summary.pending_review }}</strong
            ><span>{{ l('Session reviews outstanding', 'حصص بانتظار المراجعة') }}</span></RouterLink
          >
        </div>
        <section
          class="analytics-attention"
          v-if="data.summary.without_program || data.summary.unassigned"
        >
          <h2>{{ l('Where to follow up', 'ما يحتاج المتابعة') }}</h2>
          <RouterLink v-if="data.summary.unassigned" :to="base + '/people'" class="text-link"
            >{{ data.summary.unassigned }}
            {{
              l('trainees need a responsible trainer', 'متدربين يحتاجون مدرباً مسؤولاً')
            }}</RouterLink
          ><RouterLink
            v-if="data.summary.without_program"
            :to="base + (workspace ? '/training' : '/clients')"
            class="text-link"
            >{{ data.summary.without_program }}
            {{
              l('active trainees have no current program', 'متدربين نشطين بلا برنامج حالي')
            }}</RouterLink
          >
        </section>
        <div class="analytics-charts">
          <MetricChart
            class="wide-chart"
            :title="l('Training over time', 'التدريب عبر الوقت')"
            :description="
              l(
                'Completed sessions in the selected period, including retained history. Participation above uses the current active roster; it is not an adherence score.',
                'الحصص المكتملة في الفترة، بما فيها السجل المحفوظ. المشاركة أعلاه تخص القائمة النشطة الحالية وليست درجة التزام.',
              )
            "
            :items="trend"
            timeline
          />
          <MetricChart
            :title="l('Attendance', 'الحضور')"
            :description="
              l(
                'Participant records for events that have started. Cancelled events are excluded; unrecorded attendance is not absence.',
                'سجلات المشاركين للمواعيد التي بدأت. المواعيد الملغاة مستبعدة وعدم التسجيل لا يعني الغياب.',
              )
            "
            :items="attendance"
          />
          <MetricChart
            v-if="view === 'admin'"
            :title="l('Trainer responsibility', 'مسؤولية المدربين')"
            :description="
              l(
                'Current active trainees by responsible trainer. This shows workload, not trainer quality.',
                'المتدربون النشطون حالياً لكل مدرب مسؤول. هذا حجم العمل وليس جودة المدرب.',
              )
            "
            :items="data.workload.map((x) => ({ ...x, href: base + '/people' }))"
          />
          <MetricChart
            v-if="workspace"
            :title="l('Programs in use', 'البرامج المستخدمة')"
            :description="
              l(
                'Current active assignments by program version title. Historical assignments are excluded.',
                'التعيينات النشطة الحالية حسب عنوان نسخة البرنامج؛ التعيينات السابقة مستبعدة.',
              )
            "
            :items="data.programs.map((x) => ({ ...x, href: base + '/training' }))"
          />
          <section v-else class="metric-chart checkin-summary">
            <h2>{{ l('Check-in response', 'الرد على المتابعات') }}</h2>
            <p class="response-number" dir="ltr">
              {{ data.summary.submitted }} / {{ data.summary.requests }}
            </p>
            <p>
              {{
                l(
                  'Submitted out of non-cancelled requests due in the selected period. Late submissions count; drafts do not.',
                  'الردود المقدمة من الطلبات غير الملغاة المستحقة في الفترة. تحتسب الردود المتأخرة ولا تحتسب المسودات.',
                )
              }}
            </p>
            <RouterLink :to="base + '/checkins'" class="text-link">{{
              l('Open check-ins', 'فتح المتابعات')
            }}</RouterLink>
          </section>
        </div>
        <details class="analytics-method">
          <summary>{{ l('How to read these numbers', 'كيفية قراءة الأرقام') }}</summary>
          <p>
            {{
              l(
                'The date window uses your account timezone. Organization trainer reports use current responsibility; administrators see the organization. Reassigning a trainee changes the trainer’s scope, not the organization’s history. Archived memberships remain in authorized history.',
                'تستخدم الفترة المنطقة الزمنية لحسابك. تقارير المدرب بحسب مسؤوليته الحالية، والمسؤول يرى المؤسسة. إعادة تعيين المتدرب تغيّر نطاق المدرب ولا تغيّر تاريخ المؤسسة. تبقى العضويات المؤرشفة ضمن السجل المصرح.',
              )
            }}
          </p>
          <p>
            {{
              l(
                'These are operational counts, not health outcomes, retention rates, or revenue. A sparse chart means limited evidence. Open Training or Clients to review the underlying work.',
                'هذه أعداد تشغيلية وليست نتائج صحية أو نسب احتفاظ أو إيرادات. قلة البيانات تعني أدلة محدودة. افتح التدريب أو المتدربين لمراجعة العمل الأصلي.',
              )
            }}
          </p>
        </details>
      </template>
    </PageState>
  </div>
</template>
<style scoped>
.analytics-page {
  max-width: 1180px;
}
.analytics-filters {
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}
.analytics-filters label {
  flex: 1;
  max-width: 240px;
  min-width: 0;
}
.analytics-numbers {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-block: 24px 32px;
  border-block: 1px solid var(--line);
}
.analytics-numbers > a,
.analytics-numbers > div {
  padding: 24px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.analytics-numbers strong {
  font-size: 2.3rem;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.analytics-numbers small {
  font-size: 1rem;
  color: var(--muted);
}
.analytics-numbers span {
  font-size: 0.85rem;
  color: var(--muted);
}
.analytics-charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px 40px;
}
.wide-chart {
  grid-column: 1/-1;
}
.analytics-attention {
  padding: 20px;
  border-inline-start: 3px solid var(--accent);
  background: var(--surface);
  margin-bottom: 24px;
  display: grid;
  gap: 10px;
}
.analytics-attention h2,
.checkin-summary h2 {
  font-size: 1.05rem;
}
.checkin-summary {
  border-top: 1px solid var(--line);
  padding-block: 24px;
}
.response-number {
  font-size: 2rem;
}
.analytics-method {
  border-top: 1px solid var(--line);
  padding-top: 24px;
  margin-top: 24px;
}
@media (max-width: 650px) {
  .analytics-filters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .analytics-filters label {
    max-width: none;
  }
  .analytics-filters button {
    grid-column: 1/-1;
  }
  .analytics-charts {
    grid-template-columns: minmax(0, 1fr);
  }
  .analytics-numbers {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .analytics-numbers strong {
    font-size: 1.8rem;
  }
}
@media (max-width: 380px) {
  .analytics-filters {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
  .analytics-filters label {
    max-width: none;
  }
}
</style>
