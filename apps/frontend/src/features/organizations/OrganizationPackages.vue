<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { programContext } from '../coaching/program-context'
import { user, profile } from '../../app/auth'
import { request } from '../../lib/backend'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { language as l, errorMessage, dateLabel } from '../../lib/i18n'
import { localDate, addDays } from '../../lib/dates'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import TimezonePicker from '../../components/TimezonePicker.vue'
import MemberPicker from './MemberPicker.vue'
import OrganizationNav from './OrganizationNav.vue'
const context = programContext(useRoute()),
  endpoint = `/v1/workspaces/${context.workspace}/packages`,
  key = `packages:${user.value!.id}:${context.key}`
type Package = {
  id: string
  member_id: string
  member_name: string
  member_active: boolean
  renewal_id: string | null
  title: string
  allowance: number
  reserved: number
  used: number
  available: number
  starts_on: string
  ends_on: string
  timezone: string
  archived: boolean
  revision: number
}
type Ledger = {
  id: string
  title: string
  starts_at: string
  timezone: string
  state: string
  attendance: string
  allocation: string
}
type Draft = {
  id: string
  members: string[]
  title: string
  allowance: number
  starts_on: string
  ends_on: string
  timezone: string
  renewed_from: string | null
}
const items = ref<Package[]>([]),
  next = ref<number | null>(null),
  search = ref(''),
  status = ref('active'),
  loading = ref(true),
  error = ref(''),
  selected = ref<Package>(),
  history = ref<Ledger[]>([]),
  historyNext = ref<number | null>(null),
  detailLoading = ref(false),
  detailError = ref(''),
  draft = ref<Draft>(),
  editing = ref(false),
  ready = ref(false),
  saved = ref(false),
  draftError = ref(''),
  adjusting = ref(false),
  allowance = ref(1),
  reason = ref('')
let generation = 0,
  detailGeneration = 0,
  disposed = false,
  draftGeneration = 0,
  timer: ReturnType<typeof setTimeout>
