<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { user } from '../../app/auth'
import { rows, rpc } from '../../lib/backend'
import { language as l, errorMessage, t } from '../../lib/i18n'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import PageState from '../../components/PageState.vue'
import type { CoachingForm, Field } from './types'
const route = useRoute(),
  router = useRouter(),
  isNew = route.params.id === 'new'
const key = `form:${user.value!.id}:${route.params.id}`
const form = ref<CoachingForm>({
  id: crypto.randomUUID(),
  coach_id: user.value!.id,
  title: '',
  kind: 'checkin',
  revision: 0,
  fields: [],
})
const loading = ref(true),
  busy = ref(false),
  error = ref(''),
  notice = ref(''),
  restored = ref(false)
let ready = false
function add() {
  form.value.fields.push({ id: crypto.randomUUID(), label: '', type: 'text', required: true })
}
function starter(kind: 'checkin' | 'assessment') {
  form.value.kind = kind
  form.value.title =
    kind === 'checkin'
      ? l('Weekly reflection', 'مراجعة الأسبوع')
      : l('Timed hold assessment', 'تقييم الثبات بالوقت')
  form.value.fields =
    kind === 'checkin'
      ? [
          {
            id: crypto.randomUUID(),
            label: l('How did training feel this week?', 'كيف كان التدريب هذا الأسبوع؟'),
            type: 'text',
            required: true,
          },
          {
            id: crypto.randomUUID(),
            label: l('Energy, from 1 (low) to 5 (high)', 'الطاقة من ١ (منخفضة) إلى ٥ (مرتفعة)'),
            type: 'number',
            required: true,
            min: 1,
            max: 5,
            unit: '',
          },
          {
            id: crypto.randomUUID(),
            label: l('Anything you would like to adjust?', 'هل ترغب بتعديل شيء؟'),
            type: 'text',
            required: false,
          },
        ]
      : [
          {
            id: crypto.randomUUID(),
            label: l('Hold duration', 'مدة الثبات'),
            type: 'number',
            required: true,
            min: 0,
            max: 3600,
            unit: 's',
          },
          {
            id: crypto.randomUUID(),
            label: l('Conditions and notes', 'الظروف والملاحظات'),
            type: 'text',
            required: false,
          },
        ]
}
async function load() {
  loading.value = true
  error.value = ''
  ready = false
  try {
    if (!isNew) {
      const f = (await rows<CoachingForm>('coaching_forms', 'id', String(route.params.id)))[0]
      if (!f) throw Error('forbidden')
      form.value = f
    } else if (!form.value.fields.length) starter('checkin')
    const d = await getDraft<CoachingForm>(key)
    if (d) {
      form.value = d
      restored.value = true
    }
    ready = true
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
watch(
  form,
  () => {
    if (ready)
      void storeDraft(key, form.value).catch(
        () =>
          (error.value = l(
            'Device draft unavailable. Save before leaving.',
            'تعذر حفظ المسودة على الجهاز. احفظ قبل المغادرة.',
          )),
      )
  },
  { deep: true },
)
async function save() {
  busy.value = true
  error.value = ''
  try {
    const fields = form.value.fields.map((f) => ({
      id: f.id,
      label: f.label.trim(),
      type: f.type,
      required: f.required,
      ...(f.type === 'number'
        ? {
            unit: f.unit || '',
            ...(typeof f.min === 'number' ? { min: f.min } : {}),
            ...(typeof f.max === 'number' ? { max: f.max } : {}),
          }
        : {}),
    }))
    const result = await rpc<CoachingForm>('save_coaching_form', {
      p_id: form.value.id,
      p_title: form.value.title,
      p_kind: form.value.kind,
      p_fields: fields,
      p_revision: form.value.revision,
    })
    ready = false
    form.value = result
    await removeDraft(key)
    restored.value = false
    ready = true
    notice.value = l(
      'Template saved. Existing assignments keep their original questions.',
      'حُفظ القالب. تحتفظ التكليفات الحالية بأسئلتها الأصلية.',
    )
    if (isNew) await router.replace('/coach/forms/' + result.id)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function discard() {
  await removeDraft(key)
  restored.value = false
  await load()
}
onMounted(load)
</script>
<template>
  <div class="container page narrow-page">
    <RouterLink class="back-link" to="/coach/checkins"
      >← {{ l('Check-ins & assessments', 'المتابعات والتقييمات') }}</RouterLink
    >
    <header class="page-heading">
      <p class="overline">
        {{ l('Reusable coaching tools', 'أدوات تدريب قابلة لإعادة الاستخدام') }}
      </p>
      <h1>{{ isNew ? l('Create a template', 'إنشاء قالب') : form.title }}</h1>
      <p>
        {{
          l(
            'Ask only what will help you coach. Athletes receive a short, focused form.',
            'اسأل فقط عما يفيد التدريب. يحصل المتدرب على نموذج قصير وواضح.',
          )
        }}
      </p>
    </header>
    <PageState :loading="loading" :error="!form.fields.length ? error : ''" @retry="load">
      <p v-if="restored" class="notice">
        {{ l('Device draft restored.', 'استُعيدت مسودة الجهاز.') }}
        <button class="text-link" @click="discard">
          {{ l('Discard draft', 'تجاهل المسودة') }}
        </button>
      </p>
      <p v-if="notice" class="notice success" role="status">{{ notice }}</p>
      <form class="form-stack" @submit.prevent="save">
        <div class="panel form-stack">
          <label
            >{{ l('Template title', 'عنوان القالب')
            }}<input v-model="form.title" required maxlength="100"
          /></label>
          <label
            >{{ l('Purpose', 'الغرض')
            }}<select v-model="form.kind">
              <option value="checkin">{{ l('Check-in', 'متابعة') }}</option>
              <option value="assessment">{{ l('Assessment', 'تقييم') }}</option>
            </select></label
          >
          <div v-if="isNew" class="actions">
            <button type="button" class="text-link" @click="starter('checkin')">
              {{ l('Use reflection starter', 'استخدام قالب المتابعة') }}</button
            ><button type="button" class="text-link" @click="starter('assessment')">
              {{ l('Use assessment starter', 'استخدام قالب التقييم') }}
            </button>
          </div>
        </div>
        <fieldset v-for="(f, i) in form.fields" :key="f.id" class="panel question-editor">
          <legend>{{ l('Question', 'السؤال') }} {{ i + 1 }}</legend>
          <label
            >{{ l('Question text', 'نص السؤال') }}<input v-model="f.label" required maxlength="160"
          /></label>
          <div class="field-pair">
            <label
              >{{ l('Answer type', 'نوع الإجابة')
              }}<select v-model="f.type">
                <option value="text">{{ l('Written answer', 'إجابة نصية') }}</option>
                <option value="number">{{ l('Number', 'رقم') }}</option>
                <option value="boolean">{{ l('Yes or no', 'نعم أو لا') }}</option>
              </select></label
            ><label class="check-label"
              ><input type="checkbox" v-model="f.required" />{{ l('Required', 'مطلوب') }}</label
            >
          </div>
          <div v-if="f.type === 'number'" class="number-options">
            <label
              >{{ l('Unit (optional)', 'الوحدة (اختياري)')
              }}<input v-model="f.unit" maxlength="24" placeholder="kg, s, cm…" /></label
            ><label
              >{{ l('Minimum', 'الحد الأدنى')
              }}<input v-model.number="f.min" type="number" step="any" /></label
            ><label
              >{{ l('Maximum', 'الحد الأعلى')
              }}<input v-model.number="f.max" type="number" step="any" :min="f.min"
            /></label>
          </div>
          <div class="actions">
            <button
              type="button"
              class="text-link"
              :disabled="i === 0"
              @click="form.fields.splice(i - 1, 0, ...form.fields.splice(i, 1))"
            >
              {{ l('Move up', 'نقل لأعلى') }}</button
            ><button
              type="button"
              class="text-link"
              :disabled="form.fields.length === 1"
              @click="form.fields.splice(i, 1)"
            >
              {{ l('Remove question', 'حذف السؤال') }}
            </button>
          </div>
        </fieldset>
        <button
          type="button"
          class="button secondary"
          :disabled="form.fields.length >= 10"
          @click="add"
        >
          {{ l('Add question', 'إضافة سؤال') }}
        </button>
        <p v-if="error" class="notice error" role="alert">{{ error }}</p>
        <button class="button" :disabled="busy">
          {{ busy ? t('saving') : l('Save template', 'حفظ القالب') }}
        </button>
      </form></PageState
    >
  </div>
</template>
