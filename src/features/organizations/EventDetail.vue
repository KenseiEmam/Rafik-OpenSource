<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { user } from '../../app/auth'
import { request } from '../../lib/backend'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { language as l, errorMessage, locale } from '../../lib/i18n'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import PageState from '../../components/PageState.vue'
import OrganizationNav from './OrganizationNav.vue'
import type { EventDetail, EventPerson } from './service-types'
import type { Organization } from './types'
const route = useRoute(),
  id = String(route.params.workspace),
  view = String(route.params.view),
  eid = String(route.params.id),
  base = `/organization/${id}/${view}`,
  endpoint = `/v1/workspaces/${id}/calendar`,
  scope = `event:${id}:${eid}:${view}`
const data = ref<EventDetail>(),
  organization = ref<Organization>(),
  loading = ref(true),
  error = ref(''),
  attendance = ref<Record<string, string>>({}),
  selected = ref(''),
  values = ref<Record<string, number | string>>({}),
  note = ref(''),
  revision = ref(0),
  draftReady = ref(false),
  draftError = ref(''),
  editingTime = ref(false),
  cancelOpen = ref(false),
  futureSeries = ref(false),
  newStaff = ref<string[]>([]),
  changingStaff = ref(false),
  local = ref(''),
  zone = ref('UTC'),
  minutes = ref(60),
  previewTimes = ref<{ starts_at: string; ends_at: string }[]>([]),
  previewError = ref('')
const trainees = computed(() => data.value?.people.filter((p) => p.duty === 'trainee') || []),
  person = computed(() => trainees.value.find((p) => p.member_id === selected.value)),
  result = computed(() => data.value?.results.find((r) => r.member_id === selected.value))
const now = ref(Date.now())
const clock = window.setInterval(() => {
  now.value = Date.now()
}, 15000)
onUnmounted(() => window.clearInterval(clock))
const started = computed(
    () => !!data.value && new Date(data.value.event.starts_at).getTime() <= now.value,
  ),
  writable = computed(
    () => view !== 'trainee' && data.value?.event.state !== 'cancelled' && started.value,
  )
const draftKey = () => `assessment-result:${user.value!.id}:${id}:${eid}:${selected.value}`
function localInput(instant: string, tz: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(instant))
  const v = (type: string) => parts.find((p) => p.type === type)!.value
  return `${v('year')}-${v('month')}-${v('day')}T${v('hour')}:${v('minute')}`
}
const label = (value: string) =>
  new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-AE' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'shortOffset',
    timeZone: data.value?.event.timezone || 'UTC',
  }).format(new Date(value))
const attendanceName = (value: string) =>
  l(
    (
      {
        present: 'Present',
        absent: 'Absent',
        excused: 'Excused',
        unmarked: 'Not recorded',
      } as Record<string, string>
    )[value] || value,
    (
      { present: 'حاضر', absent: 'غائب', excused: 'بعذر', unmarked: 'لم يسجل' } as Record<
        string,
        string
      >
    )[value] || value,
  )
