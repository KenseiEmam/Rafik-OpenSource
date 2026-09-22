<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import {
  PhArrowLeft,
  PhArrowRight,
  PhCheck,
  PhCheckCircle,
  PhCloudCheck,
  PhCloudSlash,
  PhClock,
  PhDownloadSimple,
} from '@phosphor-icons/vue'
import PageState from '../../components/PageState.vue'
import { user } from '../../app/auth'
import { language, locale, t, errorMessage } from '../../lib/i18n'
import { clone, convertLoad, type LocalSession, type Session, type Unit } from '../../lib/domain'
import {
  loadWorkout,
  changeWorkout,
  syncWorkout,
  adoptGuest,
  reloadServerSession,
} from '../../lib/training'
import { editLocalSession, getLocalSession } from '../../lib/storage'
import { rpc } from '../../lib/backend'
import sample from '../../content/sample.json'
const route = useRoute()
const router = useRouter()
const id = String(route.params.id)
const row = ref<LocalSession>()
const loading = ref(true)
const error = ref('')
const selected = ref(0)
const working = ref(false)
const syncing = ref(false)
const finishConfirm = ref(false)
const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | undefined
let mutation = Promise.resolve()
const correcting = ref(false)
const savingLocal = ref(0)
const noteDraft = ref<string>()
onBeforeRouteLeave(async () => {
  await mutation
})
const owner = computed(() => user.value?.id || 'guest')
const session = computed(() => row.value?.session)
const current = computed(() => session.value?.prescription.exercises[selected.value])
const info = computed(() => sample.exercises.find((e) => e.id === current.value?.exerciseId))
const entries = computed(
  () => session.value?.entries.filter((e) => e.exercise_key === current.value?.key) || [],
)
const doneCount = computed(() => session.value?.entries.filter((e) => e.completed).length || 0)
const total = computed(() => session.value?.entries.length || 0)
const finished = computed(() => session.value?.status === 'completed')
const remaining = computed(() =>
  Math.max(0, Math.ceil(((row.value?.restUntil || 0) - now.value) / 1000)),
)
const status = computed(() =>
  savingLocal.value
    ? language('Saving on this device…', 'جارٍ الحفظ على الجهاز…')
    : !row.value
      ? ''
      : row.value.owner === 'guest'
        ? t('localSave')
        : syncing.value
          ? t('syncing')
          : row.value.syncError
            ? t('syncFailed')
            : row.value.localRevision > row.value.syncedRevision
              ? t('waiting')
              : t('synced'),
)
async function load() {
  loading.value = true
  error.value = ''
  try {
    row.value = await loadWorkout(id, owner.value)
    if (row.value.owner === 'guest' && user.value && route.query.save === '1') {
      await adoptGuest(id, user.value.id)
      row.value = await getLocalSession(id)
      await router.replace(route.path)
    }
    if (row.value?.owner !== 'guest') void sync()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
async function sync() {
  if (syncing.value || !row.value || row.value.owner === 'guest') return
  syncing.value = true
  try {
    await syncWorkout(id, owner.value)
    row.value = await getLocalSession(id)
  } finally {
    syncing.value = false
  }
}
function mutate(fn: (s: Session) => void) {
  savingLocal.value++
  mutation = mutation.then(async () => {
    error.value = ''
    try {
      row.value = await changeWorkout(id, fn)
      void sync()
    } catch (e) {
      error.value = errorMessage(e)
    } finally {
      savingLocal.value--
    }
  })
  return mutation
}
const fieldDrafts = ref<Record<string, string>>({})
const invalidFields = ref<Record<string, boolean>>({})
const fieldKey = (index: number, field: string) => `${current.value!.key}:${index}:${field}`
const hasInvalid = computed(() => Object.values(invalidFields.value).some(Boolean))
function changeEntry(index: number, field: 'load' | 'reps', event: Event) {
  const input = event.target as HTMLInputElement
  const key = fieldKey(index, field)
  fieldDrafts.value[key] = input.value
  const valid = input.value !== '' && input.checkValidity() && Number.isFinite(Number(input.value))
  invalidFields.value[key] = !valid
  if (!valid) {
    error.value = language(
      'Enter a valid number before saving this set.',
      'أدخل رقماً صالحاً قبل حفظ المجموعة.',
    )
    return
  }
  const exerciseKey = current.value!.key,
    value = Number(input.value)
  void mutate((s) => {
    s.entries.find((e) => e.exercise_key === exerciseKey && e.set_index === index)![field] = value
  })
}
async function toggle(index: number) {
  if (hasInvalid.value) return
  const key = current.value!.key
  const entry = entries.value.find((e) => e.set_index === index)!
  if (!entry.completed && entry.reps < 1) {
    error.value = language('Add at least one repetition.', 'أضف تكراراً واحداً على الأقل.')
    return
  }
  await mutate((s) => {
    const e = s.entries.find((e) => e.exercise_key === key && e.set_index === index)!
    e.completed = !e.completed
  })
  if (!entry.completed) {
    row.value = await editLocalSession(id, (r) => {
      r.restUntil = Date.now() + current.value!.rest * 1000
    })
  }
}
function units(event: Event) {
  fieldDrafts.value = {}
  invalidFields.value = {}
  const unit = (event.target as HTMLSelectElement).value as Unit
  const key = current.value!.key
  void mutate((s) => {
    s.entries
      .filter((e) => e.exercise_key === key)
      .forEach((e) => {
        e.load = convertLoad(e.load, e.unit, unit)
        e.unit = unit
      })
  })
}
async function finish() {
  if (hasInvalid.value) return
  if (doneCount.value === 0) {
    error.value = errorMessage(new Error('no_completed_sets'))
    return
  }
  if (doneCount.value < total.value && !finishConfirm.value) {
    finishConfirm.value = true
    return
  }
  working.value = true
  await mutate((s) => {
    s.status = 'completed'
    s.completed_at ||= new Date().toISOString()
  })
  row.value = await editLocalSession(id, (r) => {
    r.restUntil = undefined
  })
  finishConfirm.value = false
  correcting.value = false
  working.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
async function saveAccount() {
  if (!user.value) {
    await router.push({ path: '/login', query: { next: route.path + '?save=1' } })
    return
  }
  working.value = true
  try {
    await adoptGuest(id, user.value.id)
    row.value = await getLocalSession(id)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    working.value = false
  }
}
async function latest() {
  working.value = true
  try {
    row.value = await reloadServerSession(id, owner.value)
    fieldDrafts.value = {}
    invalidFields.value = {}
    noteDraft.value = undefined
    error.value = ''
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    working.value = false
  }
}
async function skipRest() {
  row.value = await editLocalSession(id, (r) => {
    r.restUntil = undefined
  })
}
function exportDraft() {
  if (!row.value) return
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(row.value.session, null, 2)], { type: 'application/json' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = 'rafik-workout-draft.json'
  a.click()
  URL.revokeObjectURL(url)
}
function updateNote(event: Event) {
  const note = (event.target as HTMLTextAreaElement).value
  noteDraft.value = note
  void mutate((s) => {
    s.note = note
  })
}
const previous = ref<Record<string, string>>({})
async function getPrevious() {
  if (!user.value) return
  try {
    const { backend } = await import('../../lib/backend')
    const { data } = await backend
      .from('sessions')
      .select('id')
      .eq('client_id', user.value.id)
      .eq('status', 'completed')
      .neq('id', id)
      .order('completed_at', { ascending: false })
      .limit(1)
    if (data?.[0]) {
      const s = await rpc<Session>('session_document', { p_id: data[0].id })
      s.entries
        .filter((e) => e.completed)
        .forEach((e) => {
          previous.value[
            s.prescription.exercises.find((x) => x.key === e.exercise_key)?.exerciseId ||
              e.exercise_key
          ] = `${e.load} ${t(e.unit)} × ${e.reps}`
        })
    }
  } catch {
    /* Previous results are optional; never invent a number on failure. */
  }
}
onMounted(() => {
  void load()
  void getPrevious()
  clock = setInterval(() => {
    now.value = Date.now()
  }, 1000)
  window.addEventListener('online', sync)
})
onUnmounted(() => {
  clearInterval(clock)
  window.removeEventListener('online', sync)
})
function correctSets() {
  correcting.value = true
  finishConfirm.value = false
}
</script>
<template>
  <div class="container page workout-page">
    <RouterLink class="back-link" :to="user ? '/today' : '/routine'"
      ><PhArrowLeft :size="18" class="directional" aria-hidden="true" />{{
        user ? t('today') : t('sample')
      }}</RouterLink
    ><PageState :loading="loading" :error="!row ? error : ''" @retry="load"
      ><template v-if="row && session">
        <div class="workout-heading">
          <div>
            <span class="overline">{{
              session.title === sample.title ? t('contentTitle') : session.title
            }}</span>
            <h1>
              {{
                finished
                  ? language('Session complete.', 'اكتملت الحصة.')
                  : locale === 'ar'
                    ? session.prescription.nameAr || session.prescription.name
                    : session.prescription.name
              }}
            </h1>
          </div>
          <span class="save-status" role="status"
            ><PhCloudSlash
              v-if="row.owner === 'guest' || row.syncError"
              :size="19"
              aria-hidden="true"
            /><PhCloudCheck v-else :size="19" aria-hidden="true" />{{ status }}</span
          >
        </div>
        <div v-if="error" class="notice error" role="alert">{{ error }}</div>
        <div v-if="row.conflict" class="notice error">
          <strong>{{
            language('Another device saved a newer version.', 'حفظ جهاز آخر نسخة أحدث.')
          }}</strong>
          <p>
            {{
              language(
                'Your draft is still here. Download it before loading the server version. We also keep a local recovery copy.',
                'مسودتك ما زالت هنا. نزّلها قبل تحميل نسخة الخادم. نحتفظ أيضاً بنسخة استرداد محلية.',
              )
            }}
          </p>
          <div class="actions">
            <button class="button small secondary" @click="exportDraft">
              <PhDownloadSimple :size="17" aria-hidden="true" />{{
                language('Download my draft', 'تنزيل مسودتي')
              }}</button
            ><button class="button small" :disabled="working" @click="latest">
              {{ language('Load latest version', 'تحميل أحدث نسخة') }}
            </button>
          </div>
        </div>
        <div v-else-if="row.syncError" class="notice">
          <p>{{ errorMessage(new Error(row.syncError)) }}</p>
          <button class="button small secondary" @click="sync">{{ t('retry') }}</button>
        </div>
        <template v-if="!finished || correcting"
          ><div class="workout-progress">
            <span
              >{{ doneCount }} / {{ total }} {{ language('sets recorded', 'مجموعة مسجلة') }}</span
            ><progress
              :value="doneCount"
              :max="total"
              :aria-label="language('Sets completed', 'المجموعات المكتملة')"
            ></progress>
          </div>
          <div class="logger-layout">
            <aside class="exercise-nav" :aria-label="t('exercises')">
              <button
                v-for="(ex, i) in session.prescription.exercises"
                :key="ex.key"
                @click="selected = i"
                :class="{ selected: i === selected }"
                :aria-current="i === selected ? 'step' : undefined"
              >
                <span class="exercise-index"
                  ><PhCheck
                    v-if="
                      session.entries.filter((e) => e.exercise_key === ex.key && e.completed)
                        .length === ex.sets
                    "
                    :size="18"
                    aria-hidden="true"
                  /><template v-else>{{ i + 1 }}</template></span
                ><span
                  >{{
                    locale === 'ar'
                      ? sample.exercises.find((x) => x.id === ex.exerciseId)?.name_ar
                      : sample.exercises.find((x) => x.id === ex.exerciseId)?.name
                  }}<small
                    >{{
                      session.entries.filter((e) => e.exercise_key === ex.key && e.completed).length
                    }}
                    / {{ ex.sets }} {{ t('sets') }}</small
                  ></span
                >
              </button>
            </aside>
            <section v-if="current" class="logger-main">
              <div class="logger-exercise-heading">
                <div>
                  <h2>{{ locale === 'ar' ? info?.name_ar : info?.name }}</h2>
                  <p>
                    {{ locale === 'ar' ? info?.equipment_ar : info?.equipment
                    }}<span class="inline-rest"
                      ><PhClock :size="16" aria-hidden="true" />{{ current.rest }}
                      {{ language('sec rest', 'ثانية راحة') }}</span
                    >
                  </p>
                </div>
                <label class="unit-control"
                  ><span class="sr-only">{{ t('units') }}</span
                  ><select
                    :value="entries[0]?.unit || current.unit"
                    @change="units"
                    :disabled="row.conflict"
                  >
                    <option value="kg">{{ t('kg') }}</option>
                    <option value="lb">{{ t('lb') }}</option>
                  </select></label
                >
              </div>
              <p class="instruction">
                {{ locale === 'ar' ? info?.instructions_ar : info?.instructions }}
              </p>
              <p v-if="current.note" class="coach-prescription">{{ current.note }}</p>
              <p v-if="previous[current.exerciseId]" class="previous-result">
                {{ t('previous') }}: <strong dir="ltr">{{ previous[current.exerciseId] }}</strong>
              </p>
              <div class="set-grid set-head" aria-hidden="true">
                <span>{{ language('Set', 'المجموعة') }}</span
                ><span>{{ t('load') }} ({{ t(entries[0]?.unit || current.unit) }})</span
                ><span>{{ t('reps') }}</span
                ><span>{{ t('done') }}</span>
              </div>
              <div
                v-for="entry in entries"
                :key="entry.set_index"
                class="set-grid set-row"
                :class="{ recorded: entry.completed }"
              >
                <span class="set-number">{{ entry.set_index + 1 }}</span
                ><input
                  type="number"
                  inputmode="decimal"
                  min="0"
                  max="1000"
                  step="0.01"
                  :value="fieldDrafts[fieldKey(entry.set_index, 'load')] ?? entry.load"
                  :disabled="row.conflict"
                  :aria-label="
                    language(
                      `Set ${entry.set_index + 1} load`,
                      `وزن المجموعة ${entry.set_index + 1}`,
                    )
                  "
                  @input="changeEntry(entry.set_index, 'load', $event)"
                /><input
                  type="number"
                  inputmode="numeric"
                  min="0"
                  max="200"
                  step="1"
                  :value="fieldDrafts[fieldKey(entry.set_index, 'reps')] ?? entry.reps"
                  :disabled="row.conflict"
                  :aria-label="
                    language(
                      `Set ${entry.set_index + 1} reps`,
                      `تكرارات المجموعة ${entry.set_index + 1}`,
                    )
                  "
                  @input="changeEntry(entry.set_index, 'reps', $event)"
                /><button
                  class="record-button"
                  :class="{ checked: entry.completed }"
                  :disabled="row.conflict || hasInvalid"
                  :aria-pressed="entry.completed"
                  :aria-label="
                    language(
                      `Mark set ${entry.set_index + 1} ${entry.completed ? 'incomplete' : 'done'}`,
                      `تسجيل المجموعة ${entry.set_index + 1}`,
                    )
                  "
                  @click="toggle(entry.set_index)"
                >
                  <PhCheck :size="23" weight="bold" aria-hidden="true" />
                </button>
              </div>
              <div v-if="remaining > 0" class="rest-timer">
                <PhClock :size="22" aria-hidden="true" />
                <div>
                  <span>{{ t('rest') }}</span
                  ><strong dir="ltr"
                    >{{ Math.floor(remaining / 60) }}:{{
                      String(remaining % 60).padStart(2, '0')
                    }}</strong
                  >
                </div>
                <button class="text-link" @click="skipRest">{{ t('skipRest') }}</button>
              </div>
              <div class="logger-bottom">
                <button
                  v-if="selected < session.prescription.exercises.length - 1"
                  class="button secondary full"
                  @click="selected++"
                >
                  {{ t('nextExercise')
                  }}<PhArrowRight :size="20" class="directional" aria-hidden="true" />
                </button>
                <p class="small-print">
                  {{
                    language(
                      'Record the weight for one dumbbell. For bodyweight exercises, leave the load at 0.',
                      'سجّل وزن دمبل واحد. في تمارين وزن الجسم اترك الوزن ٠.',
                    )
                  }}
                </p>
              </div>
            </section>
          </div>
          <div class="finish-section">
            <div>
              <h2>{{ language('Ready to wrap up?', 'جاهز لإنهاء الحصة؟') }}</h2>
              <p>
                {{
                  language(
                    'Finish when you are done. Unrecorded sets stay uncompleted.',
                    'أنهِ الحصة عند الانتهاء. تبقى المجموعات غير المسجلة غير مكتملة.',
                  )
                }}
              </p>
            </div>
            <button
              class="button"
              :disabled="working || doneCount === 0 || row.conflict || hasInvalid"
              @click="finish"
            >
              {{ correcting ? language('Save correction', 'حفظ التصحيح') : t('finish')
              }}<PhCheckCircle :size="20" aria-hidden="true" />
            </button>
          </div>
          <div v-if="finishConfirm" class="notice">
            <p>
              {{
                language(
                  `Finish with ${total - doneCount} unrecorded sets?`,
                  `إنهاء الحصة مع ${total - doneCount} مجموعات غير مسجلة؟`,
                )
              }}
            </p>
            <div class="actions">
              <button class="button small" @click="finish">
                {{ language('Finish with recorded sets', 'إنهاء بالمجموعات المسجلة') }}</button
              ><button class="button small secondary" @click="finishConfirm = false">
                {{ language('Keep training', 'متابعة التمرين') }}
              </button>
            </div>
          </div></template
        >
        <section v-else class="completion-layout">
          <div class="completion-main">
            <div class="completion-icon">
              <PhCheckCircle :size="44" weight="light" aria-hidden="true" />
            </div>
            <h2>
              {{ language('You showed up. Here’s what you did.', 'أنجزت حصتك. إليك ما سجّلته.') }}
            </h2>
            <div class="result-facts">
              <div>
                <strong>{{ doneCount }}</strong
                ><span>{{ language('sets recorded', 'مجموعات مسجلة') }}</span>
              </div>
              <div>
                <strong>{{
                  session.prescription.exercises.filter((x) =>
                    session!.entries.some((e) => e.exercise_key === x.key && e.completed),
                  ).length
                }}</strong
                ><span>{{ t('exercises') }}</span>
              </div>
            </div>
            <button class="text-link" @click="correctSets">
              {{ language('Correct recorded sets', 'تصحيح المجموعات المسجلة') }}
            </button>
            <div class="summary-exercises">
              <div v-for="ex in session.prescription.exercises" :key="ex.key">
                <span>{{
                  locale === 'ar'
                    ? sample.exercises.find((e) => e.id === ex.exerciseId)?.name_ar
                    : sample.exercises.find((e) => e.id === ex.exerciseId)?.name
                }}</span
                ><strong
                  >{{
                    session.entries.filter((e) => e.exercise_key === ex.key && e.completed).length
                  }}
                  / {{ ex.sets }}</strong
                >
              </div>
            </div>
            <RouterLink :to="user ? '/today' : '/routine'" class="button secondary"
              >{{ language('Back to training', 'العودة إلى التدريب')
              }}<PhArrowRight :size="19" class="directional" aria-hidden="true"
            /></RouterLink>
          </div>
          <aside class="completion-aside">
            <div class="panel">
              <label for="session-note"
                ><h3>
                  {{
                    row.owner === 'guest'
                      ? language('A note for next time', 'ملاحظة للمرة القادمة')
                      : t('note')
                  }}
                </h3>
                <span class="subtle">{{ t('optional') }}</span></label
              ><textarea
                id="session-note"
                :value="noteDraft ?? session.note"
                maxlength="2000"
                rows="4"
                :placeholder="
                  language(
                    'What felt good? Anything to adjust?',
                    'ما الذي كان جيداً؟ هل هناك ما يحتاج إلى تعديل؟',
                  )
                "
                @input="updateNote"
              ></textarea
              ><small>{{ status }}</small>
            </div>
            <div v-if="session.coach_note" class="panel feedback-panel">
              <h3>{{ t('feedback') }}</h3>
              <p>{{ session.coach_note }}</p>
            </div>
            <div v-if="row.owner === 'guest'" class="panel tinted">
              <h3>{{ language('Keep this session with you.', 'احتفظ بهذه الحصة.') }}</h3>
              <p>
                {{
                  language(
                    'Save to an account for a backed-up history. Your workout stays here while you sign in.',
                    'احفظها بحساب للاحتفاظ بسجلك. سيبقى تمرينك هنا أثناء تسجيل الدخول.',
                  )
                }}
              </p>
              <button class="button full" :disabled="working" @click="saveAccount">
                {{ language('Save to my account', 'حفظ في حسابي') }}
              </button>
            </div>
          </aside>
        </section>
      </template></PageState
    >
  </div>
</template>
