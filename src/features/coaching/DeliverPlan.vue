<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { user, profile } from '../../app/auth'
import { request, rows, rpc } from '../../lib/backend'
import type { PlanVersion, Relationship, Profile, Assignment } from '../../lib/domain'
import { language as l, errorMessage } from '../../lib/i18n'
import { programContext } from './program-context'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import OrganizationNav from '../organizations/OrganizationNav.vue'
import PageState from '../../components/PageState.vue'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
const route = useRoute(),
  context = programContext(route),
  versionId = String(route.params.id)
type Recipient = {
  id: string
  name: string
  revision?: number
  assignment_id: string | null
  assignment_revision: number | null
  current?: string
}
const version = ref<PlanVersion>(),
  people = ref<Recipient[]>([]),
  selected = ref<string[]>([]),
  search = ref(''),
  limit = ref(20),
  pagePeople = ref<Recipient[]>([]),
  nextPeople = ref<number | null>(null),
  review = ref(false),
  loading = ref(true),
  error = ref(''),
  done = ref(false)
const start = ref(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: profile.value?.timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date()),
  ),
  end = ref(''),
  mode = ref('flexible')
const key = `delivery:${user.value!.id}:${context.key}:${versionId}`
const visible = computed(() => pagePeople.value)
const recipients = computed(() => people.value.filter((p) => selected.value.includes(p.id)))
let initialized = false
watch(
  [selected, start, end, mode],
  () => {
    if (initialized)
      void storeDraft(key, {
        selected: [...selected.value],
        start: start.value,
        end: end.value,
        mode: mode.value,
      }).catch((e) => (error.value = errorMessage(e)))
  },
  { deep: true },
)
let rosterGeneration = 0,
  searchTimer: ReturnType<typeof setTimeout>
