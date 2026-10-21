<script setup lang="ts">
import { useListPageSize } from '../../lib/list-page-size'
import ListPagination from '../../components/ListPagination.vue'
import EmptyState from '../../components/EmptyState.vue'
import { loadEditorDraft } from '../../lib/editor-draft'
import PageHeading from '../../components/PageHeading.vue'
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { programContext } from '../coaching/program-context'
import { user, profile } from '../../app/auth'
import { request } from '../../lib/backend'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { language as l, errorMessage, dateLabel } from '../../lib/i18n'
import { localDate } from '../../lib/dates'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import MemberPicker from './MemberPicker.vue'
import OrganizationNav from './OrganizationNav.vue'
const route = useRoute(),
  router = useRouter(),
  editor = String(route.params.editor || ''),
  initialPath = route.path,
  context = programContext(route),
  key = `trainer-tasks:${user.value!.id}:${context.key}`,
  today = localDate(profile.value?.timezone || 'UTC')
const listPath = context.base + '/tasks',
  draftKey = key + ':' + (editor || 'new')
type Task = {
  id: string
  title: string
  description: string
  assigned_to: string
  trainer_name: string
  trainer_active: boolean
  priority: 'normal' | 'high'
  state: string
  due_date: string | null
  revision: number
}
type Draft = {
  id: string
  title: string
  description: string
  members: string[]
  priority: 'normal' | 'high'
  due_date: string
  revision: number
}
const items = ref<Task[]>([]),
  counts = ref({ open: 0, overdue: 0, completed: 0 }),
  next = ref<number | null>(null),
  state = ref('open'),
  search = ref(''),
  loading = ref(true),
  error = ref(''),
  draft = ref<Draft>(),
  editing = ref(false),
  draftSaved = ref(false),
  draftError = ref(''),
  ready = ref(false)
let serial = 0,
  disposed = false,
  timer: ReturnType<typeof setTimeout>,
  draftWrite = 0
const total = ref(0),
  offset = ref(0)
