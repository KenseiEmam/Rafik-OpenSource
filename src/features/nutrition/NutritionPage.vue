<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { user, profile } from '../../app/auth'
import { rows, rpc } from '../../lib/backend'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { language as l, errorMessage, dateLabel } from '../../lib/i18n'
import { localDate } from '../../lib/dates'
import type { Relationship, Profile } from '../../lib/domain'
import {
  nutrientKeys,
  nutrientTotals,
  type Food,
  type Meal,
  type Guidance,
  type Nutrients,
} from './model'
import NutrientFields from './NutrientFields.vue'
import PageState from '../../components/PageState.vue'
const router = useRouter(),
  route = useRoute(),
  coach = route.path.startsWith('/coach'),
  draftKey = `nutrition:${user.value!.id}:${coach ? 'coach' : 'client'}`
const scope = ref(String(route.query.client || '')),
  date = ref(localDate(profile.value?.timezone || 'UTC'))
const relationships = ref<Relationship[]>([]),
  people = ref<Profile[]>([]),
  guides = ref<Guidance[]>([]),
  foods = ref<Food[]>([]),
  meals = ref<Meal[]>([])
const loading = ref(true),
  busy = ref(false),
  error = ref(''),
  notice = ref(''),
  editing = ref(false),
  confirmRemove = ref(''),
  restored = ref(false)
const guidance = ref(''),
  targets = ref<Nutrients>({}),
  effective = ref(date.value),
  copyFrom = ref(''),
  selectedFood = ref('')
const entry = ref(fresh()),
  guidanceId = ref(crypto.randomUUID() as string),
  guidanceRevision = ref(0)
let ready = false
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
const scopeName = (r: Relationship) =>
  people.value.find((p) => p.id === (coach ? r.client_id : r.coach_id))?.display_name || ''
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
    guides.value = (await rows<Guidance>('nutrition_guidance')).filter((g) =>
      ids.has(g.relationship_id),
    )
    meals.value = coach
      ? (await rows<Meal>('meal_entries')).filter(
          (m) => m.relationship_id && ids.has(m.relationship_id),
        )
      : await rows<Meal>('meal_entries', 'client_id', user.value!.id)
    if (!coach) foods.value = await rows<Food>('saved_foods', 'owner_id', user.value!.id)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