async function load(more = false) {
  const current = ++generation
  loading.value = true
  error.value = ''
  try {
    const result = await request<{ items: Package[]; next: number | null }>(
      endpoint +
        '?' +
        new URLSearchParams({
          view: context.view,
          search: search.value,
          status: status.value,
          offset: String(more ? next.value || 0 : 0),
        }),
    )
    if (disposed || current !== generation) return
    items.value = more ? [...items.value, ...result.items] : result.items
    next.value = result.next
  } catch (e) {
    if (!disposed && current === generation) error.value = errorMessage(e)
  } finally {
    if (!disposed && current === generation) loading.value = false
  }
}
async function open(item: Package, more = false) {
  const current = ++detailGeneration
  selected.value = item
  detailLoading.value = true
  detailError.value = ''
  if (!more) {
    history.value = []
    adjusting.value = false
    reason.value = ''
  }
  try {
    const result = await request<{ item: Package; items: Ledger[]; next: number | null }>(
      endpoint +
        '?' +
        new URLSearchParams({
          view: context.view,
          id: item.id,
          offset: String(more ? historyNext.value || 0 : 0),
        }),
    )
    if (disposed || current !== detailGeneration) return
    selected.value = { ...item, ...result.item }
    history.value = more ? [...history.value, ...result.items] : result.items
    historyNext.value = result.next
    allowance.value = result.item.allowance
  } catch (e) {
    if (!disposed && current === detailGeneration) detailError.value = errorMessage(e)
  } finally {
    if (!disposed && current === detailGeneration) detailLoading.value = false
  }
}
const command = useCommand<'create' | 'adjust' | 'archive'>(
  key,
  async (action, result) => {
    if (action === 'create') {
      ready.value = false
      draft.value = undefined
      editing.value = false
      await removeDraft(key)
      ready.value = true
    }
    await load()
    if (action === 'create') await open(result as Package)
    else if (selected.value) await open(selected.value)
  },
  (_, args) => request(endpoint, { method: 'POST', body: JSON.stringify(args) }),
)
const locked = computed(() => command.state.busy || !!command.state.pending || !command.state.ready)
function create() {
  const starts = localDate(profile.value?.timezone || 'UTC')
  draft.value = {
    id: crypto.randomUUID(),
    members: [],
    title: '',
    allowance: 8,
    starts_on: starts,
    ends_on: addDays(starts, 30),
    timezone: profile.value?.timezone || 'UTC',
    renewed_from: null,
  }
  editing.value = true
}
function renew(item: Package) {
  create()
  const today = localDate(item.timezone),
    next = addDays(item.ends_on.slice(0, 10), 1),
    start = next < today ? today : next
  Object.assign(draft.value!, {
    members: [item.member_id],
    title: item.title,
    allowance: item.allowance,
    starts_on: start,
    ends_on: addDays(
      start,
      Math.round((Date.parse(item.ends_on) - Date.parse(item.starts_on)) / 86400000),
    ),
    timezone: item.timezone,
    renewed_from: item.id,
  })
}
function run(action: 'create' | 'adjust' | 'archive', args: Record<string, unknown>) {
  return command.run(action, {
    operation: crypto.randomUUID(),
    view: context.view,
    action,
    ...args,
  })
}
function save() {
  if (draft.value) return run('create', { ...draft.value, member: draft.value.members[0] })
}
async function discard() {
  await removeDraft(key)
  draft.value = undefined
  editing.value = false
  saved.value = false
}
watch(
  draft,
  async () => {
    if (!ready.value || !draft.value) return
    const current = ++draftGeneration
    saved.value = false
    try {
      await storeDraft(key, JSON.parse(JSON.stringify(draft.value)))
      if (current === draftGeneration) {
        saved.value = true
        draftError.value = ''
      }
    } catch (e) {
      draftError.value = errorMessage(e)
    }
  },
  { deep: true },
)
watch([search, status], () => {
  generation++
  loading.value = true
  clearTimeout(timer)
  timer = setTimeout(() => load(), 180)
})
onMounted(async () => {
  await load()
  draft.value = await getDraft<Draft>(key).catch(() => undefined)
  saved.value = !!draft.value
  ready.value = true
})
onUnmounted(() => {
  disposed = true
  generation++
  detailGeneration++
  clearTimeout(timer)
})
function closeDetail() {
  selected.value = undefined
  detailGeneration++
}
const allocation = (state: string) =>
  state === 'reserved'
    ? l('Reserved', 'محجوزة')
    : state === 'used'
      ? l('Used', 'مستخدمة')
      : l('Released', 'محررة')
