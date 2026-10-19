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
type ActivePlan = {
  id: string
  revision: number
  title: string
  goal: string | null
  sport: string | null
}
type Recipient = {
  id: string
  name: string
  revision?: number
  assignment_id: string | null
  assignment_revision: number | null
  current?: string
  /** Institution recipients list every active plan; independent coaching keeps one. */
  plans?: ActivePlan[]
}
type Overlap = { id: string; title: string; goal: string | null }
type Sport = { id: string; name: string; kind: string; archived: boolean }
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
  done = ref(false),
  // Per athlete: '' adds a concurrent plan; a plan ID replaces that plan.
  replace = ref<Record<string, string>>({}),
  goal = ref(''),
  sport = ref(''),
  sports = ref<Sport[]>([]),
  overlaps = ref<{ name: string; plans: Overlap[] }[]>([])
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
        replace: { ...replace.value },
        goal: goal.value,
        sport: sport.value,
      }).catch((e) => (error.value = errorMessage(e)))
  },
  { deep: true },
)
watch(
  [replace, goal, sport],
  () => {
    if (initialized)
      void storeDraft(key, {
        selected: [...selected.value],
        start: start.value,
        end: end.value,
        mode: mode.value,
        replace: { ...replace.value },
        goal: goal.value,
        sport: sport.value,
      }).catch((e) => (error.value = errorMessage(e)))
  },
  { deep: true },
)
const planLabel = (plan: ActivePlan) =>
  [plan.title, plan.goal, sports.value.find((s) => s.id === plan.sport)?.name]
    .filter(Boolean)
    .join(' · ')
