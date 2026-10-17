<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { user, profile, contexts } from '../../app/auth'
import { request } from '../../lib/backend'
import { language as l, errorMessage, dateLabel } from '../../lib/i18n'
import { localDate } from '../../lib/dates'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import MemberPicker from '../organizations/MemberPicker.vue'
import OrganizationNav from '../organizations/OrganizationNav.vue'
import PageState from '../../components/PageState.vue'
import MacroPlanner from './MacroPlanner.vue'
import MealPlanEditor from './MealPlanEditor.vue'
import OrganizationMealFields from './OrganizationMealFields.vue'
import { nutrientKeys, nutrientTotals, type Nutrients, type PlannedFood } from './model'
import './organization-nutrition.css'
type Plan = {
  id: string
  revision: number
  effective_on: string
  expires_on: string | null
  targets: Nutrients
  meals: PlannedFood[]
  guidance: string
  author_id: string
  created_at: string
}
type Meal = {
  id: string
  revision: number
  logged_on: string
  food: PlannedFood
  note: string
  removed: boolean
}
type Data = {
  member: { id: string; name: string; active: boolean; roles: string[] } | null
  today: string
  date: string
  sharing: { enabled: boolean; revision: number }
  canReadDiary: boolean
  current: Plan | null
  latestRevision: number
  plans: Plan[]
  total: number
  next: number | null
  authors: { id: string; name: string }[]
  removed: Meal[]
  removedNext: number | null
  meals: Meal[]
  corrections: { id: string; revision: number; document: Meal; recorded_at: string }[]
  correctionsNext: number | null
}
const route = useRoute(),
  router = useRouter(),
  workspace = String(route.params.workspace),
  view = String(route.params.view),
  trainee = view === 'trainee'
const endpoint = `/v1/workspaces/${workspace}/nutrition`
const workspaceName = computed(
  () =>
    contexts.value.find((c) => c.workspace_id === workspace)?.name || l('Institution', 'المؤسسة'),
)
const selected = ref(String(route.query.member || '')),
  date = ref(localDate(profile.value?.timezone || 'UTC')),
  section = ref('plan'),
  choosing = ref(!selected.value)
const data = ref<Data>(),
  loading = ref(false),
  error = ref(''),
  editor = ref(false),
  mealEditor = ref(false),
  restored = ref(false),
  savingDraft = ref(false),
  draftError = ref(''),
  review = ref(false),
  removeId = ref(''),
  historyMeal = ref('')
const initialFood = (): PlannedFood => ({
  name: '',
  meal: 'breakfast',
  quantity: 1,
  basis: 1,
  unit: 'serving',
  nutrients: {},
  source: l('Manual entry', 'إدخال يدوي'),
})
const plan = ref({
  revision: 0,
  effective_on: date.value,
  expires_on: '',
  targets: {} as Nutrients,
  meals: [] as PlannedFood[],
  guidance: '',
})
const meal = ref({ id: crypto.randomUUID() as string, revision: 0, food: initialFood(), note: '' })
const hasPlanDraft = ref(false),
  hasMealDraft = ref(false),
  includeRemoved = ref(false)
const keyFor = (member = selected.value, day = date.value) =>
  `organization-nutrition:${user.value!.id}:${workspace}:${view}:${member}:${day}`
