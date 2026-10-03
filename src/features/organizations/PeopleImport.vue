<script setup lang="ts">
// Spreadsheet roster import. Each row becomes an ordinary invitation command with its own
// operation id; the whole job is stored on this device before dispatch so an interrupted
// import can resume without creating a second invitation for anyone.
import { computed, onMounted, ref } from 'vue'
import { PhFileXls, PhDownloadSimple, PhCheckCircle, PhWarningCircle } from '@phosphor-icons/vue'
import { user } from '../../app/auth'
import { ApiError, request } from '../../lib/backend'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { language as l, errorMessage } from '../../lib/i18n'
import {
  readSpreadsheet,
  parseDelimited,
  buildXlsx,
  downloadBlob,
  SpreadsheetError,
} from '../../lib/spreadsheet'
import { importRows, tooManyRows, MAX_IMPORT_ROWS, type ImportRow } from './people-import'
import type { Role } from './types'
const props = defineProps<{ workspace: string; organization: string }>()
const emit = defineEmits<{ changed: []; close: [] }>()
type JobRow = ImportRow & {
  id: string
  token: string
  operation: string
  state: 'pending' | 'invited' | 'skipped' | 'failed'
  reason: string
}
type Job = { rows: JobRow[]; source: string }
const key = `organization-import:${user.value!.id}:${props.workspace}`
const step = ref<'choose' | 'review' | 'run'>('choose'),
  fallback = ref<Role>('trainee'),
  source = ref(''),
  rows = ref<ImportRow[]>([]),
  job = ref<Job>(),
  reading = ref(false),
  running = ref(false),
  readError = ref(''),
  pasted = ref(''),
  copied = ref(false),
  dragging = ref(false)
const ready = computed(() => rows.value.filter((r) => !r.problem))
const problems = computed(() => rows.value.filter((r) => r.problem))
const counts = computed(() => {
  const all = job.value?.rows || []
  const of = (state: JobRow['state']) => all.filter((r) => r.state === state).length
  return {
    total: all.length,
    invited: of('invited'),
    skipped: of('skipped'),
    failed: of('failed'),
    pending: of('pending'),
  }
})
const finished = computed(() => !running.value && !counts.value.pending)
const roleName = (role: string) =>
  l(
    { admin: 'Administrator', trainer: 'Trainer', trainee: 'Trainee' }[role] || role,
    { admin: 'مسؤول', trainer: 'مدرب', trainee: 'متدرب' }[role] || role,
  )
const problemText = (problem: ImportRow['problem']) =>
  ({
    missing_email: l('No email address', 'لا يوجد بريد إلكتروني'),
    invalid_email: l('Email is not valid', 'البريد الإلكتروني غير صالح'),
    duplicate: l('Repeated in this file', 'مكرر في الملف'),
    invalid_role: l('Unknown role', 'دور غير معروف'),
    '': '',
  })[problem]
const fileProblem = (code: string) =>
  ({
    spreadsheet_too_large: l('This file is larger than 5 MB.', 'حجم الملف أكبر من 5 ميغابايت.'),
    spreadsheet_legacy_xls: l(
      'Old .xls files cannot be read. In Excel choose File → Save As → Excel Workbook (.xlsx), or CSV.',
      'لا يمكن قراءة ملفات ‎.xls‎ القديمة. احفظ الملف في Excel بصيغة ‎.xlsx‎ أو CSV.',
    ),
    spreadsheet_unsupported_browser: l(
      'This browser cannot open .xlsx files. Save the sheet as CSV, or paste the rows below.',
      'هذا المتصفح لا يفتح ملفات ‎.xlsx‎. احفظ الورقة بصيغة CSV أو الصق الصفوف أدناه.',
    ),
  })[code] ||
  l(
    'We could not read this file. Save it as .xlsx or CSV and try again.',
    'تعذرت قراءة الملف. احفظه بصيغة ‎.xlsx‎ أو CSV وحاول مجدداً.',
  )
