<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { user, profile } from '../../app/auth'
import { rows, rpc } from '../../lib/backend'
import { language as l, errorMessage, dateLabel, locale } from '../../lib/i18n'
import { localDate, addDays } from '../../lib/dates'
import type { Assignment, Profile, Relationship, ScheduledDay } from '../../lib/domain'
import type { Measurement, ProgressSession } from './types'
import { exerciseTrend } from './helpers'
import PageState from '../../components/PageState.vue'
const route = useRoute(),
  coach = route.path.startsWith('/coach'),
  relationship = String(route.params.id || '')
const sessions = ref<ProgressSession[]>([]),
  measurements = ref<Measurement[]>([]),
  relationships = ref<Relationship[]>([]),
  people = ref<Profile[]>([]),
  schedule = ref<ScheduledDay[]>([])
const loading = ref(true),
  busy = ref(false),
  error = ref(''),
  notice = ref(''),
  person = ref<Profile>(),
  exercise = ref(''),
  kind = ref('strength')
const today = computed(() => localDate(person.value?.timezone || profile.value?.timezone || 'UTC')),
  from = ref(addDays(localDate(profile.value?.timezone || 'UTC'), -41)),
  to = ref(localDate(profile.value?.timezone || 'UTC'))
const metric = ref('weight'),
  unit = ref<string>(profile.value?.units || 'kg'),
  value = ref<number>(),
  measuredOn = ref(today.value),
  share = ref(''),
  editing = ref<Measurement>(),
  confirmDelete = ref('')
let measurementId: string = crypto.randomUUID()
const options = computed(() =>
  Array.from(new Map(sessions.value.flatMap((s) => s.exercises).map((e) => [e.id, e])).values()),
)
const trend = computed(() =>
  exerciseTrend(sessions.value, exercise.value).filter((x) => x.kind === kind.value),
)
const metricUnit = computed(() =>
  kind.value === 'strength' ? 'kg' : kind.value === 'timed' ? 's' : 'm',
)
const metricLabel = computed(() =>
  kind.value === 'strength'
    ? l('Heaviest completed set (kg)', 'أثقل مجموعة مكتملة (كغ)')
    : kind.value === 'timed'
      ? l('Longest completed set (seconds)', 'أطول مجموعة مكتملة (ثوانٍ)')
      : l('Farthest completed set (metres)', 'أبعد مجموعة مكتملة (أمتار)'),
)
const points = computed(() => {
  const data = trend.value,
    high = Math.max(...data.map((p) => p.value), 1)
  const first = Date.parse(data[0]?.date || '1970-01-01'),
    last = Date.parse(data.at(-1)?.date || '1970-01-01')
  return data
    .map(
      (p) =>
        `${20 + (last === first ? 280 : ((Date.parse(p.date) - first) / (last - first)) * 560)},${130 - (p.value / high) * 110}`,
    )
    .join(' ')
})
const visibleMeasurements = computed(() =>
  measurements.value
    .filter((m) => m.measured_on >= from.value && m.measured_on <= to.value)
    .sort((a, b) => b.measured_on.localeCompare(a.measured_on)),
)
const personName = (r: Relationship) =>
  people.value.find((p) => p.id === r.coach_id)?.display_name || ''
