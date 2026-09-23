<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { user, profile } from '../../app/auth'
import { rows, rpc } from '../../lib/backend'
import { language as l, dateLabel, errorMessage } from '../../lib/i18n'
import { localDate } from '../../lib/dates'
import type { Enrollment } from '../teams/types'
import type { CoachingRequest, Conversation } from './types'
const props = defineProps<{ coach?: boolean }>()
const enrollments = ref<Enrollment[]>([]),
  requests = ref<CoachingRequest[]>([]),
  inbox = ref<Conversation[]>([]),
  error = ref('')
let timer: ReturnType<typeof setInterval> | undefined,
  running = false
async function load() {
  if (running || document.hidden) return
  running = true
  try {
    if (!props.coach)
      enrollments.value = (await rpc<Enrollment[]>('my_team_enrollments')).filter(
        (e) => e.state === 'pending' || e.pending_coach_id,
      )
    const all = await rpc<Conversation[]>('conversation_inbox')
    const relations = all.filter((c) => (props.coach ? c.coach_id : c.client_id) === user.value!.id)
    const ids = new Set(relations.map((r) => r.id))
    inbox.value = relations.filter((c) => c.unread > 0)
    requests.value = (await rows<CoachingRequest>('coaching_requests'))
      .filter(
        (q) =>
          ids.has(q.relationship_id) &&
          (props.coach ||
            relations.some((r) => r.id === q.relationship_id && r.state === 'active')) &&
          !q.cancelled &&
          (props.coach
            ? q.submitted_at && !q.reviewed_at
            : !q.submitted_at && q.due_date <= localDate(profile.value?.timezone || 'UTC')),
      )
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
    error.value = ''
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    running = false
  }
}
onMounted(() => {
  void load()
  timer = setInterval(() => void load(), 30000)
})
onUnmounted(() => clearInterval(timer))
</script>
<template>
  <section
    v-if="requests.length || inbox.length || enrollments.length || error"
    class="coaching-activity"
    :aria-label="l('Coaching updates', 'مستجدات التدريب')"
  >
    <div class="section-title">
      <h2>
        {{
          props.coach
            ? l('Conversations & check-ins', 'المحادثات والمتابعات')
            : l('Your next check-in', 'متابعتك القادمة')
        }}
      </h2>
    </div>
    <p v-if="error" class="notice error">
      {{ error }}
      <button class="text-link" @click="load">
        {{ l('Retry updates', 'إعادة تحميل المستجدات') }}
      </button>
    </p>
    <RouterLink v-for="e in enrollments" :key="e.id" class="activity-row" to="/teams">
      <div>
        <strong>{{ e.team_name }}</strong>
        <p>
          {{
            e.pending_coach_id
              ? l('Review a proposed coach change', 'راجع تغيير المدرب المقترح')
              : l('Review your team invitation', 'راجع دعوة الفريق')
          }}
        </p>
      </div>
      <span aria-hidden="true">↗</span>
    </RouterLink>
    <RouterLink
      v-for="q in requests.slice(0, 5)"
      :key="q.id"
      class="activity-row"
      :to="(props.coach ? '/coach/checkins/' : '/checkins/') + q.id"
      ><div>
        <strong>{{ q.title }}</strong>
        <p>
          {{
            props.coach
              ? l('Ready for your review', 'جاهز لمراجعتك')
              : l('Due', 'الموعد') + ' ' + dateLabel(q.due_date)
          }}
        </p>
      </div>
      <span>↗</span></RouterLink
    ><RouterLink
      v-if="requests.length > 5"
      class="text-link"
      :to="props.coach ? '/coach/checkins' : '/checkins'"
      >{{ l('View all requests', 'عرض كل الطلبات') }} ({{ requests.length }})</RouterLink
    ><RouterLink
      v-for="c in inbox"
      :key="c.id"
      class="activity-row"
      :to="(props.coach ? '/coach/messages/' : '/messages/') + c.id"
      ><div>
        <strong>{{ c.name }}</strong>
        <p>{{ c.unread }} {{ l('unread messages', 'رسائل غير مقروءة') }}</p>
      </div>
      <span>↗</span></RouterLink
    >
  </section>
</template>
