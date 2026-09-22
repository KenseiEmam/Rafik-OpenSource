<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { user } from '../../app/auth'
import { rpc, rows } from '../../lib/backend'
import { clone, type Exercise } from '../../lib/domain'
import { language, locale, errorMessage, t } from '../../lib/i18n'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import PageState from '../../components/PageState.vue'
const exercises = ref<Exercise[]>([]),
  search = ref(''),
  equipment = ref(''),
  movement = ref(''),
  scope = ref('active')
const loading = ref(true),
  busy = ref(false),
  error = ref(''),
  message = ref(''),
  editing = ref<Exercise>(),
  restored = ref(false)
const key = `exercise-draft:${user.value!.id}`
const visible = computed(() =>
  exercises.value.filter(
    (e) =>
      (scope.value === 'archived' ? e.active === false : e.active !== false) &&
      (scope.value !== 'mine' || e.owner_id === user.value!.id) &&
      (!equipment.value || e.equipment === equipment.value) &&
      (!movement.value || e.movement === movement.value) &&
      `${e.name} ${e.name_ar} ${e.equipment} ${e.movement}`
        .toLowerCase()
        .includes(search.value.toLowerCase()),
  ),
)
const equipmentOptions = computed(() =>
  [...new Set(exercises.value.map((e) => e.equipment).filter(Boolean))].sort(),
)
const movementOptions = computed(() =>
  [...new Set(exercises.value.map((e) => e.movement).filter(Boolean))].sort(),
)
async function load() {
  loading.value = true
  error.value = ''
  try {
    exercises.value = await rows<Exercise>('exercises')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
function create() {
  editing.value = {
    id: 'custom-' + crypto.randomUUID(),
    name: '',
    name_ar: '',
    equipment: '',
    equipment_ar: '',
    instructions: '',
    instructions_ar: '',
    movement: '',
    kind: 'strength',
    media_url: '',
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
async function save() {
  if (!editing.value) return
  busy.value = true
  error.value = ''
  try {
    const e = editing.value
    const data = {
      name: e.name.trim(),
      name_ar: e.name_ar.trim() || e.name.trim(),
      equipment: e.equipment.trim(),
      equipment_ar: e.equipment_ar.trim() || e.equipment.trim(),
      instructions: e.instructions.trim(),
      instructions_ar: e.instructions_ar.trim() || e.instructions.trim(),
      movement: e.movement.trim(),
      kind: e.kind || 'strength',
      media_url: e.media_url?.trim() || '',
    }
    await rpc('save_exercise', { p_id: e.id, p_data: data, p_revision: e.revision || 0 })
    await close()
    await load()
    message.value = language('Exercise saved to your library.', 'حُفظ التمرين في مكتبتك.')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function archive(e: Exercise) {
  busy.value = true
  error.value = ''
  try {
    await rpc('set_exercise_active', { p_id: e.id, p_active: e.active === false })
    await load()
    message.value = language(
      'Library updated. Published plans and training history keep their original instructions.',
      'تم تحديث المكتبة. تحتفظ الخطط المنشورة والسجلات بالتعليمات الأصلية.',
    )
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
onMounted(async () => {
  await load()
  const draft = await getDraft<Exercise>(key)
  if (draft) {
    editing.value = draft
    restored.value = true
  }
})
</script>
<template>
  <div class="container page">
    <header class="page-heading heading-actions">
      <div>
        <p class="overline">{{ language('Your coaching toolkit', 'أدواتك التدريبية') }}</p>
        <h1>{{ language('A library you can make your own.', 'مكتبة تناسب أسلوبك.') }}</h1>
        <p>
          {{
            language(
              'Find a movement, refine your instructions, or add something new.',
              'ابحث عن حركة، حسّن تعليماتك أو أضف تمريناً جديداً.',
            )
          }}
        </p>
      </div>
      <button class="button" v-if="!editing" @click="create">
        {{ language('Create exercise', 'إنشاء تمرين') }}
      </button>
    </header>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="message" class="notice success" role="status">{{ message }}</p>
    <section v-if="editing" class="panel exercise-editor">
      <form class="context-form" @submit.prevent="save">
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
              }}<input v-model="editing.name" required maxlength="120" /></label
            ><label
              >{{ language('Recording type', 'نوع التسجيل')
              }}<select v-model="editing.kind">
                <option value="strength">{{ language('Reps and load', 'تكرارات ووزن') }}</option>
                <option value="timed">{{ language('Time', 'زمن') }}</option>
                <option value="distance">{{ language('Distance', 'مسافة') }}</option>
              </select></label
            ><label
              >{{ language('Equipment', 'المعدات')
              }}<input v-model="editing.equipment" maxlength="120" /></label
            ><label
              >{{ language('Movement category', 'فئة الحركة')
              }}<input v-model="editing.movement" maxlength="80"
            /></label>
          </div>
          <label
            >{{ language('Instructions', 'التعليمات')
            }}<textarea v-model="editing.instructions" required rows="4" maxlength="2000" /></label
          ><label
            >{{ language('Demonstration link (optional, HTTPS)', 'رابط الشرح (اختياري، HTTPS)')
            }}<input v-model="editing.media_url" type="url" pattern="https://.*" maxlength="1000"
          /></label>
          <details>
            <summary>
              {{ language('Arabic translation (optional)', 'الترجمة العربية (اختيارية)') }}
            </summary>
            <div class="context-form">
              <label
                >{{ language('Arabic name', 'الاسم بالعربية')
                }}<input v-model="editing.name_ar" maxlength="120" dir="rtl" /></label
              ><label
                >{{ language('Arabic equipment', 'المعدات بالعربية')
                }}<input v-model="editing.equipment_ar" maxlength="120" dir="rtl" /></label
              ><label
                >{{ language('Arabic instructions', 'التعليمات بالعربية')
                }}<textarea v-model="editing.instructions_ar" maxlength="2000" rows="3" dir="rtl" />
              </label>
            </div>
          </details>
          <button class="button" :disabled="busy">
            {{ language('Save exercise', 'حفظ التمرين') }}
          </button>
        </fieldset>
      </form>
    </section>
    <PageState :loading="loading" @retry="load"
      ><div class="library-tools">
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
            <option v-for="e in equipmentOptions" :key="e">{{ e }}</option>
          </select></label
        ><label
          >{{ language('Movement', 'الحركة')
          }}<select v-model="movement">
            <option value="">{{ language('All movements', 'كل الحركات') }}</option>
            <option v-for="m in movementOptions" :key="m">{{ m }}</option>
          </select></label
        >
      </div>
      <p v-if="!visible.length" class="empty-review">
        {{
          language(
            'No matching exercises. Change the filters or create your own.',
            'لا توجد تمارين مطابقة. غيّر المرشحات أو أنشئ تمرينك.',
          )
        }}
      </p>
      <div class="exercise-library">
        <article v-for="e in visible" :key="e.id" class="library-row">
          <div>
            <span class="overline"
              >{{
                e.owner_id
                  ? language('Your exercise', 'تمرينك')
                  : language('Rafik library', 'مكتبة رفيق')
              }}
              ·
              {{
                e.kind === 'timed'
                  ? language('Time', 'زمن')
                  : e.kind === 'distance'
                    ? language('Distance', 'مسافة')
                    : language('Strength', 'قوة')
              }}</span
            >
            <h2>{{ locale === 'ar' ? e.name_ar || e.name : e.name }}</h2>
            <p class="subtle">
              {{ locale === 'ar' ? e.equipment_ar || e.equipment : e.equipment }} · {{ e.movement }}
            </p>
            <details>
              <summary>{{ t('instruction') }}</summary>
              <p class="preserve-lines">
                {{ locale === 'ar' ? e.instructions_ar || e.instructions : e.instructions }}
              </p>
              <a
                v-if="e.media_url"
                :href="e.media_url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-link"
                >{{ language('Open demonstration', 'فتح الشرح') }} ↗</a
              >
            </details>
          </div>
          <div v-if="e.owner_id === user?.id" class="actions">
            <button class="text-link" :disabled="busy || !!editing" @click="edit(e)">
              {{ language('Edit', 'تعديل') }}</button
            ><button class="text-link" :disabled="busy || !!editing" @click="archive(e)">
              {{
                e.active === false ? language('Restore', 'استعادة') : language('Archive', 'أرشفة')
              }}
            </button>
          </div>
        </article>
      </div>
    </PageState>
  </div>
</template>
