<script setup lang="ts">
import { notifySuccess } from '../../lib/feedback'
import PageHeading from '../../components/PageHeading.vue'
import TimezonePicker from '../../components/TimezonePicker.vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { user, profile } from '../../app/auth'
import { rows, rpc } from '../../lib/backend'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { commandRejected } from '../ongoing/helpers'
import { language as l, locale, errorMessage } from '../../lib/i18n'
import { localDate, addDays } from '../../lib/dates'
import type { Relationship, Profile } from '../../lib/domain'
import { appointmentTime, type Slot, type Appointment } from './model'
import PageState from '../../components/PageState.vue'
const router = useRouter(),
  route = useRoute(),
  coach = route.path.startsWith('/coach'),
  key = `appointments:${user.value!.id}`
const loading = ref(true),
  busy = ref(false),
  error = ref(''),
  notice = ref(''),
  relation = ref(String(route.query.client || '')),
  history = ref(false)
const slots = ref<Slot[]>([]),
  appointments = ref<Appointment[]>([]),
  relationships = ref<Relationship[]>([]),
  people = ref<Profile[]>([])
const zone = ref(profile.value?.timezone || 'UTC'),
  viewZone = ref(profile.value?.timezone || 'UTC'),
  local = ref(addDays(localDate(zone.value), 1) + 'T10:00'),
  minutes = ref(30),
  count = ref(1),
  every = ref(7),
  title = ref(l('Coaching conversation', 'جلسة متابعة')),
  location = ref('')
const preview = ref<{ starts_at: string; ends_at: string }[]>([]),
  previewSignature = ref(''),
  rescheduling = ref(''),
  newSlot = ref(''),
  confirmCancel = ref(''),
  note = ref('')
type Command = {
  name: 'publish_availability' | 'book_appointment' | 'change_appointment'
  args: Record<string, unknown>
}
const pending = ref<Command>()