let disposed = false,
  generation = 0,
  draftGeneration = 0,
  ready = false,
  draftWrite = Promise.resolve()
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value))
function snapshot() {
  return clone({
    hasPlanDraft: hasPlanDraft.value,
    hasMealDraft: hasMealDraft.value,
    plan: plan.value,
    meal: meal.value,
    editor: editor.value,
    mealEditor: mealEditor.value,
  })
}
watch(
  [plan, meal, editor, mealEditor, hasPlanDraft, hasMealDraft],
  () => {
    if (!ready) return
    const key = keyFor(),
      value = snapshot()
    const draftStamp = ++draftGeneration
    savingDraft.value = true
    draftWrite = draftWrite
      .then(() => storeDraft(key, value))
      .then(() => {
        if (!disposed && draftStamp === draftGeneration) {
          savingDraft.value = false
          draftError.value = ''
        }
      })
      .catch(() => {
        if (!disposed && draftStamp === draftGeneration) {
          savingDraft.value = false
          draftError.value = l(
            'Could not keep a device draft. Keep this page open.',
            'تعذر حفظ مسودة الجهاز. أبقِ الصفحة مفتوحة.',
          )
        }
      })
  },
  { deep: true, flush: 'sync' },
)
function freshPlan(source = data.value?.current) {
  return {
    revision: data.value?.latestRevision || 0,
    effective_on: data.value?.today || date.value,
    expires_on: '',
    targets: clone(source?.targets || {}),
    meals: clone(source?.meals || []),
    guidance: source?.guidance || '',
  }
}
async function load(reset = false, offset = 0, historyOffset = 0, removedOffset = 0) {
  const stamp = ++generation
  loading.value = true
  error.value = ''
  if (reset) {
    ready = false
    data.value = undefined
    review.value = false
    historyMeal.value = ''
    removeId.value = ''
  }
  try {
    await draftWrite
    const q = new URLSearchParams({
      view,
      date: date.value,
      offset: String(offset),
      historyOffset: String(historyOffset),
      removed: String(includeRemoved.value),
      removedOffset: String(removedOffset),
    })
    if (selected.value) q.set('member', selected.value)
    if (historyMeal.value) q.set('meal', historyMeal.value)
    const result = await request<Data>(`${endpoint}?${q}`)
    if (disposed || stamp !== generation) return
    data.value = result
    if (trainee && result.member) selected.value = result.member.id
    if (reset) {
      hasPlanDraft.value = false
      hasMealDraft.value = false
      plan.value = freshPlan()
      meal.value = { id: crypto.randomUUID(), revision: 0, food: initialFood(), note: '' }
      editor.value = false
      mealEditor.value = false
      restored.value = false
      const draft = result.member ? await getDraft<ReturnType<typeof snapshot>>(keyFor()) : null
      if (disposed || stamp !== generation) return
      if (draft) {
        hasPlanDraft.value = !!draft.hasPlanDraft
        hasMealDraft.value = !!draft.hasMealDraft
        plan.value = draft.plan
        meal.value = draft.meal
        editor.value = draft.editor
        mealEditor.value = draft.mealEditor
        restored.value = true
      }
    }
  } catch (e) {
    if (!disposed && stamp === generation) {
      data.value = undefined
      error.value = errorMessage(e)
    }
  } finally {
    if (!disposed && stamp === generation) {
      loading.value = false
      ready = true
    }
  }
}
async function choose(ids: string[]) {
  if (locked.value) return
  await draftWrite
  selected.value = ids[0] || ''
  choosing.value = !selected.value
  await router.replace({ query: selected.value ? { member: selected.value } : {} })
  if (!disposed) await load(true)
}
async function changeDate() {
  await load(true)
}
const command = useCommand<string>(
  `organization-nutrition:${workspace}:${view}`,
  async (_name, _result, args) => {
    await draftWrite
    if (args.action === 'publish' || args.action === 'meal')
      await removeDraft(keyFor(String(args.member), String(args.draftDate)))
    if (disposed || args.member !== selected.value || args.draftDate !== date.value) return
    ready = false
    if (args.action === 'publish') {
      hasPlanDraft.value = false
      editor.value = false
      review.value = false
    }
    if (args.action === 'meal') {
      hasMealDraft.value = false
      mealEditor.value = false
      meal.value = { id: crypto.randomUUID(), revision: 0, food: initialFood(), note: '' }
    }
    removeId.value = ''
    restored.value = false
    await load(false)
  },
  (_name, args) => request(endpoint, { method: 'POST', body: JSON.stringify(args) }),
)
const locked = computed(
  () => !command.state.ready || command.state.busy || !!command.state.pending || loading.value,
)
const canWrite = computed(
  () => data.value?.member?.active && data.value.member.roles.includes('trainee'),
)
function send(action: string, args: Record<string, unknown>) {
  if (locked.value || !data.value?.member) return
  return command.run(action, {
    ...args,
    operation: crypto.randomUUID(),
    action,
    view,
    member: data.value.member.id,
    draftDate: date.value,
  })
}
function closePlanEditor() {
  editor.value = false
  review.value = false
}
function showChanges(id: string) {
  historyMeal.value = id
  return load()
}
function reusePlan(value: Plan) {
  hasPlanDraft.value = false
  editPlan(value)
  section.value = 'plan'
}
function revealInvalid(event: Event) {
  const target = event.target as HTMLElement
  const details = target.closest('details')
  if (details) details.open = true
}
async function discardPlan() {
  await load(false)
  if (error.value || !data.value?.member) return
  plan.value = freshPlan()
  hasPlanDraft.value = false
  editor.value = false
  review.value = false
}
function publish() {
  return send('publish', { ...plan.value, id: crypto.randomUUID() })
}
watch(
  plan,
  () => {
    review.value = false
  },
  { deep: true, flush: 'sync' },
)
function editPlan(source = data.value?.current) {
  if (!hasPlanDraft.value) plan.value = freshPlan(source)
  hasPlanDraft.value = true
  editor.value = true
  review.value = false
}
async function editMeal(item?: Meal, food?: PlannedFood) {
  if (item || food || !hasMealDraft.value)
    meal.value = item
      ? { id: item.id, revision: item.revision, food: clone(item.food), note: item.note }
      : { id: crypto.randomUUID(), revision: 0, food: food ? clone(food) : initialFood(), note: '' }
  hasMealDraft.value = true
  mealEditor.value = true
  section.value = 'diary'
  await nextTick()
  document.querySelector<HTMLInputElement>('.org-meal-editor input')?.focus()
}
const totals = computed(() => nutrientTotals((data.value?.meals || []).map((m) => m.food)))
const planTotals = computed(() => nutrientTotals(data.value?.current?.meals || []))
const labels = {
  kcal: ['Energy', 'الطاقة'],
  protein_g: ['Protein', 'البروتين'],
  carb_g: ['Carbohydrate', 'الكربوهيدرات'],
  fat_g: ['Fat', 'الدهون'],
}
const label = (key: (typeof nutrientKeys)[number]) => l(labels[key][0]!, labels[key][1]!)
const unit = (key: string) => (key === 'kcal' ? l('kcal', 'سعرة') : l('g', 'غ'))
const mealLabel = (v: string) =>
  ({
    breakfast: l('Breakfast', 'الفطور'),
    lunch: l('Lunch', 'الغداء'),
    dinner: l('Dinner', 'العشاء'),
    snack: l('Snack', 'وجبة خفيفة'),
  })[v]