function selectScope() {
  void router.replace({ query: { ...route.query, client: scope.value || undefined } })
  notice.value = ''
  if (coach) {
    targets.value = { ...current.value?.targets }
    guidance.value = current.value?.guidance || ''
    guidanceRevision.value = Math.max(0, ...relevant.value.map((g) => g.revision))
    guidanceId.value = crypto.randomUUID()
  } else {
    entry.value = fresh()
    editing.value = false
    selectedFood.value = ''
  }
}
function pickFood() {
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
function copyGuide() {
  const g = guides.value.find((g) => g.id === copyFrom.value)
  if (g) {
    guidance.value = g.guidance
    targets.value = { ...g.targets }
  }
}
watch(
  [entry, scope, date, guidance, targets, effective, guidanceId, guidanceRevision],
  () => {
    if (ready)
      void storeDraft(draftKey, {
        entry: entry.value,
        scope: scope.value,
        date: date.value,
        guidance: guidance.value,
        targets: targets.value,
        effective: effective.value,
        guidanceId: guidanceId.value,
        guidanceRevision: guidanceRevision.value,
        editing: editing.value,
      }).catch(
        () =>
          (error.value = l(
            'Could not keep a device draft. Keep this page open.',
            'تعذر حفظ مسودة الجهاز. أبقِ هذه الصفحة مفتوحة.',
          )),
      )
  },
  { deep: true, flush: 'sync' },
)
async function saveGuidance() {
  busy.value = true
  error.value = ''
  try {
    await rpc('save_nutrition_guidance', {
      p_id: guidanceId.value,
      p_relationship: scope.value,
      p_revision: guidanceRevision.value,
      p_effective: effective.value,
      p_targets: targets.value,
      p_guidance: guidance.value,
    })
    ready = false
    await load()
    selectScope()
    await removeDraft(draftKey)
    restored.value = false
    ready = true
    notice.value = l(
      'Guidance saved. Earlier versions remain in history.',
      'حُفظت الإرشادات. تبقى النسخ السابقة في السجل.',
    )
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function saveMeal() {
  busy.value = true
  error.value = ''
  try {
    await rpc('save_meal', {
      p_id: entry.value.id,
      p_relationship: scope.value || null,
      p_date: date.value,
      p_meal: entry.value.meal,
      p_data: entry.value,
      p_revision: entry.value.revision,
    })
    ready = false
    entry.value = fresh()
    editing.value = false
    selectedFood.value = ''
    await removeDraft(draftKey)
    restored.value = false
    ready = true
    await load()
    notice.value = l('Meal saved.', 'حُفظت الوجبة.')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function saveFood() {
  busy.value = true
  error.value = ''
  try {
    const f = await rpc<Food>('save_food', {
      p_id: entry.value.food_id || entry.value.id,
      p_name: entry.value.name,
      p_basis: entry.value.basis,
      p_unit: entry.value.unit,
      p_nutrients: entry.value.nutrients,
      p_source: entry.value.source,
      p_revision: foods.value.find((f) => f.id === entry.value.food_id)?.revision || 0,
    })
    entry.value.food_id = f.id
    await load()
    notice.value = l(
      'Saved to your foods. Existing meals keep their recorded values.',
      'حُفظ في أطعمتك. تحتفظ الوجبات السابقة بقيمها المسجلة.',
    )
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
function edit(m: Meal) {
  entry.value = { ...m }
  editing.value = true
  notice.value = ''
  document.querySelector('#meal-editor')?.scrollIntoView({ behavior: 'smooth' })
}
async function remove(m: Meal) {
  busy.value = true
  error.value = ''
  try {
    await rpc('remove_meal', { p_id: m.id, p_revision: m.revision })
    await load()
    confirmRemove.value = ''
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function retire(f: Food) {
  busy.value = true
  error.value = ''
  try {
    await rpc('archive_food', { p_id: f.id, p_revision: f.revision })
    await load()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function discard() {
  ready = false
  await removeDraft(draftKey)
  entry.value = fresh()
  editing.value = false
  await load()
  selectScope()
  restored.value = false
  ready = true
}
onMounted(async () => {
  await load()
  selectScope()
  const d = await getDraft<{
    entry: ReturnType<typeof fresh>
    scope: string
    date: string
    guidance: string
    targets: Nutrients
    effective: string
    guidanceId: string
    guidanceRevision: number
    editing: boolean
  }>(draftKey)
  if (d) {
    entry.value = d.entry
    scope.value = d.scope
    date.value = d.date
    guidance.value = d.guidance
    targets.value = d.targets
    effective.value = d.effective
    guidanceId.value = d.guidanceId
    guidanceRevision.value = d.guidanceRevision
    editing.value = d.editing
    restored.value = true
  }
  ready = true
})
</script>
<template>
  <div class="container page">
    <RouterLink class="back-link" :to="coach ? '/coach/more' : '/more'"
      >← {{ l('More tools', 'أدوات إضافية') }}</RouterLink
    >
    <header class="page-heading">
      <p class="overline">{{ l('Optional support', 'دعم اختياري') }}</p>
      <h1>
        {{
          coach
            ? l('Nutrition guidance', 'إرشادات التغذية')
            : l('Nutrition, at your pace', 'التغذية، بوتيرتك')
        }}
      </h1>
      <p>
        {{
          coach
            ? l(
                'Offer useful guidance. Review what your client chooses to share.',
                'قدّم إرشادات مفيدة. وراجع ما يختار متدربك مشاركته.',
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
    </header>
    <PageState :loading="loading" :error="''" @retry="load"
      ><p v-if="error" class="notice error" role="alert">
        {{ error }}
        <button class="text-link" @click="discard">
          {{ l('Discard draft and reload', 'تجاهل المسودة وأعد التحميل') }}
        </button>
      </p>
      <p v-if="notice" class="notice success" role="status">{{ notice }}</p>
      <p v-if="restored" class="notice">
        {{ l('Your device draft is restored.', 'استُعيدت مسودة جهازك.') }}
      </p>
      <div class="progress-filters">
        <label
          >{{ coach ? l('Client', 'المتدرب') : l('Record visibility', 'ظهور السجل')
          }}<select v-model="scope" @change="selectScope">
            <option value="">
              {{ coach ? l('Choose a client', 'اختر متدرباً') : l('Only me', 'أنا فقط') }}
            </option>
            <option v-for="r in relationships" :key="r.id" :value="r.id">
              {{ scopeName(r) }}{{ r.state === 'archived' ? l(' · archived', ' · مؤرشف') : '' }}
            </option>
          </select></label
        ><label>{{ l('Date', 'التاريخ') }}<input v-model="date" type="date" /></label>
      </div>
      <p v-if="scope && !coach" class="notice">
        {{
          l(
            'Meals recorded here are shared with this coach. Choose Only me for a private record.',
            'تُشارك الوجبات المسجلة هنا مع هذا المدرب. اختر «أنا فقط» لسجل خاص.',
          )
        }}
      </p>
      <div
        v-if="nutrientKeys.some((k) => totals[k].value !== null || current?.targets[k] != null)"
        class="nutrition-totals"
      >
        <div v-for="key in nutrientKeys" :key="key">
          <span>{{ l(labels[key][0]!, labels[key][1]!) }}</span
          ><strong
            >{{ totals[key].value ?? '—' }}
            <small>{{ key === 'kcal' ? 'kcal' : 'g' }}</small></strong
          ><small v-if="current?.targets[key] != null"
            >{{ l('Current target', 'الهدف الحالي') }} {{ current.targets[key] }}</small
          ><small v-if="totals[key].missing"
            >{{ totals[key].missing }}
            {{ l('entries without this value', 'سجلات دون هذه القيمة') }}</small
          >
        </div>
      </div>
      <div class="ongoing-layout">
        <section class="form-stack">
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
          <section class="panel">
            <h2>{{ l('Food record', 'سجل الطعام') }}</h2>
            <p v-if="!dayMeals.length">
              {{
                l(
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
                <button class="text-link" @click="edit(m)">
                  {{ l('Edit meal', 'تعديل الوجبة') }}</button
                ><button
                  v-if="confirmRemove !== m.id"
                  class="text-link"
                  @click="confirmRemove = m.id"
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
              <p v-for="k in nutrientKeys.filter((k) => g.targets[k] != null)" :key="k">
                {{ l(labels[k][0]!, labels[k][1]!) }}: {{ g.targets[k] }}
                {{ k === 'kcal' ? 'kcal' : 'g' }}
              </p>
            </article>
          </details>
        </section>
        <aside class="form-stack">
          <form v-if="coach && scope" class="panel form-stack" @submit.prevent="saveGuidance">
            <h2>{{ l('Set guidance', 'تحديد الإرشادات') }}</h2>
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
            <details>
              <summary>{{ l('Optional daily targets', 'أهداف يومية اختيارية') }}</summary>
              <NutrientFields v-model="targets" />
            </details>
            <label
              >{{ l('Effective from', 'بدءاً من')
              }}<input type="date" v-model="effective" required /></label
            ><button
              class="button"
              :disabled="busy || relationships.find((r) => r.id === scope)?.state !== 'active'"
            >
              {{ l('Save guidance', 'حفظ الإرشادات') }}
            </button>
            <p class="subtle">
              {{
                l(
                  'These are coach-entered targets, not an automated recommendation.',
                  'هذه أهداف يدخلها المدرب وليست توصية آلية.',
                )
              }}
            </p>
          </form>
          <form v-if="!coach" id="meal-editor" class="panel form-stack" @submit.prevent="saveMeal">
            <h2>
              {{ editing ? l('Correct a meal', 'تصحيح وجبة') : l('Record a meal', 'تسجيل وجبة') }}
            </h2>
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
                <option v-for="m in ['breakfast', 'lunch', 'dinner', 'snack']" :key="m" :value="m">
                  {{ mealLabel(m) }}
                </option>
              </select></label
            ><label
              >{{ l('Food or meal name', 'اسم الطعام أو الوجبة')
              }}<input v-model="entry.name" required maxlength="120"
            /></label>
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
                }}<select v-model="entry.unit">
                  <option value="serving">{{ l('Serving', 'حصة') }}</option>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                </select></label
              >
            </div>
            <details class="nutrition-details">
              <summary>{{ l('Nutrition details (optional)', 'تفاصيل التغذية (اختياري)') }}</summary>
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
                  busy || (!!scope && relationships.find((r) => r.id === scope)?.state !== 'active')
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
      </div></PageState
    >
  </div>
</template>
