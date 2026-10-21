<script setup lang="ts">
import PageHeading from '../../components/PageHeading.vue'
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { user, profile } from '../../app/auth'
import { rows, rpc } from '../../lib/backend'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { language as l, locale, errorMessage, dateLabel } from '../../lib/i18n'
import { localDate } from '../../lib/dates'
import type { Relationship, Profile } from '../../lib/domain'
import {
  nutrientKeys,
  nutrientTotals,
  type Food,
  type Meal,
  type Guidance,
  type Nutrients,
  type PlannedFood,
  type CatalogFood,
} from './model'
import NutrientFields from './NutrientFields.vue'
import MacroPlanner from './MacroPlanner.vue'
import MealPlanEditor from './MealPlanEditor.vue'
import FoodPicker from './FoodPicker.vue'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import PageState from '../../components/PageState.vue'
const router = useRouter(),
  route = useRoute(),
  coach = route.path.startsWith('/coach')
const baseKey = `nutrition:${user.value!.id}:${coach ? 'coach' : 'client'}`
const scope = ref(String(route.query.client || '')),
  date = ref(localDate(profile.value?.timezone || 'UTC'))
const relationships = ref<Relationship[]>([]),
  people = ref<Profile[]>([]),
  guides = ref<Guidance[]>([]),
  foods = ref<Food[]>([]),
  meals = ref<Meal[]>([])
const loading = ref(true),
  selecting = ref(false),
  error = ref(''),
  notice = ref(''),
  editing = ref(false),
  confirmRemove = ref(''),
  restored = ref(false)
const plannedMeals = ref<PlannedFood[]>([]),
  view = ref(coach ? 'plan' : 'record'),
  showFoodLibrary = ref(false),
  selectedCatalogFood = ref<CatalogFood>()
const guidance = ref(''),
  targets = ref<Nutrients>({}),
  effective = ref(date.value),
  copyFrom = ref(''),
  selectedFood = ref('')
const entry = ref(fresh()),
  guidanceId = ref(crypto.randomUUID() as string),
  guidanceRevision = ref(0)
let disposed = false,
  ready = false,
  generation = 0,
  draftWrite = Promise.resolve(),
  selectionGeneration = 0
function fresh() {
  return {
    id: crypto.randomUUID() as string,
    name: '',
    quantity: 1,
    basis: 1,
    unit: 'serving',
    nutrients: {} as Nutrients,
    source: l('Manual entry', 'إدخال يدوي'),
    note: '',
    meal: 'breakfast',
    food_id: null as string | null,
    revision: 0,
  }
}
const relevant = computed(() =>
  guides.value
    .filter((g) => g.relationship_id === scope.value)
    .sort((a, b) => b.effective_on.localeCompare(a.effective_on) || b.revision - a.revision),
)
const current = computed(() => relevant.value.find((g) => g.effective_on <= date.value))
const dayMeals = computed(() =>
  meals.value
    .filter((m) => m.logged_on === date.value && (m.relationship_id || '') === scope.value)
    .sort((a, b) => a.created_at.localeCompare(b.created_at)),
)
const totals = computed(() => nutrientTotals(dayMeals.value))
const scopeName = (r?: Relationship) =>
  people.value.find((p) => p.id === (coach ? r?.client_id : r?.coach_id))?.display_name || ''
const labels = {
  kcal: ['Energy', 'الطاقة'],
  protein_g: ['Protein', 'البروتين'],
  carb_g: ['Carbohydrate', 'الكربوهيدرات'],
  fat_g: ['Fat', 'الدهون'],
}
const mealLabel = (v: string) =>
  ({
    breakfast: l('Breakfast', 'الفطور'),
    lunch: l('Lunch', 'الغداء'),
    dinner: l('Dinner', 'العشاء'),
    snack: l('Snack', 'وجبة خفيفة'),
  })[v]
const keyFor = (selected = scope.value, day = date.value) =>
  `${baseKey}:${selected || 'private'}${coach ? '' : ':' + day}`