</script>
<template>
  <OrganizationNav />
  <div class="container page organization-packages">
    <header class="page-heading heading-actions">
      <div>
        <p class="overline">{{ l('Session allowances', 'أرصدة الجلسات') }}</p>
        <h1>{{ l('Subscription packages', 'باقات الاشتراك') }}</h1>
        <p>
          {{
            l(
              'See what is available, booked and used for each trainee.',
              'تابع الجلسات المتاحة والمحجوزة والمستخدمة لكل متدرب.',
            )
          }}
        </p>
      </div>
      <button
        v-if="context.view === 'admin' && !draft"
        class="button"
        :disabled="locked"
        @click="create"
      >
        {{ l('Assign a package', 'تعيين باقة') }}
      </button>
    </header>
    <CommandStatus :command="command" />
    <button
      v-if="command.state.error && !command.state.pending && selected"
      class="text-link"
      @click="open(selected)"
    >
      {{ l('Refresh package and discard adjustment', 'تحديث الباقة وإلغاء التعديل') }}
    </button>
    <p v-if="draftError" role="alert" class="notice error">{{ draftError }}</p>
    <p v-else-if="draft && saved" role="status" class="small-print">
      {{ l('Draft saved on this device.', 'حُفظت المسودة على هذا الجهاز.') }}
    </p>
    <div v-if="draft && !editing" class="notice heading-actions">
      <span>{{ l('You have an unfinished package.', 'لديك باقة غير مكتملة.') }}</span
      ><button type="button" class="text-link" :disabled="locked" @click="editing = true">
        {{ l('Continue draft', 'متابعة المسودة') }}</button
      ><button type="button" class="text-link" :disabled="locked" @click="discard">
        {{ l('Discard draft', 'حذف المسودة') }}
      </button>
    </div>
    <form v-if="editing && draft" class="panel package-editor" @submit.prevent="save">
      <fieldset :disabled="locked" class="form-fields">
        <div class="heading-actions">
          <h2>{{ l('Assign a package', 'تعيين باقة') }}</h2>
          <button type="button" class="text-link" @click="editing = false">
            {{ l('Close editor', 'إغلاق المحرر') }}
          </button>
        </div>
        <p v-if="draft.renewed_from" class="notice">
          {{
            l(
              'Creates a new allowance linked to the previous package. Unused sessions are not transferred automatically.',
              'ينشئ رصيداً جديداً مرتبطاً بالباقة السابقة. لا تُنقل الجلسات غير المستخدمة تلقائياً.',
            )
          }}
        </p>
        <MemberPicker
          :disabled="!!draft.renewed_from"
          :workspace="context.workspace"
          view="admin"
          role="trainee"
          :max="1"
          v-model="draft.members"
        /><label
          >{{ l('Package name', 'اسم الباقة')
          }}<input
            v-model="draft.title"
            maxlength="160"
            required
            :placeholder="l('e.g. 8 personal training sessions', 'مثلاً: ٨ جلسات تدريب شخصي')"
        /></label>
        <div class="field-pair">
          <label
            >{{ l('Session allowance', 'عدد الجلسات')
            }}<input
              v-model.number="draft.allowance"
              type="number"
              min="1"
              max="1000"
              required /></label
          ><label
            >{{ l('Starts on', 'تبدأ في')
            }}<input v-model="draft.starts_on" type="date" required /></label
          ><label
            >{{ l('Valid through', 'صالحة حتى')
            }}<input v-model="draft.ends_on" type="date" :min="draft.starts_on" required
          /></label>
        </div>
        <TimezonePicker
          v-model="draft.timezone"
          :label="l('Package timezone', 'المنطقة الزمنية للباقة')"
        />
        <p class="small-print">
          {{
            l(
              'Only bookings explicitly linked to this package use its allowance. This records an entitlement, not a payment.',
              'لا يستخدم رصيد هذه الباقة إلا الحجز المرتبط بها صراحةً. هذا سجل استحقاق وليس دفعة مالية.',
            )
          }}
        </p>
        <button class="button" :disabled="draft.members.length !== 1">
          {{ l('Assign package', 'تعيين الباقة') }}
        </button>
      </fieldset>
    </form>
    <div class="package-layout" :class="{ 'has-selection': selected }">
      <section class="package-list" :aria-label="l('Packages', 'الباقات')">
        <div class="package-filters">
          <label
            >{{ l('Search packages or trainees', 'ابحث عن باقات أو متدربين')
            }}<input v-model="search" type="search" /></label
          ><label
            >{{ l('Package status', 'حالة الباقة')
            }}<select v-model="status">
              <option value="active">{{ l('Current and upcoming', 'الحالية والقادمة') }}</option>
              <option value="expired">{{ l('Expired', 'المنتهية') }}</option>
              <option value="archived">{{ l('Archived', 'المؤرشفة') }}</option>
              <option value="all">{{ l('All packages', 'كل الباقات') }}</option>
            </select></label
          >
        </div>
        <p v-if="error" role="alert" class="notice error">
          {{ error }}
          <button type="button" class="text-link" @click="load()">
            {{ l('Retry', 'إعادة المحاولة') }}
          </button>
        </p>
        <p v-if="loading" role="status">{{ l('Loading packages…', 'تحميل الباقات…') }}</p>
        <p v-else-if="!items.length" class="notice">
          {{
            l(
              'No matching packages. Assign a trainee’s session allowance to start tracking bookings.',
              'لا توجد باقات مطابقة. عيّن رصيد جلسات للمتدرب لبدء متابعة الحجوزات.',
            )
          }}
        </p>
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          class="package-row"
          :aria-pressed="selected?.id === item.id"
          @click="open(item)"
        >
          <strong dir="auto">{{ item.member_name }}</strong
          ><span dir="auto">{{ item.title }}</span
          ><span
            >{{ item.available }} {{ l('available', 'متاحة') }} · {{ item.reserved }}
            {{ l('reserved', 'محجوزة') }} · {{ item.used }} {{ l('used', 'مستخدمة') }}</span
          ><small
            >{{ l('Valid through', 'صالحة حتى') }} {{ dateLabel(item.ends_on.slice(0, 10)) }}</small
          ></button
        ><button
          v-if="next !== null"
          type="button"
          class="text-link"
          :disabled="loading"
          @click="load(true)"
        >
          {{ l('More packages', 'المزيد من الباقات') }}
        </button>
      </section>
      <section
        v-if="selected"
        class="panel package-detail"
        :aria-label="l('Selected package', 'الباقة المختارة')"
      >
        <button type="button" class="text-link" @click="closeDetail">
          {{ l('Back to packages', 'العودة إلى الباقات') }}
        </button>
        <h2 dir="auto">{{ selected.title }}</h2>
        <p dir="auto">{{ selected.member_name }}</p>
        <dl class="package-balances">
          <div>
            <dt>{{ l('Available', 'متاحة') }}</dt>
            <dd>{{ selected.available }}</dd>
          </div>
          <div>
            <dt>{{ l('Reserved', 'محجوزة') }}</dt>
            <dd>{{ selected.reserved }}</dd>
          </div>
          <div>
            <dt>{{ l('Used', 'مستخدمة') }}</dt>
            <dd>{{ selected.used }}</dd>
          </div>
        </dl>
        <p class="small-print">
          {{ dateLabel(selected.starts_on.slice(0, 10)) }} —
          {{ dateLabel(selected.ends_on.slice(0, 10)) }} · {{ selected.timezone }}
        </p>
        <p class="small-print">
          {{
            l(
              'Booking reserves a session; completion uses it. Cancellation releases it. No-shows need an explicit charge decision. Independent sessions never change this balance.',
              'الحجز يحجز جلسة والإكمال يخصمها والإلغاء يحررها. يتطلب الغياب قرار خصم صريحاً. الجلسات المستقلة لا تغيّر هذا الرصيد.',
            )
          }}
        </p>
        <RouterLink
          v-if="
            !selected.archived &&
            selected.member_active &&
            selected.ends_on.slice(0, 10) >= localDate(selected.timezone) &&
            selected.available > 0 &&
            context.view !== 'trainee'
          "
          class="button"
          :to="
            context.base + '/calendar/new?package=' + selected.id + '&member=' + selected.member_id
          "
          >{{ l('Book a session', 'حجز جلسة') }}</RouterLink
        >
        <p v-if="selected.renewal_id" class="small-print">
          {{
            l(
              'A renewal has already been assigned for this package.',
              'تم تعيين تجديد لهذه الباقة بالفعل.',
            )
          }}
        </p>
        <button
          v-if="context.view === 'admin' && !selected.renewal_id && selected.member_active"
          type="button"
          class="text-link"
          :disabled="locked || !!draft"
          @click="renew(selected)"
        >
          {{ l('Renew package', 'تجديد الباقة') }}
        </button>
        <div v-if="context.view === 'admin'" class="actions">
          <button
            type="button"
            class="text-link"
            :disabled="locked || selected.archived"
            @click="adjusting = !adjusting"
          >
            {{ l('Adjust allowance', 'تعديل الرصيد') }}</button
          ><button
            type="button"
            class="text-link"
            :disabled="locked || (!selected.archived && selected.reserved > 0)"
            @click="
              run('archive', {
                id: selected.id,
                revision: selected.revision,
                archived: !selected.archived,
              })
            "
          >
            {{
              selected.archived
                ? l('Restore package', 'استعادة الباقة')
                : l('Archive package', 'أرشفة الباقة')
            }}
          </button>
        </div>
        <p v-if="context.view === 'admin' && selected.reserved > 0" class="small-print">
          {{
            l(
              'Resolve reserved bookings before archiving.',
              'أكمل أو ألغِ الحجوزات المحجوزة قبل الأرشفة.',
            )
          }}
        </p>
        <form
          v-if="adjusting"
          class="form-fields"
          @submit.prevent="
            run('adjust', { id: selected.id, revision: selected.revision, allowance, reason })
          "
        >
          <fieldset :disabled="locked" class="form-fields">
            <label
              >{{ l('Total session allowance', 'إجمالي رصيد الجلسات')
              }}<input
                v-model.number="allowance"
                type="number"
                :min="Math.max(1, selected.used + selected.reserved)"
                max="1000"
                required /></label
            ><label
              >{{ l('Reason for adjustment', 'سبب التعديل')
              }}<textarea v-model="reason" required maxlength="500" /></label
            ><button class="button">{{ l('Save adjustment', 'حفظ التعديل') }}</button>
          </fieldset>
        </form>
        <h3>{{ l('Session history', 'سجل الجلسات') }}</h3>
        <p v-if="detailLoading" role="status">{{ l('Loading history…', 'تحميل السجل…') }}</p>
        <p v-if="detailError" role="alert" class="notice error">
          {{ detailError }}
          <button type="button" class="text-link" @click="open(selected)">
            {{ l('Retry', 'إعادة المحاولة') }}
          </button>
        </p>
        <p v-else-if="!detailLoading && !history.length" class="subtle">
          {{
            l(
              'No sessions have been linked to this package yet.',
              'لم تُربط جلسات بهذه الباقة بعد.',
            )
          }}
        </p>
        <ul class="package-history">
          <li v-for="item in history" :key="item.id">
            <span dir="auto">{{ item.title }}</span
            ><span
              >{{ dateLabel(localDate(item.timezone, new Date(item.starts_at))) }} ·
              {{ allocation(item.allocation) }}</span
            >
          </li>
        </ul>
        <button
          v-if="historyNext !== null"
          type="button"
          class="text-link"
          :disabled="detailLoading"
          @click="open(selected, true)"
        >
          {{ l('More history', 'المزيد من السجل') }}
        </button>
      </section>
    </div>
  </div>
