<script setup lang="ts">
import TimezonePicker from '../../components/TimezonePicker.vue'
import { computed, onMounted, ref, watch, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { user, profile } from '../../app/auth'
import { request } from '../../lib/backend'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { localDate, addDays } from '../../lib/dates'
import { language as l, errorMessage, locale } from '../../lib/i18n'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import MemberPicker from './MemberPicker.vue'
import PageState from '../../components/PageState.vue'
import OrganizationNav from './OrganizationNav.vue'
import type { Organization } from './types'
import type { TrainingGroup, AssessmentTemplate, CalendarEvent } from './service-types'
const route = useRoute(),
  router = useRouter(),
  id = String(route.params.workspace),
  view = String(route.params.view),
  base = `/organization/${id}/${view}`,
  key = `event-composer:${user.value!.id}:${id}:${view}:${route.query.makeup || 'general'}`
const stepPanel = ref<HTMLElement>()
const data = ref<Organization>(),
  templates = ref<AssessmentTemplate[]>([]),
  groups = ref<TrainingGroup[]>([]),
  loading = ref(true),
  error = ref(''),
  loadError = ref(''),
  saved = ref(false),
  step = ref(1),
  ready = ref(false),
  group = ref(''),
  times = ref<{ starts_at: string; ends_at: string }[]>([])
const draft = ref({
  id: crypto.randomUUID() as string,
  title: '',
  kind: 'training',
  template: '',
  staff: [] as string[],
  participants: [] as string[],
  local:
    addDays(
      localDate(
        profile.value?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      ),
      1,
    ) + 'T09:00',
  zone: profile.value?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  minutes: 60,
  count: 1,
  every: 7,
  location: '',
})
let disposed = false,
  draftGeneration = 0
const templateChannel =
  typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(`rafik-templates:${user.value!.id}:${id}`)
    : undefined
async function refreshTemplates() {
  if (disposed || catalogBusy.value.templates) return
  await findCatalog('templates')
}
if (templateChannel)
  templateChannel.onmessage = async ({ data: message }) => {
    if (
      disposed ||
      !message ||
      typeof message !== 'object' ||
      message.event !== draft.value.id ||
      typeof message.template !== 'string'
    )
      return
    try {
      const page = await request<{ items: AssessmentTemplate[] }>(
        `/v1/workspaces/${id}/services?view=${view}&kind=templates&id=${encodeURIComponent(message.template)}`,
      )
      if (disposed) return
      const created = page.items.find((item) => item.id === message.template)
      if (created && !locked.value) {
        templates.value = [created, ...templates.value.filter((item) => item.id !== created.id)]
        draft.value.template = created.id
      }
    } catch (e) {
      if (!disposed) error.value = errorMessage(e)
    }
  }
onUnmounted(() => {
  disposed = true
  window.removeEventListener('focus', refreshTemplates)
  templateChannel?.close()
})
watch(step, async () => {
  await nextTick()
  stepPanel.value?.focus()
})
const trainerOptions = ref<Organization['members']>([])
const people = computed(
    () => data.value?.members.filter((m) => m.active && m.roles.includes('trainee')) || [],
  ),
  staff = computed(() => trainerOptions.value)
const chosen = computed(() => people.value.filter((m) => draft.value.participants.includes(m.id)))
const selectedTemplate = computed(() => templates.value.find((t) => t.id === draft.value.template))
const templateSearch = ref(''),
  groupSearch = ref(''),
  templateNext = ref<number | null>(null),
  groupNext = ref<number | null>(null)
const catalogBusy = ref({ templates: false, groups: false })
async function catalogPage(kind: 'templates' | 'groups', append = false) {
  const q = new URLSearchParams({
    view,
    kind,
    search: kind === 'templates' ? templateSearch.value : groupSearch.value,
    offset: String(append ? (kind === 'templates' ? templateNext.value : groupNext.value) || 0 : 0),
  })
  const page = await request<{ items: any[]; next: number | null }>(
    `/v1/workspaces/${id}/services?${q}`,
  )
  if (kind === 'templates') {
    const selected = selectedTemplate.value
    templates.value = append
      ? Array.from(new Map([...templates.value, ...page.items].map((t) => [t.id, t])).values())
      : page.items
    if (selected && !templates.value.some((t) => t.id === selected.id))
      templates.value.unshift(selected)
    templateNext.value = page.next
  } else {
    groups.value = append ? [...groups.value, ...page.items] : page.items
    groupNext.value = page.next
  }
}
async function findCatalog(kind: 'templates' | 'groups', append = false) {
  if (catalogBusy.value[kind]) return
  catalogBusy.value[kind] = true
  error.value = ''
  try {
    await catalogPage(kind, append)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    catalogBusy.value[kind] = false
  }
}
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    data.value = await request<Organization>(`/v1/workspaces/${id}?view=${view}&summary=true`)
    await Promise.all([catalogPage('templates'), catalogPage('groups')])
    if (view === 'trainer') draft.value.staff = [data.value.self.id]
  } catch (e) {
    loadError.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
const command = useCommand<'create'>(
  key,
  async (_, result) => {
    ready.value = false
    await removeDraft(key)
    if (!disposed) await router.push(base + '/calendar/' + (result as CalendarEvent[])[0]!.id)
  },
  (_, args) =>
    request(`/v1/workspaces/${id}/calendar`, { method: 'POST', body: JSON.stringify(args) }),
  { successMessage: l('Calendar event scheduled.', 'تمت جدولة الحدث في التقويم.') },
)
const locked = computed(() => command.state.busy || !!command.state.pending || !command.state.ready)
function groupMembers() {
  const selected = groups.value.find((g) => g.id === group.value)
  if (selected) {
    draft.value.participants = selected.members
      .filter((m) => m.active && m.roles.includes('trainee') && !draft.value.staff.includes(m.id))
      .map((m) => m.id)
    if (view === 'admin')
      draft.value.staff = selected.members
        .filter((m) => m.active && m.roles.includes('trainer'))
        .map((m) => m.id)
  }
}
async function advance() {
  error.value = ''
  if (step.value === 1) {
    if (draft.value.kind === 'assessment' && !selectedTemplate.value) {
      error.value = l('Choose an assessment template first.', 'اختر قالب تقييم أولاً.')
      return
    }
    step.value = 2
    return
  }
  try {
    times.value = await request(`/v1/workspaces/${id}/calendar-preview`, {
      method: 'POST',
      body: JSON.stringify({ ...draft.value, view }),
    })
    step.value = 3
  } catch (e) {
    error.value = errorMessage(e)
  }
}
function submit() {
  return command.run('create', {
    ...draft.value,
    view,
    action: 'create',
    operation: crypto.randomUUID(),
    template_revision: selectedTemplate.value?.revision,
    makeups: draft.value.participants
      .filter((member) => route.query.makeup && member === String(route.query.member))
      .map((member) => ({
        member,
        makeup_for: String(route.query.makeup),
      })),
  })
}
const timeLabel = (value: string) =>
  new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-AE' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'shortOffset',
    timeZone: draft.value.zone,
  }).format(new Date(value))