function useTable(table: string[][], name: string) {
  readError.value = ''
  if (!table.length) {
    readError.value = l('No rows were found.', 'لم يتم العثور على صفوف.')
    return
  }
  if (tooManyRows(table))
    readError.value = l(
      `Only the first ${MAX_IMPORT_ROWS} people are imported at a time. Split larger lists into several files.`,
      `يتم استيراد أول ${MAX_IMPORT_ROWS} شخص فقط في كل مرة. قسّم القوائم الكبيرة إلى عدة ملفات.`,
    )
  const parsed = importRows(table, fallback.value)
  if (!parsed.some((r) => r.email)) {
    readError.value = l(
      'No email column was found. Add a column titled “Email” and try again.',
      'لم يتم العثور على عمود للبريد الإلكتروني. أضف عموداً بعنوان «Email» وحاول مجدداً.',
    )
    return
  }
  rows.value = parsed
  source.value = name
  step.value = 'review'
}
async function choose(file?: File | null) {
  if (!file) return
  reading.value = true
  try {
    useTable(await readSpreadsheet(file), file.name)
  } catch (e) {
    readError.value =
      e instanceof SpreadsheetError ? fileProblem(e.message) : fileProblem('unreadable')
  } finally {
    reading.value = false
  }
}
function readPasted() {
  useTable(parseDelimited(pasted.value), l('Pasted rows', 'صفوف ملصقة'))
}
function template() {
  downloadBlob(
    buildXlsx(
      [
        ['Name', 'Email', 'Role'],
        ['Example Trainee', 'trainee@example.com', 'Trainee'],
        ['Example Trainer', 'trainer@example.com', 'Trainer'],
      ],
      'People',
      [28, 34, 14],
    ),
    'rafik-people-template.xlsx',
  )
}
const token = () =>
  [...crypto.getRandomValues(new Uint8Array(32))]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
async function start() {
  job.value = {
    source: source.value,
    rows: ready.value.map((r) => ({
      ...r,
      id: crypto.randomUUID(),
      token: token(),
      operation: crypto.randomUUID(),
      state: 'pending',
      reason: '',
    })),
  }
  try {
    // Durable before dispatch: a reload resumes with the same operation ids.
    await storeDraft(key, job.value)
  } catch (e) {
    readError.value = errorMessage(e)
    job.value = undefined
    return
  }
  step.value = 'run'
  await send()
}
async function send() {
  if (!job.value || running.value) return
  running.value = true
  for (const row of job.value.rows) {
    if (row.state !== 'pending') continue
    try {
      await request(`/v1/workspaces/${props.workspace}`, {
        method: 'POST',
        body: JSON.stringify({
          operation: row.operation,
          action: 'invite',
          id: row.id,
          email: row.email,
          roles: [row.role],
          token: row.token,
        }),
      })
      row.state = 'invited'
    } catch (e) {
      const api = e instanceof ApiError ? e : null
      const known = !!api && api.statusCode >= 400 && api.statusCode < 500
      if (api && known && ['already_member', 'invitation_pending'].includes(api.message)) {
        row.state = 'skipped'
        row.reason = errorMessage(e)
      } else {
        row.state = 'failed'
        row.reason = errorMessage(e)
        // Unknown outcome: stop so a retry replays the same operation in order.
        if (!known) {
          await storeDraft(key, job.value).catch(() => {})
          break
        }
      }
    }
    await storeDraft(key, job.value).catch(() => {})
  }
  running.value = false
  emit('changed')
}
async function retry() {
  if (!job.value) return
  for (const row of job.value.rows) if (row.state === 'failed') row.state = 'pending'
  await storeDraft(key, job.value).catch(() => {})
  await send()
}
const link = (row: JobRow) => location.origin + '/organization-invite/' + row.token
const statusText = (row: JobRow) =>
  row.state === 'invited'
    ? l('Invitation ready', 'الدعوة جاهزة')
    : row.state === 'skipped'
      ? row.reason
      : row.state === 'failed'
        ? row.reason || l('Not sent', 'لم تُرسل')
        : running.value
          ? l('Waiting…', 'بالانتظار…')
          : l('Not started', 'لم تبدأ')
