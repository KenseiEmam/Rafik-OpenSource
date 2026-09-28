<script setup lang="ts">
import ExerciseDemo from '../../components/ExerciseDemo.vue'
import ExercisePicker from '../../components/ExercisePicker.vue'
import ProgramCover from './ProgramCover.vue'
import { request } from '../../lib/backend'
import OrganizationNav from '../organizations/OrganizationNav.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  PhArrowLeft,
  PhPlus,
  PhTrash,
  PhArrowUp,
  PhArrowDown,
  PhEye,
  PhX,
} from '@phosphor-icons/vue'
import { user, contexts } from '../../app/auth'
import { duplicateSession, duplicateWeek } from './program-structure'
import { programContext } from './program-context'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import { clone, type Plan, type PlanVersion, type Prescription } from '../../lib/domain'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { language, locale, t, errorMessage } from '../../lib/i18n'
import sample from '../../content/sample.json'
import PrescriptionFields from './PrescriptionFields.vue'
import { upgradePrescription, targetLabel } from '../../lib/prescriptions'
import type { Exercise } from '../../lib/domain'
import PageState from '../../components/PageState.vue'
const route = useRoute(),
  router = useRouter()
const context = programContext(route)
const editable = ref(context.view !== 'trainee')
const isNew = route.params.id === 'new'
const id = ref(isNew ? crypto.randomUUID() : String(route.params.id))
const title = ref(language('My training plan', 'خطتي التدريبية'))
const draft = ref<Prescription>(upgradePrescription(clone(sample.prescription) as Prescription))
const version = ref<number | null>(null)
const selected = ref(0)
const loadedSuccessfully = ref(false)
const loading = ref(true),
  preview = ref(false),
  restored = ref(false)
const error = ref(''),
  message = ref('')
const published = ref<PlanVersion>()
const listed = ref(false),
  recordRevision = ref(1),
  uploading = ref(false)
const form = ref<HTMLFormElement>()
let initialized = false
const keyFor = (id: string) =>
  context.workspace ? `plan:${user.value!.id}:${context.key}:${id}` : `plan:${user.value!.id}:${id}`
const key =
  keyFor(String(route.params.id)) +
  (route.query.source ? `:source:${route.query.source}:member:${route.query.member || ''}` : '')
