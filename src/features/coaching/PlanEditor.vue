<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhArrowLeft, PhPlus, PhTrash, PhArrowUp, PhArrowDown, PhEye } from '@phosphor-icons/vue'
import { user } from '../../app/auth'
import { rpc, rows } from '../../lib/backend'
import { clone, type Plan, type PlanVersion, type Prescription } from '../../lib/domain'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { language, locale, t, errorMessage } from '../../lib/i18n'
import sample from '../../content/sample.json'
import PageState from '../../components/PageState.vue'
const route = useRoute(),
  router = useRouter()
const isNew = route.params.id === 'new'
const id = ref(isNew ? crypto.randomUUID() : String(route.params.id))
const title = ref(language('My training plan', 'خطتي التدريبية'))
const draft = ref<Prescription>(clone(sample.prescription) as Prescription)
const version = ref<number | null>(null)
const selected = ref(0)
const loading = ref(true),
  busy = ref(false),
  preview = ref(false),
  restored = ref(false)
const error = ref(''),
  message = ref('')
const published = ref<PlanVersion>()
const form = ref<HTMLFormElement>()
let initialized = false
const key = `plan:${user.value!.id}:${route.params.id}`
const day = computed(() => draft.value.days[selected.value]!)
const name = (exerciseId: string) => {
  const e = sample.exercises.find((e) => e.id === exerciseId)
  return locale.value === 'ar' ? e?.name_ar : e?.name
}
async function load(recover = true) {
  loading.value = true
  error.value = ''
  try {
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
        draft.value = local.draft
        version.value = local.version
        restored.value = true
        initialized = true
        return
      }
    }
    if (!isNew) {
      const p = (await rows<Plan>('plans', 'id', id.value))[0]
      if (!p) throw Error('not_found')
      title.value = p.title
      draft.value = clone(p.draft)
      version.value = p.draft_version
    }
    initialized = true
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
async function save() {
  if (!form.value?.reportValidity()) return false
  busy.value = true
  error.value = ''
  try {
    const p = await rpc<Plan>('save_plan', {
      p_id: id.value,
      p_title: title.value,
      p_draft: clone(draft.value),
      p_expected_version: version.value,
    })
    version.value = p.draft_version
    restored.value = false
    await storeDraft(key, {
      id: id.value,
      title: title.value,
      draft: draft.value,
      version: version.value,
    })
    message.value = language(
      'Draft saved. Clients keep their current plan until you publish and assign the update.',
      'حُفظت المسودة. تبقى خطة المتدربين الحالية حتى تنشر التحديث وتعيّنه.',
    )
    return true
  } catch (e) {
    error.value = errorMessage(e)
    return false
  } finally {
    busy.value = false
  }
}
async function publish() {
  if (!(await save())) return
  busy.value = true
  try {
    published.value = await rpc<PlanVersion>('publish_plan', {
      p_id: id.value,
      p_expected_version: version.value,
    })
    await removeDraft(key)
    message.value = language(
      'Published. You can now invite a client or update an existing assignment.',
      'تم النشر. يمكنك الآن دعوة متدرب أو تحديث خطة متدرب حالي.',
    )
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
function addExercise() {
  day.value.exercises.push({
    key: crypto.randomUUID(),
    exerciseId: 'goblet-squat',
    sets: 3,
    reps: 10,
    load: 0,
    unit: 'kg',
    rest: 60,
    note: '',
  })
}
function addDay() {
  const d = clone(draft.value.days[0]!)
  d.id = crypto.randomUUID()
  d.name = language('New session', 'حصة جديدة')
  d.nameAr = ''
  d.exercises.forEach((e) => (e.key = crypto.randomUUID()))
  draft.value.days.push(d)
  selected.value = draft.value.days.length - 1
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
    draft.value = clone(sample.prescription) as Prescription
    version.value = null
    id.value = crypto.randomUUID()
    initialized = true
  } else await load(false)
}
async function duplicate() {
  const newId = crypto.randomUUID()
  await storeDraft(`plan:${user.value!.id}:${newId}`, {
    id: newId,
    title: title.value + language(' copy', ' نسخة'),
    draft: clone(draft.value),
    version: null,
  })
  await storeDraft(`plan:${user.value!.id}:new`, {
    id: newId,
    title: title.value + language(' copy', ' نسخة'),
    draft: clone(draft.value),
    version: null,
  })
  await router.push('/coach/plans/new')
}
onMounted(() => load())
function removeDay() {
  draft.value.days.splice(selected.value, 1)
  selected.value = 0
}
</script>
<template>
  <div class="container page editor-page">
    <RouterLink class="back-link" to="/coach/plans"
      ><PhArrowLeft :size="18" aria-hidden="true" class="directional" />{{ t('plans') }}</RouterLink
    >
    <div class="page-heading heading-actions">
      <div>
        <p class="overline">{{ language('Plan studio', 'تصميم الخطة') }}</p>
        <h1>
          {{
            isNew
              ? language('A useful place to start.', 'بداية مفيدة.')
              : language('Make the next session better.', 'اجعل الحصة القادمة أفضل.')
          }}
        </h1>
      </div>
      <button class="button secondary small" @click="preview = !preview">
        <PhEye :size="18" aria-hidden="true" />{{
          preview
            ? language('Edit plan', 'تعديل الخطة')
            : language('Client preview', 'معاينة المتدرب')
        }}
      </button>
    </div>
    <PageState :loading="loading" :error="loading ? error : ''" @retry="load()"
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
        <RouterLink v-if="published" to="/coach/clients" class="text-link">{{
          t('clients')
        }}</RouterLink>
      </p>
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
          <div class="day-tabs">
            <button
              v-for="(d, i) in draft.days"
              :key="d.id"
              type="button"
              :class="{ selected: selected === i }"
              @click="selected = i"
            >
              {{ locale === 'ar' ? d.nameAr || d.name : d.name }}</button
            ><button v-if="!preview && draft.days.length < 7" type="button" @click="addDay">
              <PhPlus :size="18" />{{ language('Add day', 'إضافة يوم') }}
            </button>
          </div>
          <section v-if="day" class="editor-day">
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
            <article v-for="(ex, i) in day.exercises" :key="ex.key" class="editor-exercise">
              <div class="editor-exercise-top">
                <span class="exercise-index">{{ String(i + 1).padStart(2, '0') }}</span>
                <h3 v-if="preview">{{ name(ex.exerciseId) }}</h3>
                <label v-else class="grow"
                  ><span class="sr-only">{{ language('Exercise', 'التمرين') }} {{ i + 1 }}</span
                  ><select v-model="ex.exerciseId">
                    <option v-for="e in sample.exercises" :key="e.id" :value="e.id">
                      {{ locale === 'ar' ? e.name_ar : e.name }}
                    </option>
                  </select></label
                >
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
              <p v-if="preview" class="prescription-line">
                {{ ex.sets }} {{ t('sets') }} × {{ ex.reps }} {{ t('reps') }} · {{ ex.load }}
                {{ t(ex.unit) }} · {{ ex.rest }} {{ language('sec rest', 'ثانية راحة') }}
              </p>
              <div v-else class="exercise-fields">
                <label
                  >{{ t('sets')
                  }}<input
                    v-model.number="ex.sets"
                    type="number"
                    required
                    min="1"
                    max="10" /></label
                ><label
                  >{{ t('reps')
                  }}<input
                    v-model.number="ex.reps"
                    type="number"
                    required
                    min="1"
                    max="100" /></label
                ><label
                  >{{ t('load')
                  }}<input
                    v-model.number="ex.load"
                    type="number"
                    required
                    min="0"
                    max="1000"
                    step="0.01" /></label
                ><label
                  >{{ t('units')
                  }}<select v-model="ex.unit">
                    <option value="kg">{{ t('kg') }}</option>
                    <option value="lb">{{ t('lb') }}</option>
                  </select></label
                ><label
                  >{{ language('Rest (seconds)', 'الراحة (ثانية)')
                  }}<input v-model.number="ex.rest" type="number" required min="0" max="600"
                /></label>
              </div>
              <p v-if="preview">
                {{
                  locale === 'ar'
                    ? sample.exercises.find((e) => e.id === ex.exerciseId)?.instructions_ar
                    : sample.exercises.find((e) => e.id === ex.exerciseId)?.instructions
                }}
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
              v-if="!preview && day.exercises.length < 12"
              type="button"
              class="button secondary full"
              @click="addExercise"
            >
              <PhPlus :size="18" />{{ language('Add exercise', 'إضافة تمرين') }}
            </button>
          </section>
          <div class="editor-savebar">
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