watch(
  exercise,
  () => (kind.value = options.value.find((e) => e.id === exercise.value)?.kind || 'strength'),
)
watch(metric, () => (unit.value = metric.value === 'weight' ? profile.value?.units || 'kg' : 'cm'))
async function load() {
  loading.value = true
  error.value = ''
  try {
    relationships.value = await rows<Relationship>(
      'coach_clients',
      coach ? 'coach_id' : 'client_id',
      user.value!.id,
    )
    people.value = await rows<Profile>('profiles')
    if (coach) {
      const r = relationships.value.find((r) => r.id === relationship)
      if (!r) throw Error('forbidden')
      person.value = people.value.find((p) => p.id === r.client_id)
    } else person.value = profile.value || undefined
    const records = await rpc<ProgressSession[]>('training_progress', {
      p_relationship: relationship || null,
      p_from: from.value,
      p_to: to.value,
    })
    sessions.value = records
    exercise.value ||= options.value[0]?.id || ''
    measurements.value = coach
      ? await rows<Measurement>('measurements', 'relationship_id', relationship)
      : await rows<Measurement>('measurements', 'client_id', user.value!.id)
    const assignments = await rows<Assignment>(
      'assignments',
      coach ? 'relationship_id' : 'client_id',
      coach ? relationship : user.value!.id,
    )
    schedule.value = []
    for (const a of assignments.filter((a) => a.state === 'active' && a.schedule_mode === 'cycle'))
      schedule.value.push(
        ...(await rpc<ScheduledDay[]>('assignment_schedule', {
          p_id: a.id,
          p_from: addDays(today.value, -41),
          p_to: today.value,
        })),
      )
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
function edit(m: Measurement) {
  editing.value = m
  measurementId = m.id
  metric.value = m.metric
  measuredOn.value = m.measured_on
  value.value = m.value
  share.value = m.relationship_id || ''
  queueMicrotask(() => (unit.value = m.unit as typeof unit.value))
}
function reset() {
  editing.value = undefined
  measurementId = crypto.randomUUID()
  value.value = undefined
  notice.value = ''
}
async function save() {
  busy.value = true
  error.value = ''
  try {
    await rpc('save_measurement', {
      p_id: measurementId,
      p_relationship: share.value || null,
      p_metric: metric.value,
      p_date: measuredOn.value,
      p_value: value.value,
      p_unit: unit.value,
      p_revision: editing.value?.revision || 0,
    })
    reset()
    await load()
    notice.value = l('Measurement saved.', 'حُفظ القياس.')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function remove(m: Measurement) {
  busy.value = true
  error.value = ''
  try {
    await rpc('remove_measurement', { p_id: m.id, p_revision: m.revision })
    confirmDelete.value = ''
    await load()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
const normalized = (m: Measurement) =>
  Number((m.value * (m.unit === 'lb' ? 0.45359237 : m.unit === 'in' ? 2.54 : 1)).toFixed(2))
onMounted(load)
</script>
<template>
  <div class="container page">
    <RouterLink v-if="coach" class="back-link" :to="'/coach/clients/' + relationship"
      >← {{ l('Athlete workspace', 'مساحة المتدرب') }}</RouterLink
    >
    <header class="page-heading">
      <p class="overline">
        {{ coach ? person?.display_name : l('Your training over time', 'تدريبك مع الوقت') }}
      </p>
      <h1>{{ l('Progress', 'التقدم') }}</h1>
      <p>
        {{
          l(
            'Completed work, recorded results, and optional measurements.',
            'عمل مكتمل ونتائج مسجلة وقياسات اختيارية.',
          )
        }}
      </p>
    </header>
    <form class="progress-filters" @submit.prevent="load">
      <label>{{ l('From', 'من') }}<input v-model="from" type="date" required :max="to" /></label
      ><label>{{ l('To', 'إلى') }}<input v-model="to" type="date" required :min="from" /></label
      ><button class="button secondary" :disabled="loading">
        {{ l('Apply dates', 'تطبيق التواريخ') }}
      </button>
    </form>
    <PageState :loading="loading" :error="''" @retry="load"
      ><p v-if="error" class="notice error" role="alert">{{ error }}</p>
      <p v-if="notice" class="notice success" role="status">{{ notice }}</p>
      <div class="progress-summary">
        <strong>{{ sessions.length }}</strong
        ><span>{{ l('completed sessions in this range', 'حصة مكتملة في هذه الفترة') }}</span>
      </div>
      <div class="ongoing-layout">
        <section class="form-stack">
          <article class="panel form-stack">
            <h2>{{ l('Exercise history', 'سجل التمرين') }}</h2>
            <p>
              {{
                l(
                  'Only completed sets from saved sessions appear here. Weight is converted to kg; reps and set counts remain separate.',
                  'تظهر المجموعات المكتملة من الحصص المحفوظة فقط. يُحوّل الوزن إلى كغ، وتبقى التكرارات وعدد المجموعات منفصلة.',
                )
              }}
            </p>
            <label
              >{{ l('Exercise', 'التمرين')
              }}<select v-model="exercise">
                <option value="" disabled>{{ l('Choose an exercise', 'اختر تمريناً') }}</option>
                <option v-for="e in options" :key="e.id" :value="e.id">
                  {{ locale === 'ar' ? e.name_ar : e.name }}
                </option>
              </select></label
            >
            <label v-if="options.length"
              >{{ l('Result type', 'نوع النتيجة')
              }}<select v-model="kind">
                <option value="strength">{{ l('Strength · kg', 'قوة · كغ') }}</option>
                <option value="timed">{{ l('Time · seconds', 'وقت · ثوانٍ') }}</option>
                <option value="distance">{{ l('Distance · metres', 'مسافة · أمتار') }}</option>
              </select></label
            >
            <p v-if="!trend.length" class="notice">
              {{
                l(
                  'No completed results of this type in the selected dates.',
                  'لا توجد نتائج مكتملة لهذا النوع في التواريخ المختارة.',
                )
              }}
            </p>
            <template v-else
              ><h3>{{ metricLabel }}</h3>
              <svg
                v-if="trend.length > 1"
                class="trend-chart"
                viewBox="0 0 600 150"
                role="img"
                :aria-label="
                  metricLabel +
                  '; ' +
                  l('Exact values in the list below.', 'القيم الدقيقة في القائمة أدناه.')
                "
              >
                <line x1="20" y1="130" x2="580" y2="130" class="chart-axis" />
                <polyline :points="points" fill="none" class="chart-line" />
                <circle
                  v-for="(point, i) in points.split(' ')"
                  :key="i"
                  :cx="point.split(',')[0]"
                  :cy="point.split(',')[1]"
                  r="4"
                  class="chart-point"
                />
              </svg>
              <p v-if="trend.length === 1" class="subtle">
                {{
                  l(
                    'Your first recorded result. More sessions will build the trend.',
                    'أول نتيجة مسجلة. ستوضح الحصص القادمة مسار التقدم.',
                  )
                }}
              </p>
              <div v-else class="chart-dates" dir="ltr">
                <span>{{ dateLabel(trend[0]!.date) }}</span
                ><span>{{ dateLabel(trend.at(-1)!.date) }}</span>
              </div>
              <ol class="trend-results">
                <li v-for="p in trend" :key="p.id">
                  <RouterLink :to="(coach ? '/coach/review/' : '/workout/') + p.id">{{
                    dateLabel(p.date)
                  }}</RouterLink
                  ><strong>{{ p.value }} {{ metricUnit }}</strong
                  ><span
                    >{{ p.sets }} {{ l('sets', 'مجموعات')
                    }}<template v-if="kind === 'strength'">
                      · {{ p.reps }} {{ l('total reps', 'إجمالي التكرارات') }}</template
                    ></span
                  >
                </li>
              </ol></template
            >
          </article>
          <article class="panel">
            <h2>{{ l('Current schedule · last six weeks', 'الجدول الحالي · آخر ستة أسابيع') }}</h2>
            <p>
              {{
                l(
                  'Based on the current cycle assignment. Schedule edits change this view. Flexible plans do not have a planned-session denominator.',
                  'حسب تكليف الدورة الحالي. تعديل الجدول يغير هذا العرض. لا تحتوي الخطط المرنة على عدد حصص مخطط للمقارنة.',
                )
              }}
            </p>
            <p v-if="!schedule.length" class="notice">
              {{ l('No cycle schedule in this period.', 'لا يوجد جدول دورة لهذه الفترة.') }}
            </p>
            <dl v-else class="schedule-counts">
              <template
                v-for="s in [
                  ['completed', 'Completed', 'مكتمل'],
                  ['in_progress', 'In progress', 'قيد التنفيذ'],
                  ['skipped', 'Skipped', 'متجاوز'],
                  ['rest', 'Rest', 'راحة'],
                  ['planned', 'Outstanding', 'متبقٍ'],
                ]"
                :key="s[0]"
                ><dt>{{ l(s[1]!, s[2]!) }}</dt>
                <dd>
                  {{
                    schedule.filter((d) =>
                      s[0] === 'planned'
                        ? ['planned', 'moved'].includes(d.state)
                        : d.state === s[0],
                    ).length
                  }}
                </dd></template
              >
            </dl>
          </article>
        </section>
        <aside class="form-stack">
          <section class="panel">
            <h2>{{ l('Optional measurements', 'قياسات اختيارية') }}</h2>
            <p>
              {{
                l(
                  'Record only what is useful to you. Sharing is your choice for each record.',
                  'سجّل ما يفيدك فقط. المشاركة اختيارك لكل قياس.',
                )
              }}
            </p>
            <form v-if="!coach" class="form-stack" @submit.prevent="save">
              <label
                >{{ l('Measurement', 'القياس')
                }}<select v-model="metric">
                  <option value="weight">{{ l('Body weight', 'وزن الجسم') }}</option>
                  <option value="waist">{{ l('Waist circumference', 'محيط الخصر') }}</option>
                </select></label
              >
              <div class="field-pair">
                <label
                  >{{ l('Value', 'القيمة')
                  }}<input
                    v-model.number="value"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="2000"
                    required /></label
                ><label
                  >{{ l('Unit', 'الوحدة')
                  }}<select v-model="unit">
                    <template v-if="metric === 'weight'"
                      ><option value="kg">kg</option>
                      <option value="lb">lb</option></template
                    ><template v-else
                      ><option value="cm">cm</option>
                      <option value="in">in</option></template
                    >
                  </select></label
                >
              </div>
              <label
                >{{ l('Date', 'التاريخ')
                }}<input v-model="measuredOn" type="date" required :max="today" /></label
              ><label
                >{{ l('Share with', 'المشاركة مع')
                }}<select v-model="share">
                  <option value="">{{ l('Only me', 'أنا فقط') }}</option>
                  <option
                    v-for="r in relationships.filter((r) => r.state === 'active')"
                    :key="r.id"
                    :value="r.id"
                  >
                    {{ personName(r) }}
                  </option>
                </select></label
              >
              <div class="actions">
                <button class="button" :disabled="busy">
                  {{
                    editing
                      ? l('Save correction', 'حفظ التصحيح')
                      : l('Save measurement', 'حفظ القياس')
                  }}</button
                ><button v-if="editing" type="button" class="text-link" @click="reset">
                  {{ l('Cancel edit', 'إلغاء التعديل') }}
                </button>
              </div>
            </form>
          </section>
          <section class="panel">
            <h2>{{ l('Measurement history', 'سجل القياسات') }}</h2>
            <p v-if="!visibleMeasurements.length">
              {{
                coach
                  ? l(
                      'No shared measurements in this range.',
                      'لا توجد قياسات مشتركة في هذه الفترة.',
                    )
                  : l('No measurements in this range.', 'لا توجد قياسات في هذه الفترة.')
              }}
            </p>
            <article v-for="m in visibleMeasurements" :key="m.id" class="measurement-row">
              <div>
                <small
                  >{{ dateLabel(m.measured_on) }} ·
                  {{ m.metric === 'weight' ? l('Weight', 'الوزن') : l('Waist', 'الخصر') }}</small
                >
                <h3>{{ m.value }} {{ m.unit }}</h3>
                <p v-if="m.unit === 'lb' || m.unit === 'in'">
                  ≈ {{ normalized(m) }} {{ m.metric === 'weight' ? 'kg' : 'cm' }}
                </p>
                <small>{{
                  m.relationship_id
                    ? l('Shared with coach', 'مشترك مع المدرب')
                    : l('Only you', 'أنت فقط')
                }}</small>
              </div>
              <div v-if="!coach" class="actions">
                <button class="text-link" @click="edit(m)">{{ l('Edit', 'تعديل') }}</button
                ><button
                  v-if="confirmDelete !== m.id"
                  class="text-link"
                  @click="confirmDelete = m.id"
                >
                  {{ l('Remove', 'حذف') }}</button
                ><template v-else
                  ><button class="text-link" :disabled="busy" @click="remove(m)">
                    {{ l('Confirm removal', 'تأكيد الحذف') }}</button
                  ><button class="text-link" @click="confirmDelete = ''">
                    {{ l('Keep', 'إبقاء') }}
                  </button></template
                >
              </div>
            </article>
          </section>
        </aside>
      </div>
    </PageState>
  </div>
</template>
