<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { request } from '../../lib/backend'
import { language as l, dateLabel, errorMessage } from '../../lib/i18n'
import type { Session } from '../../lib/domain'
import { programContext } from '../coaching/program-context'
import OrganizationNav from './OrganizationNav.vue'
import MemberPicker from './MemberPicker.vue'
import ListPagination from '../../components/ListPagination.vue'
import PageState from '../../components/PageState.vue'
const route = useRoute(),
  router = useRouter(),
  context = programContext(route)
type History = {
  members: { id: string; name: string; active: boolean }[]
  sessions: (Session & { member_id: string })[]
  total: number
  next: string | null
}
const data = ref<History>(),
  offset = ref(0),
  loading = ref(false),
  error = ref(''),
  member = ref(String(route.query.member || ''))
let generation = 0,
  disposed = false
async function load() {
  const current = ++generation
  loading.value = true
  error.value = ''
  const query = new URLSearchParams({
    view: context.view,
    history: 'true',
    ...(member.value ? { member: member.value } : {}),
    offset: String(Math.max(0, Number(route.query.offset) || 0)),
  })
  try {
    const result = await request<History>(`/v1/workspaces/${context.workspace}/delivery?${query}`)
    if (disposed || current !== generation) return
    data.value = result
    offset.value = Math.max(0, Number(route.query.offset) || 0)
  } catch (e) {
    if (!disposed && current === generation) {
      error.value = errorMessage(e)
      if ((e as { statusCode?: number }).statusCode === 403) data.value = undefined
    }
  } finally {
    if (!disposed && current === generation) loading.value = false
  }
}
function choose(ids: string[]) {
  member.value = ids[0] || ''
  return router.push({ query: member.value ? { member: member.value } : {} })
}
watch(
  () => [route.query.member, route.query.offset],
  () => {
    member.value = String(route.query.member || '')
    void load()
  },
)
onMounted(() => load())
onUnmounted(() => {
  disposed = true
  generation++
})
const name = (id: string) =>
  data.value?.members.find((m) => m.id === id)?.name || l('Former member', 'عضو سابق')
</script>
<template>
  <OrganizationNav />
  <div class="container page session-history-page">
    <header class="work-heading">
      <div>
        <p class="overline">{{ l('Recorded workouts', 'التمارين المسجّلة') }}</p>
        <h1>{{ l('Session history', 'سجل الحصص') }}</h1>
        <p>
          {{
            l(
              'Latest workouts first. Open a session to review its recorded work.',
              'أحدث الحصص أولاً. افتح حصة لمراجعة التمارين المسجّلة.',
            )
          }}
        </p>
      </div>
      <div class="actions">
        <RouterLink
          v-if="context.view !== 'trainee'"
          class="button secondary"
          :to="context.base + '/events'"
          >{{ l('Events & assessments', 'المواعيد والتقييمات') }}</RouterLink
        >
        <RouterLink class="button secondary" :to="context.base + '/training'">{{
          context.view === 'trainee'
            ? l('My training', 'تدريبي')
            : l('Athlete plans', 'خطط الرياضيين')
        }}</RouterLink>
      </div>
    </header>
    <div class="list-controls">
      <h2 class="list-section-label">{{ l('Recorded sessions', 'الحصص المسجلة') }}</h2>
      <ListPagination
        :label="l('Session pages', 'صفحات الحصص')"
        :offset="offset"
        :page-size="10"
        :total="data?.total || 0"
        :disabled="loading"
        @page="(offset) => router.push({ query: { ...route.query, offset: offset || undefined } })"
      />
    </div>
    <details v-if="context.view !== 'trainee'" class="history-filter">
      <summary>{{ l('Filter by athlete (optional)', 'تصفية حسب الرياضي (اختياري)') }}</summary>
      <MemberPicker
        :workspace="context.workspace"
        :view="context.view"
        single
        :model-value="member ? [member] : []"
        :label="l('Athlete', 'الرياضي')"
        @update:model-value="choose"
      />
    </details>
    <p v-if="loading && data" role="status" class="small-print">
      {{ l('Updating sessions…', 'جارٍ تحديث الحصص…') }}
    </p>
    <p v-if="error && data" role="alert" class="notice error">
      {{ error }}
      <button class="text-link" @click="load()">{{ l('Retry', 'إعادة المحاولة') }}</button>
    </p>
    <PageState :loading="loading && !data" :error="!data ? error : ''" @retry="load()"
      ><template v-if="data">
        <section v-if="!data.sessions.length" class="empty-state panel">
          <h2>{{ l('No recorded sessions yet.', 'لا توجد حصص مسجّلة بعد.') }}</h2>
          <p>
            {{
              l(
                'Workouts appear here once an athlete starts an assigned session. Scheduled events stay in Calendar.',
                'تظهر التمارين هنا عندما يبدأ الرياضي حصة معيّنة. تبقى المواعيد المجدولة في التقويم.',
              )
            }}
          </p>
        </section>
        <ol v-else class="session-list">
          <li v-for="session in data.sessions" :key="session.id">
            <RouterLink
              class="session-row"
              :to="
                context.view === 'trainee'
                  ? '/workout/' + session.id + '?workspace=' + context.workspace
                  : context.base + '/review/' + session.id
              "
            >
              <div>
                <p class="overline" dir="auto">
                  {{
                    context.view === 'trainee'
                      ? l('Your workout', 'تمرينك')
                      : name(session.member_id)
                  }}
                </p>
                <h2 dir="auto">{{ session.prescription.name }}</h2>
                <p dir="auto">{{ session.title }} · {{ dateLabel(session.started_at) }}</p>
              </div>
              <span class="tag">{{
                session.status === 'completed'
                  ? session.reviewed_at
                    ? l('Reviewed', 'تمت المراجعة')
                    : l('Awaiting review', 'بانتظار المراجعة')
                  : l('In progress', 'قيد التنفيذ')
              }}</span
              ><span aria-hidden="true">↗</span>
            </RouterLink>
          </li>
        </ol>
      </template></PageState
    >
  </div>
</template>
<style scoped>
.history-filter {
  margin-block: 20px;
}
.session-list {
  list-style: none;
  margin: 20px 0;
  padding: 0;
  display: grid;
  gap: 12px;
}
.session-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
  padding: 22px;
  color: var(--ink);
  text-decoration: none;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
}
.session-row:hover {
  border-color: var(--accent);
}
.session-row > div {
  min-width: 0;
  flex: 1 1 230px;
  overflow-wrap: anywhere;
}
.session-row h2 {
  margin: 6px 0;
  font-size: 1.1rem;
}
.session-row p {
  margin: 0;
}
.session-row .overline {
  color: var(--muted);
}
@media (max-width: 500px) {
  .session-row {
    padding: 18px;
    gap: 12px;
  }
}
</style>