</template>
<style scoped>
.package-editor {
  margin-block: 1rem;
}
.package-layout {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(0, 1.3fr);
  gap: 1.5rem;
  align-items: start;
}
.package-layout:not(.has-selection) {
  grid-template-columns: 1fr;
}
.package-list,
.package-detail {
  min-width: 0;
}
.package-filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-block: 1rem;
}
.package-filters label {
  flex: 1;
  min-width: 0;
}
.package-row {
  display: grid;
  gap: 0.35rem;
  text-align: start;
  width: 100%;
  padding: 1rem;
  border: 0;
  border-block-end: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  overflow-wrap: anywhere;
}
.package-row[aria-pressed='true'] {
  background: var(--tint);
}
.package-row small {
  color: var(--muted);
}
.package-detail {
  display: grid;
  gap: 1rem;
  align-content: start;
}
.package-detail > :is(h2, h3, p, dl, ul) {
  margin: 0;
}
.package-detail > .text-link {
  justify-self: start;
}
.package-balances {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}
.package-balances dt {
  font-size: 0.8rem;
  color: var(--muted);
}
.package-balances dd {
  font-size: 1.75rem;
  margin: 0;
}
.package-history {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}
.package-history li {
  display: grid;
  gap: 0.25rem;
  padding-block: 0.5rem;
  border-block-end: 1px solid var(--line);
  overflow-wrap: anywhere;
}
.package-history li span:last-child {
  color: var(--muted);
  font-size: 0.8rem;
}
@media (max-width: 800px) {
  .package-layout {
    display: block;
  }
  .package-layout.has-selection .package-list {
    display: none;
  }
  .package-filters {
    flex-direction: column;
  }
}
</style>
