<script setup lang="ts">
import ExerciseDemo from '../../components/ExerciseDemo.vue'
import { exerciseVideos, videoForExercise, exerciseAssetUrl } from '../../lib/exercise-media'
import media from '../../content/exercise-media.json'
import {
  exerciseArea,
  categoryLabel,
  equipmentCategories,
  equipmentLabel,
} from '../../lib/exercise-catalog'
import OrganizationNav from '../organizations/OrganizationNav.vue'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { PhArrowLeft, PhArrowRight, PhBarbell } from '@phosphor-icons/vue'
import { user } from '../../app/auth'
import { useRoute } from 'vue-router'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import { programContext } from './program-context'
const context = programContext(useRoute())
import { clone, type Exercise } from '../../lib/domain'
import { language, locale, errorMessage, t } from '../../lib/i18n'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import PageState from '../../components/PageState.vue'
const exercises = ref<Exercise[]>([]),
  search = ref(''),
  equipment = ref(''),
  movement = ref(''),
  recording = ref(''),
  mediaFilter = ref(''),
  sort = ref('preview'),
  scope = ref('active')
const authorized = ref(false)
const loading = ref(true),
  error = ref(''),
  message = ref(''),
  editing = ref<Exercise>(),
  restored = ref(false)
const key = `exercise-draft:${user.value!.id}:${context.key}`
const visible = computed(() =>
  exercises.value
    .filter(
      (e) =>
        (scope.value === 'archived' ? e.active === false : e.active !== false) &&
        (scope.value !== 'mine' || context.editableExercise(e)) &&
        (!equipment.value || equipmentCategories(e).includes(equipment.value)) &&
        (!movement.value || exerciseArea(e) === movement.value) &&
        (!recording.value || (e.kind || 'strength') === recording.value) &&
        (!mediaFilter.value ||
          (mediaFilter.value === 'video'
            ? !!videoForExercise(e)
            : !!e.media_url || !!e.media_ref)) &&
        `${e.name} ${e.name_ar} ${e.equipment} ${e.movement} ${e.target_muscle || ''}`
          .toLowerCase()
          .includes(search.value.toLowerCase()),
    )
    .sort(
      (a, b) =>
        (sort.value === 'preview'
          ? Number(!!videoForExercise(b)) - Number(!!videoForExercise(a))
          : 0) || a.name.localeCompare(b.name),
    ),
)
const filtersOpen = ref(false)
const filterCount = computed(
  () =>
    [
      equipment.value,
      movement.value,
      recording.value,
      mediaFilter.value,
      scope.value !== 'active',
    ].filter(Boolean).length,
)
const page = ref(0),
  selectedId = ref(''),
  mobileDetail = ref(false)
const detailHeading = ref<HTMLElement>()
const pageSize = 24
const pageCount = computed(() => Math.max(1, Math.ceil(visible.value.length / pageSize)))
const pageItems = computed(() =>
  visible.value.slice(page.value * pageSize, (page.value + 1) * pageSize),
)
const selectedExercise = computed(
  () => pageItems.value.find((e) => e.id === selectedId.value) || pageItems.value[0],
)
const displayName = (e: Exercise) => (locale.value === 'ar' ? e.name_ar || e.name : e.name)
const equipmentName = (e: Exercise) =>
  locale.value === 'ar' ? e.equipment_ar || e.equipment : e.equipment
const illustration = (e: Exercise) =>
  e.media_url
    ? undefined
    : media.items.find((item) =>
        e.media_ref
          ? item.id === e.media_ref
          : !e.owner_id && !e.workspace_id && item.exerciseId === e.id,
      )