function results() {
  if (!job.value) return
  downloadBlob(
    buildXlsx(
      [
        ['Name', 'Email', 'Role', 'Status', 'Invitation link'],
        ...job.value.rows.map((r) => [
          r.name,
          r.email,
          roleName(r.role),
          statusText(r),
          r.state === 'invited' ? link(r) : '',
        ]),
      ],
      'Invitations',
      [26, 34, 14, 30, 80],
    ),
    'rafik-invitations.xlsx',
  )
}
async function copyLinks() {
  const text = (job.value?.rows || [])
    .filter((r) => r.state === 'invited')
    .map((r) => [r.name, r.email, link(r)].filter(Boolean).join('\t'))
    .join('\n')
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
  } catch {
    copied.value = false
  }
}
async function finish() {
  await removeDraft(key).catch(() => {})
  job.value = undefined
  rows.value = []
  step.value = 'choose'
  emit('close')
}
async function discardStored() {
  await removeDraft(key).catch(() => {})
  job.value = undefined
  step.value = 'choose'
}
onMounted(async () => {
  const stored = await getDraft<Job>(key).catch(() => undefined)
  if (stored?.rows?.length) {
    job.value = stored
    step.value = 'run'
  }
})
</script>
<template>
  <div class="people-import">
    <template v-if="step === 'choose'">
      <p class="import-intro">
        {{
          l(
            `Add up to ${MAX_IMPORT_ROWS} people at once. Only an email address is required; name and role are optional.`,
            `أضف حتى ${MAX_IMPORT_ROWS} شخص دفعة واحدة. البريد الإلكتروني فقط مطلوب، والاسم والدور اختياريان.`,
          )
        }}
      </p>
      <label
        class="import-drop"
        :class="{ dragging }"
        @dragover.prevent="dragging = true"
        @dragleave="dragging = false"
        @drop.prevent="
          dragging = false
          choose($event.dataTransfer?.files[0])
        "
      >
        <PhFileXls :size="34" aria-hidden="true" />
        <strong>{{
          reading
            ? l('Reading your file…', 'جارٍ قراءة الملف…')
            : l('Choose an Excel or CSV file', 'اختر ملف Excel أو CSV')
        }}</strong>
        <span>{{ l('or drop it here · .xlsx, .csv', 'أو أفلته هنا · ‎.xlsx‎ و ‎.csv‎') }}</span>
        <input
          type="file"
          class="sr-only"
          accept=".xlsx,.csv,.tsv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          :disabled="reading"
          @change="
            choose(($event.target as HTMLInputElement).files?.[0])
            ;($event.target as HTMLInputElement).value = ''
          "
        />
      </label>
      <p v-if="readError" class="notice error" role="alert">{{ readError }}</p>
      <div class="import-options">
        <button type="button" class="text-link" @click="template">
          <PhDownloadSimple :size="17" aria-hidden="true" />{{
            l('Download the template (.xlsx)', 'تنزيل القالب (‎.xlsx‎)')
          }}
        </button>
        <label
          >{{ l('Role when a row has none', 'الدور عند عدم تحديده')
          }}<select v-model="fallback">
            <option value="trainee">{{ roleName('trainee') }}</option>
            <option value="trainer">{{ roleName('trainer') }}</option>
          </select></label
        >
      </div>
      <details class="import-paste">
        <summary>
          {{ l('Or paste rows copied from Excel', 'أو الصق صفوفاً منسوخة من Excel') }}
        </summary>
        <label
          ><span class="sr-only">{{ l('Pasted rows', 'الصفوف الملصقة') }}</span
          ><textarea
            v-model="pasted"
            rows="5"
            dir="auto"
            :placeholder="'Name\tEmail\nSara Khalil\tsara@example.com'"
          />
        </label>
        <button
          type="button"
          class="button secondary small"
          :disabled="!pasted.trim()"
          @click="readPasted"
        >
          {{ l('Review pasted rows', 'مراجعة الصفوف الملصقة') }}
        </button>
      </details>
    </template>

    <template v-else-if="step === 'review'">
      <p class="import-summary" role="status">
        <PhCheckCircle :size="20" aria-hidden="true" class="ok" />
        <strong>{{ ready.length }}</strong> {{ l('ready to invite', 'جاهز للدعوة') }}
        <template v-if="problems.length"
          ><PhWarningCircle :size="20" aria-hidden="true" class="warn" />
          <strong>{{ problems.length }}</strong>
          {{ l('will be skipped', 'سيتم تخطيه') }}</template
        >
        <span class="small-print"> · {{ source }}</span>
      </p>
      <div
        class="import-table"
        tabindex="0"
        :aria-label="l('Rows to import', 'الصفوف المراد استيرادها')"
      >
        <table>
          <thead>
            <tr>
              <th scope="col">{{ l('Row', 'الصف') }}</th>
              <th scope="col">{{ l('Name', 'الاسم') }}</th>
              <th scope="col">{{ l('Email', 'البريد') }}</th>
              <th scope="col">{{ l('Role', 'الدور') }}</th>
              <th scope="col">{{ l('Check', 'التحقق') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.line" :class="{ problem: row.problem }">
              <td>{{ row.line }}</td>
              <td dir="auto">{{ row.name || '—' }}</td>
              <td dir="ltr">{{ row.email || '—' }}</td>
              <td>
                <select
                  v-model="row.role"
                  :aria-label="l('Role for row', 'دور الصف') + ' ' + row.line"
                  :disabled="!!row.problem && row.problem !== 'invalid_role'"
                  @change="row.problem === 'invalid_role' && (row.problem = '')"
                >
                  <option value="trainee">{{ roleName('trainee') }}</option>
                  <option value="trainer">{{ roleName('trainer') }}</option>
                  <option value="admin">{{ roleName('admin') }}</option>
                </select>
              </td>
              <td>{{ row.problem ? problemText(row.problem) : l('Ready', 'جاهز') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="small-print">
        {{
          l(
            'Each person gets their own invitation link, valid for 7 days. People who are already members or already invited are skipped automatically.',
            'يحصل كل شخص على رابط دعوة خاص صالح لمدة 7 أيام. يتم تخطي الأعضاء الحاليين ومن لديهم دعوة سابقة تلقائياً.',
          )
        }}
      </p>
      <p v-if="readError" class="notice" role="status">{{ readError }}</p>
      <div class="import-actions">
        <button type="button" class="text-link" @click="step = 'choose'">
          {{ l('Choose another file', 'اختيار ملف آخر') }}
        </button>
        <button type="button" class="button" :disabled="!ready.length" @click="start">
          {{ l('Create', 'إنشاء') }} {{ ready.length }}
          {{ l(ready.length === 1 ? 'invitation' : 'invitations', 'دعوة') }}
        </button>
      </div>
    </template>

    <template v-else-if="job">
      <div class="import-progress" role="status" aria-live="polite">
        <strong>{{
          running
            ? l('Creating invitations…', 'جارٍ إنشاء الدعوات…')
            : counts.pending
              ? l('Import paused', 'الاستيراد متوقف')
              : l('Import finished', 'اكتمل الاستيراد')
        }}</strong>
        <span
          >{{ counts.invited }} {{ l('invited', 'دعوة') }} · {{ counts.skipped }}
          {{ l('skipped', 'متخطى')
          }}<template v-if="counts.failed">
            · {{ counts.failed }} {{ l('not sent', 'لم تُرسل') }}</template
          ></span
        >
        <progress :max="counts.total" :value="counts.total - counts.pending" />
      </div>
      <p v-if="counts.invited && finished" class="notice success">
        {{
          l(
            'Invitations are ready. Send each person their link — download the list or copy the links below.',
            'الدعوات جاهزة. أرسل لكل شخص رابطه — نزّل القائمة أو انسخ الروابط أدناه.',
          )
        }}
      </p>
      <ol class="import-results">
        <li v-for="row in job.rows" :key="row.id" :class="row.state">
          <span
            ><strong dir="auto">{{ row.name || row.email }}</strong
            ><small v-if="row.name" dir="ltr">{{ row.email }}</small></span
          ><span class="import-state">{{ statusText(row) }}</span>
        </li>
      </ol>
      <div class="import-actions">
        <button
          v-if="!running && (counts.failed || counts.pending)"
          type="button"
          class="button secondary"
          @click="counts.pending ? send() : retry()"
        >
          {{
            counts.pending
              ? l('Continue import', 'متابعة الاستيراد')
              : l('Retry the rows not sent', 'إعادة محاولة الصفوف غير المرسلة')
          }}
        </button>
        <button
          v-if="finished && counts.invited"
          type="button"
          class="button secondary"
          @click="copyLinks"
        >
          {{ copied ? l('Links copied', 'تم نسخ الروابط') : l('Copy links', 'نسخ الروابط') }}
        </button>
        <button
          v-if="finished && counts.invited"
          type="button"
          class="button secondary"
          @click="results"
        >
          <PhDownloadSimple :size="17" aria-hidden="true" />{{
            l('Download links (.xlsx)', 'تنزيل الروابط (‎.xlsx‎)')
          }}
        </button>
        <button v-if="finished" type="button" class="button" @click="finish">
          {{ l('Done', 'تم') }}
        </button>
        <button
          v-if="!running && !finished && !counts.invited && !counts.skipped"
          type="button"
          class="text-link"
          @click="discardStored"
        >
          {{ l('Discard this import', 'تجاهل هذا الاستيراد') }}
        </button>
      </div>
    </template>
  </div>
</template>
<style scoped>
.import-intro {
  margin-bottom: 14px;
}
.import-drop {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 28px 16px;
  border: 1.5px dashed var(--line);
  border-radius: var(--radius);
  background: var(--surface-soft);
  text-align: center;
  cursor: pointer;
  color: var(--ink);
}
.import-drop svg {
  color: var(--accent);
}
.import-drop span {
  color: var(--muted);
  font-size: 0.85rem;
}
.import-drop:hover,
.import-drop.dragging,
.import-drop:focus-within {
  border-color: var(--accent);
  background: var(--tint);
}
.import-options {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 12px 20px;
  margin-block: 16px;
}
.import-options .text-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.import-paste summary {
  cursor: pointer;
  color: var(--accent);
  font-weight: 600;
  font-size: 0.9rem;
}
.import-paste textarea {
  width: 100%;
  margin-block: 10px;
  font-family: ui-monospace, monospace;
  font-size: 0.85rem;
}
.import-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  color: var(--ink);
}
.import-summary .ok {
  color: var(--accent);
}
.import-summary .warn {
  color: var(--error);
  margin-inline-start: 10px;
}
.import-table {
  max-height: 320px;
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: 10px;
}
.import-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.import-table th,
.import-table td {
  padding: 8px 10px;
  text-align: start;
  border-bottom: 1px solid var(--line);
  overflow-wrap: anywhere;
}
.import-table thead th {
  position: sticky;
  top: 0;
  background: var(--surface-soft);
  font-size: 0.75rem;
  color: var(--muted);
}
.import-table select {
  min-width: 110px;
  padding-block: 4px;
}
.import-table tr.problem td {
  color: var(--muted);
}
.import-table tr.problem td:last-child {
  color: var(--error);
  font-weight: 600;
}
.import-table + p {
  margin-top: 12px;
}
.import-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px 14px;
  margin-top: 16px;
}
.import-actions .button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.import-progress {
  display: grid;
  gap: 6px;
  margin-bottom: 14px;
}
.import-progress span {
  color: var(--muted);
  font-size: 0.85rem;
}
.import-progress progress {
  width: 100%;
  accent-color: var(--accent);
}
.import-results {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 300px;
  overflow: auto;
  border-top: 1px solid var(--line);
}
.import-results li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
  font-size: 0.88rem;
}
.import-results li > span:first-child {
  display: grid;
  min-width: 0;
  overflow-wrap: anywhere;
}
.import-results small {
  color: var(--muted);
}
.import-state {
  color: var(--muted);
  text-align: end;
  flex-shrink: 0;
  max-width: 50%;
}
.import-results li.invited .import-state {
  color: var(--accent);
  font-weight: 650;
}
.import-results li.failed .import-state {
  color: var(--error);
  font-weight: 650;
}
</style>
