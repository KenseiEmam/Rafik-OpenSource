<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { PhArrowLeft, PhCheckCircle } from '@phosphor-icons/vue'
import { user } from '../../app/auth'
import { rpc, rows, request } from '../../lib/backend'
import type { Session, Profile, Relationship } from '../../lib/domain'
import { language, locale, t, errorMessage, dateLabel } from '../../lib/i18n'
import { exerciseName, targetLabel, actualLabel, performedExercise } from '../../lib/prescriptions'
import PageState from '../../components/PageState.vue'
import { programContext } from './program-context'
import OrganizationNav from '../organizations/OrganizationNav.vue'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
const route = useRoute()
const context = programContext(route)
const draftKey = `review:${user.value!.id}:${context.key}:${route.params.id}`
const id = String(route.params.id)
const back = {
  path: context.workspace ? context.base + '/training' : '/coach',
  query: { view: String(route.query.view || 'all'), search: route.query.search },
}
const session = ref<Session>(),
  person = ref<{ display_name: string }>()
const relationship = ref('')
const note = ref(''),
  error = ref(''),
  message = ref('')
const loading = ref(true)
const minutes = computed(() =>
  session.value?.completed_at
    ? Math.max(
        1,
        Math.round(
          (Date.parse(session.value.completed_at) - Date.parse(session.value.started_at)) / 60000,
        ),
      )
    : null,
)
async function load() {
  loading.value = true
  error.value = ''
  try {
    if (context.workspace) {
      const s = await request<Session & { member_name: string }>(
        `/v1/organization-sessions/${id}?view=${context.view}`,
      )
      session.value = s
      person.value = { display_name: s.member_name }
      note.value = s.coach_note
      return
    }
    const s = await rpc<Session>('session_document', { p_id: id })
    if (!s || s.coach_id !== user.value!.id) throw Error('forbidden')
    session.value = s
    relationship.value =
      (await rows<Relationship>('coach_clients', 'client_id', s.client_id)).find(
        (r) => r.coach_id === user.value!.id,
      )?.id || ''
    note.value = s.coach_note
    person.value = (await rows<Profile>('profiles', 'id', s.client_id))[0]
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
const command = useCommand<'review'>(
  draftKey,
  async () => {
    await removeDraft(draftKey)
    await load()
    message.value = language(
      'Review saved. Your client can see this feedback in their session.',
      'حُفظت المراجعة. يمكن لمتدربك رؤية الملاحظات ضمن حصته.',
    )
  },
  (_, args) =>
    context.workspace
      ? request(`/v1/workspaces/${context.workspace}/sessions`, {
          method: 'POST',
          body: JSON.stringify(args),
        })
      : rpc('review_session', { p_id: id, p_note: args.note }),
)
const busy = computed(() => command.state.busy || !!command.state.pending || !command.state.ready)
async function save() {
  message.value = ''
  await command.run('review', {
    operation: crypto.randomUUID(),
    action: 'review',
    view: context.view,
    id,
    revision: session.value!.version,
    note: note.value,
  })
}
let draftReady = false
watch(note, () => {
  if (draftReady)
    void storeDraft(draftKey, note.value).catch((e) => (error.value = errorMessage(e)))
})
onMounted(async () => {
  await load()
  const draft = await getDraft<string>(draftKey)
  if (draft !== undefined) note.value = draft
  draftReady = true
})
</script>
<template>
  <OrganizationNav v-if="context.workspace" />
  <div class="container page">
    <RouterLink :to="back" class="back-link"
      ><PhArrowLeft :size="18" class="directional" />{{
        context.workspace
          ? language('Back to training', 'العودة إلى التدريب')
          : language('Review list', 'قائمة المراجعة')
      }}</RouterLink
    ><PageState :loading="loading" :error="!session ? error : ''" @retry="load"
      ><template v-if="session"
        ><div class="page-heading">
          <p class="overline">{{ language('Session review', 'مراجعة الحصة') }}</p>
          <h1>{{ person?.display_name }}</h1>
          <p>
            {{ session.prescription.name }} ·
            {{ dateLabel(session.completed_at || session.started_at) }}
          </p>
        </div>
        <dl class="review-summary">
          <div>
            <dt>{{ language('Status', 'الحالة') }}</dt>
            <dd>
              {{
                session.status === 'completed'
                  ? session.reviewed_at
                    ? language('Reviewed', 'تمت المراجعة')
                    : language('Completed', 'مكتملة')
                  : language('In progress', 'قيد التنفيذ')
              }}
            </dd>
          </div>
          <div>
            <dt>{{ language('Sets recorded', 'المجموعات المسجلة') }}</dt>
            <dd>
              {{ session.entries.filter((e) => e.completed).length }} /
              {{ session.entries.length }}
            </dd>
          </div>
          <div>
            <dt>{{ language('Exercises', 'التمارين') }}</dt>
            <dd>{{ session.prescription.exercises.length }}</dd>
          </div>
          <div v-if="minutes !== null">
            <dt>{{ language('Duration', 'المدة') }}</dt>
            <dd>{{ minutes }} {{ language('min', 'دقيقة') }}</dd>
          </div>
        </dl>
        <CommandStatus :command="command" :show-notice="false" />
        <div class="review-layout">
          <section>
            <article
              v-for="ex in session.prescription.exercises"
              :key="ex.key"
              class="review-exercise"
            >
              <h2>
                {{ exerciseName(performedExercise(ex, session.entries)) }}
              </h2>
              <p class="subtle">
                {{ language('Planned', 'المخطط') }}: {{ exerciseName(ex) }} · {{ ex.sets }} ×
                {{ targetLabel(ex) }}
              </p>
              <table>
                <caption class="sr-only">
                  {{
                    language('Actual sets', 'المجموعات الفعلية')
                  }}
                </caption>
                <thead>
                  <tr>
                    <th>{{ language('Set', 'المجموعة') }}</th>
                    <th>{{ language('Actual', 'النتيجة') }}</th>
                    <th>{{ language('Target', 'الهدف') }}</th>
                    <th>{{ language('Recorded', 'مسجلة') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="entry in session.entries.filter((e) => e.exercise_key === ex.key)"
                    :key="entry.set_index"
                  >
                    <td>{{ entry.set_index + 1 }}</td>
                    <td>
                      {{ entry.completed ? actualLabel(entry, ex.kind) : '–' }}
                    </td>
                    <td>{{ targetLabel(ex, ex.targets?.[entry.set_index] || ex) }}</td>
                    <td>{{ entry.completed ? language('Yes', 'نعم') : language('No', 'لا') }}</td>
                  </tr>
                </tbody>
              </table>
            </article>
          </section>
          <aside>
            <RouterLink
              v-if="relationship"
              class="button secondary full"
              :to="'/coach/messages/' + relationship + '?session=' + id"
              >{{ language('Discuss this workout', 'مناقشة هذه الحصة') }}</RouterLink
            >
            <section v-if="session.note" class="panel">
              <h2>{{ language('Client note', 'ملاحظة المتدرب') }}</h2>
              <p class="preserve-lines">{{ session.note }}</p>
            </section>
            <form class="panel feedback-form" @submit.prevent="save">
              <h2>{{ language('Make your feedback useful.', 'قدّم ملاحظات مفيدة.') }}</h2>
              <p>
                {{
                  language(
                    'Acknowledge the session and suggest one adjustment for next time.',
                    'علّق على الحصة واقترح تعديلاً واحداً للمرة القادمة.',
                  )
                }}
              </p>
              <label for="review-note"
                >{{ t('feedback') }} <span class="subtle">{{ t('optional') }}</span></label
              ><textarea id="review-note" v-model="note" rows="6" maxlength="2000"></textarea
              ><button class="button full" :disabled="busy || session.status !== 'completed'">
                <PhCheckCircle :size="20" />{{
                  busy ? t('loading') : language('Save review', 'حفظ المراجعة')
                }}
              </button>
              <p v-if="message" class="notice success" role="status">{{ message }}</p>
              <RouterLink v-if="message" class="button secondary full" :to="back"
                >{{ language('Continue reviewing', 'متابعة المراجعات') }} →</RouterLink
              >
              <p v-if="error" class="notice error" role="alert">{{ error }}</p>
            </form>
          </aside>
        </div></template
      ></PageState
    >
  </div>
</template>
<style scoped>
.review-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 1px;
  margin: 0 0 24px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
}
.review-summary > div {
  background: var(--surface);
  padding: 12px 14px;
}
.review-summary dt {
  font-size: 0.75rem;
  color: var(--muted);
}
.review-summary dd {
  margin: 4px 0 0;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
</style>