const instructions = computed(() => {
  const e = selectedExercise.value
  if (!e) return []
  return (locale.value === 'ar' ? e.instructions_ar || e.instructions : e.instructions)
    .split(/\n+|(?<=[.!?])\s+/)
    .filter(Boolean)
})
watch([search, equipment, movement, scope, recording, mediaFilter, sort], () => {
  page.value = 0
  mobileDetail.value = false
})
watch(pageCount, (count) => {
  if (page.value >= count) page.value = count - 1
})
async function select(e: Exercise) {
  selectedId.value = e.id
  mobileDetail.value = true
  await nextTick()
  if (window.matchMedia('(max-width: 760px)').matches) detailHeading.value?.focus()
}
async function backToList() {
  mobileDetail.value = false
  await nextTick()
  document.getElementById('exercise-choice-' + selectedExercise.value?.id)?.focus()
}
function changePage(delta: number) {
  page.value += delta
  selectedId.value = ''
  mobileDetail.value = false
}
function clearFilters() {
  search.value = ''
  equipment.value = ''
  movement.value = ''
  scope.value = 'active'
  recording.value = ''
  mediaFilter.value = ''
}
const equipmentOptions = computed(() =>
  [...new Set(exercises.value.flatMap(equipmentCategories).filter(Boolean))].sort(),
)
const movementOptions = computed(() =>
  [...new Set(exercises.value.map(exerciseArea).filter(Boolean))].sort(),
)
async function load() {
  loading.value = true
  error.value = ''
  try {
    exercises.value = await context.catalog()
    authorized.value = true
  } catch (e) {
    authorized.value = false
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
function create() {
  editing.value = {
    id: (context.workspace ? 'org-' : 'custom-') + crypto.randomUUID(),
    name: '',
    name_ar: '',
    equipment: '',
    equipment_ar: '',
    instructions: '',
    instructions_ar: '',
    movement: '',
    category: '',
    body_part: '',
    target_muscle: '',
    kind: 'strength',
    media_url: '',
    media_ref: null,
    revision: 0,
    active: true,
  }
  restored.value = false
}
function edit(e: Exercise) {
  editing.value = clone(e)
  restored.value = false
}
async function close() {
  editing.value = undefined
  restored.value = false
  await removeDraft(key)
}
watch(
  editing,
  () => {
    if (editing.value)
      void storeDraft(key, editing.value).catch(() => {
        error.value = language('Could not save a device draft.', 'تعذر حفظ مسودة على الجهاز.')
      })
  },
  { deep: true },
)
const command = useCommand<'save' | 'active'>(
  key,
  async () => {
    await close()
    await load()
    message.value = language(
      'Exercise library updated. Published instructions are preserved.',
      'تم تحديث المكتبة. تبقى التعليمات المنشورة محفوظة.',
    )
  },
  (action, args) =>
    action === 'save'
      ? context.exercise(
          String(args.id),
          args.data as Record<string, unknown>,
          Number(args.revision),
          String(args.operation),
        )
      : context.exerciseActive(args.exercise as Exercise, String(args.operation)),
)
const busy = computed(() => command.state.busy || !!command.state.pending || !command.state.ready)
async function save() {
  if (!editing.value) return
  const e = editing.value
  message.value = ''
  error.value = ''
  const data = {
    name: e.name.trim(),
    name_ar: e.name_ar.trim() || e.name.trim(),
    equipment: e.equipment.trim(),
    equipment_ar: e.equipment_ar.trim() || e.equipment.trim(),
    instructions: e.instructions.trim(),
    instructions_ar: e.instructions_ar.trim() || e.instructions.trim(),
    movement: e.movement.trim(),
    category: e.body_part || '',
    body_part: e.body_part || '',
    target_muscle: e.target_muscle?.trim() || '',
    kind: e.kind || 'strength',
    media_url: e.media_url?.trim() || '',
    media_ref: e.media_ref || null,
  }
  await command.run('save', {
    operation: crypto.randomUUID(),
    id: e.id,
    data,
    revision: e.revision || 0,
  })
}
async function archive(e: Exercise) {
  message.value = ''
  await command.run('active', { operation: crypto.randomUUID(), exercise: e })
}
onMounted(async () => {
  await load()
  if (!authorized.value) return
  const draft = await getDraft<Exercise>(key)
  if (draft) {
    editing.value = draft
    restored.value = true
  }
})
</script>
<template>
  <OrganizationNav v-if="context.workspace" />
  <div
    class="container page exercise-page"
    :class="{ 'mobile-detail': mobileDetail, 'filters-open': filtersOpen }"
  >
    <header class="page-heading heading-actions">
      <div>
        <p class="overline">{{ language('Your coaching toolkit', 'أدواتك التدريبية') }}</p>
        <h1>{{ language('Exercises', 'التمارين') }}</h1>
        <p>
          {{
            language(
              'Find the right movement. Review the technique, then build it into your plan.',
              'ابحث عن حركة، حسّن تعليماتك أو أضف تمريناً جديداً.',
            )
          }}
        </p>
      </div>
      <button class="button" v-if="!editing && authorized" :disabled="busy" @click="create">
        {{ language('Create exercise', 'إنشاء تمرين') }}
      </button>
    </header>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="message" class="notice success" role="status">{{ message }}</p>
    <CommandStatus :command="command" :show-notice="false" />
    <section v-if="editing && authorized" class="panel exercise-editor">
      <form class="context-form" @submit.prevent="save">
        <fieldset class="form-fields" :disabled="busy">
          <div class="section-heading">
            <h2>
              {{
                editing.revision
                  ? language('Edit your exercise', 'تعديل تمرينك')
                  : language('New exercise', 'تمرين جديد')
              }}
            </h2>
            <button type="button" class="text-link" :disabled="busy" @click="close">
              {{ language('Discard and close', 'تجاهل وإغلاق') }}
            </button>
          </div>
          <p v-if="restored" class="notice">
            {{ language('Your exercise draft was restored.', 'تم استرداد مسودة التمرين.') }}
          </p>
          <p>
            {{
              language(
                'Private to your library. Assigned clients see the instructions captured when you publish a plan.',
                'خاص بمكتبتك. يرى المتدرب التعليمات المحفوظة عند نشر الخطة.',
              )
            }}
          </p>
          <fieldset :disabled="busy">
            <div class="field-pair">
              <label
                >{{ language('Exercise name', 'اسم التمرين')
                }}<input v-model="editing.name" required maxlength="100" /></label
              ><label
                >{{ language('Recording type', 'نوع التسجيل')
                }}<select v-model="editing.kind">
                  <option value="strength">{{ language('Reps and load', 'تكرارات ووزن') }}</option>
                  <option value="timed">{{ language('Time', 'زمن') }}</option>
                  <option value="distance">{{ language('Distance', 'مسافة') }}</option>
                </select></label
              ><label
                >{{ language('Equipment', 'المعدات')
                }}<input v-model="editing.equipment" maxlength="100" /></label
              ><label
                >{{ language('Movement category', 'فئة الحركة')
                }}<input v-model="editing.movement" maxlength="60"
              /></label>
            </div>
            <label
              >{{ language('Body area', 'منطقة الجسم')
              }}<select v-model="editing.body_part">
                <option value="">{{ language('Not categorized', 'غير مصنّف') }}</option>
                <option
                  v-for="area in [
                    'back',
                    'cardio',
                    'chest',
                    'lower arms',
                    'lower legs',
                    'neck',
                    'shoulders',
                    'upper arms',
                    'upper legs',
                    'waist',
                  ]"
                  :key="area"
                  :value="area"
                >
                  {{ categoryLabel(area) }}
                </option>
              </select></label
            >
            <label
              >{{ language('Instructions', 'التعليمات')
              }}<textarea
                v-model="editing.instructions"
                required
                rows="4"
                maxlength="2000"
              /></label
            ><label
              >{{ language('Demonstration link (optional, HTTPS)', 'رابط الشرح (اختياري، HTTPS)')
              }}<input v-model="editing.media_url" type="url" pattern="https://.*" maxlength="500"
            /></label>
            <label
              >{{ language('Library demonstration (optional)', 'شرح من المكتبة (اختياري)')
              }}<select v-model="editing.media_ref">
                <option :value="null">
                  {{ language('No library demonstration', 'دون شرح من المكتبة') }}
                </option>
                <option v-for="item in exerciseVideos" :key="item.id" :value="item.id">
                  {{ exercises.find((e) => e.id === item.exerciseId)?.name || item.name }} ·
                  {{ language('Video', 'فيديو') }}
                </option>
                <option v-for="item in media.items" :key="item.id" :value="item.id">
                  {{
                    locale === 'ar'
                      ? exercises.find((e) => e.id === item.exerciseId)?.name_ar || item.sourceSlug
                      : exercises.find((e) => e.id === item.exerciseId)?.name || item.sourceSlug
                  }}
                </option>
              </select></label
            >
            <p class="subtle">
              {{
                language(
                  'Choose only an exact movement match. An external demonstration link takes priority.',
                  'اختر رسماً مطابقاً للحركة. تكون الأولوية لرابط الشرح الخارجي.',
                )
              }}
            </p>
            <ExerciseDemo :exercise="editing" />
            <details>
              <summary>
                {{ language('Arabic translation (optional)', 'الترجمة العربية (اختيارية)') }}
              </summary>
              <div class="context-form">
                <label
                  >{{ language('Arabic name', 'الاسم بالعربية')
                  }}<input v-model="editing.name_ar" maxlength="100" dir="rtl" /></label
                ><label
                  >{{ language('Arabic equipment', 'المعدات بالعربية')
                  }}<input v-model="editing.equipment_ar" maxlength="100" dir="rtl" /></label
                ><label
                  >{{ language('Arabic instructions', 'التعليمات بالعربية')
                  }}<textarea
                    v-model="editing.instructions_ar"
                    maxlength="2000"
                    rows="3"
                    dir="rtl"
                  />
                </label>
              </div>
            </details>
            <button class="button" :disabled="busy">
              {{ language('Save exercise', 'حفظ التمرين') }}
            </button>
          </fieldset>
        </fieldset>
      </form>
    </section>
    <PageState v-if="!editing" :loading="loading" @retry="load">
      <div class="catalog-controls">
        <button
          type="button"
          class="button secondary small catalog-filter-toggle"
          :aria-expanded="filtersOpen"
          @click="filtersOpen = !filtersOpen"
        >
          {{ language('Filters', 'المرشحات') }}<span v-if="filterCount"> · {{ filterCount }}</span>
        </button>
        <div class="library-tools">
          <label class="grow"
            >{{ language('Search exercises', 'البحث عن تمرين')
            }}<input v-model="search" type="search" /></label
          ><label
            >{{ language('Library', 'المكتبة')
            }}<select v-model="scope">
              <option value="active">{{ language('All active', 'كل النشطة') }}</option>
              <option value="mine">{{ language('My exercises', 'تماريني') }}</option>
              <option value="archived">{{ language('Archived', 'مؤرشفة') }}</option>
            </select></label
          ><label
            >{{ language('Equipment', 'المعدات')
            }}<select v-model="equipment">
              <option value="">{{ language('All equipment', 'كل المعدات') }}</option>
              <option v-for="e in equipmentOptions" :key="e" :value="e">
                {{ equipmentLabel(e) }}
              </option>
            </select></label
          ><label
            >{{ language('Body area', 'منطقة الجسم')
            }}<select v-model="movement">
              <option value="">{{ language('All body areas', 'كل مناطق الجسم') }}</option>
              <option v-for="m in movementOptions" :key="m" :value="m">
                {{ categoryLabel(m) }}
              </option>
            </select></label
          >
        </div>
        <div class="catalog-quick-filters">
          <label
            >{{ language('Recording type', 'نوع التسجيل')
            }}<select v-model="recording">
              <option value="">{{ language('Any recording type', 'كل أنواع التسجيل') }}</option>
              <option value="strength">{{ language('Reps & load', 'تكرارات ووزن') }}</option>
              <option value="timed">{{ language('Time', 'زمن') }}</option>
              <option value="distance">{{ language('Distance', 'مسافة') }}</option>
            </select></label
          >
          <label
            >{{ language('Demonstration', 'الشرح المرئي')
            }}<select v-model="mediaFilter">
              <option value="">{{ language('All exercises', 'كل التمارين') }}</option>
              <option value="video">{{ language('Video demonstrations', 'شرح بالفيديو') }}</option>
              <option value="media">{{ language('With a preview', 'مع شرح مرئي') }}</option>
            </select></label
          >
        </div>
        <div class="catalog-summary">
          <select
            v-model="sort"
            class="catalog-sort"
            :aria-label="language('Sort exercises', 'ترتيب التمارين')"
          >
            <option value="preview">{{ language('Videos first', 'الفيديوهات أولاً') }}</option>
            <option value="name">{{ language('Name: A–Z', 'الاسم: أبجدي') }}</option>
          </select>
          <p role="status">
            {{ visible.length.toLocaleString(locale) }} {{ language('exercises', 'تمرين') }}
          </p>
          <button
            v-if="search || equipment || movement || recording || mediaFilter || scope !== 'active'"
            class="text-link"
            @click="clearFilters"
          >
            {{ language('Clear filters', 'مسح المرشحات') }}
          </button>
        </div>
      </div>
      <p v-if="!visible.length" class="empty-review">
        {{
          language(
            'No exercises match. Try another name or clear the filters.',
            'لا توجد تمارين مطابقة. جرّب اسماً آخر أو امسح المرشحات.',
          )
        }}
      </p>
      <div v-else class="catalog-workspace" :class="{ 'show-detail': mobileDetail }">
        <section
          class="catalog-list-pane"
          :aria-label="language('Exercise results', 'نتائج التمارين')"
        >
          <div
            class="catalog-list"
            tabindex="0"
            :aria-label="language('Exercise results', 'نتائج التمارين')"
          >
            <button
              v-for="e in pageItems"
              :key="e.id"
              :id="'exercise-choice-' + e.id"
              type="button"
              class="catalog-choice"
              :class="{ selected: selectedExercise?.id === e.id }"
              :aria-pressed="selectedExercise?.id === e.id"
              @click="select(e)"
            >
              <span class="catalog-icon" aria-hidden="true"
                ><img
                  v-if="videoForExercise(e)"
                  class="catalog-video-poster"
                  :src="exerciseAssetUrl(videoForExercise(e)!.poster.path)"
                  width="52"
                  height="52"
                  alt=""
                  loading="lazy" /><img
                  v-else-if="illustration(e)"
                  :src="illustration(e)!.frames[0]!.path.replace('/v1/catalog', '')"
                  width="52"
                  height="52"
                  alt=""
                  loading="lazy" /><PhBarbell v-else :size="24"
              /></span>
              <span class="catalog-choice-copy"
                ><strong dir="auto">{{ displayName(e) }}</strong
                ><span
                  >{{ equipmentName(e)
                  }}<template v-if="videoForExercise(e)">
                    · {{ language('Video', 'فيديو') }}</template
                  ></span
                ></span
              >
              <PhArrowRight class="catalog-arrow" :size="17" aria-hidden="true" />
            </button>
          </div>
          <nav
            class="catalog-pagination"
            :aria-label="language('Exercise pages', 'صفحات التمارين')"
          >
            <button
              class="icon-button"
              type="button"
              :disabled="page === 0"
              :aria-label="language('Previous exercises', 'التمارين السابقة')"
              @click="changePage(-1)"
            >
              <PhArrowLeft :size="18" />
            </button>
            <span>{{ page + 1 }} / {{ pageCount }}</span>
            <button
              class="icon-button"
              type="button"
              :disabled="page + 1 >= pageCount"
              :aria-label="language('Next exercises', 'التمارين التالية')"
              @click="changePage(1)"
            >
              <PhArrowRight :size="18" />
            </button>
          </nav>
        </section>
        <section
          v-if="selectedExercise"
          :key="selectedExercise.id"
          class="catalog-detail"
          :aria-label="language('Exercise details', 'تفاصيل التمرين')"
          tabindex="0"
        >
          <button class="text-link catalog-back" @click="backToList">
            <PhArrowLeft :size="18" />{{ language('All exercises', 'كل التمارين') }}
          </button>
          <p class="overline">
            {{
              context.editableExercise(selectedExercise)
                ? language('Your exercise', 'تمرينك')
                : language('Exercise library', 'مكتبة التمارين')
            }}
          </p>
          <h2 ref="detailHeading" tabindex="-1" dir="auto">{{ displayName(selectedExercise) }}</h2>
          <div class="catalog-tags">
            <span>{{ equipmentName(selectedExercise) }}</span
            ><span v-if="exerciseArea(selectedExercise)">{{
              categoryLabel(exerciseArea(selectedExercise))
            }}</span
            ><span v-if="selectedExercise.target_muscle" dir="auto">{{
              selectedExercise.target_muscle
            }}</span
            ><span>{{
              selectedExercise.kind === 'timed'
                ? language('Time', 'زمن')
                : selectedExercise.kind === 'distance'
                  ? language('Distance', 'مسافة')
                  : language('Reps & load', 'تكرارات ووزن')
            }}</span>
          </div>
          <ExerciseDemo :exercise="selectedExercise" expanded />
          <div class="catalog-technique">
            <h3>{{ t('instruction') }}</h3>
            <p v-if="locale === 'ar' && !selectedExercise.instructions_ar" class="subtle">
              التعليمات الأصلية متاحة بالإنجليزية.
            </p>
            <ol :dir="locale === 'ar' && !selectedExercise.instructions_ar ? 'ltr' : undefined">
              <li v-for="(instruction, index) in instructions" :key="index">{{ instruction }}</li>
            </ol>
          </div>
          <div v-if="context.editableExercise(selectedExercise)" class="actions">
            <button class="button secondary" :disabled="busy" @click="edit(selectedExercise)">
              {{ language('Edit exercise', 'تعديل التمرين') }}
            </button>
            <button class="text-link" :disabled="busy" @click="archive(selectedExercise)">
              {{
                selectedExercise.active === false
                  ? language('Restore', 'استعادة')
                  : language('Archive', 'أرشفة')
              }}
            </button>
          </div>
          <p v-if="selectedExercise.id.startsWith('wger-')" class="small-print catalog-source">
            <a
              :href="'https://wger.de/api/v2/exerciseinfo/' + selectedExercise.id.slice(5) + '/'"
              target="_blank"
              rel="noopener noreferrer"
              >wger · {{ language('Exercise source & license', 'مصدر التمرين والترخيص') }}</a
            >
          </p>
          <p v-if="selectedExercise.id.startsWith('dataset-')" class="small-print catalog-source">
            <a
              href="https://github.com/hasaneyldrm/exercises-dataset/tree/7455efae41b330c265e7cd4b78dfa848e7ce5ebd"
              target="_blank"
              rel="noopener noreferrer"
              >Exercises Dataset · MIT</a
            >
          </p>
        </section>
      </div>
    </PageState>
  </div>
</template>
<style scoped>
.catalog-filter-toggle {
  display: none;
}
.catalog-quick-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.catalog-quick-filters label {
  flex: 1;
  min-width: 140px;
  max-width: 280px;
}
.catalog-sort {
  width: auto;
  max-width: 150px;
  min-width: 0;
  font-size: 0.8rem;
  padding: 0.4rem;
  margin: 0;
}
.catalog-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-block: 0.75rem;
  font-size: 0.85rem;
  color: var(--muted);
}
.catalog-summary p {
  margin: 0;
}
.catalog-workspace {
  display: grid;
  grid-template-columns: minmax(240px, 0.8fr) minmax(0, 1.4fr);
  height: min(720px, calc(100dvh - 385px));
  min-height: 380px;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface);
}
.catalog-list-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  border-inline-end: 1px solid var(--line);
}
.catalog-list {
  overflow: auto;
  overscroll-behavior: contain;
  min-height: 0;
  flex: 1;
  padding: 8px;
}
.catalog-choice {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  min-width: 0;
  text-align: start;
  padding: 12px 10px;
  min-height: 78px;
  border: 0;
  border-radius: 8px;
  color: var(--ink);
  background: transparent;
  cursor: pointer;
}
.catalog-choice:hover {
  background: var(--surface-soft);
}
.catalog-choice.selected {
  background: var(--tint);
}
.catalog-icon {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: var(--surface-soft);
  border-radius: 8px;
  color: var(--muted);
}
.catalog-icon .catalog-video-poster {
  object-fit: cover;
}
.catalog-icon img {
  background: #1c2924;
  border-radius: 8px;
}
.catalog-choice-copy {
  display: grid;
  gap: 5px;
  flex: 1;
  min-width: 0;
}
.catalog-choice-copy strong {
  font-size: 0.88rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.catalog-choice-copy > span {
  font-size: 0.75rem;
  color: var(--muted);
  overflow-wrap: anywhere;
}
.catalog-arrow {
  flex-shrink: 0;
  color: var(--muted);
}
.catalog-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--line);
  font-size: 0.8rem;
}
.catalog-detail {
  padding: 24px;
  overflow: auto;
  overscroll-behavior: contain;
  min-width: 0;
}
.catalog-detail h2 {
  font-size: 1.5rem;
  line-height: 1.25;
  margin-block: 8px 16px;
  overflow-wrap: anywhere;
}
.catalog-detail h3 {
  font-size: 1rem;
  margin-block: 1.5rem 0.75rem;
}
.catalog-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.catalog-tags span {
  font-size: 0.75rem;
  padding: 4px 8px;
  border: 1px solid var(--line);
  border-radius: 5px;
  color: var(--muted);
}
.catalog-technique ol {
  padding-inline-start: 1.5rem;
  font-size: 0.9rem;
  line-height: 1.8;
}
.catalog-technique li {
  padding-inline-start: 0.3rem;
  margin-block: 0.5rem;
}
.catalog-source {
  margin-top: 2rem;
}
.catalog-back {
  display: none;
}
.catalog-arrow:dir(rtl),
.catalog-pagination:dir(rtl) svg,
.catalog-back:dir(rtl) svg {
  transform: rotate(180deg);
}
@media (max-width: 760px) {
  .catalog-controls {
    display: flex;
    flex-direction: column;
  }
  .library-tools {
    order: 0;
    margin-bottom: 0.65rem;
  }
  .catalog-filter-toggle {
    display: inline-flex;
    align-self: flex-start;
    order: 1;
  }
  .catalog-quick-filters {
    order: 2;
    margin-top: 0.75rem;
  }
  .catalog-summary {
    order: 3;
  }
  .exercise-page:not(.filters-open) .library-tools > label:not(.grow),
  .exercise-page:not(.filters-open) .catalog-quick-filters {
    display: none;
  }
  .mobile-detail .catalog-controls,
  .mobile-detail .page-heading > button {
    display: none;
  }
  .exercise-page .page-heading {
    flex-direction: row;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }
  .exercise-page .page-heading h1 {
    margin: 0;
  }
  .exercise-page .page-heading > button {
    padding-inline: 12px;
    font-size: 0.8rem;
  }
  .page-heading p:not(.overline) {
    display: none;
  }

  .catalog-workspace {
    display: block;
    height: auto;
    min-height: 0;
  }
  .catalog-list-pane {
    border: 0;
  }
  .catalog-list {
    max-height: min(620px, 65dvh);
  }
  .catalog-detail {
    display: none;
    padding: 18px;
  }
  .catalog-workspace.show-detail .catalog-list-pane {
    display: none;
  }
  .catalog-workspace.show-detail .catalog-detail {
    display: block;
  }
  .catalog-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 24px;
  }
  .catalog-detail h2 {
    font-size: 1.25rem;
  }
}
</style>
