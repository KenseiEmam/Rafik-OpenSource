<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { user } from '../../app/auth'
import { request } from '../../lib/backend'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { language as l, errorMessage } from '../../lib/i18n'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import MemberPicker from './MemberPicker.vue'
import ListPagination from '../../components/ListPagination.vue'
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
  offset = ref(0),
  total = ref(0),
  search = ref(''),
  archived = ref(false),
  editing = ref(false),
  draftReady = ref(false),
  draftError = ref(''),
  saved = ref(false)
const fresh = () => ({
  id: crypto.randomUUID() as string,
  name: '',
  title: '',
  revision: 0,
  archived: false,
  members: [] as string[],
  coaches: [] as string[],
  definition: [{ key: crypto.randomUUID(), name: '', kind: 'number', unit: '', min: 0 } as Drill],
})
const draft = ref(fresh())
let generation = 0,
  disposed = false
onUnmounted(() => {
  disposed = true
  generation++
})
async function load(page = 0) {
  if (disposed) return
  const current = ++generation
  loading.value = true
  error.value = ''
  try {
    const [result, people] = await Promise.all([
      request<{
        items: (TrainingGroup & AssessmentTemplate)[]
        next: number | null
        total: number
      }>(
        `/v1/workspaces/${id}/services?view=${view}&kind=${kind}&search=${encodeURIComponent(search.value)}&archived=${archived.value}&limit=10&offset=${page}`,
      ),
      request<Organization>(`/v1/workspaces/${id}?view=${view}&summary=true`),
    ])
    if (disposed || current !== generation) return
    items.value = result.items
    offset.value = page
    total.value = result.total
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
    if (templates && route.query.forEvent && typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(`rafik-templates:${user.value!.id}:${id}`)
      channel.postMessage({ event: String(route.query.forEvent), template: draft.value.id })
      channel.close()
    }
    editing.value = false
    await removeDraft(key)
    draft.value = fresh()
    await load()
  },
  (_, args) =>
    request(`/v1/workspaces/${id}/services`, { method: 'POST', body: JSON.stringify(args) }),
  {
    successMessage: (_, args) =>
      args.action === 'template'
        ? l('Assessment template saved.', 'تم حفظ قالب التقييم.')
        : l('Training group saved.', 'تم حفظ المجموعة التدريبية.'),
  },
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
        members: item.members?.filter((m) => m.roles.includes('trainee')).map((m) => m.id) || [],
        coaches: item.members?.filter((m) => m.roles.includes('trainer')).map((m) => m.id) || [],
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
    members: [...new Set([...draft.value.members, ...draft.value.coaches])],
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
    draft.value = { ...fresh(), ...stored, coaches: stored.coaches || [] }
    editing.value = true
  }
  if (!stored && route.query.create === '1') edit()
  draftReady.value = true
})
</script>
<template>
  <OrganizationNav />
  <div class="container page institution-service-page">
    <header class="work-heading">
      <div>
        <p class="overline">{{ l('Institution library', 'مكتبة المؤسسة') }}</p>
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
        <MemberPicker
          v-else
          :workspace="id"
          :view="view"
          role="trainee"
          v-model="draft.members"
          :label="l('Find trainees', 'البحث عن متدربين')"
          @options="organization!.members = $event"
        />
        <MemberPicker
          v-if="!templates && view === 'admin'"
          :workspace="id"
          :view="view"
          role="trainer"
          v-model="draft.coaches"
          :label="l('Add coaches to this group', 'إضافة مدربين إلى هذه المجموعة')"
          @options="
            organization!.members = [
              ...new Map([...organization!.members, ...$event].map((m) => [m.id, m])).values(),
            ]
          "
        />
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
    <div class="list-controls">
      <h2 class="list-section-label">
        {{ templates ? l('Templates', 'القوالب') : l('Groups', 'المجموعات') }}
      </h2>
      <ListPagination
        :offset="offset"
        :page-size="10"
        :total="total"
        :disabled="loading"
        @page="load"
      />
    </div>
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
            {{ templates ? l('drills', 'اختبارات') : l('people', 'أشخاص') }}
          </p>
          <p v-if="!templates" class="small-print">
            {{
              item.members
                .slice(0, 4)
                .map((m) => m.name)
                .join(' · ')
            }}
          </p>
          <RouterLink
            v-if="!templates && !item.archived && item.members.some((m) => m.active)"
            class="text-link"
            :to="base + '/messages?group=' + encodeURIComponent(item.id)"
          >
            {{ l('Open group conversation', 'فتح محادثة المجموعة') }}
          </RouterLink>
        </div>
        <button class="button secondary small" @click="edit(item)" :disabled="locked">
          {{ l('Edit', 'تعديل') }}
        </button>
      </article>
      <RouterLink :to="base + '/calendar/new'" class="text-link"
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