watch(
  draft,
  async () => {
    if (!ready.value) return
    try {
      const current = ++draftGeneration
      saved.value = false
      await storeDraft(key, JSON.parse(JSON.stringify(draft.value)))
      if (!disposed && current === draftGeneration) saved.value = true
    } catch (e) {
      error.value = errorMessage(e)
    }
  },
  { deep: true },
)
onMounted(async () => {
  window.addEventListener('focus', refreshTemplates)
  await load()
  const stored = await getDraft<typeof draft.value>(key).catch(() => undefined)
  if (stored) {
    draft.value = { ...draft.value, ...stored }
    try {
      if (stored.template && !templates.value.some((t) => t.id === stored.template)) {
        const page = await request<{ items: AssessmentTemplate[] }>(
          `/v1/workspaces/${id}/services?view=${view}&kind=templates&id=${stored.template}`,
        )
        templates.value.push(...page.items)
      }
    } catch (e) {
      error.value = errorMessage(e)
    }
  }
  if (!stored && route.query.makeup && route.query.member) {
    draft.value.participants = [String(route.query.member)]
    draft.value.title = l('Makeup session', 'جلسة تعويضية')
  }
  ready.value = true
})
</script>
<template>
  <OrganizationNav />
  <div class="container page event-composer">
    <RouterLink class="back-link" :to="base + '/calendar'">{{
      l('Back to calendar', 'العودة للتقويم')
    }}</RouterLink>
    <header class="work-heading">
      <div>
        <h1>{{ l('Schedule an event', 'جدولة موعد') }}</h1>
        <p>
          {{
            l('Details, people, then a final review.', 'التفاصيل ثم الأشخاص ثم المراجعة النهائية.')
          }}
        </p>
      </div>
    </header>
    <ol class="composer-steps" :aria-label="l('Scheduling steps', 'خطوات الجدولة')">
      <li
        v-for="(label, index) in [
          l('Details', 'التفاصيل'),
          l('People', 'الأشخاص'),
          l('Review', 'المراجعة'),
        ]"
        :key="index"
        :aria-current="step === index + 1 ? 'step' : undefined"
        :class="{ current: step === index + 1 }"
      >
        {{ index + 1 }}. {{ label }}
      </li>
    </ol>
    <CommandStatus :command="command" />
    <p v-if="error && !loading" role="alert" class="notice error">{{ error }}</p>
    <PageState :loading="loading" :error="loadError" @retry="load">
      <form v-if="data" @submit.prevent="step === 3 ? submit() : advance()">
        <fieldset :disabled="locked" class="form-fields">
          <section
            v-if="step === 1"
            ref="stepPanel"
            tabindex="-1"
            :aria-label="l('Event details', 'تفاصيل الموعد')"
            class="panel"
          >
            <label
              >{{ l('Event name', 'اسم الموعد')
              }}<input v-model="draft.title" required maxlength="100"
            /></label>
            <label
              >{{ l('Event type', 'نوع الموعد')
              }}<select v-model="draft.kind">
                <option value="training">{{ l('Training session', 'حصة تدريب') }}</option>
                <option value="assessment">
                  {{ l('Assessor-led assessment', 'تقييم بإشراف مقيم') }}
                </option>
              </select></label
            >
            <details v-if="draft.kind === 'assessment'" class="catalog-search">
              <summary>{{ l('Find another template', 'ابحث عن قالب آخر') }}</summary>
              <div class="form-fields">
                <label
                  >{{ l('Find an assessment template', 'البحث عن قالب تقييم')
                  }}<input
                    v-model="templateSearch"
                    type="search"
                    @keydown.enter.prevent="findCatalog('templates')" /></label
                ><button
                  type="button"
                  class="text-link"
                  :disabled="catalogBusy.templates"
                  @click="findCatalog('templates')"
                >
                  {{ l('Search templates', 'البحث في القوالب') }}</button
                ><button
                  v-if="templateNext !== null"
                  type="button"
                  class="text-link"
                  :disabled="catalogBusy.templates"
                  @click="findCatalog('templates', true)"
                >
                  {{ l('More templates', 'المزيد من القوالب') }}
                </button>
              </div>
            </details>
            <label v-if="draft.kind === 'assessment'"
              >{{ l('Assessment template', 'قالب التقييم')
              }}<select v-model="draft.template" required>
                <option value="" disabled>{{ l('Choose a template', 'اختر قالباً') }}</option>
                <option v-for="t in templates" :key="t.id" :value="t.id">
                  {{ t.title }}
                </option></select
              ><RouterLink
                :to="base + '/assessment-templates?create=1&forEvent=' + draft.id"
                target="_blank"
                rel="noopener"
                class="text-link"
                >{{ l('Create a template ↗ (new tab)', 'إنشاء قالب ↗ (تبويب جديد)') }}</RouterLink
              ></label
            >
            <button
              v-if="draft.kind === 'assessment'"
              type="button"
              class="text-link"
              :disabled="catalogBusy.templates"
              @click="refreshTemplates"
            >
              {{ l('Refresh templates', 'تحديث القوالب') }}
            </button>
            <div class="service-field-row">
              <label
                >{{ l('Local date and time', 'التاريخ والوقت المحلي')
                }}<input v-model="draft.local" type="datetime-local" required /></label
              ><TimezonePicker
                v-model="draft.zone"
                :label="l('Timezone', 'المنطقة الزمنية')"
                :disabled="locked"
              />
            </div>
            <label
              >{{ l('Duration', 'المدة')
              }}<select v-model.number="draft.minutes">
                <option v-for="n in [15, 30, 45, 60, 90, 120]" :key="n" :value="n">
                  {{ n }} {{ l('minutes', 'دقيقة') }}
                </option>
              </select></label
            >
            <label
              >{{ l('Location or meeting link', 'الموقع أو رابط الاجتماع')
              }}<input v-model="draft.location" maxlength="500"
            /></label>
            <details>
              <summary>{{ l('Repeat this event', 'تكرار الموعد') }}</summary>
              <div class="service-field-row">
                <label
                  >{{ l('Occurrences (up to 8)', 'عدد المواعيد (حتى 8)')
                  }}<input
                    v-model.number="draft.count"
                    type="number"
                    min="1"
                    max="8"
                    required /></label
                ><label
                  >{{ l('Repeat every', 'التكرار كل')
                  }}<select v-model.number="draft.every">
                    <option :value="7">{{ l('Week', 'أسبوع') }}</option>
                    <option :value="14">{{ l('Two weeks', 'أسبوعين') }}</option>
                  </select></label
                >
              </div>
            </details>
          </section>
          <section
            v-else-if="step === 2"
            ref="stepPanel"
            tabindex="-1"
            :aria-label="l('Choose people', 'اختيار الأشخاص')"
            class="panel"
          >
            <MemberPicker
              v-if="view === 'admin'"
              :workspace="id"
              :view="view"
              role="trainer"
              :max="8"
              v-model="draft.staff"
              :exclude-ids="draft.participants"
              :label="l('Trainers / assessors', 'المدربون / المقيمون')"
              @options="trainerOptions = $event"
            />
            <p v-else>
              {{
                l('You are the assigned trainer for this event.', 'أنت المدرب المعيّن لهذا الموعد.')
              }}
            </p>
            <h2>{{ l('Athletes', 'الرياضيون') }}</h2>
            <details class="group-shortcut">
              <summary>{{ l('Start with a training group', 'ابدأ بمجموعة تدريب') }}</summary>
              <div class="form-fields">
                <label
                  >{{ l('Find a group (optional)', 'البحث عن مجموعة (اختياري)')
                  }}<input
                    v-model="groupSearch"
                    type="search"
                    @keydown.enter.prevent="findCatalog('groups')" /></label
                ><button
                  type="button"
                  class="text-link"
                  :disabled="catalogBusy.groups"
                  @click="findCatalog('groups')"
                >
                  {{ l('Search groups', 'البحث في المجموعات') }}</button
                ><button
                  v-if="groupNext !== null"
                  type="button"
                  class="text-link"
                  :disabled="catalogBusy.groups"
                  @click="findCatalog('groups', true)"
                >
                  {{ l('More groups', 'المزيد من المجموعات') }}
                </button>
              </div>
              <label v-if="groups.length"
                >{{ l('Start with a group (optional)', 'ابدأ بمجموعة (اختياري)')
                }}<select v-model="group" @change="groupMembers">
                  <option value="">
                    {{ l('Choose people individually', 'اختيار الأشخاص فردياً') }}
                  </option>
                  <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
                </select></label
              >
            </details>
            <MemberPicker
              :workspace="id"
              :view="view"
              role="trainee"
              v-model="draft.participants"
              :exclude-ids="draft.staff"
              :label="l('Find trainees', 'البحث عن متدربين')"
              @options="data!.members = $event"
            />
          </section>
          <section
            v-else
            ref="stepPanel"
            tabindex="-1"
            :aria-label="l('Review schedule', 'مراجعة الجدول')"
            class="panel event-review"
          >
            <h2>{{ draft.title }}</h2>
            <p>{{ draft.location }} · {{ draft.zone }}</p>
            <p v-if="selectedTemplate">
              {{ selectedTemplate.title }} · {{ selectedTemplate.definition.length }}
              {{ l('drills', 'اختبارات') }}
            </p>
            <h3>{{ l('People', 'الأشخاص') }}</h3>
            <p>
              {{ l('Trainers / assessors', 'المدربون / المقيمون') }}:
              {{
                view === 'trainer'
                  ? profile?.display_name
                  : staff
                      .filter((m) => draft.staff.includes(m.id))
                      .map((m) => m.name)
                      .join(' · ')
              }}
            </p>
            <ul>
              <li v-for="m in chosen" :key="m.id">
                {{ m.name }}
              </li>
            </ul>
            <h3>{{ l('Dates to schedule', 'المواعيد للجدولة') }}</h3>
            <ol>
              <li v-for="time in times" :key="time.starts_at">
                {{ timeLabel(time.starts_at) }} — {{ timeLabel(time.ends_at) }}
              </li>
            </ol>
            <p class="small-print">
              {{
                l(
                  'These dates and people are fixed for this series. Later group changes will not add or remove event participants. Any conflict rejects the entire series.',
                  'هذه التواريخ والأشخاص ثابتون لهذه السلسلة. تغييرات المجموعة لاحقاً لا تضيف أو تحذف المشاركين. أي تعارض يرفض السلسلة كاملة.',
                )
              }}
            </p>
            <p class="small-print">
              {{
                l(
                  'During a repeated daylight-saving hour, preview uses standard time. Review the displayed instants before confirming.',
                  'خلال ساعة مكررة بسبب التوقيت الصيفي تستخدم المعاينة التوقيت القياسي. راجع الأوقات قبل التأكيد.',
                )
              }}
            </p>
          </section>
          <div class="actions">
            <button v-if="step > 1" type="button" class="button secondary" @click="step--">
              {{ l('Back', 'رجوع') }}</button
            ><button
              class="button"
              :disabled="
                step === 2 &&
                (!draft.staff.length ||
                  !chosen.length ||
                  chosen.length !== draft.participants.length ||
                  (view === 'admin' &&
                    draft.staff.some(
                      (id) =>
                        !staff.some((m) => m.id === id && m.active && m.roles.includes('trainer')),
                    )))
              "
            >
              {{
                step === 3
                  ? l('Confirm schedule', 'تأكيد الجدول')
                  : step === 2
                    ? l('Review schedule', 'مراجعة الجدول')
                    : l('Choose people', 'اختيار الأشخاص')
              }}
            </button>
          </div>
          <p class="small-print" role="status">
            {{
              saved
                ? l('Draft saved on this device.', 'حُفظت المسودة على هذا الجهاز.')
                : l(
                    'Changes are saved on this device as you type.',
                    'تُحفظ التغييرات على هذا الجهاز أثناء الكتابة.',
                  )
            }}
          </p>
        </fieldset>
      </form>
    </PageState>
  </div>
