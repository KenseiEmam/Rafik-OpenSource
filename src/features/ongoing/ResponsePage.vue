<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { user } from '../../app/auth'
import { rows, rpc } from '../../lib/backend'
import { language as l, errorMessage, dateLabel, t } from '../../lib/i18n'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import type { Relationship } from '../../lib/domain'
import type { CoachingRequest } from './types'
import PageState from '../../components/PageState.vue'
const route = useRoute(),
  coach = route.path.startsWith('/coach'),
  id = String(route.params.id),
  base = coach ? '/coach/checkins' : '/checkins'
const key = `response:${user.value!.id}:${id}`
const q = ref<CoachingRequest>(),
  rel = ref<Relationship>(),
  history = ref<CoachingRequest[]>([]),
  answers = ref<CoachingRequest['answers']>({}),
  revision = ref(0),
  feedback = ref('')
const loading = ref(true),
  busy = ref(false),
  error = ref(''),
  notice = ref(''),
  restored = ref(false),
  confirmCancel = ref(false)
let ready = false
const editable = computed(() => !coach && rel.value?.state === 'active' && !q.value?.cancelled)
async function load(restore = true) {
  loading.value = true
  error.value = ''
  ready = false
  try {
    const data = (await rows<CoachingRequest>('coaching_requests', 'id', id))[0]
    if (!data) throw Error('forbidden')
    q.value = data
    rel.value = (await rows<Relationship>('coach_clients', 'id', data.relationship_id))[0]
    if ((coach ? rel.value?.coach_id : rel.value?.client_id) !== user.value!.id)
      throw Error('forbidden')
    answers.value = { ...data.answers }
    revision.value = data.revision
    feedback.value = data.feedback
    const saved =
      restore && !coach
        ? await getDraft<{ answers: CoachingRequest['answers']; revision: number }>(key)
        : null
    if (saved) {
      answers.value = saved.answers
      revision.value = saved.revision
      restored.value = true
    }
    history.value = (
      await rows<CoachingRequest>('coaching_requests', 'relationship_id', data.relationship_id)
    )
      .filter(
        (x) =>
          x.id !== id &&
          x.form_id === data.form_id &&
          x.form_revision === data.form_revision &&
          x.submitted_at,
      )
      .sort((a, b) => b.due_date.localeCompare(a.due_date))
    ready = true
  } catch (e) {
    q.value = undefined
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
watch(
  answers,
  () => {
    if (ready && !coach)
      void storeDraft(key, { answers: answers.value, revision: revision.value }).catch(
        () =>
          (error.value = l(
            'Could not save the device draft. Keep this page open and retry.',
            'تعذر حفظ مسودة الجهاز. أبقِ الصفحة مفتوحة وأعد المحاولة.',
          )),
      )
  },
  { deep: true },
)
function numberAnswer(key: string, event: Event) {
  const v = (event.target as HTMLInputElement).value
  answers.value[key] = v === '' ? null : Number(v)
}
async function save(submit: boolean) {
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    const result = await rpc<CoachingRequest>('save_coaching_response', {
      p_id: id,
      p_answers: answers.value,
      p_revision: revision.value,
      p_submit: submit,
    })
    ready = false
    q.value = result
    revision.value = result.revision
    answers.value = { ...result.answers }
    await removeDraft(key)
    restored.value = false
    ready = true
    notice.value = submit
      ? l(
          'Response submitted. Your coach can review it now.',
          'أُرسلت الإجابة. يمكن لمدربك مراجعتها الآن.',
        )
      : result.submitted_at
        ? l(
            'Correction saved. Your coach will review the updated response.',
            'حُفظ التصحيح. سيراجع مدربك الإجابة المحدثة.',
          )
        : l('Draft saved. Submit when you are ready.', 'حُفظت المسودة. أرسلها عندما تكون جاهزاً.')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function review() {
  busy.value = true
  error.value = ''
  try {
    q.value = await rpc<CoachingRequest>('review_coaching_response', {
      p_id: id,
      p_revision: q.value!.revision,
      p_feedback: feedback.value,
    })
    notice.value = l(
      'Review saved and shared with your client.',
      'حُفظت المراجعة ومشاركتها مع المتدرب.',
    )
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function cancel() {
  busy.value = true
  error.value = ''
  try {
    await rpc('cancel_coaching_request', { p_id: id, p_revision: q.value!.revision })
    confirmCancel.value = false
    await load(false)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function discard() {
  await removeDraft(key)
  restored.value = false
  await load(false)
}
const display = (v: unknown) =>
  v === true
    ? l('Yes', 'نعم')
    : v === false
      ? l('No', 'لا')
      : v === null || v === undefined || v === ''
        ? '—'
        : String(v)
onMounted(() => load())
</script>
<template>
  <div class="container page narrow-page">
    <RouterLink class="back-link" :to="base"
      >← {{ l('Check-ins & assessments', 'المتابعات والتقييمات') }}</RouterLink
    >
    <PageState :loading="loading" :error="!q ? error : ''" @retry="load()"
      ><template v-if="q">
        <header class="page-heading">
          <p class="overline">
            {{ q.kind === 'assessment' ? l('Assessment', 'تقييم') : l('Check-in', 'متابعة') }} ·
            {{ l('Due', 'الموعد') }} {{ dateLabel(q.due_date) }}
          </p>
          <h1>{{ q.title }}</h1>
          <p>
            {{
              q.cancelled
                ? l('This request was cancelled.', 'أُلغي هذا الطلب.')
                : q.submitted_at
                  ? l('Submitted', 'أُرسل') + ' ' + dateLabel(q.submitted_at)
                  : l('A few useful details for your next step.', 'تفاصيل مفيدة لخطوتك التالية.')
            }}
          </p>
        </header>
        <p v-if="restored" class="notice">
          {{ l('Your device draft is restored.', 'استُعيدت مسودة جهازك.') }}
        </p>
        <p v-if="error" class="notice error" role="alert">
          {{ error }}
          <button class="text-link" @click="discard">
            {{ l('Discard local edits & load latest', 'تجاهل التعديلات المحلية وتحميل الأحدث') }}
          </button>
        </p>
        <p v-if="notice" class="notice success" role="status">{{ notice }}</p>
        <div v-if="q.reviewed_at" class="coach-feedback">
          <span class="overline">{{ l('Coach’s feedback', 'ملاحظات المدرب') }}</span>
          <p>{{ q.feedback || l('Reviewed by your coach.', 'راجعها مدربك.') }}</p>
          <small>{{ dateLabel(q.reviewed_at) }}</small>
        </div>
        <p v-if="!editable && !coach && !q.cancelled" class="notice">
          {{
            l(
              'This coaching relationship is archived. Your history remains available.',
              'علاقة التدريب مؤرشفة. يبقى سجلك متاحاً.',
            )
          }}
        </p>
        <form v-if="!coach" class="form-stack" @submit.prevent="save(true)">
          <fieldset class="panel form-stack" :disabled="!editable || busy">
            <legend>{{ l('Your response', 'إجابتك') }}</legend>
            <label v-for="f in q.fields" :key="f.id"
              >{{ f.label }} <span v-if="f.unit">({{ f.unit }})</span
              ><small v-if="!f.required"> {{ l('Optional', 'اختياري') }}</small>
              <textarea
                v-if="f.type === 'text'"
                :value="String(answers[f.id] ?? '')"
                @input="answers[f.id] = ($event.target as HTMLTextAreaElement).value"
                :required="f.required"
                maxlength="2000"
                rows="3"
              ></textarea>
              <input
                v-else-if="f.type === 'number'"
                :value="typeof answers[f.id] === 'number' ? (answers[f.id] as number) : ''"
                @input="numberAnswer(f.id, $event)"
                type="number"
                step="any"
                :min="f.min"
                :max="f.max"
                :required="f.required"
              />
              <select v-else v-model="answers[f.id]" :required="f.required">
                <option :value="undefined">{{ l('Choose an answer', 'اختر إجابة') }}</option>
                <option :value="true">{{ l('Yes', 'نعم') }}</option>
                <option :value="false">{{ l('No', 'لا') }}</option>
              </select></label
            >
          </fieldset>
          <div v-if="editable" class="actions">
            <button class="button" :disabled="busy">
              {{
                q.submitted_at
                  ? l('Save correction', 'حفظ التصحيح')
                  : l('Submit response', 'إرسال الإجابة')
              }}</button
            ><button
              v-if="!q.submitted_at"
              type="button"
              class="button secondary"
              :disabled="busy"
              @click="save(false)"
            >
              {{ l('Save draft', 'حفظ المسودة') }}
            </button>
          </div>
          <p v-if="q.submitted_at && editable" class="subtle">
            {{
              l(
                'Corrections preserve your submission date and ask your coach to review again.',
                'تحافظ التصحيحات على تاريخ الإرسال وتطلب مراجعة جديدة من مدربك.',
              )
            }}
          </p>
        </form>
        <template v-else
          ><section v-if="q.submitted_at" class="panel form-stack">
            <div v-for="f in q.fields" :key="f.id" class="answer-row">
              <h2>{{ f.label }}</h2>
              <p>{{ display(q.answers[f.id]) }} {{ f.unit }}</p>
            </div>
          </section>
          <p v-else class="notice">
            {{
              q.cancelled
                ? l('No response is expected.', 'لا توجد إجابة منتظرة.')
                : l('Waiting for your client to submit.', 'بانتظار إرسال المتدرب.')
            }}
          </p>
          <form v-if="q.submitted_at" class="panel form-stack review-form" @submit.prevent="review">
            <label
              >{{ l('Feedback for your client', 'ملاحظات للمتدرب')
              }}<textarea v-model="feedback" rows="4" maxlength="2000"></textarea></label
            ><button class="button" :disabled="busy">{{ l('Save review', 'حفظ المراجعة') }}</button>
          </form>
          <div v-if="!q.submitted_at && !q.cancelled" class="actions">
            <button v-if="!confirmCancel" class="text-link" @click="confirmCancel = true">
              {{ l('Cancel this occurrence', 'إلغاء هذا الموعد') }}</button
            ><template v-else
              ><span>{{ l('Cancel this request?', 'إلغاء هذا الطلب؟') }}</span
              ><button class="button small secondary" :disabled="busy" @click="cancel">
                {{ l('Confirm cancellation', 'تأكيد الإلغاء') }}</button
              ><button class="text-link" @click="confirmCancel = false">
                {{ t('cancel') }}
              </button></template
            >
          </div></template
        >
        <RouterLink
          class="button secondary conversation-context"
          :to="(coach ? '/coach/messages/' : '/messages/') + q.relationship_id + '?request=' + q.id"
          >{{ l('Discuss this response', 'مناقشة هذه الإجابة') }}</RouterLink
        >
        <section v-if="history.length" class="comparison-section">
          <h2>{{ l('Earlier responses to these questions', 'إجابات سابقة على هذه الأسئلة') }}</h2>
          <p>
            {{
              l(
                'Only this template revision is compared. Different questions or units stay separate.',
                'تُقارن نسخة القالب هذه فقط. تبقى الأسئلة أو الوحدات المختلفة منفصلة.',
              )
            }}
          </p>
          <article v-for="h in history" :key="h.id" class="panel comparison-entry">
            <RouterLink :to="base + '/' + h.id">{{ dateLabel(h.due_date) }}</RouterLink>
            <dl>
              <template v-for="f in q.fields.filter((x) => x.type === 'number')" :key="f.id"
                ><dt>{{ f.label }}</dt>
                <dd>{{ display(h.answers[f.id]) }} {{ f.unit }}</dd></template
              >
            </dl>
          </article>
        </section>
      </template></PageState
    >
  </div>
</template>