async function load() {
  loading.value = true
  error.value = ''
  try {
    data.value = await request<EventDetail>(endpoint + `?view=${view}&id=${eid}`)
    attendance.value = Object.fromEntries(data.value.people.map((p) => [p.member_id, p.attendance]))
    zone.value = data.value.event.timezone
    local.value = localInput(data.value.event.starts_at, zone.value)
    minutes.value =
      (Date.parse(data.value.event.ends_at) - Date.parse(data.value.event.starts_at)) / 60000
    newStaff.value = data.value.people.filter((p) => p.duty === 'staff').map((p) => p.member_id)
    if (view === 'admin')
      organization.value = await request<Organization>(`/v1/workspaces/${id}?view=admin`)
    newStaff.value = newStaff.value.filter((id) =>
      data.value!.people.some((p) => p.member_id === id && p.active && p.roles.includes('trainer')),
    )
  } catch (e) {
    error.value = errorMessage(e)
    data.value = undefined
  } finally {
    loading.value = false
  }
}
async function openResult(p: EventPerson, restore = true) {
  draftReady.value = false
  selected.value = p.member_id
  const current = data.value?.results.find((r) => r.member_id === p.member_id)
  values.value = { ...(current?.values || {}) }
  note.value = current?.note || ''
  revision.value = current?.revision || 0
  if (restore) {
    const saved = await getDraft<{ values: typeof values.value; note: string; revision: number }>(
      draftKey(),
    ).catch(() => undefined)
    if (saved) {
      values.value = saved.values
      note.value = saved.note
      revision.value = saved.revision
    }
  }
  draftReady.value = true
  await nextTick()
  document.querySelector<HTMLElement>('.result-editor h2')?.focus()
}
const command = useCommand<'change'>(
  scope,
  async (_, result, args) => {
    if (args.action === 'result') {
      await removeDraft(`assessment-result:${user.value!.id}:${id}:${eid}:${args.member}`)
      draftReady.value = false
      selected.value = ''
    }
    editingTime.value = false
    cancelOpen.value = false
    changingStaff.value = false
    await load()
  },
  (_, args) => request(endpoint, { method: 'POST', body: JSON.stringify(args) }),
)
const locked = computed(() => command.state.busy || !!command.state.pending || !command.state.ready)
const run = (args: Record<string, unknown>) =>
  command.run('change', {
    id: eid,
    view,
    operation: crypto.randomUUID(),
    revision: data.value!.event.revision,
    ...args,
  })
async function previewTime() {
  previewError.value = ''
  try {
    previewTimes.value = await request(`/v1/workspaces/${id}/calendar-preview`, {
      method: 'POST',
      body: JSON.stringify({
        view,
        local: local.value,
        zone: zone.value,
        minutes: minutes.value,
        count: 1,
        every: 7,
      }),
    })
  } catch (e) {
    previewError.value = errorMessage(e)
  }
}
watch([local, zone, minutes], () => {
  previewTimes.value = []
})
const previewLabel = (value: string) =>
  new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-AE' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'long',
    timeZone: zone.value,
  }).format(new Date(value))