</template>
<style scoped>
.event-composer {
  max-width: 880px;
}
.composer-steps {
  list-style: none;
  display: flex;
  gap: 24px;
  padding: 0;
  margin-block: 24px;
  font-size: 0.9rem;
  color: var(--muted);
}
.composer-steps .current {
  color: var(--ink);
  font-weight: 700;
}
.event-composer .panel {
  margin-bottom: 24px;
}
.event-composer label {
  margin-block: 16px;
}
.service-field-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}
.event-composer .service-field-row > label,
.event-composer .service-field-row :deep(.timezone-picker > label) {
  margin: 0;
}
.service-field-row > label,
.service-field-row :deep(.timezone-picker) {
  display: grid;
  gap: 8px;
}
.service-field-row input[type='datetime-local'],
.service-field-row :deep(.timezone-anchor) {
  min-height: 48px;
  box-sizing: border-box;
}
.event-composer h2 {
  font-size: 1.2rem;
}
.event-review h3 {
  margin-top: 24px;
  font-size: 1rem;
}
.event-review li {
  margin-block: 8px;
  overflow-wrap: anywhere;
}
@media (max-width: 650px) {
  .service-field-row {
    grid-template-columns: minmax(0, 1fr);
  }
  .composer-steps {
    gap: 14px;
  }
  .event-composer .panel {
    padding: 20px;
  }
}
</style>