const { recordLimit, appliedLimit, pageSizes, acceptLimit, changeLimit } = useListPageSize(
  10,
  () => {
    void load(0)
  },
)
async function load(page = Math.max(0, Number(route.query.offset) || 0)) {
  const current = ++serial
  loading.value = true
  error.value = ''
  try {
    const result = await request<{
      items: Task[]
      next: number | null
      total: number
      counts: typeof counts.value
    }>(
      `/v1/workspaces/${context.workspace}/tasks?` +
        new URLSearchParams({
          view: context.view,
          today,
          state: state.value,
          search: search.value,
          offset: String(page),
          limit: String(recordLimit.value),
          ...(editor && editor !== 'new' ? { id: editor } : {}),
        }),
    )
    if (disposed || current !== serial) return
    items.value = result.items
    total.value = result.total
    offset.value = page
    acceptLimit()
    counts.value = result.counts
    next.value = result.next
  } catch (e) {
    if (!disposed && current === serial) error.value = errorMessage(e)
  } finally {
    if (!disposed && current === serial) loading.value = false
  }
}
const returnToList = ref(false)
const command = useCommand<'save' | 'state'>(
  key,
  async (action) => {
    if (action === 'save') {
      ready.value = false
      draft.value = undefined
      editing.value = false
      await removeDraft(draftKey)
      ready.value = true
      if (!disposed && editor && route.path === initialPath) returnToList.value = true
    }
    await load()
  },
  (_, args) =>
    request(`/v1/workspaces/${context.workspace}/tasks`, {
      method: 'POST',
      body: JSON.stringify(args),
    }),
  {
    successMessage: (action) =>
      action === 'state'
        ? l('Task status updated.', 'تم تحديث حالة المهمة.')
        : l('Task saved.', 'تم حفظ المهمة.'),
  },
)
watch(
  () => command.state.busy,
  (busy) => {
    if (
      !busy &&
      !command.state.pending &&
      returnToList.value &&
      !disposed &&
      route.path === initialPath
    )
      void router.replace(listPath)
  },
)
const locked = computed(() => command.state.busy || !!command.state.pending || !command.state.ready)
function create() {
  if (!editor) {
    void router.push(listPath + '/new')
    return
  }
  draft.value = {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    members: [],
    priority: 'normal',
    due_date: '',
    revision: 0,
  }
  editing.value = true
}
function edit(task: Task) {
  if (!editor) {
    void router.push(listPath + '/' + task.id)
    return
  }
  draft.value = {
    id: task.id,
    title: task.title,
    description: task.description,
    members: [task.assigned_to],
    priority: task.priority,
    due_date: task.due_date?.slice(0, 10) || '',
    revision: task.revision,
  }
  editing.value = true
}
async function discard() {
  await removeDraft(key)
  draft.value = undefined
  editing.value = false
  draftSaved.value = false
  if (!disposed && editor && route.path === initialPath) await router.push(listPath)
}
function save() {
  if (!draft.value) return
  return command.run('save', {
    action: 'save',
    view: context.view,
    operation: crypto.randomUUID(),
    ...draft.value,
    assigned_to: draft.value.members[0],
  })
}
function update(task: Task, value: string) {
  return command.run('state', {
    action: 'state',
    view: context.view,
    operation: crypto.randomUUID(),
    id: task.id,
    revision: task.revision,
    state: value,
  })
}
watch(
  draft,
  async () => {
    if (!ready.value || !draft.value) return
    const generation = ++draftWrite
    draftSaved.value = false
    try {
      await storeDraft(draftKey, JSON.parse(JSON.stringify(draft.value)))
      if (generation === draftWrite) {
        draftSaved.value = true
        draftError.value = ''
      }
    } catch (e) {
      draftError.value = errorMessage(e)
    }
  },
  { deep: true },
)
watch([search, state], () => {
  serial++
  loading.value = true
  clearTimeout(timer)
  timer = setTimeout(() => load(0), 180)
})
onMounted(async () => {
  await load()
  if (disposed) return
  const stored = await loadEditorDraft<Draft>(key, editor).catch(() => undefined)
  if (disposed) return
  if (stored && (!editor || (editor === 'new' ? !stored.revision : stored.id === editor)))
    draft.value = stored
  if (editor && context.view === 'admin') {
    if (draft.value) editing.value = true
    else if (editor === 'new') create()
    else if (items.value[0]) edit(items.value[0])
    else error.value ||= l('This task is unavailable.', 'هذه المهمة غير متاحة.')
  }
  draftSaved.value = !!stored
  ready.value = true
})
onUnmounted(() => {
  disposed = true
  serial++
  clearTimeout(timer)
})
</script>
<template>
  <OrganizationNav />
  <div class="container page trainer-tasks">
    <RouterLink v-if="editor" class="back-link" :to="listPath">{{
      l('Back to tasks', 'العودة إلى المهام')
    }}</RouterLink>
    <PageHeading class="page-heading heading-actions">
      <div>
        <p class="overline">{{ l('Daily work', 'العمل اليومي') }}</p>
        <h1>
          {{
            editor
              ? editor === 'new'
                ? l('Assign a task', 'تعيين مهمة')
                : l('Edit task', 'تعديل المهمة')
              : context.view === 'admin'
                ? l('Coach tasks', 'مهام المدربين')
                : l('My tasks', 'مهامي')
          }}
        </h1>
        <p>
          {{
            context.view === 'admin'
              ? l(
                  'Give each follow-up a clear owner and due date.',
                  'حدد مسؤولاً وموعداً لكل متابعة.',
                )
              : l('Tasks assigned to you by your institution.', 'المهام التي عينتها لك مؤسستك.')
          }}
        </p>
      </div>
      <button
        v-if="!editor && context.view === 'admin' && !draft"
        class="button"
        :disabled="locked"
        @click="create"
      >
        {{ l('Assign a task', 'تعيين مهمة') }}
      </button>
    </PageHeading>
    <CommandStatus :command="command" />
    <p v-if="error" class="notice error" role="alert">
      {{ error }}
      <button class="text-link" @click="load()">{{ l('Retry', 'إعادة المحاولة') }}</button>
    </p>
    <p v-if="!editor" class="task-summary">
      {{ counts.open }} {{ l('open', 'مفتوحة') }} · {{ counts.overdue }}
      {{ l('overdue', 'متأخرة') }} · {{ counts.completed }} {{ l('completed', 'مكتملة') }}
    </p>
    <div v-if="draft && !editing && context.view === 'admin'" class="notice">
      <span>{{
        l('Unfinished task saved on this device.', 'مهمة غير مكتملة محفوظة على الجهاز.')
      }}</span>
      <button
        class="text-link"
        :disabled="locked"
        @click="router.push(listPath + '/' + (draft?.revision ? draft.id : 'new'))"
      >
        {{ l('Continue draft', 'متابعة المسودة') }}
      </button>
      <button class="text-link" :disabled="locked" @click="discard">
        {{ l('Discard draft', 'تجاهل المسودة') }}
      </button>
    </div>
    <section v-if="draft && editing && context.view === 'admin'" class="panel task-editor">
      <div class="section-heading">
        <h2>{{ draft.revision ? l('Edit task', 'تعديل المهمة') : l('New task', 'مهمة جديدة') }}</h2>
        <button class="text-link" :disabled="locked" @click="router.push(listPath)">
          {{ l('Close editor', 'إغلاق المحرر') }}
        </button>
      </div>
      <form @submit.prevent="save">
        <fieldset class="form-fields" :disabled="locked">
          <label
            >{{ l('Task title', 'عنوان المهمة')
            }}<input v-model="draft.title" required maxlength="160"
          /></label>
          <MemberPicker
            :workspace="context.workspace"
            :view="context.view"
            role="trainer"
            include-self
            single
            :max="1"
            v-model="draft.members"
            :label="l('Assign to trainer', 'تعيين للمدرب')"
            :disabled="locked"
          />
          <div class="field-pair">
            <label
              >{{ l('Due date (optional)', 'الموعد النهائي (اختياري)')
              }}<input type="date" v-model="draft.due_date" /></label
            ><label
              >{{ l('Priority', 'الأولوية')
              }}<select v-model="draft.priority">
                <option value="normal">{{ l('Normal', 'عادية') }}</option>
                <option value="high">{{ l('High', 'عالية') }}</option>
              </select></label
            >
          </div>
          <label
            >{{ l('Instructions (optional)', 'التعليمات (اختياري)')
            }}<textarea v-model="draft.description" rows="3" maxlength="2000" />
          </label>
          <p v-if="draftSaved" class="small-print" role="status">
            {{ l('Draft saved on this device', 'حُفظت المسودة على هذا الجهاز') }}
          </p>
          <p v-if="draftError" role="alert">{{ draftError }}</p>
          <div class="actions">
            <button class="button" :disabled="locked || draft.members.length !== 1">
              {{ l('Save task', 'حفظ المهمة') }}</button
            ><button type="button" class="text-link" @click="discard">
              {{ l('Discard draft', 'تجاهل المسودة') }}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
    <template v-if="!editor">
      <div class="list-controls">
        <h2 class="list-section-label">{{ l('Tasks', 'المهام') }}</h2>
        <ListPagination
          :offset="offset"
          :page-size="appliedLimit"
          :sizes="pageSizes"
          :total="total"
          :disabled="loading"
          @page-size="changeLimit"
          @page="
            async (page) => {
              await router.replace({ query: { ...route.query, offset: page || undefined } })
              await load(page)
            }
          "
        />
      </div>
      <div class="task-filters">
        <label
          >{{ l('Search tasks', 'البحث في المهام')
          }}<input
            :placeholder="l('Search tasks or coach names…', 'ابحث بالمهام أو أسماء المدربين…')"
            type="search"
            v-model="search" /></label
        ><label
          >{{ l('Task status', 'حالة المهمة')
          }}<select v-model="state">
            <option value="open">{{ l('Open', 'مفتوحة') }}</option>
            <option value="completed">{{ l('Completed', 'مكتملة') }}</option>
            <option value="cancelled">{{ l('Cancelled', 'ملغاة') }}</option>
          </select></label
        >
      </div>
      <p v-if="loading" role="status">{{ l('Loading tasks…', 'جارٍ تحميل المهام…') }}</p>
      <EmptyState
        v-if="!loading && !items.length"
        :title="l('No tasks in this view', 'لا توجد مهام في هذا العرض')"
        :description="
          l(
            'Try another status or search. New tasks appear here when assigned.',
            'جرّب حالة أو بحثاً آخر. تظهر المهام الجديدة هنا عند تعيينها.',
          )
        "
      />
      <div class="task-list">
        <article v-for="task in items" :key="task.id" class="panel task-card">
          <div class="task-description">
            <div class="task-tags">
              <span v-if="task.priority === 'high'" class="status-label">{{
                l('High priority', 'أولوية عالية')
              }}</span
              ><span
                v-if="task.state === 'open' && task.due_date && task.due_date.slice(0, 10) < today"
                class="status-label overdue"
                >{{ l('Overdue', 'متأخرة') }}</span
              >
            </div>
            <h2>{{ task.title }}</h2>
            <p class="small-print">
              {{ task.trainer_name }} ·
              {{
                task.due_date
                  ? dateLabel(task.due_date.slice(0, 10))
                  : l('No due date', 'دون موعد نهائي')
              }}
            </p>
            <p v-if="!task.trainer_active" class="notice">
              {{
                l(
                  'Trainer inactive. Reassign this task to continue.',
                  'المدرب غير نشط. أعد تعيين المهمة للمتابعة.',
                )
              }}
            </p>
            <p v-if="task.description" class="task-instructions" dir="auto">
              {{ task.description }}
            </p>
          </div>
          <div class="task-actions" v-if="task.state !== 'cancelled' || context.view === 'admin'">
            <button
              class="button secondary small"
              :disabled="locked"
              @click="update(task, task.state !== 'open' ? 'open' : 'completed')"
            >
              {{
                task.state !== 'open'
                  ? l('Reopen', 'إعادة فتح')
                  : l('Mark complete', 'إتمام المهمة')
              }}</button
            ><template v-if="context.view === 'admin' && task.state !== 'cancelled'"
              ><button class="text-link" :disabled="locked || !!draft" @click="edit(task)">
                {{ l('Edit', 'تعديل') }}</button
              ><button class="text-link" :disabled="locked" @click="update(task, 'cancelled')">
                {{ l('Cancel task', 'إلغاء المهمة') }}
              </button></template
            >
          </div>
        </article>
      </div>
    </template>
  </div>
</template>
<style scoped>
.task-summary {
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.task-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-block: 1rem;
}
.task-filters label {
  flex: 1;
  min-width: 180px;
}
.task-list {
  display: grid;
  gap: 1rem;
  align-content: start;
}
.task-card {
  margin: 0;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  align-items: start;
}
.task-description {
  min-width: 0;
  flex: 1;
  overflow-wrap: anywhere;
}
.task-description h2 {
  font-size: 1.05rem;
  margin: 0.4rem 0;
}
.task-instructions {
  white-space: pre-wrap;
}
.task-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: center;
}
.task-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.overdue {
  color: var(--error);
}
.task-editor {
}
@media (max-width: 760px) {
  .task-card {
    flex-direction: column;
  }
  .task-actions {
    width: 100%;
  }
  .task-editor .field-pair {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