function saveResult() {
  return run({
    action: 'result',
    member: selected.value,
    revision: revision.value,
    values: values.value,
    note: note.value,
  })
}
function closeResult() {
  draftReady.value = false
  selected.value = ''
}
watch(
  [values, note],
  async () => {
    if (!draftReady.value || !selected.value) return
    try {
      await storeDraft(draftKey(), {
        values: values.value,
        note: note.value,
        revision: revision.value,
      })
      draftError.value = ''
    } catch (e) {
      draftError.value = errorMessage(e)
    }
  },
  { deep: true },
)
onMounted(load)
</script>
<template>
  <OrganizationNav />
  <div class="container page event-detail">
    <RouterLink
      class="back-link"
      :to="base + '/calendar' + (route.query.from ? '?from=' + route.query.from : '')"
      >{{ l('Back to calendar', 'العودة للتقويم') }}</RouterLink
    >
    <header class="work-heading">
      <div>
        <p class="overline">{{ l('Organization event', 'موعد المؤسسة') }}</p>
        <h1>{{ data?.event.title || l('Event', 'الموعد') }}</h1>
      </div>
    </header>
    <CommandStatus :command="command" />
    <PageState :loading="loading" :error="error" @retry="load"
      ><template v-if="data">
        <section class="event-overview">
          <p class="event-when">
            {{ label(data.event.starts_at) }} — {{ label(data.event.ends_at) }}
          </p>
          <p>{{ data.event.location || l('Location to be agreed', 'الموقع يحدد لاحقاً') }}</p>
          <p>
            {{ l('Trainers / assessors', 'المدربون / المقيمون') }}:
            {{
              data.people
                .filter((p) => p.duty === 'staff')
                .map((p) => p.name)
                .join(' · ')
            }}
          </p>
          <p
            v-if="
              data.people.some(
                (p) => p.duty === 'staff' && (!p.active || !p.roles.includes('trainer')),
              )
            "
            class="notice"
          >
            {{
              l(
                'A trainer is no longer active in this role. An administrator can reassign this event below.',
                'لم يعد أحد المدربين نشطاً بهذا الدور. يمكن للمسؤول إعادة تعيين الموعد أدناه.',
              )
            }}
          </p>
          <span class="tag">{{
            data.event.state === 'cancelled'
              ? l('Cancelled', 'ملغي')
              : data.event.state === 'completed'
                ? l('Completed', 'مكتمل')
                : l('Scheduled', 'مجدول')
          }}</span>
        </section>
        <div v-if="view !== 'trainee' && data.event.state === 'scheduled'" class="event-tools">
          <button
            v-if="!started"
            class="text-link"
            @click="editingTime = !editingTime"
            :disabled="locked"
          >
            {{ l('Reschedule this event', 'إعادة جدولة هذا الموعد') }}</button
          ><button
            v-if="view === 'admin'"
            class="text-link"
            @click="changingStaff = !changingStaff"
            :disabled="locked"
          >
            {{ l('Reassign staff', 'إعادة تعيين الموظفين') }}</button
          ><button
            v-if="!data.results.length"
            class="text-link"
            @click="cancelOpen = !cancelOpen"
            :disabled="locked"
          >
            {{ l('Cancel event', 'إلغاء الموعد') }}
          </button>
        </div>
        <form
          v-if="editingTime"
          class="panel event-change"
          @submit.prevent="
            previewTimes.length
              ? run({ action: 'reschedule', local, zone, minutes })
              : previewTime()
          "
        >
          <fieldset :disabled="locked" class="form-fields">
            <h2>{{ l('Change this occurrence', 'تغيير هذا الموعد') }}</h2>
            <label
              >{{ l('Local date and time', 'التاريخ والوقت المحلي')
              }}<input type="datetime-local" v-model="local" required /></label
            ><label>{{ l('Timezone', 'المنطقة الزمنية') }}<input v-model="zone" required /></label
            ><label
              >{{ l('Minutes', 'الدقائق')
              }}<select v-model.number="minutes">
                <option v-for="n in [15, 30, 45, 60, 90, 120]" :key="n" :value="n">{{ n }}</option>
              </select></label
            >
            <p class="small-print">
              {{
                l(
                  'Only this occurrence changes. Participant conflicts are checked before saving.',
                  'يتغير هذا الموعد فقط. تُفحص تعارضات المشاركين قبل الحفظ.',
                )
              }}
            </p>
            <p v-if="previewError" role="alert" class="notice error">{{ previewError }}</p>
            <p v-for="time in previewTimes" :key="time.starts_at">
              {{ previewLabel(time.starts_at) }} — {{ previewLabel(time.ends_at) }}
            </p>
            <button class="button">
              {{
                previewTimes.length
                  ? l('Confirm new time', 'تأكيد الوقت الجديد')
                  : l('Review new time', 'مراجعة الوقت الجديد')
              }}
            </button>
          </fieldset>
        </form>
        <form
          v-if="changingStaff && organization"
          class="panel event-change"
          @submit.prevent="run({ action: 'staff', staff: newStaff })"
        >
          <fieldset :disabled="locked" class="form-fields">
            <h2>{{ l('Assign active trainers', 'تعيين مدربين نشطين') }}</h2>
            <label
              v-for="m in organization.members.filter(
                (m) =>
                  m.active &&
                  m.roles.includes('trainer') &&
                  !trainees.some((p) => p.member_id === m.id),
              )"
              :key="m.id"
              class="check-label"
              ><input type="checkbox" v-model="newStaff" :value="m.id" />{{ m.name }}</label
            >
            <p class="small-print">
              {{
                l(
                  'The selected staff can see this event and its participant results. Existing history is preserved.',
                  'يمكن للموظفين المحددين رؤية الموعد ونتائج المشاركين. يُحفظ السجل السابق.',
                )
              }}
            </p>
            <button class="button" :disabled="!newStaff.length">
              {{ l('Confirm staff assignment', 'تأكيد تعيين الموظفين') }}
            </button>
          </fieldset>
        </form>
        <section v-if="cancelOpen" class="panel event-change">
          <h2>{{ l('Cancel this event?', 'إلغاء هذا الموعد؟') }}</h2>
          <p>{{ data.event.title }} · {{ label(data.event.starts_at) }}</p>
          <label v-if="!started" class="check-label"
            ><input v-model="futureSeries" type="checkbox" />{{
              l(
                'Also cancel later scheduled events in this series',
                'إلغاء المواعيد التالية المجدولة من هذه السلسلة أيضاً',
              )
            }}</label
          >
          <p>
            {{
              l(
                'Cancelled events stay in the calendar history. An event with recorded results cannot be cancelled.',
                'تبقى المواعيد الملغاة في سجل التقويم. لا يمكن إلغاء موعد بنتائج مسجلة.',
              )
            }}
          </p>
          <button
            class="button"
            :disabled="locked"
            @click="run({ action: 'cancel', future_series: futureSeries })"
          >
            {{ l('Confirm cancellation', 'تأكيد الإلغاء') }}
          </button>
        </section>
        <section v-if="selected && person && writable" class="panel result-editor">
          <div class="heading-actions">
            <h2 tabindex="-1">{{ person.name }}</h2>
            <button class="text-link" @click="closeResult" :disabled="locked">
              {{ l('Back to participants', 'العودة للمشاركين') }}
            </button>
          </div>
          <form @submit.prevent="saveResult">
            <fieldset class="form-fields" :disabled="locked">
              <label v-for="drill in data.event.definition || []" :key="drill.key"
                >{{ drill.name }} <span v-if="drill.unit">({{ drill.unit }})</span
                ><input
                  v-if="drill.kind === 'number'"
                  v-model.number="values[drill.key]"
                  type="number"
                  step="any"
                  inputmode="decimal"
                  :min="drill.min"
                  :max="drill.max"
                  required
                /><textarea
                  v-else
                  v-model="values[drill.key]"
                  maxlength="1000"
                  required
                  rows="2"
                /></label
              ><label
                >{{ l('Assessor note (optional)', 'ملاحظة المقيم (اختياري)')
                }}<textarea v-model="note" maxlength="2000" rows="3" />
              </label>
              <p class="small-print">
                {{
                  l(
                    'This trainee sees their own result. Your organization retains the result and correction history.',
                    'يرى المتدرب نتيجته فقط. تحتفظ مؤسستك بالنتيجة وسجل التصحيحات.',
                  )
                }}
              </p>
              <p v-if="draftError" class="notice error" role="alert">{{ draftError }}</p>
              <button class="button">
                {{ result ? l('Save correction', 'حفظ التصحيح') : l('Save result', 'حفظ النتيجة') }}
              </button>
            </fieldset>
          </form>
        </section>
        <section v-if="!selected" class="event-participants">
          <h2>{{ l('Participants', 'المشاركون') }}</h2>
          <p v-if="!started && view !== 'trainee'" class="small-print">
            {{
              l(
                'Attendance and results open when this event starts.',
                'يفتح تسجيل الحضور والنتائج عند بدء الموعد.',
              )
            }}
          </p>
          <article v-for="p in trainees" :key="p.member_id" class="event-participant">
            <div>
              <h3>{{ p.name }}</h3>
              <span v-if="!writable">{{ attendanceName(p.attendance) }}</span>
              <p v-if="data.results.some((r) => r.member_id === p.member_id)" class="small-print">
                {{ l('Result recorded', 'النتيجة مسجلة') }}
              </p>
            </div>
            <div v-if="writable" class="participant-actions">
              <label class="sr-only" :for="'attendance-' + p.member_id"
                >{{ l('Attendance for', 'حضور') }} {{ p.name }}</label
              ><select
                :id="'attendance-' + p.member_id"
                v-model="attendance[p.member_id]"
                :disabled="locked"
              >
                <option value="unmarked">{{ l('Not recorded', 'لم يسجل') }}</option>
                <option value="present">{{ l('Present', 'حاضر') }}</option>
                <option value="absent">{{ l('Absent', 'غائب') }}</option>
                <option value="excused">{{ l('Excused', 'بعذر') }}</option></select
              ><button
                class="button secondary small"
                :disabled="locked || attendance[p.member_id] === p.attendance"
                @click="
                  run({
                    action: 'attendance',
                    member: p.member_id,
                    revision: p.revision,
                    attendance: attendance[p.member_id],
                  })
                "
              >
                {{ l('Save attendance', 'حفظ الحضور') }}</button
              ><button
                v-if="data.event.kind === 'assessment' && p.attendance === 'present'"
                class="button small"
                :disabled="locked"
                @click="openResult(p)"
              >
                {{
                  data.results.some((r) => r.member_id === p.member_id)
                    ? l('Review / correct result', 'مراجعة / تصحيح النتيجة')
                    : l('Record result', 'تسجيل النتيجة')
                }}
              </button>
            </div>
          </article>
          <button
            v-if="writable && data.event.state === 'scheduled'"
            class="button"
            :disabled="locked"
            @click="run({ action: 'finish' })"
          >
            {{ l('Finish event', 'إنهاء الموعد') }}
          </button>
        </section>
        <section v-if="data.results.length && !selected" class="event-results">
          <h2>{{ l('Recorded results', 'النتائج المسجلة') }}</h2>
          <article v-for="r in data.results" :key="r.member_id" class="panel">
            <h3>{{ trainees.find((p) => p.member_id === r.member_id)?.name }}</h3>
            <dl>
              <template v-for="d in data.event.definition || []" :key="d.key"
                ><dt>{{ d.name }}</dt>
                <dd>{{ r.values[d.key] }} {{ d.unit }}</dd></template
              >
            </dl>
            <p v-if="r.note">{{ r.note }}</p>
            <details>
              <summary>{{ l('Correction history', 'سجل التصحيحات') }}</summary>
              <p class="small-print">
                {{
                  l(
                    'Most recent 100 saved revisions in this event.',
                    'أحدث 100 نسخة محفوظة في هذا الموعد.',
                  )
                }}
              </p>
              <article
                v-for="h in data.history.filter((h) => h.member_id === r.member_id)"
                :key="h.id"
              >
                <p>{{ l('Revision', 'النسخة') }} {{ h.revision }} · {{ label(h.recorded_at) }}</p>
                <p v-for="d in data.event.definition || []" :key="d.key">
                  {{ d.name }}: {{ h.document.values[d.key] }} {{ d.unit }}
                </p>
                <p v-if="h.document.note">{{ h.document.note }}</p>
              </article>
            </details>
          </article>
        </section>
      </template></PageState
    >
  </div>