const shortDate = (value: string) => dateLabel(value.slice(0, 10))
const author = (id: string) =>
  data.value?.authors.find((a) => a.id === id)?.name || l('Former member', 'عضو سابق')
onMounted(() => load(true))
onBeforeUnmount(() => {
  disposed = true
  ready = false
  generation++
})
</script>
<template>
  <OrganizationNav />
  <section
    class="container page org-nutrition nutrition-workspace"
    :class="{ 'with-member': data?.member && !choosing }"
  >
    <header class="page-heading">
      <div>
        <h1>{{ l('Nutrition', 'التغذية') }}</h1>
        <p class="subtle">
          {{
            l(
              'Clear targets, practical meals, and shared follow-up.',
              'أهداف واضحة ووجبات عملية ومتابعة مشتركة.',
            )
          }}
        </p>
      </div>
      <button class="button small secondary" :disabled="locked" @click="load()">
        {{ l('Refresh', 'تحديث') }}
      </button>
    </header>
    <CommandStatus v-if="!loading" :command="command" />
    <p v-if="!draftError && (hasPlanDraft || hasMealDraft)" class="small-print" role="status">
      {{
        savingDraft
          ? l('Saving draft…', 'جارٍ حفظ المسودة…')
          : l('Draft saved on this device.', 'المسودة محفوظة على هذا الجهاز.')
      }}
    </p>
    <p v-if="draftError" class="notice error" role="alert">{{ draftError }}</p>
    <div v-if="!trainee" class="org-nutrition-person">
      <div v-if="data?.member" class="section-header">
        <strong dir="auto">{{ data.member.name }}</strong
        ><button
          class="text-link"
          :disabled="locked"
          :aria-expanded="choosing"
          @click="choosing = !choosing"
        >
          {{ l('Change trainee', 'تغيير المتدرب') }}
        </button>
      </div>
      <div v-if="choosing">
        <h2>{{ l('Choose a trainee', 'اختر متدرباً') }}</h2>
        <p class="subtle">
          {{
            view === 'admin'
              ? l('Choose anyone in this institution.', 'اختر من متدربي هذه المؤسسة.')
              : l('Your assigned trainees appear here.', 'يظهر هنا المتدربون المسندون إليك.')
          }}
        </p>
        <MemberPicker
          :workspace="workspace"
          :view="view"
          role="trainee"
          :single="true"
          :model-value="selected ? [selected] : []"
          :disabled="locked"
          @update:model-value="choose"
        />
      </div>
    </div>
    <PageState :loading="loading" :error="error" @retry="load(true)">
      <template v-if="data?.member">
        <p v-if="!canWrite" class="notice">
          {{
            l(
              'This membership is inactive. History is read-only.',
              'هذه العضوية غير نشطة. السجل للقراءة فقط.',
            )
          }}
        </p>
        <div class="org-nutrition-toolbar">
          <div
            class="org-nutrition-sections"
            role="group"
            :aria-label="l('Nutrition views', 'عرض التغذية')"
          >
            <button
              v-for="item in [
                ['plan', l('Plan', 'الخطة')],
                ['example', l('Example meal plan', 'مثال لخطة وجبات')],
                ['diary', l('Food diary', 'سجل الطعام')],
                ['history', l('Plan history', 'سجل الخطط')],
              ]"
              :key="item[0]"
              :aria-pressed="section === item[0]"
              @click="section = item[0]!"
            >
              {{ item[1] }}
            </button>
          </div>
          <label
            >{{ l('Viewing date', 'تاريخ العرض')
            }}<input
              v-model="date"
              type="date"
              required
              :disabled="locked || editor || mealEditor"
              @change="changeDate"
          /></label>
        </div>
        <p v-if="restored && (editor || mealEditor)" class="small-print" role="status">
          {{ l('Draft restored from this device.', 'استُعيدت المسودة من هذا الجهاز.') }}
        </p>
        <div
          class="org-nutrition-panel"
          tabindex="0"
          :aria-label="l('Nutrition details', 'تفاصيل التغذية')"
        >
          <template v-if="section === 'plan'">
            <form
              v-if="editor && !trainee"
              class="form-stack org-plan-editor"
              @submit.prevent="review = true"
              @invalid.capture="revealInvalid"
            >
              <fieldset :disabled="locked">
                <legend class="sr-only">{{ l('Nutrition plan', 'خطة التغذية') }}</legend>
                <div class="section-header">
                  <h2>{{ l('Update nutrition plan', 'تحديث خطة التغذية') }}</h2>
                  <button class="text-link" type="button" @click="closePlanEditor">
                    {{ l('Close editor', 'إغلاق المحرر') }}
                  </button>
                </div>
                <p class="subtle">
                  {{
                    l(
                      'Publishing creates a new version for this trainee. Earlier versions stay in history.',
                      'ينشئ النشر نسخة جديدة لهذا المتدرب. تبقى النسخ السابقة في السجل.',
                    )
                  }}
                </p>
                <div class="org-nutrition-fields">
                  <label
                    >{{ l('Starts on', 'يبدأ في')
                    }}<input
                      v-model="plan.effective_on"
                      type="date"
                      :min="data.today"
                      required
                      @input="review = false" /></label
                  ><label
                    >{{ l('Ends on (optional)', 'ينتهي في (اختياري)')
                    }}<input
                      v-model="plan.expires_on"
                      type="date"
                      :min="plan.effective_on"
                      @input="review = false"
                  /></label>
                </div>
                <MacroPlanner v-model="plan.targets" />
                <MealPlanEditor v-model="plan.meals" />
                <label
                  >{{ l('Guidance', 'إرشادات')
                  }}<textarea v-model="plan.guidance" rows="3" maxlength="4000" />
                </label>
                <div v-if="review" class="notice">
                  <strong
                    >{{ l('Ready to publish for', 'جاهز للنشر إلى') }}
                    {{ data.member.name }}</strong
                  >
                  <p>
                    {{ shortDate(plan.effective_on)
                    }}<template v-if="plan.expires_on">
                      — {{ shortDate(plan.expires_on) }}</template
                    >
                    · {{ plan.meals.length }} {{ l('suggested foods', 'أطعمة مقترحة') }}
                  </p>
                  <p>
                    {{
                      l(
                        'Visible to this trainee, institution admins and their assigned trainer.',
                        'مرئية لهذا المتدرب ومسؤولي المؤسسة والمدرب المسند إليه.',
                      )
                    }}
                  </p>
                  <button type="button" class="button" @click="publish">
                    {{ l('Publish plan', 'نشر الخطة') }}
                  </button>
                </div>
                <button v-else class="button" type="submit">
                  {{ l('Review plan', 'مراجعة الخطة') }}
                </button>
                <button type="button" class="text-link" @click="discardPlan">
                  {{ l('Discard draft and load latest plan', 'تجاهل المسودة وتحميل أحدث خطة') }}
                </button>
              </fieldset>
            </form>
            <template v-else>
              <div class="section-header">
                <h2>{{ l('Daily targets', 'الأهداف اليومية') }}</h2>
                <button
                  v-if="!trainee && canWrite"
                  class="button small"
                  :disabled="locked"
                  @click="editPlan()"
                >
                  {{
                    hasPlanDraft
                      ? l('Continue draft', 'متابعة المسودة')
                      : data.current
                        ? l('Update plan', 'تحديث الخطة')
                        : l('Create plan', 'إنشاء خطة')
                  }}
                </button>
              </div>
              <template v-if="data.current"
                ><p class="subtle">
                  {{ l('Version', 'النسخة') }} {{ data.current.revision }} · {{ l('From', 'من') }}
                  {{ shortDate(data.current.effective_on)
                  }}<template v-if="data.current.expires_on">
                    · {{ l('Through', 'حتى') }} {{ shortDate(data.current.expires_on) }}</template
                  >
                </p>
                <div class="nutrition-totals">
                  <div v-for="key in nutrientKeys" :key="key">
                    <span>{{ label(key) }}</span
                    ><strong
                      >{{ data.current.targets[key] ?? '—' }} <small>{{ unit(key) }}</small></strong
                    >
                  </div>
                </div>
                <p class="org-guidance" v-if="data.current.guidance">{{ data.current.guidance }}</p>
                <button class="text-link" @click="section = 'example'">
                  {{ l('View example meal plan', 'عرض مثال لخطة الوجبات') }}
                </button></template
              >
              <div v-else class="empty-state empty-state--compact">
                <h3>{{ l('No plan for this date', 'لا توجد خطة لهذا التاريخ') }}</h3>
                <p>
                  {{
                    trainee
                      ? l(
                          'Your institution can publish daily targets and meal ideas here.',
                          'يمكن لمؤسستك نشر أهداف يومية ومقترحات وجبات هنا.',
                        )
                      : l(
                          'Set daily targets and practical food suggestions for this trainee. Scheduled and past plans are in Plan history.',
                          'حدّد أهدافاً يومية ومقترحات طعام عملية لهذا المتدرب. الخطط المجدولة والسابقة في سجل الخطط.',
                        )
                  }}
                </p>
              </div>
            </template>
          </template>
          <template v-else-if="section === 'example'">
            <div class="section-header">
              <h2>{{ l('Example meal plan', 'مثال لخطة وجبات') }}</h2>
              <button
                v-if="!trainee && canWrite"
                class="button small"
                :disabled="locked"
                @click="editPlan()"
              >
                {{ l('Edit meal plan', 'تعديل خطة الوجبات') }}
              </button>
            </div>
            <template v-if="data.current?.meals.length">
              <h3 v-if="data.current.meals.length">{{ l('Example day', 'مثال ليوم غذائي') }}</h3>
              <p v-if="data.current.meals.length" class="subtle">
                {{
                  l(
                    'Suggestions only. Record what was actually eaten, adjusting portions as needed.',
                    'مقترحات فقط. سجّل ما تم تناوله فعلياً مع تعديل الكميات عند الحاجة.',
                  )
                }}
              </p>
              <article v-for="(food, i) in data.current.meals" :key="i" class="org-food-row">
                <div>
                  <small>{{ mealLabel(food.meal) }}</small
                  ><strong dir="auto">{{ food.name }}</strong
                  ><span
                    >{{ food.quantity }} {{ food.unit }} ·
                    {{
                      food.nutrients.kcal == null
                        ? l('Energy unknown', 'الطاقة غير معروفة')
                        : Math.round((food.nutrients.kcal * food.quantity) / food.basis) +
                          ' ' +
                          unit('kcal')
                    }}</span
                  >
                </div>
                <button
                  v-if="trainee && canWrite"
                  class="text-link"
                  :disabled="locked"
                  @click="editMeal(undefined, food)"
                >
                  {{ l('Record this food', 'تسجيل هذا الطعام') }}
                </button>
              </article>
              <p v-if="data.current.meals.length" class="small-print">
                {{ l('Example day energy', 'طاقة المثال اليومي') }}:
                {{ planTotals.kcal.value ?? '—' }} {{ unit('kcal') }}
                {{ planTotals.kcal.missing ? l('(incomplete values)', '(قيم غير مكتملة)') : '' }}
              </p></template
            >
            <p v-else class="notice">
              {{
                l(
                  'No example meals for this date. Your plan’s targets remain available in Plan.',
                  'لا توجد وجبات مقترحة لهذا التاريخ. الأهداف متاحة في الخطة.',
                )
              }}
            </p>
          </template>
          <template v-else-if="section === 'diary'">
            <div class="section-header">
              <h2>{{ l('Food diary', 'سجل الطعام') }}</h2>
              <button
                v-if="trainee && canWrite && !mealEditor"
                class="button small"
                :disabled="locked"
                @click="editMeal()"
              >
                {{
                  hasMealDraft
                    ? l('Continue food entry', 'متابعة مدخل الطعام')
                    : l('Record food', 'تسجيل طعام')
                }}
              </button>
            </div>
            <div class="org-sharing">
              <p>
                <strong>{{
                  data.sharing.enabled
                    ? l('Shared with your institution', 'مشترك مع مؤسستك')
                    : l('Food records are not shared', 'سجلات الطعام غير مشتركة')
                }}</strong>
              </p>
              <p class="subtle">
                {{
                  trainee
                    ? l(
                        'Sharing lets institution admins and your currently assigned trainer read all entries and corrections in this diary. Personal nutrition elsewhere stays separate.',
                        'تسمح المشاركة لمسؤولي المؤسسة ومدربك الحالي بقراءة جميع المدخلات والتصحيحات في هذا السجل. تبقى تغذيتك الشخصية منفصلة.',
                      )
                    : l(
                        'Only the trainee can change sharing or record food. No entries is not proof that no food was eaten.',
                        'المتدرب وحده يغيّر المشاركة أو يسجل الطعام. عدم وجود سجلات لا يعني عدم تناول الطعام.',
                      )
                }}
              </p>
              <button
                v-if="trainee && canWrite"
                type="button"
                class="button small secondary"
                :disabled="locked"
                @click="
                  send('sharing', {
                    enabled: !data.sharing.enabled,
                    revision: data.sharing.revision,
                  })
                "
              >
                {{
                  data.sharing.enabled
                    ? l('Stop sharing diary', 'إيقاف مشاركة السجل')
                    : l('Share diary with institution', 'مشاركة السجل مع المؤسسة')
                }}
              </button>
              <p v-if="trainee && data.sharing.enabled" class="small-print">
                {{
                  l(
                    'Stopping sharing hides all entries from staff; it cannot recall copies they already viewed.',
                    'يخفي إيقاف المشاركة جميع المدخلات عن الموظفين، لكنه لا يسترجع النسخ التي سبق عرضها.',
                  )
                }}
              </p>
            </div>
            <template v-if="data.canReadDiary">
              <div class="nutrition-totals">
                <div v-for="key in nutrientKeys" :key="key">
                  <span>{{ label(key) }}</span
                  ><strong
                    >{{ totals[key].value ?? '—' }} <small>{{ unit(key) }}</small></strong
                  ><span v-if="data.current?.targets[key] != null"
                    >{{ l('Target', 'الهدف') }} {{ data.current.targets[key] }}
                    {{ unit(key) }}</span
                  ><progress
                    v-if="data.current?.targets[key] && totals[key].value != null"
                    :value="totals[key].value!"
                    :max="Math.max(data.current.targets[key]!, totals[key].value!)"
                    :aria-label="
                      label(key) + ' ' + l('recorded against target', 'المسجل مقابل الهدف')
                    "
                  /><small v-if="totals[key].missing">{{
                    l('Some values are unknown', 'بعض القيم غير معروفة')
                  }}</small>
                </div>
              </div>
              <form
                v-if="mealEditor && trainee"
                class="form-stack org-meal-editor"
                @invalid.capture="revealInvalid"
                @submit.prevent="send('meal', { ...meal, logged_on: date })"
              >
                <fieldset :disabled="locked">
                  <legend>
                    <h3>
                      {{
                        meal.revision
                          ? l('Correct food entry', 'تصحيح مدخل الطعام')
                          : l('Record food', 'تسجيل طعام')
                      }}
                    </h3>
                  </legend>
                  <OrganizationMealFields v-model="meal.food" /><label
                    >{{ l('Note (optional)', 'ملاحظة (اختياري)')
                    }}<textarea v-model="meal.note" rows="2" maxlength="2000" />
                  </label>
                  <div class="button-row">
                    <button type="submit" class="button">
                      {{ l('Save food entry', 'حفظ مدخل الطعام') }}</button
                    ><button type="button" class="button secondary" @click="mealEditor = false">
                      {{ l('Close editor', 'إغلاق المحرر') }}
                    </button>
                  </div>
                </fieldset>
              </form>
              <p v-if="!data.meals.length" class="empty-state-note">
                {{ l('No food recorded for this date.', 'لم يُسجل طعام لهذا التاريخ.') }}
              </p>
              <article v-for="item in data.meals" :key="item.id" class="org-food-row">
                <div>
                  <small>{{ mealLabel(item.food.meal) }}</small
                  ><strong dir="auto">{{ item.food.name }}</strong
                  ><span
                    >{{ item.food.quantity }} {{ item.food.unit }} ·
                    {{
                      item.food.nutrients.kcal == null
                        ? l('Energy unknown', 'الطاقة غير معروفة')
                        : Math.round(
                            (item.food.nutrients.kcal * item.food.quantity) / item.food.basis,
                          ) +
                          ' ' +
                          unit('kcal')
                    }}</span
                  >
                  <p v-if="item.note" dir="auto">{{ item.note }}</p>
                  <small>{{ item.food.source }}</small>
                </div>
                <div class="org-food-actions">
                  <button
                    v-if="trainee && canWrite"
                    class="text-link"
                    :disabled="locked"
                    @click="editMeal(item)"
                  >
                    {{ l('Correct', 'تصحيح') }}</button
                  ><button class="text-link" :disabled="locked" @click="showChanges(item.id)">
                    {{ l('Changes', 'التغييرات') }}</button
                  ><button
                    v-if="trainee && canWrite"
                    class="text-link"
                    :disabled="locked"
                    @click="removeId = item.id"
                  >
                    {{ l('Remove', 'إزالة') }}</button
                  ><template v-if="removeId === item.id"
                    ><span>{{ l('Remove this entry?', 'إزالة هذا المدخل؟') }}</span
                    ><button
                      class="button small secondary"
                      :disabled="locked"
                      @click="send('remove', { id: item.id, revision: item.revision })"
                    >
                      {{ l('Confirm removal', 'تأكيد الإزالة') }}</button
                    ><button class="text-link" @click="removeId = ''">
                      {{ l('Cancel', 'إلغاء') }}
                    </button></template
                  >
                </div>
              </article>
              <label class="check-label"
                ><input
                  type="checkbox"
                  v-model="includeRemoved"
                  :disabled="locked"
                  @change="load()"
                />{{ l('Show removed entries', 'عرض المدخلات المُزالة') }}</label
              >
              <div v-if="includeRemoved" class="org-removed">
                <p v-if="!data.removed.length" class="small-print">
                  {{ l('No removed entries for this date.', 'لا مدخلات مُزالة لهذا التاريخ.') }}
                </p>
                <article v-for="item in data.removed" :key="item.id" class="org-food-row">
                  <div>
                    <strong dir="auto">{{ item.food.name }}</strong
                    ><small>{{
                      l('Removed — excluded from totals', 'مُزال — غير محتسب في الإجمالي')
                    }}</small>
                  </div>
                  <button class="text-link" :disabled="locked" @click="showChanges(item.id)">
                    {{ l('Changes', 'التغييرات') }}
                  </button>
                </article>
                <button
                  v-if="data.removedNext !== null"
                  class="text-link"
                  :disabled="locked"
                  @click="load(false, 0, 0, data.removedNext)"
                >
                  {{ l('Older removed entries', 'مدخلات مُزالة أقدم') }}
                </button>
              </div>
              <section v-if="historyMeal" class="org-sharing">
                <div class="section-header">
                  <h3>{{ l('Entry changes', 'تغييرات المدخل') }}</h3>
                  <button class="text-link" @click="historyMeal = ''">
                    {{ l('Close', 'إغلاق') }}
                  </button>
                </div>
                <p v-for="change in data.corrections" :key="change.id">
                  {{ l('Revision', 'المراجعة') }} {{ change.revision }} ·
                  {{ change.document.food.name }} · {{ change.document.food.quantity }}
                  {{ change.document.food.unit }}
                  {{ change.document.removed ? l('Removed', 'مُزال') : '' }}
                </p>
                <button
                  v-if="data.correctionsNext !== null"
                  class="text-link"
                  :disabled="locked"
                  @click="load(false, 0, data.correctionsNext)"
                >
                  {{ l('Earlier changes', 'تغييرات أقدم') }}
                </button>
              </section>
            </template>
          </template>
          <template v-else>
            <h2>{{ l('Plan history', 'سجل الخطط') }}</h2>
            <p class="subtle">
              {{
                l(
                  'Published versions are kept unchanged, including after trainer reassignment.',
                  'تبقى النسخ المنشورة دون تغيير، حتى عند إعادة تعيين المدرب.',
                )
              }}
            </p>
            <p v-if="!data.plans.length" class="empty-state-note">
              {{ l('No published plans yet.', 'لا توجد خطط منشورة بعد.') }}
            </p>
            <details v-for="p in data.plans" :key="p.id" class="org-plan-history">
              <summary>
                {{ l('Version', 'النسخة') }} {{ p.revision }} · {{ shortDate(p.effective_on) }} ·
                {{ author(p.author_id) }}
              </summary>
              <p v-if="p.expires_on">{{ l('Ends', 'تنتهي') }} {{ shortDate(p.expires_on) }}</p>
              <div class="nutrition-totals">
                <div v-for="key in nutrientKeys" :key="key">
                  <span>{{ label(key) }}</span
                  ><strong
                    >{{ p.targets[key] ?? '—' }} <small>{{ unit(key) }}</small></strong
                  >
                </div>
              </div>
              <p class="org-guidance">{{ p.guidance }}</p>
              <p v-for="(food, i) in p.meals" :key="i">
                {{ mealLabel(food.meal) }} · {{ food.name }} · {{ food.quantity }} {{ food.unit }}
              </p>
              <button
                v-if="!trainee && canWrite"
                class="text-link"
                :disabled="locked"
                @click="reusePlan(p)"
              >
                {{ l('Use as a new plan', 'استخدام كخطة جديدة') }}
              </button>
            </details>
            <div class="button-row">
              <button
                v-if="data.next !== null"
                class="text-link"
                :disabled="locked"
                @click="load(false, data.next)"
              >
                {{ l('Older plans', 'خطط أقدم') }}</button
              ><button
                v-if="data.plans.length && data.plans[0]!.revision < data.latestRevision"
                class="text-link"
                :disabled="locked"
                @click="load()"
              >
                {{ l('Latest plans', 'أحدث الخطط') }}
              </button>
            </div>
          </template>
        </div>
      </template>
    </PageState>
  </section>
</template>