const validViewZone = computed(() => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: viewZone.value })
    return true
  } catch {
    return false
  }
})
const time = (date: string) => appointmentTime(date, viewZone.value, locale.value)
const name = (id: string) => {
  const r = relationships.value.find((r) => r.id === id)
  return people.value.find((p) => p.id === (coach ? r?.client_id : r?.coach_id))?.display_name || ''
}
const available = computed(() =>
  slots.value
    .filter(
      (s) =>
        s.state === 'open' &&
        Date.parse(s.starts_at) > Date.now() &&
        (coach ||
          relationships.value.some(
            (r) => r.id === relation.value && r.coach_id === s.coach_id && r.state === 'active',
          )),
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
)
const booked = computed(() =>
  appointments.value
    .filter(
      (a) =>
        (!relation.value || a.relationship_id === relation.value) &&
        (history.value || a.state === 'booked'),
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
)
const args = () => ({
  p_local: local.value,
  p_zone: zone.value,
  p_minutes: minutes.value,
  p_count: count.value,
  p_every: every.value,
  p_title: title.value,
  p_location: location.value,
})
const state = (s: string) =>
  ({
    booked: l('Booked', 'محجوز'),
    cancelled: l('Cancelled', 'ملغي'),
    attended: l('Attended', 'حضر'),
    missed: l('Missed', 'لم يحضر'),
  })[s]
function selectRelation() {
  void router.replace({ query: { ...route.query, client: relation.value || undefined } })
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
    people.value = await rows<Profile>('profiles')
    const ids = new Set(relationships.value.map((r) => r.id))
    appointments.value = (await rows<Appointment>('appointments')).filter((a) =>
      ids.has(a.relationship_id),
    )
    slots.value = coach
      ? await rows<Slot>('appointment_slots', 'coach_id', user.value!.id)
      : await rows<Slot>('appointment_slots')
    if (!coach && !relation.value)
      relation.value = relationships.value.find((r) => r.state === 'active')?.id || ''
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
async function inspect() {
  busy.value = true
  error.value = ''
  try {
    preview.value = await rpc('availability_preview', {
      p_local: local.value,
      p_zone: zone.value,
      p_minutes: minutes.value,
      p_count: count.value,
      p_every: every.value,
    })
    previewSignature.value = JSON.stringify(args())
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function execute(command?: Command) {
  busy.value = true
  error.value = ''
  try {
    if (!pending.value && command) {
      pending.value = command
      await storeDraft(key, command)
    }
    if (!pending.value) return
    await rpc(pending.value.name, pending.value.args)
    await removeDraft(key)
    pending.value = undefined
    preview.value = []
    rescheduling.value = ''
    confirmCancel.value = ''
    await load()
    notifySuccess(l('Calendar updated.', 'حُدّث التقويم.'))
  } catch (e) {
    if (commandRejected(e)) {
      pending.value = undefined
      await removeDraft(key)
    }
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
const publish = () =>
  execute({ name: 'publish_availability', args: { ...args(), p_series: crypto.randomUUID() } })
const book = (s: Slot) =>
  execute({
    name: 'book_appointment',
    args: { p_id: crypto.randomUUID(), p_relationship: relation.value, p_slot: s.id },
  })
const change = (a: Appointment, action: string) =>
  execute({
    name: 'change_appointment',
    args: {
      p_id: a.id,
      p_revision: a.revision,
      p_action: action,
      p_slot: action === 'reschedule' ? newSlot.value : null,
      p_note: note.value,
    },
  })
async function withdraw(s: Slot) {
  busy.value = true
  error.value = ''
  try {
    await rpc('withdraw_availability', { p_id: s.id })
    await load()
    notifySuccess(l('Availability withdrawn.', 'سُحبت الإتاحة.'))
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
function possible(a: Appointment) {
  const coachId = relationships.value.find((r) => r.id === a.relationship_id)?.coach_id
  return available.value.filter((s) => s.coach_id === coachId)
}
onMounted(async () => {
  await load()
  pending.value = await getDraft<Command>(key)
})
</script>
<template>
  <div class="container page">
    <RouterLink class="back-link" :to="coach ? '/coach/more' : '/more'"
      >← {{ l('More tools', 'أدوات إضافية') }}</RouterLink
    >
    <PageHeading class="page-heading"
      ><div>
        <p class="overline">{{ l('Make time to connect', 'وقت للتواصل') }}</p>
        <h1>{{ l('Appointments', 'المواعيد') }}</h1>
        <p>
          {{
            l(
              'Book a conversation. Keep training and meeting schedules separate.',
              'احجز جلسة متابعة. تبقى مواعيد الاجتماعات منفصلة عن جدول التدريب.',
            )
          }}
        </p>
        <a v-if="coach" class="button small secondary" href="#availability-editor">{{
          l('Offer availability', 'إضافة إتاحة')
        }}</a>
      </div></PageHeading
    >
    <PageState :loading="loading" :error="''" @retry="load"
      ><p v-if="error" class="notice error" role="alert">
        {{ error }}
        <button class="text-link" @click="load">
          {{ l('Refresh calendar', 'تحديث التقويم') }}
        </button>
      </p>

      <div v-if="pending" class="notice">
        <p>
          {{
            l(
              'The last calendar change is not confirmed. Retry the saved change before making another.',
              'لم يتأكد آخر تعديل للتقويم. أعد محاولة التعديل المحفوظ قبل إجراء تعديل آخر.',
            )
          }}
        </p>
        <button class="button small" :disabled="busy" @click="execute()">
          {{ l('Retry calendar change', 'إعادة محاولة تعديل التقويم') }}
        </button>
      </div>
      <div class="progress-filters">
        <TimezonePicker v-model="viewZone" :label="l('View times in', 'عرض الأوقات حسب')" /><label
          >{{ coach ? l('Athlete', 'الرياضي') : l('Coach', 'المدرب')
          }}<select v-model="relation" @change="selectRelation">
            <option v-if="coach" value="">{{ l('All athletes', 'كل المتدربين') }}</option>
            <option v-for="r in relationships" :key="r.id" :value="r.id">{{ name(r.id) }}</option>
          </select></label
        ><label class="check-label"
          ><input type="checkbox" v-model="history" />{{
            l('Include history', 'تضمين السجل')
          }}</label
        >
      </div>

      <p v-if="!validViewZone" class="notice error" role="alert">
        {{
          l(
            'Choose a valid timezone, such as Asia/Dubai or UTC.',
            'اختر توقيتاً صالحاً مثل Asia/Dubai أو UTC.',
          )
        }}
      </p>
      <p class="subtle">{{ l('Times shown in', 'الأوقات حسب') }} {{ viewZone }}</p>
      <div class="ongoing-layout">
        <section class="form-stack">
          <section class="panel">
            <h2>{{ l('Your appointments', 'مواعيدك') }}</h2>
            <p v-if="!booked.length">
              {{ l('No appointments here yet.', 'لا توجد مواعيد هنا بعد.') }}
            </p>
            <article v-for="a in booked" :key="a.id" class="appointment-row">
              <span class="tag">{{ state(a.state) }}</span>
              <h3>{{ a.title }}</h3>
              <p>
                <strong>{{ time(a.starts_at) }}</strong> –
                {{
                  new Date(a.ends_at).toLocaleTimeString(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: validViewZone ? viewZone : 'UTC',
                  })
                }}
              </p>
              <p>{{ name(a.relationship_id) }} · {{ a.location }}</p>
              <small>{{ l('Offer timezone', 'توقيت الإتاحة') }}: {{ a.timezone }}</small>
              <p v-if="a.note">{{ a.note }}</p>
              <div v-if="a.state === 'booked'" class="actions">
                <template v-if="Date.parse(a.starts_at) > Date.now()"
                  ><button
                    class="text-link"
                    :disabled="busy || !!pending"
                    @click="
                      () => {
                        rescheduling = a.id
                        newSlot = ''
                        note = ''
                        confirmCancel = ''
                      }
                    "
                  >
                    {{ l('Reschedule', 'تغيير الموعد') }}</button
                  ><button
                    class="text-link"
                    :disabled="busy || !!pending"
                    @click="
                      () => {
                        confirmCancel = a.id
                        rescheduling = ''
                        note = ''
                      }
                    "
                  >
                    {{ l('Cancel appointment', 'إلغاء الموعد') }}
                  </button></template
                ><template v-else-if="coach && Date.parse(a.ends_at) < Date.now()"
                  ><button
                    class="text-link"
                    :disabled="busy || !!pending"
                    @click="
                      () => {
                        note = ''
                        change(a, 'attended')
                      }
                    "
                  >
                    {{ l('Mark attended', 'تسجيل الحضور') }}</button
                  ><button
                    class="text-link"
                    :disabled="busy || !!pending"
                    @click="
                      () => {
                        note = ''
                        change(a, 'missed')
                      }
                    "
                  >
                    {{ l('Mark missed', 'تسجيل الغياب') }}
                  </button></template
                >
              </div>
              <form
                v-if="rescheduling === a.id"
                class="form-stack notice"
                @submit.prevent="change(a, 'reschedule')"
              >
                <label
                  >{{ l('New time', 'الوقت الجديد')
                  }}<select v-model="newSlot" required>
                    <option value="" disabled>
                      {{ l('Choose an open time', 'اختر وقتاً متاحاً') }}
                    </option>
                    <option v-for="s in possible(a)" :key="s.id" :value="s.id">
                      {{ time(s.starts_at) }} · {{ s.title }}
                    </option>
                  </select></label
                >
                <p v-if="!possible(a).length">
                  {{
                    l(
                      'No other open times. Ask your coach to add availability.',
                      'لا توجد أوقات أخرى متاحة. اطلب من مدربك إضافة إتاحة.',
                    )
                  }}
                </p>
                <label
                  >{{ l('Reason (optional)', 'السبب (اختياري)')
                  }}<input v-model="note" maxlength="2000"
                /></label>
                <div class="actions">
                  <button class="button small" :disabled="busy || !!pending || !newSlot">
                    {{ l('Confirm new time', 'تأكيد الوقت الجديد') }}</button
                  ><button type="button" class="text-link" @click="rescheduling = ''">
                    {{ l('Keep current time', 'إبقاء الوقت الحالي') }}
                  </button>
                </div>
              </form>
              <div v-if="confirmCancel === a.id" class="notice form-stack">
                <label
                  >{{ l('Cancellation note (optional)', 'ملاحظة الإلغاء (اختياري)')
                  }}<input v-model="note" maxlength="2000"
                /></label>
                <div class="actions">
                  <button
                    class="button small secondary"
                    :disabled="busy || !!pending"
                    @click="change(a, 'cancelled')"
                  >
                    {{ l('Confirm cancellation', 'تأكيد الإلغاء') }}</button
                  ><button class="text-link" @click="confirmCancel = ''">
                    {{ l('Keep appointment', 'إبقاء الموعد') }}
                  </button>
                </div>
              </div>
            </article>
          </section>
          <section class="panel">
            <h2>
              {{
                coach
                  ? l('Published availability', 'الإتاحة المنشورة')
                  : l('Choose a time', 'اختر وقتاً')
              }}
            </h2>
            <p v-if="!available.length">
              {{
                l(
                  'No open times. Check back after availability is added.',
                  'لا توجد أوقات متاحة. تحقق بعد إضافة الإتاحة.',
                )
              }}
            </p>
            <article v-for="s in available" :key="s.id" class="slot-row">
              <div>
                <h3>{{ s.title }}</h3>
                <p>
                  {{ time(s.starts_at) }} ·
                  {{ Math.round((Date.parse(s.ends_at) - Date.parse(s.starts_at)) / 60000) }}
                  {{ l('min', 'دقيقة') }}
                </p>
                <small>{{ s.location }} · {{ s.timezone }}</small>
              </div>
              <button
                v-if="coach"
                class="text-link"
                :disabled="busy || !!pending"
                @click="withdraw(s)"
              >
                {{ l('Withdraw', 'سحب الإتاحة') }}</button
              ><button
                v-else
                class="button small secondary"
                :disabled="busy || !!pending"
                @click="book(s)"
              >
                {{ l('Book this time', 'حجز هذا الوقت') }}
              </button>
            </article>
          </section>
        </section>
        <aside v-if="coach">
          <form id="availability-editor" class="panel form-stack" @submit.prevent="inspect">
            <h2>{{ l('Offer availability', 'إضافة إتاحة') }}</h2>
            <label
              >{{ l('Appointment title', 'عنوان الموعد')
              }}<input v-model="title" required maxlength="100" :disabled="!!pending" /></label
            ><label
              >{{ l('Meeting details', 'تفاصيل اللقاء')
              }}<input
                v-model="location"
                required
                maxlength="500"
                :disabled="!!pending"
                :placeholder="
                  l('Studio, phone, or meeting link', 'المكان أو الهاتف أو رابط اللقاء')
                " /></label
            ><TimezonePicker
              v-model="zone"
              :label="l('Offer timezone', 'توقيت الإتاحة')"
              :disabled="!!pending"
            /><label
              >{{ l('First local date and time', 'أول تاريخ ووقت محلي')
              }}<input type="datetime-local" v-model="local" required :disabled="!!pending"
            /></label>
            <div class="field-pair">
              <label
                >{{ l('Duration', 'المدة')
                }}<select v-model.number="minutes" :disabled="!!pending">
                  <option v-for="m in [15, 30, 45, 60, 90, 120]" :value="m" :key="m">
                    {{ m }} {{ l('min', 'دقيقة') }}
                  </option>
                </select></label
              ><label
                >{{ l('Number of slots', 'عدد المواعيد')
                }}<input
                  type="number"
                  v-model.number="count"
                  min="1"
                  max="8"
                  required
                  :disabled="!!pending"
              /></label>
            </div>
            <label v-if="count > 1"
              >{{ l('Repeat every', 'التكرار كل')
              }}<select v-model.number="every" :disabled="!!pending">
                <option :value="7">{{ l('Week', 'أسبوع') }}</option>
                <option :value="14">{{ l('Two weeks', 'أسبوعين') }}</option>
              </select></label
            ><button class="button secondary" :disabled="busy || !!pending">
              {{ l('Preview times', 'معاينة الأوقات') }}
            </button>
            <div
              v-if="preview.length && previewSignature === JSON.stringify(args())"
              class="availability-preview"
            >
              <h3>{{ l('Confirm these times', 'تأكيد هذه الأوقات') }}</h3>
              <p v-for="s in preview" :key="s.starts_at">
                {{ time(s.starts_at) }} · {{ viewZone }}
              </p>
              <p class="subtle">
                {{
                  l(
                    'Repeated times follow the offer timezone through clock changes. During a repeated clock hour, standard time is used.',
                    'تتبع الأوقات المتكررة توقيت الإتاحة عند تغير الساعة. يُستخدم التوقيت القياسي في الساعة المتكررة.',
                  )
                }}
              </p>
              <button type="button" class="button" :disabled="busy || !!pending" @click="publish">
                {{ l('Publish availability', 'نشر الإتاحة') }}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </PageState>
  </div>
</template>