</template>
<style scoped>
.event-detail {
  max-width: 1100px;
}
.event-overview {
  padding-block: 0 24px;
  border-bottom: 1px solid var(--line);
}
.event-when {
  font-weight: 650;
}
.event-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 28px;
  margin-block: 20px;
}
.event-change,
.result-editor {
  max-width: 740px;
  margin-block: 24px;
}
.event-change label,
.result-editor label {
  margin-block: 16px;
}
.event-change h2,
.result-editor h2,
.event-participants h2,
.event-results h2 {
  font-size: 1.25rem;
}
.event-participants {
  margin-block: 32px;
}
.event-participant {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  padding-block: 20px;
  border-bottom: 1px solid var(--line);
}
.event-participant h3 {
  font-size: 1.05rem;
  margin: 0;
}
.event-participant > div {
  min-width: 0;
  overflow-wrap: anywhere;
}
.participant-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.participant-actions select {
  width: 160px;
}
.event-participants > button {
  margin-top: 24px;
}
.event-results > article {
  margin-block: 20px;
}
.event-results h3 {
  font-size: 1.05rem;
}
.event-results dl {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
}
.event-results dd {
  margin: 0;
  font-weight: 650;
  overflow-wrap: anywhere;
}
.event-results details article {
  border-bottom: 1px solid var(--line);
  padding-block: 12px;
}
.event-results p {
  overflow-wrap: anywhere;
}
@media (max-width: 750px) {
  .event-participant {
    display: block;
  }
  .participant-actions {
    margin-top: 14px;
  }
  .participant-actions select {
    width: 100%;
  }
  .event-change,
  .result-editor {
    padding: 20px;
  }
}
</style>