async function loadRoster(append = false) {
  const current = ++rosterGeneration
  const q = new URLSearchParams({
    view: context.view,
    search: search.value,
    selected: selected.value.join(','),
    offset: String(append ? nextPeople.value || 0 : 0),
  })
  try {
    const result = await request<{
      items: Recipient[]
      selected: Recipient[]
      next: number | null
    }>(
      (context.workspace
        ? `/v1/workspaces/${context.workspace}/recipients`
        : '/v1/coach/recipients') +
        '?' +
        q,
    )
    if (current !== rosterGeneration) return
    pagePeople.value = append ? [...pagePeople.value, ...result.items] : result.items
    people.value = Array.from(
      new Map([...result.selected, ...pagePeople.value].map((m) => [m.id, m])).values(),
    )
    nextPeople.value = result.next
  } catch (e) {
    error.value = errorMessage(e)
  }
}
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => void loadRoster(), 180)
})
async function load() {
  loading.value = true
  error.value = ''
  try {
    version.value = context.workspace
      ? (
          await request<{ version: PlanVersion }>(
            `/v1/workspaces/${context.workspace}/programs?view=${context.view}&version=${versionId}`,
          )
        ).version
      : (await rows<PlanVersion>('plan_versions', 'id', versionId))[0]
    if (!version.value) throw Error('program_unavailable')
    const local = await getDraft<{ selected: string[]; start: string; end: string; mode: string }>(
      key,
    )
    if (local) {
      selected.value = local.selected
      start.value = local.start
      end.value = local.end
      mode.value = local.mode
    } else if (route.query.member) selected.value = [String(route.query.member)]
    await loadRoster()
    initialized = true
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
const command = useCommand<'deliver'>(
  key,
  async () => {
    done.value = true
    await removeDraft(key)
  },
  (_, args) =>
    context.workspace
      ? request(`/v1/workspaces/${context.workspace}/delivery`, {
          method: 'POST',
          body: JSON.stringify(args),
        })
      : rpc('deliver_plan', {
          p_operation: args.operation,
          p_version: args.version_id,
          p_recipients: args.members,
          p_start: args.start_date,
          p_end: args.end_date,
          p_mode: args.schedule_mode,
        }),
)
const locked = computed(() => command.state.busy || !!command.state.pending || !command.state.ready)
function deliver() {
  return command.run('deliver', {
    operation: crypto.randomUUID(),
    action: 'assign',
    view: context.view,
    version_id: versionId,
    members: recipients.value.map((p) => ({
      id: p.id,
      revision: p.revision,
      assignment_id: p.assignment_id,
      assignment_revision: p.assignment_revision,
    })),
    start_date: start.value,
    end_date: end.value || null,
    schedule_mode: mode.value,
  })
}
onMounted(load)
</script>
<template>
  <OrganizationNav v-if="context.workspace" />
  <div class="container page delivery-page">
    <RouterLink class="back-link" :to="context.base + '/plans'">{{
      l('Back to programs', 'العودة للبرامج')
    }}</RouterLink>
    <header class="work-heading">
      <div>
        <p class="overline">{{ l('Program delivery', 'تعيين البرنامج') }}</p>
        <h1>{{ version?.title || l('Assign a program', 'تعيين برنامج') }}</h1>
        <p>
          {{
            l(
              'Choose people, review the schedule, then confirm.',
              'اختر الأشخاص وراجع الجدول ثم أكّد.',
            )
          }}
        </p>
      </div>
    </header>
    <CommandStatus :command="command" /><PageState :loading="loading" :error="error" @retry="load"
      ><section v-if="done" class="panel">
        <h2>{{ l('Ready for their next session.', 'جاهز للحصة القادمة.') }}</h2>
        <p>
          {{
            l(
              'The selected people now have this program. Started workouts and everyone else’s assignments are unchanged.',
              'أصبح البرنامج متاحاً للأشخاص المحددين. لم تتغير الحصص التي بدأت أو تعيينات الآخرين.',
            )
          }}
        </p>
        <RouterLink
          class="button"
          :to="context.base + (context.workspace ? '/training' : '/clients')"
          >{{ l('Open training workspace', 'فتح مساحة التدريب') }}</RouterLink
        >
      </section>
      <form v-else @submit.prevent="review ? deliver() : (review = true)">
        <fieldset class="form-fields" :disabled="locked">
          <template v-if="!review"
            ><section class="panel">
              <h2>{{ l('Who is this for?', 'لمن هذا البرنامج؟') }}</h2>
              <label
                >{{ l('Find a person', 'البحث عن شخص') }}<input v-model="search" type="search"
              /></label>
              <p v-if="!people.length" class="notice">
                {{
                  l(
                    'Invite a trainee first. Trainers can assign only to the people they are responsible for.',
                    'ادعُ متدرباً أولاً. يمكن للمدرب تعيين البرامج فقط لمن يتولى مسؤوليتهم.',
                  )
                }}
              </p>
              <label v-for="person in visible" :key="person.id" class="delivery-recipient"
                ><input
                  v-model="selected"
                  type="checkbox"
                  :value="person.id"
                  :disabled="selected.length >= 50 && !selected.includes(person.id)"
                /><span
                  ><strong>{{ person.name }}</strong
                  ><small>{{
                    person.current || l('No active plan', 'لا توجد خطة نشطة')
                  }}</small></span
                ></label
              ><button
                v-if="nextPeople !== null"
                type="button"
                class="text-link"
                @click="loadRoster(true)"
              >
                {{ l('Show more', 'عرض المزيد') }}
              </button>
              <p v-if="selected.length" class="small-print">
                {{ l('Selected people', 'الأشخاص المحددون') }}
              </p>
              <div v-for="id in selected" :key="id" class="heading-actions">
                <span>{{
                  people.find((p) => p.id === id)?.name || l('Unavailable person', 'شخص غير متاح')
                }}</span
                ><button
                  type="button"
                  class="text-link"
                  @click="selected = selected.filter((x) => x !== id)"
                >
                  {{ l('Remove', 'إزالة') }}
                </button>
              </div>
            </section>
            <section class="panel">
              <h2>{{ l('How should it run?', 'كيف يُنفّذ؟') }}</h2>
              <label
                >{{ l('Schedule', 'الجدول')
                }}<select v-model="mode">
                  <option value="flexible">
                    {{ l('Flexible — choose a session', 'مرن — اختيار الحصة') }}
                  </option>
                  <option value="cycle">
                    {{ l('Follow the program cycle', 'اتباع دورة البرنامج') }}
                  </option>
                </select></label
              >
              <div class="field-pair">
                <label
                  >{{ l('Start date', 'تاريخ البداية')
                  }}<input v-model="start" type="date" required /></label
                ><label
                  >{{ l('End date (optional)', 'تاريخ النهاية (اختياري)')
                  }}<input v-model="end" type="date" :min="start"
                /></label>
              </div>
              <p class="small-print">
                {{
                  l(
                    'Dates follow each trainee’s timezone. Cycle day 1 is the start date; unfilled days are recovery days.',
                    'التواريخ بحسب المنطقة الزمنية للمتدرب. اليوم الأول هو تاريخ البداية والأيام الفارغة للتعافي.',
                  )
                }}
              </p>
            </section>
            <button
              class="button"
              :disabled="!recipients.length || recipients.length !== selected.length"
            >
              {{ l('Review assignment', 'مراجعة التعيين') }} · {{ recipients.length }}
            </button></template
          >
          <section v-else class="panel">
            <h2>{{ l('Review before assigning', 'راجع قبل التعيين') }}</h2>
            <p>
              <strong>{{ version?.title }}</strong> · {{ start }}{{ end ? ' → ' + end : '' }} ·
              {{ mode === 'cycle' ? l('Program cycle', 'دورة البرنامج') : l('Flexible', 'مرن') }}
            </p>
            <ul>
              <li v-for="person in recipients" :key="person.id">
                {{ person.name }} —
                {{
                  person.assignment_id
                    ? l('Replace future training', 'استبدال التدريب القادم')
                    : l('First assignment', 'التعيين الأول')
                }}
              </li>
            </ul>
            <p>
              {{
                l(
                  'Existing started sessions retain their original prescription. This does not edit the program for other trainees.',
                  'تحتفظ الحصص التي بدأت بتعليماتها الأصلية. لا يتغير برنامج المتدربين الآخرين.',
                )
              }}
            </p>
            <div class="actions">
              <button type="button" class="button secondary" @click="review = false">
                {{ l('Back to selection', 'العودة للاختيار') }}</button
              ><button
                class="button"
                :disabled="!recipients.length || recipients.length !== selected.length"
              >
                {{ l('Confirm assignment', 'تأكيد التعيين') }}
              </button>
            </div>
          </section>
        </fieldset>
      </form></PageState
    >
  </div>
</template>
<style scoped>
.delivery-page {
  max-width: 900px;
}
.delivery-recipient {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
}
.delivery-recipient input {
  width: 20px;
  min-height: 20px;
  height: 20px;
  flex-shrink: 0;
}
.delivery-recipient span {
  display: grid;
  gap: 4px;
  min-width: 0;
  overflow-wrap: anywhere;
}
.delivery-recipient small {
  color: var(--muted);
}
.panel {
  margin-bottom: 20px;
}
.panel h2 {
  margin-bottom: 16px;
}
@media (max-width: 580px) {
  .field-pair {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