const replacedPlan = (person: Recipient) =>
  person.plans?.find((plan) => plan.id === replace.value[person.id])
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
    const local = await getDraft<{
      selected: string[]
      start: string
      end: string
      mode: string
      replace?: Record<string, string>
      goal?: string
      sport?: string
    }>(key)
    if (local) {
      selected.value = local.selected
      start.value = local.start
      end.value = local.end
      mode.value = local.mode
      replace.value = local.replace || {}
      goal.value = local.goal || ''
      sport.value = local.sport || ''
    } else if (route.query.member) selected.value = [String(route.query.member)]
    if (context.workspace)
      sports.value = (
        await request<{ items: Sport[] }>(
          `/v1/workspaces/${context.workspace}/sports?view=${context.view}`,
        ).catch(() => ({ items: [] as Sport[] }))
      ).items.filter((s) => !s.archived)
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
  async (_, result) => {
    // Concurrent plans are allowed; report overlapping dates so the coach can review them.
    overlaps.value = Array.isArray(result)
      ? (result as { member_id: string; overlaps?: Overlap[] }[])
          .filter((r) => r.overlaps?.length)
          .map((r) => ({
            name: people.value.find((p) => p.id === r.member_id)?.name || '',
            plans: r.overlaps!,
          }))
      : []
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
  {
    successMessage: l(
      'Program assigned to the selected athletes.',
      'تم تعيين البرنامج للرياضيين المحددين.',
    ),
  },
)
const locked = computed(() => command.state.busy || !!command.state.pending || !command.state.ready)
function deliver() {
  return command.run('deliver', {
    operation: crypto.randomUUID(),
    action: 'assign',
    view: context.view,
    version_id: versionId,
    members: recipients.value.map((p) =>
      context.workspace
        ? {
            id: p.id,
            revision: p.revision,
            replaces: replacedPlan(p)?.id || null,
            replaces_revision: replacedPlan(p)?.revision ?? null,
          }
        : {
            id: p.id,
            revision: p.revision,
            assignment_id: p.assignment_id,
            assignment_revision: p.assignment_revision,
          },
    ),
    start_date: start.value,
    end_date: end.value || null,
    schedule_mode: mode.value,
    ...(context.workspace ? { goal: goal.value.trim() || null, sport: sport.value || null } : {}),
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
        <section v-if="overlaps.length" class="notice" role="status">
          <h3>{{ l('Overlapping plans', 'خطط متداخلة') }}</h3>
          <p>
            {{
              l(
                'These athletes have other active plans in the same period. Same-day sessions are allowed; review the combined load.',
                'لدى هؤلاء الرياضيين خطط نشطة أخرى في الفترة نفسها. يُسمح بحصص في اليوم نفسه؛ راجع الحمل الإجمالي.',
              )
            }}
          </p>
          <ul>
            <li v-for="item in overlaps" :key="item.name" dir="auto">
              <strong>{{ item.name }}</strong
              >:
              {{ item.plans.map((p) => [p.title, p.goal].filter(Boolean).join(' · ')).join('، ') }}
            </li>
          </ul>
        </section>
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
                    person.plans
                      ? person.plans.map(planLabel).join('، ') ||
                        l('No active plan', 'لا توجد خطة نشطة')
                      : person.current || l('No active plan', 'لا توجد خطة نشطة')
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
              <div v-for="id in selected" :key="id" class="selected-recipient">
                <div class="heading-actions">
                  <span dir="auto">{{
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
                <label v-if="context.workspace && people.find((p) => p.id === id)?.plans?.length"
                  >{{ l('Existing plans', 'الخطط الحالية')
                  }}<select
                    :value="replace[id] || ''"
                    @change="
                      replace = {
                        ...replace,
                        [id]: ($event.target as HTMLSelectElement).value,
                      }
                    "
                  >
                    <option value="">
                      {{ l('Keep them and add this plan', 'إبقاؤها وإضافة هذه الخطة') }}
                    </option>
                    <option
                      v-for="plan in people.find((p) => p.id === id)?.plans"
                      :key="plan.id"
                      :value="plan.id"
                    >
                      {{ l('Replace: ', 'استبدال: ') + planLabel(plan) }}
                    </option>
                  </select></label
                >
              </div>
            </section>
            <section class="panel">
              <h2>{{ l('How should it run?', 'كيف يُنفّذ؟') }}</h2>
              <div v-if="context.workspace" class="field-pair">
                <label
                  >{{ l('Goal (optional)', 'الهدف (اختياري)')
                  }}<input
                    v-model="goal"
                    maxlength="80"
                    :placeholder="l('For example: match speed', 'مثال: سرعة المباراة')" /></label
                ><label
                  >{{ l('Sport (optional)', 'الرياضة (اختياري)')
                  }}<select v-model="sport">
                    <option value="">{{ l('Not sport-specific', 'غير مرتبطة برياضة') }}</option>
                    <option v-for="s in sports" :key="s.id" :value="s.id">{{ s.name }}</option>
                  </select></label
                >
              </div>
              <p v-if="context.workspace && context.view === 'trainer'" class="small-print">
                {{
                  l(
                    'If you support an athlete for one sport, label the plan with that sport. Primary coaches can assign any plan.',
                    'إذا كنت تدعم رياضياً في رياضة واحدة، فاربط الخطة بتلك الرياضة. يمكن للمدرب الأساسي تعيين أي خطة.',
                  )
                }}
              </p>
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
              <strong>{{ version?.title }}</strong
              ><template v-if="goal.trim()"> · {{ goal.trim() }}</template
              ><template v-if="sport"> · {{ sports.find((s) => s.id === sport)?.name }}</template> ·
              {{ start }}{{ end ? ' → ' + end : '' }} ·
              {{ mode === 'cycle' ? l('Program cycle', 'دورة البرنامج') : l('Flexible', 'مرن') }}
            </p>
            <ul>
              <li v-for="person in recipients" :key="person.id" dir="auto">
                {{ person.name }} —
                {{
                  !context.workspace
                    ? person.assignment_id
                      ? l('Replace future training', 'استبدال التدريب القادم')
                      : l('First assignment', 'التعيين الأول')
                    : replacedPlan(person)
                      ? l('Replaces ', 'تستبدل ') + planLabel(replacedPlan(person)!)
                      : person.plans?.length
                        ? l('Added alongside current plans', 'تُضاف إلى الخطط الحالية')
                        : l('First plan', 'الخطة الأولى')
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
.selected-recipient {
  display: grid;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}
.selected-recipient span {
  overflow-wrap: anywhere;
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