function snapshot() {
  return JSON.parse(
    JSON.stringify({
      entry: entry.value,
      guidance: guidance.value,
      targets: targets.value,
      plannedMeals: plannedMeals.value,
      effective: effective.value,
      guidanceId: guidanceId.value,
      guidanceRevision: guidanceRevision.value,
      editing: editing.value,
    }),
  )
}
function persist() {
  const key = keyFor(),
    value = snapshot()
  draftWrite = draftWrite
    .then(() => storeDraft(key, value))
    .catch(() => {
      error.value = l(
        'Could not keep a device draft. Keep this page open.',
        'تعذر حفظ مسودة الجهاز. أبقِ هذه الصفحة مفتوحة.',
      )
    })
  return draftWrite
}
watch(
  [entry, guidance, targets, plannedMeals, effective, guidanceId, guidanceRevision, editing],
  () => {
    if (ready) void persist()
  },
  { deep: true, flush: 'sync' },
)
async function loadRecords() {
  if (disposed) return
  const stamp = ++generation
  const [rels, persons, gs, ms, fs] = await Promise.all([
    rows<Relationship>('coach_clients', coach ? 'coach_id' : 'client_id', user.value!.id),
    rows<Profile>('profiles'),
    rows<Guidance>('nutrition_guidance'),
    coach ? rows<Meal>('meal_entries') : rows<Meal>('meal_entries', 'client_id', user.value!.id),
    coach ? Promise.resolve([]) : rows<Food>('saved_foods', 'owner_id', user.value!.id),
  ])
  if (disposed || stamp !== generation) return
  const ids = new Set(rels.map((r) => r.id))
  relationships.value = rels
  people.value = persons
  guides.value = gs.filter((g) => ids.has(g.relationship_id))
  meals.value = coach ? ms.filter((m) => m.relationship_id && ids.has(m.relationship_id)) : ms
  foods.value = fs
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    await loadRecords()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
function resetEditor() {
  selectedFood.value = ''
  selectedCatalogFood.value = undefined
  copyFrom.value = ''
  restored.value = false
  if (coach) {
    targets.value = { ...current.value?.targets }
    plannedMeals.value = JSON.parse(JSON.stringify(current.value?.meals || []))
    guidance.value = current.value?.guidance || ''
    guidanceRevision.value = Math.max(0, ...relevant.value.map((g) => g.revision))
    guidanceId.value = crypto.randomUUID()
    effective.value = localDate(
      people.value.find(
        (p) => p.id === relationships.value.find((r) => r.id === scope.value)?.client_id,
      )?.timezone ||
        profile.value?.timezone ||
        'UTC',
    )
  } else {
    entry.value = fresh()
    editing.value = false
  }
}
async function selectScope() {
  if (disposed) return
  const stamp = ++selectionGeneration
  selecting.value = true
  ready = false
  notice.value = ''
  try {
    await draftWrite
    if (disposed) return
    await router.replace({ query: { ...route.query, client: scope.value || undefined } })
    if (disposed) return
    resetEditor()
    const d = await getDraft<ReturnType<typeof snapshot>>(keyFor())
    if (disposed || stamp !== selectionGeneration) return
    if (d) {
      entry.value = d.entry
      guidance.value = d.guidance
      targets.value = d.targets
      plannedMeals.value = d.plannedMeals || []
      effective.value = d.effective
      guidanceId.value = d.guidanceId
      guidanceRevision.value = d.guidanceRevision
      editing.value = d.editing
      restored.value = true
    }
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    if (!disposed && stamp === selectionGeneration) {
      ready = true
      selecting.value = false
    }
  }
}
function copyGuide() {
  const g = guides.value.find((g) => g.id === copyFrom.value)
  if (g) {
    guidance.value = g.guidance
    targets.value = { ...g.targets }
    plannedMeals.value = JSON.parse(JSON.stringify(g.meals || []))
  }
}
function changeUnit() {
  entry.value.basis = entry.value.unit === 'serving' ? 1 : 100
  entry.value.quantity = entry.value.basis
  entry.value.nutrients = {}
  entry.value.source = l('Manual entry', 'إدخال يدوي')
  entry.value.food_id = null
  selectedFood.value = ''
  selectedCatalogFood.value = undefined
  notice.value = l(
    'The unit changed. Enter nutrition values for the new portion basis.',
    'تغيرت الوحدة. أدخل القيم الغذائية وفق الكمية الجديدة.',
  )
}
function pickFood() {
  selectedCatalogFood.value = undefined
  const f = foods.value.find((f) => f.id === selectedFood.value)
  if (f)
    entry.value = {
      ...entry.value,
      name: f.name,
      quantity: f.basis,
      basis: f.basis,
      unit: f.unit,
      nutrients: { ...f.nutrients },
      source: f.source,
      food_id: f.id,
    }
}
function chooseCatalogFood(food: CatalogFood) {
  selectedFood.value = ''
  selectedCatalogFood.value = food
  entry.value = {
    ...entry.value,
    name: locale.value === 'ar' ? food.name_ar : food.name,
    quantity: 100,
    basis: 100,
    unit: 'g',
    nutrients: { ...food.nutrients },
    source: food.source,
    food_id: null,
  }
  showFoodLibrary.value = false
}
function useSuggestedFood(food: PlannedFood) {
  selectedFood.value = ''
  selectedCatalogFood.value = undefined
  entry.value = { ...fresh(), ...JSON.parse(JSON.stringify(food)) }
  editing.value = false
  document.querySelector('#meal-editor')?.scrollIntoView({ behavior: 'smooth' })
}
type Write = 'save_nutrition_guidance' | 'save_meal' | 'save_food' | 'remove_meal' | 'archive_food'
const guidanceCommand = useCommand<Write>(
  baseKey + ':write',
  async (name, result, args) => {
    ready = false
    await draftWrite
    const oldKey = keyFor(String(args.scope), String(args.date))
    scope.value = String(args.scope)
    date.value = String(args.date)
    await loadRecords()
    if (name === 'save_food') {
      entry.value.food_id = (result as Food).id
      await persist()
    } else if (name === 'save_nutrition_guidance' || name === 'save_meal') {
      await removeDraft(oldKey)
      resetEditor()
      restored.value = false
    }
    if (name === 'remove_meal') {
      confirmRemove.value = ''
      if (entry.value.id === (args.payload as { p_id: string }).p_id) {
        await removeDraft(oldKey)
        resetEditor()
      }
    }
    // Acknowledgement may finish after the user leaves; do not alter their destination.
    if (!disposed)
      await router.replace({ query: { ...route.query, client: scope.value || undefined } })
    ready = true
    notice.value =
      name === 'save_nutrition_guidance'
        ? l(
            'Guidance saved. Earlier versions remain in history.',
            'حُفظت الإرشادات. تبقى النسخ السابقة في السجل.',
          )
        : name === 'save_meal'
          ? l('Meal saved.', 'حُفظت الوجبة.')
          : name === 'save_food'
            ? l(
                'Saved to your foods. Existing meals keep their recorded values.',
                'حُفظ في أطعمتك. تحتفظ الوجبات السابقة بقيمها المسجلة.',
              )
            : l('Updated.', 'تم التحديث.')
  },
  (name, args) => rpc(name, args.payload as Record<string, unknown>),
)
const busy = computed(
  () =>
    selecting.value ||
    guidanceCommand.state.busy ||
    !!guidanceCommand.state.pending ||
    !guidanceCommand.state.ready,
)
async function write(name: Write, payload: Record<string, unknown>) {
  error.value = ''
  notice.value = ''
  await draftWrite
  await guidanceCommand.run(name, { scope: scope.value, date: date.value, payload })
}
async function saveGuidance() {
  await write('save_nutrition_guidance', {
    p_id: guidanceId.value,
    p_relationship: scope.value,
    p_revision: guidanceRevision.value,
    p_effective: effective.value,
    p_targets: targets.value,
    p_guidance: guidance.value,
    p_meals: plannedMeals.value,
  })
}
async function saveMeal() {
  await write('save_meal', {
    p_id: entry.value.id,
    p_relationship: scope.value || null,
    p_date: date.value,
    p_meal: entry.value.meal,
    p_data: entry.value,
    p_revision: entry.value.revision,
  })
}
async function saveFood() {
  await write('save_food', {
    p_id: entry.value.food_id || entry.value.id,
    p_name: entry.value.name,
    p_basis: entry.value.basis,
    p_unit: entry.value.unit,
    p_nutrients: entry.value.nutrients,
    p_source: entry.value.source,
    p_revision: foods.value.find((f) => f.id === entry.value.food_id)?.revision || 0,
  })
}
function edit(m: Meal) {
  entry.value = JSON.parse(JSON.stringify(m))
  selectedCatalogFood.value = undefined
  editing.value = true
  notice.value = ''
  document.querySelector('#meal-editor')?.scrollIntoView({ behavior: 'smooth' })
}
async function remove(m: Meal) {
  await write('remove_meal', { p_id: m.id, p_revision: m.revision })
}
async function retire(f: Food) {
  await write('archive_food', { p_id: f.id, p_revision: f.revision })
}
async function discard() {
  if (busy.value) return
  ready = false
  await draftWrite
  await removeDraft(keyFor())
  await load()
  await selectScope()
}
onMounted(async () => {
  await load()
  if (disposed) return
  if (scope.value && !relationships.value.some((r) => r.id === scope.value)) scope.value = ''
  const pending = guidanceCommand.state.pending
  if (pending) {
    scope.value = String(pending.args.scope)
    date.value = String(pending.args.date)
  }
  await selectScope()
})
onBeforeUnmount(() => {
  disposed = true
  ready = false
  generation++
  selectionGeneration++
})
</script>
<template>
  <div class="container page nutrition-workspace">
    <RouterLink class="back-link" :to="coach ? '/coach/more' : '/more'"
      >← {{ l('More tools', 'أدوات إضافية') }}</RouterLink
    >
    <PageHeading class="page-heading"
      ><div>
        <p class="overline">{{ l('Optional support', 'دعم اختياري') }}</p>
        <h1>
          {{ coach ? l('Nutrition', 'التغذية') : l('Nutrition', 'التغذية') }}
        </h1>
        <p>
          {{
            coach
              ? l(
                  'Set clear daily targets, turn them into meal ideas, and review shared food records.',
                  'حدد أهدافاً يومية واضحة وحوّلها إلى مقترحات وجبات وراجع سجلات الطعام المشاركة.',
                )
              : l(
                  'Keep a simple food record, with as much detail as you find useful.',
                  'احتفظ بسجل طعام بسيط، بالتفاصيل التي تفيدك.',
                )
          }}
        </p>
        <a v-if="!coach" class="button small secondary" href="#meal-editor">{{
          l('Record a meal', 'تسجيل وجبة')
        }}</a>
      </div></PageHeading
    >
    <PageState :loading="loading" :error="''" @retry="load"
      ><p v-if="error" class="notice error" role="alert">
        {{ error }}
        <button class="text-link" @click="discard" :disabled="busy">
          {{ l('Discard draft and reload', 'تجاهل المسودة وأعد التحميل') }}
        </button>
      </p>
      <p
        v-if="notice && !guidanceCommand.state.busy && !guidanceCommand.state.pending"
        class="notice success"
        role="status"
      >
        {{ notice }}
      </p>
      <p v-if="restored" class="notice">
        {{ l('Your device draft is restored.', 'استُعيدت مسودة جهازك.') }}
      </p>
      <CommandStatus :command="guidanceCommand" :show-notice="false" />
      <fieldset class="progress-filters" :disabled="busy">
        <label
          >{{ coach ? l('Athlete', 'الرياضي') : l('Record visibility', 'ظهور السجل')
          }}<select v-model="scope" @change="selectScope">
            <option value="">
              {{ coach ? l('Choose an athlete', 'اختر رياضياً') : l('Only me', 'أنا فقط') }}
            </option>
            <option v-for="r in relationships" :key="r.id" :value="r.id">
              {{ scopeName(r) }}{{ r.state === 'archived' ? l(' · archived', ' · مؤرشف') : '' }}
            </option>
          </select></label
        ><label v-if="!coach || view === 'record'"
          >{{ l('Date', 'التاريخ')
          }}<input v-model="date" type="date" @change="!coach && selectScope()"
        /></label>
      </fieldset>
      <p v-if="scope && !coach" class="notice">
        {{
          l(
            'Meals recorded here are shared with this coach. Choose Only me for a private record.',
            'تُشارك الوجبات المسجلة هنا مع هذا المدرب. اختر «أنا فقط» لسجل خاص.',
          )
        }}
      </p>
      <div v-if="!coach || (scope && view === 'record')" class="nutrition-totals">
        <div v-for="key in nutrientKeys" :key="key">
          <span>{{ l(labels[key][0]!, labels[key][1]!) }}</span
          ><strong
            >{{ totals[key].value ?? '—' }}
            <small>{{ key === 'kcal' ? 'kcal' : 'g' }}</small></strong
          ><small v-if="current?.targets[key] != null"
            >{{ l('Daily target', 'الهدف اليومي') }} {{ current.targets[key] }}</small
          ><small v-else>{{ l('No target set', 'لم يُحدد هدف') }}</small>
          <progress
            v-if="current?.targets[key] && totals[key].value !== null"
            :value="Math.min(totals[key].value!, current.targets[key]!)"
            :max="current.targets[key]!"
            :aria-label="
              l(labels[key][0]!, labels[key][1]!) + l(' logged toward target', ' المسجل من الهدف')
            "
          />
          <small
            v-if="
              current?.targets[key] != null && totals[key].value !== null && !totals[key].missing
            "
            >{{ Math.abs(Math.round((current.targets[key]! - totals[key].value!) * 10) / 10) }}
            {{ key === 'kcal' ? 'kcal' : 'g' }}
            {{
              totals[key].value! > current.targets[key]!
                ? l('above target', 'فوق الهدف')
                : l('remaining to target', 'متبقية للهدف')
            }}</small
          >
          <small v-if="totals[key].value === null">{{
            l('Nothing logged for this nutrient', 'لا يوجد تسجيل لهذا العنصر')
          }}</small>
          <small v-if="totals[key].missing"
            >{{ totals[key].missing }}
            {{ l('entries without this value', 'سجلات دون هذه القيمة') }}</small
          >
        </div>
      </div>
      <p v-if="coach && !scope" class="notice">
        {{
          l(
            'Choose an athlete to view their shared food record or add guidance.',
            'اختر متدرباً لعرض سجل طعامه المشارك أو إضافة إرشادات.',
          )
        }}
      </p>
      <div v-else>
        <div
          v-if="coach"
          class="segmented nutrition-tabs"
          :aria-label="l('Nutrition view', 'عرض التغذية')"
        >
          <button
            :aria-pressed="view === 'plan'"
            :class="{ selected: view === 'plan' }"
            @click="view = 'plan'"
          >
            {{ l('Edit nutrition plan', 'تعديل خطة التغذية') }}
          </button>
          <button
            :aria-pressed="view === 'record'"
            :class="{ selected: view === 'record' }"
            @click="view = 'record'"
          >
            {{ l('Food record & history', 'سجل الطعام والإرشادات') }}
          </button>
        </div>
        <div class="ongoing-layout" :class="{ 'nutrition-coach': coach }">
          <section v-if="!coach || view === 'record'" class="form-stack">
            <article v-if="current" class="panel">
              <p class="overline">
                {{ l('Coach guidance', 'إرشادات المدرب') }} · {{ dateLabel(current.effective_on) }}
              </p>
              <h2>{{ l('A plan for your day', 'خطة ليومك') }}</h2>
              <p class="preserve-lines">
                {{
                  current.guidance ||
                  l('Your coach has set optional targets.', 'حدد مدربك أهدافاً اختيارية.')
                }}
              </p>
            </article>
            <section v-if="current?.meals?.length" class="panel form-stack">
              <h2>{{ l('Suggested meals', 'وجبات مقترحة') }}</h2>
              <p class="subtle">
                {{
                  l(
                    'An example day from your coach. Adjust portions to what you actually eat before saving a meal.',
                    'مثال ليوم غذائي من مدربك. عدّل الكميات لما تناولته فعلياً قبل حفظ الوجبة.',
                  )
                }}
              </p>
              <article v-for="(food, index) in current.meals" :key="index" class="planned-food-row">
                <div>
                  <small>{{ mealLabel(food.meal) }}</small
                  ><strong>{{ food.name }}</strong
                  ><span
                    >{{ food.quantity }} {{ food.unit }} ·
                    {{ nutrientTotals([food]).kcal.value ?? '—' }} kcal</span
                  >
                </div>
                <button
                  v-if="!coach"
                  type="button"
                  class="text-link"
                  :disabled="busy"
                  @click="useSuggestedFood(food)"
                >
                  {{ l('Use for meal entry', 'استخدام لتسجيل وجبة') }}
                </button>
              </article>
            </section>
            <section class="panel">
              <h2>{{ l('Food record', 'سجل الطعام') }}</h2>
              <p v-if="!dayMeals.length">
                {{
                  coach
                    ? l(
                        'No meals shared by this athlete for this date.',
                        'لم يشارك هذا المتدرب وجبات لهذا التاريخ.',
                      )
                    : l(
                        'No meals recorded for this date. An empty log does not mean you ate nothing.',
                        'لا توجد وجبات مسجلة لهذا التاريخ. السجل الفارغ لا يعني أنك لم تأكل.',
                      )
                }}
              </p>
              <article v-for="m in dayMeals" :key="m.id" class="meal-row">
                <div>
                  <span class="overline">{{ mealLabel(m.meal) }}</span>
                  <h3>{{ m.name }}</h3>
                  <p>{{ m.quantity }} {{ m.unit }} · {{ m.source }}</p>
                  <p v-if="m.note">{{ m.note }}</p>
                  <div class="meal-numbers">
                    <span v-for="k in nutrientKeys" :key="k"
                      >{{ l(labels[k][0]!, labels[k][1]!) }}:
                      {{ nutrientTotals([m])[k].value ?? '—' }}
                      {{ k === 'kcal' ? 'kcal' : 'g' }}</span
                    >
                  </div>
                </div>
                <div v-if="!coach" class="actions">
                  <button class="text-link" @click="edit(m)" :disabled="busy">
                    {{ l('Edit meal', 'تعديل الوجبة') }}</button
                  ><button
                    v-if="confirmRemove !== m.id"
                    class="text-link"
                    @click="confirmRemove = m.id"
                    :disabled="busy"
                  >
                    {{ l('Remove', 'حذف') }}</button
                  ><button v-else class="text-link" :disabled="busy" @click="remove(m)">
                    {{ l('Confirm removal', 'تأكيد الحذف') }}
                  </button>
                </div>
              </article>
            </section>
            <details v-if="relevant.length" class="panel">
              <summary>{{ l('Guidance history', 'سجل الإرشادات') }}</summary>
              <article v-for="g in relevant" :key="g.id" class="meal-row">
                <h3>{{ dateLabel(g.effective_on) }} · v{{ g.revision }}</h3>
                <p class="preserve-lines">{{ g.guidance }}</p>
                <p v-for="(food, index) in g.meals || []" :key="index">
                  {{ mealLabel(food.meal) }} · {{ food.name }} · {{ food.quantity }}
                  {{ food.unit }} · {{ nutrientTotals([food]).kcal.value ?? '—' }} kcal
                </p>
                <p v-for="k in nutrientKeys.filter((k) => g.targets[k] != null)" :key="k">
                  {{ l(labels[k][0]!, labels[k][1]!) }}: {{ g.targets[k] }}
                  {{ k === 'kcal' ? 'kcal' : 'g' }}
                </p>
              </article>
            </details>
          </section>
          <aside v-if="!coach || view === 'plan'" class="form-stack">
            <form v-if="coach && scope" class="panel form-stack" @submit.prevent="saveGuidance">
              <div class="section-heading">
                <h2>{{ l('Daily nutrition plan', 'خطة التغذية اليومية') }}</h2>
                <button
                  class="button"
                  :disabled="busy || relationships.find((r) => r.id === scope)?.state !== 'active'"
                >
                  {{ l('Save nutrition plan', 'حفظ خطة التغذية') }}
                </button>
              </div>
              <fieldset class="form-stack nutrition-plan-fields" :disabled="busy">
                <MacroPlanner v-model="targets" />
                <MealPlanEditor v-model="plannedMeals" />
                <label
                  >{{ l('Reuse your guidance', 'إعادة استخدام إرشاداتك')
                  }}<select v-model="copyFrom" @change="copyGuide">
                    <option value="">{{ l('Start here', 'ابدأ هنا') }}</option>
                    <option v-for="g in guides" :key="g.id" :value="g.id">
                      {{ scopeName(relationships.find((r) => r.id === g.relationship_id)!) }} ·
                      {{ dateLabel(g.effective_on) }} · v{{ g.revision }}
                    </option>
                  </select></label
                ><label
                  >{{ l('Meal guidance', 'إرشادات الوجبات')
                  }}<textarea v-model="guidance" rows="5" maxlength="4000"></textarea>
                </label>
                <label
                  >{{ l('Effective from', 'بدءاً من')
                  }}<input type="date" v-model="effective" required
                /></label>
              </fieldset>
              <p class="subtle">
                {{
                  l(
                    'These are coach-entered targets, not an automated recommendation.',
                    'هذه أهداف يدخلها المدرب وليست توصية آلية.',
                  )
                }}
              </p>
            </form>
            <form
              v-if="!coach"
              id="meal-editor"
              class="panel form-stack"
              @submit.prevent="saveMeal"
            >
              <h2>
                {{ editing ? l('Correct a meal', 'تصحيح وجبة') : l('Record a meal', 'تسجيل وجبة') }}
              </h2>
              <fieldset class="form-stack" :disabled="busy">
                <button
                  type="button"
                  class="button secondary"
                  :aria-expanded="showFoodLibrary"
                  @click="showFoodLibrary = !showFoodLibrary"
                >
                  {{
                    showFoodLibrary
                      ? l('Close food library', 'إغلاق مكتبة الطعام')
                      : l('Choose from food library', 'اختر من مكتبة الطعام')
                  }}
                </button>
                <FoodPicker v-if="showFoodLibrary" @select="chooseCatalogFood" />
                <p
                  v-if="Object.values(entry.nutrients).some((v) => typeof v === 'number')"
                  class="notice"
                >
                  {{ l('For this amount', 'لهذه الكمية') }}:
                  {{ nutrientTotals([entry]).kcal.value ?? '—' }} kcal ·
                  {{ l('Protein', 'بروتين') }}
                  {{ nutrientTotals([entry]).protein_g.value ?? '—' }} g ·
                  {{ l('Carbs', 'كربوهيدرات') }} {{ nutrientTotals([entry]).carb_g.value ?? '—' }} g
                  · {{ l('Fat', 'دهون') }} {{ nutrientTotals([entry]).fat_g.value ?? '—' }} g
                </p>
                <label v-if="foods.some((f) => !f.archived)"
                  >{{ l('Use a saved food', 'استخدام طعام محفوظ')
                  }}<select v-model="selectedFood" @change="pickFood">
                    <option value="">{{ l('Enter manually', 'إدخال يدوي') }}</option>
                    <option v-for="f in foods.filter((f) => !f.archived)" :key="f.id" :value="f.id">
                      {{ f.name }}
                    </option>
                  </select></label
                >
                <label
                  >{{ l('Meal', 'الوجبة')
                  }}<select v-model="entry.meal">
                    <option
                      v-for="m in ['breakfast', 'lunch', 'dinner', 'snack']"
                      :key="m"
                      :value="m"
                    >
                      {{ mealLabel(m) }}
                    </option>
                  </select></label
                ><label
                  >{{ l('Food or meal name', 'اسم الطعام أو الوجبة')
                  }}<input v-model="entry.name" required maxlength="120"
                /></label>
                <div v-if="selectedCatalogFood && entry.unit === 'g'" class="actions">
                  <button
                    v-for="portion in selectedCatalogFood.portions"
                    :key="portion.name"
                    type="button"
                    class="button small secondary"
                    @click="entry.quantity = portion.grams"
                  >
                    {{ locale === 'ar' ? portion.name_ar || portion.name : portion.name }} ·
                    {{ portion.grams }} g
                  </button>
                </div>
                <div class="field-pair">
                  <label
                    >{{ l('Amount eaten', 'الكمية المتناولة')
                    }}<input
                      v-model.number="entry.quantity"
                      type="number"
                      min="0.01"
                      max="10000"
                      step="0.01"
                      required /></label
                  ><label
                    >{{ l('Portion unit', 'وحدة الكمية')
                    }}<select v-model="entry.unit" @change="changeUnit">
                      <option value="serving">{{ l('Serving', 'حصة') }}</option>
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                    </select></label
                  >
                </div>
                <details class="nutrition-details">
                  <summary>
                    {{ l('Nutrition details (optional)', 'تفاصيل التغذية (اختياري)') }}
                  </summary>
                  <label
                    >{{ l('Values below are per', 'القيم أدناه لكل') }} ({{ entry.unit }})<input
                      v-model.number="entry.basis"
                      type="number"
                      min="0.01"
                      max="10000"
                      step="0.01"
                      required /></label
                  ><NutrientFields v-model="entry.nutrients" />
                  <p class="subtle">
                    {{
                      l(
                        'Leave unknown values blank. Enter 0 only when the value is known to be zero.',
                        'اترك القيم المجهولة فارغة. أدخل ٠ فقط عندما تكون القيمة صفراً بالفعل.',
                      )
                    }}
                  </p>
                </details>
                <label
                  >{{ l('Value source', 'مصدر القيم')
                  }}<input v-model="entry.source" required maxlength="200" /></label
                ><label
                  >{{ l('Meal note (optional)', 'ملاحظة الوجبة (اختياري)')
                  }}<textarea v-model="entry.note" maxlength="2000" rows="2"></textarea>
                </label>
                <div class="actions">
                  <button
                    class="button"
                    :disabled="
                      busy ||
                      (!!scope && relationships.find((r) => r.id === scope)?.state !== 'active')
                    "
                  >
                    {{
                      editing ? l('Save correction', 'حفظ التصحيح') : l('Save meal', 'حفظ الوجبة')
                    }}</button
                  ><button
                    type="button"
                    class="text-link"
                    :disabled="busy || !entry.name"
                    @click="saveFood"
                  >
                    {{
                      entry.food_id
                        ? l('Update saved food', 'تحديث الطعام المحفوظ')
                        : l('Keep as saved food', 'حفظ الطعام للاستخدام لاحقاً')
                    }}</button
                  ><button
                    v-if="editing"
                    type="button"
                    class="text-link"
                    @click="
                      () => {
                        entry = fresh()
                        editing = false
                      }
                    "
                  >
                    {{ l('Cancel edit', 'إلغاء التعديل') }}
                  </button>
                </div>
              </fieldset>
            </form>
            <details v-if="!coach && foods.length" class="panel">
              <summary>{{ l('Manage saved foods', 'إدارة الأطعمة المحفوظة') }}</summary>
              <div v-for="f in foods.filter((f) => !f.archived)" :key="f.id" class="meal-row">
                <strong>{{ f.name }}</strong
                ><button class="text-link" :disabled="busy" @click="retire(f)">
                  {{ l('Retire saved food', 'إيقاف الطعام المحفوظ') }}
                </button>
              </div>
            </details>
          </aside>
        </div>
      </div></PageState
    >
  </div>
</template>
