<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { user } from '../../app/auth'
import { request } from '../../lib/backend'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { language as l, errorMessage } from '../../lib/i18n'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import PageState from '../../components/PageState.vue'
import OrganizationNav from './OrganizationNav.vue'
import type { Organization } from './types'
import type { Drill, TrainingGroup, AssessmentTemplate } from './service-types'
const route = useRoute(),
  id = String(route.params.workspace),
  view = String(route.params.view),
  base = `/organization/${id}/${view}`,
  templates = route.path.endsWith('/assessment-templates'),
  kind = templates ? 'templates' : 'groups',
  key = `service-catalog:${user.value!.id}:${id}:${view}:${kind}`
const items = ref<(TrainingGroup & AssessmentTemplate)[]>([]),
  organization = ref<Organization>(),
  loading = ref(true),
  error = ref(''),
  next = ref<number | null>(null),
  search = ref(''),
  archived = ref(false),
  editing = ref(false),
  draftReady = ref(false),
  draftError = ref(''),
  saved = ref(false),
  memberSearch = ref('')
const fresh = () => ({
  id: crypto.randomUUID() as string,
  name: '',
  title: '',
  revision: 0,
  archived: false,
  members: [] as string[],
  definition: [{ key: crypto.randomUUID(), name: '', kind: 'number', unit: '', min: 0 } as Drill],
})
const draft = ref(fresh())
const members = computed(
  () => organization.value?.members.filter((m) => m.active && m.roles.includes('trainee')) || [],
)
const unavailable = computed(() =>
  draft.value.members.filter((id) => !members.value.some((m) => m.id === id)),
)
const visibleMembers = computed(() =>
  members.value
    .filter((m) => m.name.toLowerCase().includes(memberSearch.value.toLowerCase()))
    .slice(0, 30),
)
async function load(append = false) {
  loading.value = true
  error.value = ''
  try {
    const [result, people] = await Promise.all([
      request<{ items: (TrainingGroup & AssessmentTemplate)[]; next: number | null }>(
        `/v1/workspaces/${id}/services?view=${view}&kind=${kind}&search=${encodeURIComponent(search.value)}&archived=${archived.value}&offset=${append ? next.value || 0 : 0}`,
      ),
      request<Organization>(`/v1/workspaces/${id}?view=${view}`),
    ])
    items.value = append ? [...items.value, ...result.items] : result.items
    next.value = result.next
    organization.value = people
  } catch (e) {
    error.value = errorMessage(e)
    items.value = []
  } finally {
    loading.value = false
  }
}
const command = useCommand<'save'>(
  key,
  async () => {
    editing.value = false
    await removeDraft(key)
    draft.value = fresh()
    await load()
  },
  (_, args) =>
    request(`/v1/workspaces/${id}/services`, { method: 'POST', body: JSON.stringify(args) }),
)
const locked = computed(() => command.state.busy || !!command.state.pending || !command.state.ready)
function addDrill() {
  draft.value.definition.push({ key: crypto.randomUUID(), name: '', kind: 'number', unit: '' })
}
function edit(item?: TrainingGroup & AssessmentTemplate) {
  draft.value = item
    ? {
        id: item.id,
        name: item.name || '',
        title: item.title || '',
        revision: item.revision,
        archived: item.archived,
        members: item.members?.map((m) => m.id) || [],
        definition: JSON.parse(JSON.stringify(item.definition || [])),
      }
    : fresh()
  editing.value = true
}
async function close() {
  editing.value = false
  await removeDraft(key)
  draft.value = fresh()
}
function save() {
  return command.run('save', {
    ...draft.value,
    view,
    action: templates ? 'template' : 'group',
    operation: crypto.randomUUID(),
  })
}
watch(
  draft,
  async () => {
    if (!draftReady.value || !editing.value) return
    try {
      saved.value = false
      await storeDraft(key, draft.value)
      saved.value = true
      draftError.value = ''
    } catch (e) {
      draftError.value = errorMessage(e)
    }
  },
  { deep: true },
)
onMounted(async () => {
  await load()
  const stored = await getDraft<ReturnType<typeof fresh>>(key).catch(() => undefined)
  if (stored) {
    draft.value = stored
    editing.value = true
  }
  draftReady.value = true
})
</script>
<template>
  <OrganizationNav />
  <div class="container page organization-service-page">
    <header class="work-heading">
      <div>
        <p class="overline">{{ l('Organization library', 'مكتبة المؤسسة') }}</p>
        <h1>
          {{
            templates
              ? l('Assessment templates', 'قوالب التقييم')
              : l('Training groups', 'مجموعات التدريب')
          }}
        </h1>
        <p>
          {{
            templates
              ? l(
                  'Define the drills once. Each scheduled assessment keeps its own fixed copy.',
                  'حدّد الاختبارات مرة؛ يحتفظ كل تقييم مجدول بنسخته الثابتة.',
                )
              : l(
                  'Bring people together for scheduling. Existing event rosters stay unchanged.',
                  'اجمع الأشخاص للجدولة؛ تبقى قوائم المواعيد السابقة كما هي.',
                )
          }}
        </p>
      </div>
      <button class="button" @click="edit()" :disabled="locked || !organization">
        {{ templates ? l('New template', 'قالب جديد') : l('New group', 'مجموعة جديدة') }}
      </button>
    </header>
    <CommandStatus :command="command" />
    <p v-if="draftError" role="alert" class="notice error">{{ draftError }}</p>
    <form v-if="editing && organization" class="panel service-editor" @submit.prevent="save">
      <fieldset class="form-fields" :disabled="locked">
        <div class="heading-actions">
          <h2>
            {{
              draft.revision ? l('Edit details', 'تعديل التفاصيل') : l('Set it up', 'إعداد جديد')
            }}
          </h2>
          <button type="button" class="text-link" @click="close">
            {{ l('Close editor', 'إغلاق المحرر') }}
          </button>
        </div>
        <label
          >{{ l('Name', 'الاسم')
          }}<input v-if="templates" v-model="draft.title" maxlength="100" required /><input
            v-else
            v-model="draft.name"
            maxlength="100"
            required
        /></label>
        <template v-if="templates"
          ><section
            v-for="(drill, index) in draft.definition"
            :key="drill.key"
            class="assessment-drill-editor"
          >
            <div class="heading-actions">
              <h3>{{ l('Drill', 'اختبار') }} {{ index + 1 }}</h3>
              <button
                type="button"
                class="text-link"
                :disabled="draft.definition.length === 1"
                @click="draft.definition.splice(index, 1)"
              >
                {{ l('Remove drill', 'حذف الاختبار') }} {{ index + 1 }}
              </button>
            </div>
            <label
              >{{ l('Drill name', 'اسم الاختبار')
              }}<input v-model="drill.name" maxlength="100" required
            /></label>
            <div class="service-field-row">
              <label
                >{{ l('Result type', 'نوع النتيجة')
                }}<select v-model="drill.kind">
                  <option value="number">{{ l('Number', 'رقم') }}</option>
                  <option value="text">{{ l('Observation', 'ملاحظة') }}</option>
                </select></label
              ><label v-if="drill.kind === 'number'"
                >{{ l('Unit', 'الوحدة')
                }}<input
                  v-model="drill.unit"
                  maxlength="30"
                  :placeholder="l('e.g. seconds, repetitions', 'مثلاً ثوانٍ أو تكرارات')"
              /></label>
            </div>
            <details v-if="drill.kind === 'number'">
              <summary>{{ l('Optional result bounds', 'حدود اختيارية للنتيجة') }}</summary>
              <div class="service-field-row">
                <label
                  >{{ l('Minimum', 'الحد الأدنى')
                  }}<input v-model.number="drill.min" type="number" step="any" /></label
                ><label
                  >{{ l('Maximum', 'الحد الأقصى')
                  }}<input v-model.number="drill.max" type="number" step="any"
                /></label>
              </div>
            </details>
          </section>
          <button
            type="button"
            class="button secondary"
            :disabled="draft.definition.length >= 12"
            @click="addDrill"
          >
            {{ l('Add drill', 'إضافة اختبار') }}
          </button></template
        >
        <template v-else
          ><label
            >{{ l('Find trainees', 'البحث عن متدربين')
            }}<input v-model="memberSearch" type="search"
          /></label>
          <p class="small-print">
            {{ draft.members.length }}
            {{ l('selected · search to find more people', 'محدد · ابحث عن أشخاص آخرين') }}
          </p>
          <label v-for="m in visibleMembers" :key="m.id" class="check-label"
            ><input v-model="draft.members" type="checkbox" :value="m.id" />{{ m.name }}</label
          >
          <p v-for="member in unavailable" :key="member" class="notice">
            {{
              l(
                'A previously selected member is no longer eligible.',
                'أحد الأعضاء المحددين سابقاً لم يعد متاحاً.',
              )
            }}
            <button
              type="button"
              class="text-link"
              @click="draft.members = draft.members.filter((id) => id !== member)"
            >
              {{ l('Remove unavailable member', 'إزالة العضو غير المتاح') }}
            </button>
          </p>
          <p v-if="!visibleMembers.length">
            {{ l('No matching active trainees.', 'لا يوجد متدربون نشطون مطابقون.') }}
          </p></template
        >
        <label v-if="draft.revision" class="check-label"
          ><input v-model="draft.archived" type="checkbox" />{{
            l('Archive from new scheduling', 'أرشفة من الجدولة الجديدة')
          }}</label
        >
        <p class="small-print">
          {{
            l(
              saved
                ? 'Draft saved on this device.'
                : 'Changes are saved on this device as you type.',
              saved
                ? 'حُفظت المسودة على هذا الجهاز.'
                : 'تُحفظ التغييرات على هذا الجهاز أثناء الكتابة.',
            )
          }}
        </p>
        <button class="button">
          {{ templates ? l('Save template', 'حفظ القالب') : l('Save group', 'حفظ المجموعة') }}
        </button>
      </fieldset>
    </form>
    <form class="organization-toolbar" @submit.prevent="load()">
      <label
        >{{ l('Search library', 'البحث في المكتبة')
        }}<input v-model="search" type="search" /></label
      ><label class="check-label"
        ><input v-model="archived" type="checkbox" />{{ l('Archived', 'مؤرشف') }}</label
      ><button class="button secondary" :disabled="loading">{{ l('Find', 'بحث') }}</button>
    </form>
    <PageState :loading="loading" :error="error" @retry="load()"
      ><p v-if="!items.length" class="notice">
        {{
          l(
            'Nothing here yet. Create one above or adjust your search.',
            'لا يوجد شيء هنا بعد. أنشئ عنصراً أو عدّل البحث.',
          )
        }}
      </p>
      <article v-for="item in items" :key="item.id" class="service-library-row">
        <div>
          <h2>{{ templates ? item.title : item.name }}</h2>
          <p>
            {{ templates ? item.definition.length : item.members.length }}
            {{ templates ? l('drills', 'اختبارات') : l('trainees', 'متدربين') }}
          </p>
          <p v-if="!templates" class="small-print">
            {{
              item.members
                .slice(0, 4)
                .map((m) => m.name)
                .join(' · ')
            }}
          </p>
        </div>
        <button class="button secondary small" @click="edit(item)" :disabled="locked">
          {{ l('Edit', 'تعديل') }}
        </button>
      </article>
      <button v-if="next !== null" class="button secondary" @click="load(true)">
        {{ l('Load more', 'تحميل المزيد') }}</button
      ><RouterLink :to="base + '/calendar/new'" class="text-link"
        >{{ l('Schedule an event', 'جدولة موعد') }} ↗</RouterLink
      ></PageState
    >
  </div>
</template>
<style scoped>
.service-editor {
  max-width: 780px;
  margin-bottom: 28px;
}
.service-editor label {
  margin-block: 12px;
}
.service-editor h2 {
  font-size: 1.2rem;
}
.assessment-drill-editor {
  padding: 20px 0;
  border-block-end: 1px solid var(--line);
}
.assessment-drill-editor h3 {
  font-size: 1rem;
}
.service-field-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.service-library-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 22px 0;
  border-bottom: 1px solid var(--line);
  margin-bottom: 16px;
}
.service-library-row > div {
  min-width: 0;
  overflow-wrap: anywhere;
}
.service-library-row h2 {
  font-size: 1.05rem;
  margin: 0;
}
.service-library-row p {
  margin: 6px 0;
}
.service-library-row button {
  flex-shrink: 0;
}
@media (max-width: 550px) {
  .service-field-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