const day = computed(() => draft.value.days[selected.value]!)
const catalog = ref<Exercise[]>([])
const activeCatalog = computed(() => catalog.value.filter((exercise) => exercise.active !== false))
const name = (id: string) => {
  const e =
    catalog.value.find((e) => e.id === id) ||
    draft.value.days
      .flatMap((d) => d.exercises.flatMap((e) => [e, ...(e.alternatives || [])]))
      .find((e) => e.exerciseId === id)?.info
  return (locale.value === 'ar' ? e?.name_ar?.trim() || e?.name : e?.name) || id
}
function selectExercise(index: number, exerciseId: string) {
  const ex = day.value.exercises[index]!
  if (!exerciseId || exerciseId === ex.exerciseId) return
  const info = catalog.value.find((e) => e.id === exerciseId)
  if (!info || info.active === false) return
  ex.exerciseId = exerciseId
  ex.kind = info?.kind || 'strength'
  ex.seconds ||= 30
  ex.metres ||= 100
  ex.alternatives = []
  delete ex.info
}
function toggleAlternative(index: number, exerciseId: string, checked: boolean) {
  const ex = day.value.exercises[index]!
  const alternatives = ex.alternatives || []
  if (!checked) {
    ex.alternatives = alternatives.filter((alternative) => alternative.exerciseId !== exerciseId)
    return
  }
  const option = catalog.value.find((exercise) => exercise.id === exerciseId)
  if (
    alternatives.length >= 3 ||
    alternatives.some((alternative) => alternative.exerciseId === exerciseId) ||
    !option ||
    option.active === false ||
    option.id === ex.exerciseId ||
    (option.kind || 'strength') !== (ex.kind || 'strength')
  )
    return
  ex.alternatives = [...alternatives, { exerciseId }]
}
function restDay() {
  if (day.value.restDay) day.value.exercises = []
  else addExercise()
}
function freeSlot() {
  for (let week = 1; week <= (draft.value.cycleWeeks || 1); week++)
    for (let weekday = 0; weekday < 7; weekday++)
      if (!draft.value.days.some((d) => d.week === week && d.weekday === weekday))
        return { week, weekday }
  return null
}
async function load(recover = true) {
  loadedSuccessfully.value = false
  loading.value = true
  error.value = ''
  try {
    if (isNew) {
      catalog.value = await context.catalog()
      if (route.query.source) {
        const source = await context.load(String(route.query.source))
        title.value = source.program.title.slice(0, 85) + language(' adapted', ' معدّل')
        draft.value = upgradePrescription(clone(source.program.draft))
        version.value = null
      }
    } else {
      const loaded = await context.load(id.value)
      if (!loaded.program) throw Error('not_found')
      catalog.value = loaded.catalog
      editable.value = loaded.editable
      listed.value = !!loaded.program.listed
      recordRevision.value = loaded.program.revision || 1
      title.value = loaded.program.title
      draft.value = upgradePrescription(clone(loaded.program.draft))
      version.value = loaded.program.draft_version
      if (!loaded.editable) {
        preview.value = true
        initialized = true
        loadedSuccessfully.value = true
        return
      }
    }
    if (recover) {
      const local = await getDraft<{
        id: string
        title: string
        draft: Prescription
        version: number | null
      }>(key)
      if (local) {
        id.value = local.id
        title.value = local.title
        draft.value = upgradePrescription(local.draft)
        version.value = local.version
        restored.value = true
        initialized = true
        loadedSuccessfully.value = true
        return
      }
    }
    initialized = true
    loadedSuccessfully.value = true
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
watch(
  [title, draft],
  () => {
    if (initialized) {
      message.value = ''
      void storeDraft(key, {
        id: id.value,
        title: title.value,
        draft: draft.value,
        version: version.value,
      }).catch(() => {
        error.value = language(
          'This browser could not save the draft. Save your plan before leaving.',
          'تعذر حفظ المسودة في المتصفح. احفظ الخطة قبل المغادرة.',
        )
      })
    }
  },
  { deep: true },
)
const command = useCommand<'save' | 'publish' | 'listing'>(
  `program:${key}`,
  async (action, result) => {
    const value = result as { plan: Plan; version?: PlanVersion }
    recordRevision.value = value.plan.revision || 1
    listed.value = !!value.plan.listed
    if (action === 'listing') {
      message.value = listed.value
        ? language('Available in the organization catalog.', 'متاح في مكتبة المؤسسة.')
        : language(
            'Removed from the catalog. Existing assignments remain available.',
            'أُزيل من المكتبة. تبقى التعيينات الحالية متاحة.',
          )
      return
    }
    version.value = value.plan.draft_version
    restored.value = false
    if (action === 'publish') {
      published.value = value.version
      await removeDraft(key)
    } else
      await storeDraft(key, {
        id: id.value,
        title: title.value,
        draft: draft.value,
        version: version.value,
      })
    message.value =
      action === 'publish'
        ? language(
            'Published. Choose who receives this version.',
            'تم النشر. اختر من يتلقى هذه النسخة.',
          )
        : language(
            'Draft saved. Current assignments are unchanged.',
            'حُفظت المسودة. التعيينات الحالية لم تتغير.',
          )
  },
  (action, args) => context.command(action, args),
)
const busy = computed(
  () => uploading.value || command.state.busy || !!command.state.pending || !command.state.ready,
)
async function execute(action: 'save' | 'publish') {
  if (!editable.value || !form.value?.reportValidity()) return
  error.value = ''
  message.value = ''
  await command.run(action, {
    operation: crypto.randomUUID(),
    id: id.value,
    title: title.value,
    draft: clone(draft.value),
    revision: version.value,
  })
}
const save = () => execute('save')
const publish = () => execute('publish')
async function toggleListing() {
  message.value = ''
  await command.run('listing', {
    operation: crypto.randomUUID(),
    id: id.value,
    revision: version.value,
    record_revision: recordRevision.value,
    value: !listed.value,
  })
}
async function uploadCover(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2097152) {
    error.value = language(
      'Choose a JPG, PNG or WebP image up to 2 MB.',
      'اختر صورة JPG أو PNG أو WebP حتى ٢ ميغابايت.',
    )
    return
  }
  const workspace =
    context.workspace || contexts.value.find((c) => c.kind === 'independent')?.workspace_id
  if (!workspace) return
  uploading.value = true
  error.value = ''
  try {
    const digest = [
      ...new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())),
    ]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
    const prior = await getDraft<{ digest: string; id: string }>(key + ':cover-upload')
    const mediaId = prior?.digest === digest ? prior.id : crypto.randomUUID()
    await storeDraft(key + ':cover-upload', { digest, id: mediaId })
    await request(`/v1/program-media/${mediaId}?workspace=${workspace}`, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })
    draft.value.presentation ||= {}
    draft.value.presentation.cover = mediaId
    await removeDraft(key + ':cover-upload')
  } catch (e) {
    error.value =
      errorMessage(e) +
      ' ' +
      language('Choose the same file again to retry.', 'اختر الملف نفسه لإعادة المحاولة.')
  } finally {
    uploading.value = false
    ;(event.target as HTMLInputElement).value = ''
  }
}
function addExercise() {
  const first = activeCatalog.value[0]
  day.value.exercises.push({
    key: crypto.randomUUID(),
    exerciseId: first?.id || 'goblet-squat',
    kind: first?.kind || 'strength',
    seconds: 30,
    metres: 100,
    sets: 3,
    reps: 10,
    load: 0,
    unit: 'kg',
    rest: 60,
    note: '',
  })
}
function addDay() {
  const slot = freeSlot()
  if (!slot) {
    error.value = language(
      'Add a cycle week before adding more days.',
      'أضف أسبوعاً للدورة قبل إضافة أيام.',
    )
    return
  }
  const d = clone(
    draft.value.days.find((d) => !d.restDay) || {
      id: crypto.randomUUID(),
      name: '',
      minutes: 30,
      exercises: [],
    },
  )
  Object.assign(d, slot)
  d.id = crypto.randomUUID()
  d.name = language('New session', 'حصة جديدة')
  d.nameAr = ''
  d.exercises.forEach((e) => (e.key = crypto.randomUUID()))
  draft.value.days.push(d)
  selected.value = draft.value.days.length - 1
  if (!d.exercises.length) addExercise()
}
function joinPrevious(index: number) {
  const previous = day.value.exercises[index - 1]!
  previous.group ||= language('Superset', 'مجموعة مركبة') + ' ' + index
  day.value.exercises[index]!.group = previous.group
}
function move(index: number, offset: number) {
  const ex = day.value.exercises.splice(index, 1)[0]!
  day.value.exercises.splice(index + offset, 0, ex)
}
async function discard() {
  initialized = false
  await removeDraft(key)
  restored.value = false
  selected.value = 0
  if (isNew) {
    title.value = language('My training plan', 'خطتي التدريبية')
    draft.value = upgradePrescription(clone(sample.prescription) as Prescription)
    version.value = null
    id.value = crypto.randomUUID()
    initialized = true
  } else await load(false)
}
async function duplicate() {
  const newId = crypto.randomUUID()
  await storeDraft(keyFor(newId), {
    id: newId,
    title: title.value.slice(0, 85) + language(' copy', ' نسخة'),
    draft: clone(draft.value),
    version: null,
  })
  await storeDraft(keyFor('new'), {
    id: newId,
    title: title.value.slice(0, 85) + language(' copy', ' نسخة'),
    draft: clone(draft.value),
    version: null,
  })
  await router.push(
    context.base + '/plans/new' + (route.query.member ? '?member=' + route.query.member : ''),
  )
}
onMounted(() => load())
function copySession() {
  try {
    draft.value = duplicateSession(draft.value, selected.value, language(' copy', ' نسخة'))
    selected.value = draft.value.days.length - 1
  } catch (e) {
    error.value = errorMessage(e)
  }
}
function copyWeek() {
  try {
    const old = day.value.week || 1
    draft.value = duplicateWeek(draft.value, old)
    selected.value = draft.value.days.findIndex((d) => d.week === draft.value.cycleWeeks)
  } catch (e) {
    error.value = errorMessage(e)
  }
}
function removeDay() {
  draft.value.days.splice(selected.value, 1)
  selected.value = 0
}
</script>
<template>
  <OrganizationNav v-if="context.workspace" />
  <div class="container page editor-page">
    <RouterLink class="back-link" :to="context.base + '/plans'"
      ><PhArrowLeft :size="18" aria-hidden="true" class="directional" />{{ t('plans') }}</RouterLink
    >
    <div class="page-heading heading-actions">
      <div>
        <p class="overline">{{ language('Plan studio', 'تصميم الخطة') }}</p>
        <h1>
          {{
            isNew ? language('Create a plan', 'إنشاء خطة') : language('Edit plan', 'تعديل الخطة')
          }}
        </h1>
      </div>
      <button v-if="editable" class="button secondary small" @click="preview = !preview">
        <PhEye :size="18" aria-hidden="true" />{{
          preview
            ? language('Edit plan', 'تعديل الخطة')
            : language('Client preview', 'معاينة المتدرب')
        }}
      </button>
    </div>
    <PageState :loading="loading" :error="!loadedSuccessfully ? error : ''" @retry="load()"
      ><p v-if="restored" class="notice">
        {{ language('Your local draft has been restored.', 'تم استرداد مسودتك المحلية.') }}
        <button class="text-link" @click="discard">
          {{ language('Discard local changes', 'تجاهل التعديلات المحلية') }}
        </button>
      </p>
      <p v-if="error" class="notice error" role="alert">
        {{ error }}
        <button v-if="!isNew" class="text-link" @click="discard">
          {{
            language(
              'Reload saved plan (discards this draft)',
              'إعادة تحميل الخطة المحفوظة وحذف هذه المسودة',
            )
          }}
        </button>
      </p>
      <p v-if="message" class="notice success" role="status">
        {{ message }}
        <RouterLink
          v-if="published"
          :to="
            context.base +
            '/deliver/' +
            published.id +
            (route.query.member ? '?member=' + route.query.member : '')
          "
          class="text-link"
          >{{ language('Assign this plan', 'تعيين هذه الخطة') }}</RouterLink
        >
      </p>
      <CommandStatus :command="command" :show-notice="false" />
      <form ref="form" @submit.prevent="save">
        <fieldset :disabled="busy" class="form-fields">
          <div class="editor-title" v-if="!preview">
            <label for="plan-title">{{ language('Plan name', 'اسم الخطة') }}</label
            ><input id="plan-title" v-model="title" required maxlength="100" class="title-input" />
            <p class="small-print">
              {{
                language(
                  'Changes are kept on this device. Save the draft to back it up to your account.',
                  'تُحفظ التعديلات على هذا الجهاز. احفظ المسودة للاحتفاظ بها في حسابك.',
                )
              }}
            </p>
          </div>
          <h2 v-else>{{ title }}</h2>
          <details
            v-if="context.workspace && editable && (published || !isNew)"
            class="panel catalog-visibility"
          >
            <summary>{{ language('Organization catalog', 'مكتبة المؤسسة') }}</summary>
            <p>
              {{
                language(
                  'Catalog programs can be viewed by your organization’s members. Assignment is still an explicit step.',
                  'يمكن لأعضاء المؤسسة مشاهدة برامج المكتبة. يبقى التعيين خطوة صريحة.',
                )
              }}
            </p>
            <button
              type="button"
              class="button secondary small"
              :disabled="busy"
              @click="toggleListing"
            >
              {{
                listed
                  ? language('Remove from catalog', 'إزالة من المكتبة')
                  : language('Make available in catalog', 'إتاحة في المكتبة')
              }}
            </button>
          </details>
          <ProgramCover
            :id="draft.presentation?.cover"
            :style="!preview ? { maxWidth: '220px', maxHeight: '124px' } : {}"
          />
          <details open v-if="!preview" class="program-description">
            <summary>
              {{
                language(
                  'Help trainees recognize this program',
                  'مساعدة المتدربين على تمييز البرنامج',
                )
              }}
            </summary>
            <label
              >{{ language('Goal (optional)', 'الهدف (اختياري)')
              }}<input
                :value="draft.presentation?.goal"
                maxlength="160"
                @input="
                  draft.presentation = {
                    ...draft.presentation,
                    goal: ($event.target as HTMLInputElement).value,
                  }
                "
            /></label>
            <label
              >{{ language('Experience level', 'مستوى الخبرة')
              }}<select
                :value="draft.presentation?.level || 'mixed'"
                @change="
                  draft.presentation = {
                    ...draft.presentation,
                    level: ($event.target as HTMLSelectElement).value as
                      'beginner' | 'mixed' | 'experienced',
                  }
                "
              >
                <option value="mixed">{{ language('Adaptable', 'قابل للتكييف') }}</option>
                <option value="beginner">{{ language('Getting started', 'للمبتدئين') }}</option>
                <option value="experienced">{{ language('Experienced', 'ذوو خبرة') }}</option>
              </select></label
            >
            <label
              >{{
                language(
                  'Cover image (optional, up to 2 MB)',
                  'صورة الغلاف (اختيارية، حتى ٢ ميغابايت)',
                )
              }}<input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                @change="uploadCover" /></label
            ><button
              v-if="draft.presentation?.cover"
              type="button"
              class="text-link"
              @click="delete draft.presentation.cover"
            >
              {{ language('Remove cover from this draft', 'إزالة الغلاف من المسودة') }}
            </button>
          </details>
          <details open v-if="!preview" class="program-description">
            <summary>
              {{ language('Program description (optional)', 'وصف البرنامج (اختياري)') }}
            </summary>
            <label
              >{{ language('Who it helps and what to expect', 'لمن يناسب وماذا تتوقع')
              }}<textarea v-model="draft.description" maxlength="1000" rows="3" /></label
            ><label
              >{{ language('Arabic description (optional)', 'الوصف بالعربية (اختياري)')
              }}<textarea v-model="draft.descriptionAr" maxlength="1000" rows="3" />
            </label>
          </details>
          <p v-else-if="draft.description">
            {{ locale === 'ar' ? draft.descriptionAr || draft.description : draft.description }}
          </p>
          <button
            v-if="!editable && context.view !== 'trainee'"
            type="button"
            class="button secondary"
            @click="duplicate"
          >
            {{ language('Make an editable copy', 'إنشاء نسخة للتعديل') }}
          </button>
          <details open v-if="!preview" class="program-schedule">
            <summary>
              {{ language('Program schedule', 'جدول البرنامج') }}
            </summary>
            <label
              >{{ language('Repeat every (weeks)', 'التكرار كل (أسابيع)')
              }}<input v-model.number="draft.cycleWeeks" type="number" min="1" max="12" required
            /></label>
            <p v-if="!preview" class="small-print">
              {{
                language(
                  `This ${draft.cycleWeeks || 1}-week plan repeats every ${(draft.cycleWeeks || 1) * 7} days from the assignment start date. Days without a workout are rest days. Use one week for a simple weekly routine.`,
                  `تتكرر الخطة كل ${(draft.cycleWeeks || 1) * 7} أيام من تاريخ البدء. الأيام دون تمارين أيام راحة. اختر أسبوعاً واحداً لروتين أسبوعي بسيط.`,
                )
              }}
              <RouterLink :to="context.base + '/exercises'" target="_blank"
                >{{
                  language('Manage your exercise library', 'إدارة مكتبة التمارين')
                }}
                ↗</RouterLink
              >
            </p>
          </details>
          <div class="day-tabs">
            <button
              v-for="(d, i) in draft.days"
              :key="d.id"
              type="button"
              :class="{ selected: selected === i }"
              @click="selected = i"
            >
              {{ language('W', 'أ') }}{{ d.week }} ·
              {{ locale === 'ar' ? d.nameAr || d.name : d.name }}</button
            ><button v-if="!preview && draft.days.length < 84" type="button" @click="addDay">
              <PhPlus :size="18" />{{ language('Add day', 'إضافة يوم') }}
            </button>
          </div>
          <section v-if="day" class="editor-day">
            <div v-if="!preview" class="actions session-reuse">
              <button type="button" class="text-link" @click="copySession">
                {{ language('Duplicate session', 'نسخ الحصة') }}</button
              ><button type="button" class="text-link" @click="copyWeek">
                {{ language('Duplicate this week', 'نسخ هذا الأسبوع') }}
              </button>
            </div>
            <div v-if="!preview" class="day-settings">
              <label
                >{{ language('Session name', 'اسم الحصة')
                }}<input v-model="day.name" required maxlength="80" /></label
              ><label
                >{{ language('Arabic name (optional)', 'الاسم بالعربية (اختياري)')
                }}<input v-model="day.nameAr" maxlength="80" /></label
              ><label
                >{{ language('Minutes', 'الدقائق')
                }}<input
                  v-model.number="day.minutes"
                  type="number"
                  min="5"
                  max="180"
                  required /></label
              ><button
                v-if="draft.days.length > 1"
                class="icon-button danger"
                type="button"
                :aria-label="language('Remove this day', 'حذف اليوم')"
                @click="removeDay"
              >
                <PhTrash :size="20" />
              </button>
            </div>
            <div v-if="!preview" class="field-pair cycle-settings">
              <label
                >{{ language('Cycle week', 'أسبوع الدورة')
                }}<input
                  v-model.number="day.week"
                  type="number"
                  min="1"
                  :max="draft.cycleWeeks"
                  required /></label
              ><label
                >{{ language('Day of cycle week', 'اليوم في أسبوع الدورة')
                }}<select v-model.number="day.weekday">
                  <option v-for="n in 7" :key="n" :value="n - 1">
                    {{ language('Day', 'اليوم') }} {{ n }}
                  </option>
                </select></label
              ><label class="check-label"
                ><input v-model="day.restDay" type="checkbox" @change="restDay" />{{
                  language('Rest day', 'يوم راحة')
                }}</label
              >
            </div>
            <p v-if="day.restDay" class="notice">
              {{
                language('Recovery day. No workout to record.', 'يوم تعافٍ. لا يوجد تمرين للتسجيل.')
              }}
            </p>
            <article
              v-for="(ex, i) in day.exercises"
              :key="ex.key"
              class="editor-exercise"
              :class="{
                'grouped-exercise': !!ex.group,
                'group-continued': !!ex.group && day.exercises[i - 1]?.group === ex.group,
              }"
            >
              <p v-if="ex.group" class="superset-banner">
                {{ language('Superset / circuit', 'مجموعة مركبة / دائرة') }} · {{ ex.group
                }}<span v-if="day.exercises[i - 1]?.group === ex.group">
                  · {{ language('Continue together', 'تابع ضمن المجموعة') }}</span
                >
              </p>
              <div class="editor-exercise-top">
                <span class="exercise-index">{{ String(i + 1).padStart(2, '0') }}</span>
                <h3 v-if="preview">{{ name(ex.exerciseId) }}</h3>
                <ExercisePicker
                  v-else
                  class="grow"
                  :model-value="ex.exerciseId"
                  :exercises="catalog"
                  :fallback-name="name(ex.exerciseId)"
                  :label="language('Exercise', 'التمرين') + ' ' + (i + 1)"
                  hide-label
                  @update:model-value="selectExercise(i, $event)"
                />
                <div v-if="!preview" class="actions compact-actions">
                  <button
                    class="icon-button"
                    type="button"
                    :disabled="i === 0"
                    :aria-label="language('Move exercise up', 'نقل التمرين للأعلى')"
                    @click="move(i, -1)"
                  >
                    <PhArrowUp :size="18" /></button
                  ><button
                    class="icon-button"
                    type="button"
                    :disabled="i === day.exercises.length - 1"
                    :aria-label="language('Move exercise down', 'نقل التمرين للأسفل')"
                    @click="move(i, 1)"
                  >
                    <PhArrowDown :size="18" /></button
                  ><button
                    class="icon-button danger"
                    type="button"
                    :disabled="day.exercises.length === 1"
                    :aria-label="language('Remove exercise', 'حذف التمرين')"
                    @click="day.exercises.splice(i, 1)"
                  >
                    <PhTrash :size="18" />
                  </button>
                </div>
              </div>
              <div v-if="preview" class="prescription-line">
                <p>
                  {{ ex.group }} · {{ ex.sets }} {{ t('sets') }} · {{ targetLabel(ex) }} ·
                  {{ ex.rest }} {{ language('sec rest', 'ثانية راحة') }}
                </p>
                <p v-for="(target, n) in ex.targets" :key="n">
                  {{ n + 1 }}. {{ targetLabel(ex, target) }}
                </p>
              </div>
              <template v-else
                ><button
                  v-if="i > 0 && !ex.group"
                  type="button"
                  class="text-link"
                  @click="joinPrevious(i)"
                >
                  {{ language('Pair with previous exercise', 'اربط بالتمرين السابق') }}</button
                ><PrescriptionFields v-model="day.exercises[i]!"
              /></template>
              <ExerciseDemo :exercise="catalog.find((e) => e.id === ex.exerciseId) || ex.info" />
              <p v-if="preview">
                {{
                  locale === 'ar'
                    ? (catalog.find((e) => e.id === ex.exerciseId) || ex.info)?.instructions_ar
                    : (catalog.find((e) => e.id === ex.exerciseId) || ex.info)?.instructions
                }}
              </p>
              <details v-if="!preview" class="exercise-alternatives">
                <summary>
                  {{ language('Offer an alternative', 'اقتراح تمرين بديل')
                  }}<span v-if="ex.alternatives?.length"> ({{ ex.alternatives.length }})</span>
                </summary>
                <p class="subtle">
                  {{
                    language(
                      'Choose up to 3 exercises with the same recording type. They use the same sets and targets; your client can adjust their recorded results.',
                      'اختر حتى 3 تمارين من نوع التسجيل نفسه. تستخدم المجموعات والأهداف نفسها، ويمكن للمتدرب تعديل نتائجه المسجلة.',
                    )
                  }}
                </p>
                <ul
                  v-if="ex.alternatives?.length"
                  class="alternative-chips"
                  :aria-label="
                    language('Approved alternatives', 'البدائل المعتمدة') + ' ' + (i + 1)
                  "
                >
                  <li v-for="alternative in ex.alternatives" :key="alternative.exerciseId">
                    <span>{{ name(alternative.exerciseId) }}</span>
                    <button
                      type="button"
                      :aria-label="
                        language('Remove alternative', 'إزالة البديل') +
                        ' ' +
                        name(alternative.exerciseId)
                      "
                      @click="toggleAlternative(i, alternative.exerciseId, false)"
                    >
                      <PhX :size="15" aria-hidden="true" />
                    </button>
                  </li>
                </ul>
                <ExercisePicker
                  model-value=""
                  :exercises="catalog"
                  :excluded-ids="[
                    ex.exerciseId,
                    ...(ex.alternatives || []).map((alternative) => alternative.exerciseId),
                  ]"
                  :kind="ex.kind || 'strength'"
                  :disabled="(ex.alternatives?.length || 0) >= 3"
                  :label="language('Add approved alternative', 'إضافة بديل معتمد') + ' ' + (i + 1)"
                  :placeholder="
                    (ex.alternatives?.length || 0) >= 3
                      ? language('Three alternatives selected', 'تم اختيار ثلاثة بدائل')
                      : language('Search same-type exercises', 'ابحث عن تمارين من النوع نفسه')
                  "
                  @update:model-value="toggleAlternative(i, $event, true)"
                />
              </details>
              <p v-if="preview && ex.alternatives?.length" class="subtle">
                {{ language('Approved alternatives', 'البدائل المعتمدة') }}:
                {{ ex.alternatives.map((a) => name(a.exerciseId)).join(' · ') }}
              </p>
              <p v-if="preview && ex.note" class="coach-prescription">{{ ex.note }}</p>
              <details v-if="!preview">
                <summary>{{ language('Add a coaching cue', 'إضافة توجيه للمتدرب') }}</summary>
                <label
                  ><span class="sr-only">{{ language('Coaching cue', 'توجيه المتدرب') }}</span
                  ><textarea v-model="ex.note" maxlength="500" rows="2"></textarea>
                </label>
              </details>
            </article>
            <button
              v-if="!preview && !day.restDay && day.exercises.length < 12"
              type="button"
              class="button secondary full"
              @click="addExercise"
            >
              <PhPlus :size="18" />{{ language('Add exercise', 'إضافة تمرين') }}
            </button>
          </section>
          <div v-if="editable" class="editor-savebar">
            <p>
              {{
                language(
                  'Publishing creates a fixed version. Existing client plans change only when you assign it.',
                  'النشر ينشئ نسخة ثابتة. تتغير خطط المتدربين فقط عند تعيينها لهم.',
                )
              }}
            </p>
            <div class="actions">
              <button v-if="!isNew" type="button" class="text-link" @click="duplicate">
                {{ language('Duplicate', 'إنشاء نسخة') }}</button
              ><button type="submit" class="button secondary" :disabled="busy">
                {{ language('Save draft', 'حفظ المسودة') }}</button
              ><button type="button" class="button" :disabled="busy" @click="publish">
                {{ busy ? t('loading') : language('Publish plan', 'نشر الخطة') }}
              </button>
            </div>
          </div>
        </fieldset>
      </form></PageState
    >
  </div>
</template>

<style>
.alternative-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
  padding: 0;
  list-style: none;
}
.alternative-chips li {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--tint);
  color: var(--ink);
}
.alternative-chips span {
  overflow: hidden;
  padding: 7px 3px 7px 11px;
  font-size: 0.78rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}
[dir='rtl'] .alternative-chips span {
  padding: 7px 11px 7px 3px;
}
.alternative-chips button {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 34px;
  min-height: 34px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--muted);
}
.alternative-chips button:hover {
  color: var(--error);
}
.exercise-alternatives > .exercise-picker {
  margin-top: 12px;
}
@media (max-width: 600px) {
  .editor-exercise-top > .exercise-picker {
    flex: 1 0 calc(100% - 28px);
    width: calc(100% - 28px);
  }
}
</style>

<style scoped>
.grouped-exercise {
  border-inline-start: 4px solid var(--accent);
}
.group-continued {
  margin-block-start: 8px;
}
.superset-banner {
  color: var(--accent);
  font-size: 0.82rem;
  font-weight: 700;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}
</style>
