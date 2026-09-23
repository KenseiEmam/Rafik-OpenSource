<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { user, profile } from '../../app/auth'
import { request } from '../../lib/backend'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { localDate, addDays } from '../../lib/dates'
import { language as l, errorMessage, locale } from '../../lib/i18n'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import PageState from '../../components/PageState.vue'
import OrganizationNav from './OrganizationNav.vue'
import type { Organization } from './types'
import type { TrainingGroup, AssessmentTemplate, CalendarEvent } from './service-types'
const route = useRoute(),
  router = useRouter(),
  id = String(route.params.workspace),
  view = String(route.params.view),
  base = `/organization/${id}/${view}`,
  key = `event-composer:${user.value!.id}:${id}:${view}`
const data = ref<Organization>(),
  templates = ref<AssessmentTemplate[]>([]),
  groups = ref<TrainingGroup[]>([]),
  loading = ref(true),
  error = ref(''),
  loadError = ref(''),
  saved = ref(false),
  step = ref(1),
  ready = ref(false),
  search = ref(''),
  group = ref(''),
  times = ref<{ starts_at: string; ends_at: string }[]>([])
const draft = ref({
  id: crypto.randomUUID() as string,
  title: '',
  kind: 'training',
  template: '',
  staff: [] as string[],
  participants: [] as string[],
  local: addDays(localDate(profile.value?.timezone || 'UTC'), 1) + 'T09:00',
  zone: profile.value?.timezone || 'UTC',
  minutes: 60,
  count: 1,
  every: 7,
  location: '',
})
const people = computed(
    () => data.value?.members.filter((m) => m.active && m.roles.includes('trainee')) || [],
  ),
  staff = computed(
    () => data.value?.members.filter((m) => m.active && m.roles.includes('trainer')) || [],
  )
const visible = computed(() =>
  people.value
    .filter((m) => m.name.toLowerCase().includes(search.value.toLowerCase()))
    .slice(0, 30),
)
const chosen = computed(() => people.value.filter((m) => draft.value.participants.includes(m.id)))
const selectedTemplate = computed(() => templates.value.find((t) => t.id === draft.value.template))
async function allCatalog<T>(kind: string) {
  const result: T[] = []
  let offset: number | null = 0
  do {
    const page: { items: T[]; next: number | null } = await request<{
      items: T[]
      next: number | null
    }>(`/v1/workspaces/${id}/services?view=${view}&kind=${kind}&offset=${offset}`)
    result.push(...page.items)
    offset = page.next
  } while (offset !== null)
  return result
}
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    ;[data.value, templates.value, groups.value] = await Promise.all([
      request<Organization>(`/v1/workspaces/${id}?view=${view}`),
      allCatalog<AssessmentTemplate>('templates'),
      allCatalog<TrainingGroup>('groups'),
    ])
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
    await router.push(base + '/calendar/' + (result as CalendarEvent[])[0]!.id)
  },
  (_, args) =>
    request(`/v1/workspaces/${id}/calendar`, { method: 'POST', body: JSON.stringify(args) }),
)
const locked = computed(() => command.state.busy || !!command.state.pending || !command.state.ready)
function groupMembers() {
  const selected = groups.value.find((g) => g.id === group.value)
  if (selected)
    draft.value.participants = selected.members
      .filter((m) => people.value.some((p) => p.id === m.id) && !draft.value.staff.includes(m.id))
      .map((m) => m.id)
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
      saved.value = false
      await storeDraft(key, draft.value)
      saved.value = true
    } catch (e) {
      error.value = errorMessage(e)
    }
  },
  { deep: true },
)
onMounted(async () => {
  await load()
  const stored = await getDraft<typeof draft.value>(key).catch(() => undefined)
  if (stored) draft.value = stored
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
          <section v-if="step === 1" class="panel">
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
            <label v-if="draft.kind === 'assessment'"
              >{{ l('Assessment template', 'قالب التقييم')
              }}<select v-model="draft.template" required>
                <option value="" disabled>{{ l('Choose a template', 'اختر قالباً') }}</option>
                <option v-for="t in templates" :key="t.id" :value="t.id">
                  {{ t.title }}
                </option></select
              ><RouterLink
                v-if="!templates.length"
                :to="base + '/assessment-templates'"
                class="text-link"
                >{{ l('Create a template first', 'أنشئ قالباً أولاً') }}</RouterLink
              ></label
            >
            <div class="service-field-row">
              <label
                >{{ l('Local date and time', 'التاريخ والوقت المحلي')
                }}<input v-model="draft.local" type="datetime-local" required /></label
              ><label
                >{{ l('Timezone', 'المنطقة الزمنية')
                }}<input v-model="draft.zone" required list="zones" /></label
              ><datalist id="zones">
                <option>Asia/Dubai</option>
                <option>Asia/Riyadh</option>
                <option>Europe/London</option>
                <option>America/New_York</option>
                <option>UTC</option>
              </datalist>
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
          <section v-else-if="step === 2" class="panel">
            <fieldset v-if="view === 'admin'" class="form-fields">
              <legend>{{ l('Trainers / assessors', 'المدربون / المقيمون') }}</legend>
              <label v-for="m in staff" :key="m.id" class="check-label"
                ><input
                  v-model="draft.staff"
                  type="checkbox"
                  :value="m.id"
                  :disabled="draft.participants.includes(m.id)"
                />{{ m.name }}</label
              >
              <p v-if="!staff.length">
                {{
                  l(
                    'Add an organization trainer before scheduling.',
                    'أضف مدرباً للمؤسسة قبل الجدولة.',
                  )
                }}
              </p>
            </fieldset>
            <p v-else>
              {{
                l('You are the assigned trainer for this event.', 'أنت المدرب المعيّن لهذا الموعد.')
              }}
            </p>
            <h2>{{ l('Trainees', 'المتدربون') }}</h2>
            <label v-if="groups.length"
              >{{ l('Start with a group (optional)', 'ابدأ بمجموعة (اختياري)')
              }}<select v-model="group" @change="groupMembers">
                <option value="">
                  {{ l('Choose people individually', 'اختيار الأشخاص فردياً') }}
                </option>
                <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
              </select></label
            >
            <label
              >{{ l('Find trainees', 'البحث عن متدربين') }}<input v-model="search" type="search"
            /></label>
            <p class="small-print">
              {{ draft.participants.length }} {{ l('selected · up to 100', 'محدد · حتى 100') }}
            </p>
            <label v-for="m in visible" :key="m.id" class="check-label"
              ><input
                v-model="draft.participants"
                type="checkbox"
                :value="m.id"
                :disabled="draft.staff.includes(m.id)"
              />{{ m.name }}</label
            >
            <p v-if="!visible.length">
              {{ l('No matching active trainees.', 'لا يوجد متدربون نشطون مطابقون.') }}
            </p>
          </section>
          <section v-else class="panel event-review">
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
              <li v-for="m in chosen" :key="m.id">{{ m.name }}</li>
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
              :disabled="step === 2 && (!draft.staff.length || !chosen.length)"
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
