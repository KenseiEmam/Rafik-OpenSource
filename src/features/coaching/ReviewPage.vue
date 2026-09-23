<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { PhArrowLeft, PhCheckCircle } from '@phosphor-icons/vue'
import { user } from '../../app/auth'
import { rpc, rows } from '../../lib/backend'
import type { Session, Profile, Relationship } from '../../lib/domain'
import { language, locale, t, errorMessage, dateLabel } from '../../lib/i18n'
import { exerciseName, targetLabel, actualLabel, performedExercise } from '../../lib/prescriptions'
import PageState from '../../components/PageState.vue'
const route = useRoute()
const id = String(route.params.id)
const back = {
  path: '/coach',
  query: { view: String(route.query.view || 'all'), search: route.query.search },
}
const session = ref<Session>(),
  person = ref<Profile>()
const relationship = ref('')
const note = ref(''),
  error = ref(''),
  message = ref('')
const loading = ref(true),
  busy = ref(false)
async function load() {
  loading.value = true
  error.value = ''
  try {
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
async function save() {
  busy.value = true
  try {
    await rpc('review_session', { p_id: id, p_note: note.value })
    message.value = language(
      'Review saved. Your client can see this feedback in their session.',
      'حُفظت المراجعة. يمكن لمتدربك رؤية الملاحظات ضمن حصته.',
    )
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
onMounted(load)
</script>
<template>
  <div class="container page">
    <RouterLink :to="back" class="back-link"
      ><PhArrowLeft :size="18" class="directional" />{{
        language('Review list', 'قائمة المراجعة')
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
