<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { user } from '../../app/auth'
import { backend, rpc } from '../../lib/backend'
import { language as l, errorMessage, dateLabel } from '../../lib/i18n'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { commandRejected } from './helpers'
import type { Conversation, Message } from './types'
import PageState from '../../components/PageState.vue'
const route = useRoute(),
  coach = route.path.startsWith('/coach'),
  base = coach ? '/coach/messages' : '/messages',
  id = String(route.params.id || '')
const key = `message:${user.value!.id}:${id}`
const log = ref<HTMLElement>()
const scrollEnd = async () => {
  await nextTick()
  if (log.value) log.value.scrollTop = log.value.scrollHeight
}
type Pending = { id: string; body: string; session: string | null; request: string | null }
const conversations = ref<Conversation[]>([]),
  messages = ref<Message[]>([]),
  text = ref(''),
  pending = ref<Pending>(),
  context = ref({
    session: typeof route.query.session === 'string' ? route.query.session : null,
    request: typeof route.query.request === 'string' ? route.query.request : null,
  })
const loading = ref(true),
  busy = ref(false),
  error = ref(''),
  notice = ref(''),
  older = ref(false),
  olderBusy = ref(false)
const current = computed(() => conversations.value.find((c) => c.id === id))
let ready = false,
  timer: ReturnType<typeof setInterval> | undefined,
  refreshing = false
async function persist() {
  await storeDraft(key, { text: text.value, pending: pending.value, context: context.value })
}
watch(
  [text, context],
  () => {
    if (ready && id)
      void persist().catch(
        () =>
          (error.value = l(
            'Device draft unavailable. Keep this page open.',
            'مسودة الجهاز غير متاحة. أبقِ الصفحة مفتوحة.',
          )),
      )
  },
  { deep: true },
)
async function pageMessages(before?: number) {
  let query = backend
    .from('messages')
    .select('*')
    .eq('relationship_id', id)
    .order('sequence', { ascending: false })
    .limit(50)
  if (before !== undefined) query = query.lt('sequence', before)
  const result = await query
  if (result.error) throw result.error
  return result.data as Message[]
}
async function refresh() {
  if (refreshing || document.hidden) return
  refreshing = true
  try {
    const inbox = await rpc<Conversation[]>('conversation_inbox')
    conversations.value = inbox
      .filter((c) => (coach ? c.coach_id : c.client_id) === user.value!.id)
      .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
    if (id) {
      if (!current.value) throw Error('forbidden')
      const follow =
        !messages.value.length ||
        !log.value ||
        log.value.scrollHeight - log.value.scrollTop - log.value.clientHeight < 80
      const latest = await pageMessages()
      older.value = messages.value.length ? older.value : latest.length === 50
      // If more than one page arrived between polls, replace the window rather than hiding a gap.
      const lastKnown = messages.value.at(-1)?.sequence
      const gap =
        lastKnown !== undefined && latest.length === 50 && latest.at(-1)!.sequence > lastKnown
      if (gap) older.value = true
      const merged = new Map([...(gap ? [] : messages.value), ...latest].map((m) => [m.id, m]))
      messages.value = [...merged.values()].sort((a, b) => a.sequence - b.sequence)
      if (follow) await scrollEnd()
      const last = latest[0]
      if (last && !document.hidden) {
        await rpc('mark_conversation_read', { p_relationship: id, p_sequence: last.sequence })
        current.value.unread = 0
      }
    }
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    refreshing = false
  }
}
async function loadOlder() {
  olderBusy.value = true
  try {
    const height = log.value?.scrollHeight || 0
    const result = await pageMessages(messages.value[0]?.sequence)
    messages.value = [...result.reverse(), ...messages.value]
    older.value = result.length === 50
    await nextTick()
    if (log.value) log.value.scrollTop += log.value.scrollHeight - height
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    olderBusy.value = false
  }
}
async function send() {
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    if (!pending.value) {
      if (!text.value.trim()) return
      pending.value = { id: crypto.randomUUID(), body: text.value, ...context.value }
      await persist()
    }
    const p = pending.value
    await rpc<Message>('send_message', {
      p_id: p.id,
      p_relationship: id,
      p_body: p.body,
      p_session: p.session,
      p_request: p.request,
    })
    ready = false
    pending.value = undefined
    text.value = ''
    context.value = { session: null, request: null }
    await removeDraft(key)
    ready = true
    await refresh()
    await scrollEnd()
    notice.value = l('Message sent.', 'أُرسلت الرسالة.')
  } catch (e) {
    if (commandRejected(e)) {
      pending.value = undefined
      await persist()
    }
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
function contextLink(m: Message) {
  return m.request_id
    ? (coach ? '/coach/checkins/' : '/checkins/') + m.request_id
    : (coach ? '/coach/review/' : '/workout/') + m.session_id
}
function refreshMessages() {
  error.value = ''
  void refresh()
}
const focus = () => void refresh()
onMounted(async () => {
  await refresh()
  try {
    if (id) {
      const d = await getDraft<{ text: string; pending?: Pending; context: typeof context.value }>(
        key,
      )
      if (d) {
        text.value = d.text
        pending.value = d.pending
        context.value = d.context
      }
    }
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    ready = true
    loading.value = false
    await scrollEnd()
  }
  timer = setInterval(() => void refresh(), 20000)
  window.addEventListener('focus', focus)
  document.addEventListener('visibilitychange', focus)
})
onUnmounted(() => {
  clearInterval(timer)
  window.removeEventListener('focus', focus)
  document.removeEventListener('visibilitychange', focus)
})
</script>
<template>
  <div class="container page">
    <header class="page-heading heading-actions">
      <div>
        <p class="overline">{{ l('Keep the conversation going', 'تابع الحوار') }}</p>
        <h1>{{ l('Messages', 'الرسائل') }}</h1>
        <p>
          {{ l('One place for the details between sessions.', 'مكان واحد للتفاصيل بين الحصص.') }}
        </p>
      </div>
      <button class="button secondary small" @click="refreshMessages">
        {{ l('Refresh messages', 'تحديث الرسائل') }}
      </button>
    </header>
    <PageState :loading="loading" :error="!conversations.length ? error : ''" @retry="refresh"
      ><div class="conversation-layout">
        <nav class="conversation-list" :aria-label="l('Conversations', 'المحادثات')">
          <p v-if="!conversations.length" class="notice">
            {{
              l(
                'Conversations appear when a coaching relationship is connected.',
                'تظهر المحادثات عند ربط علاقة تدريب.',
              )
            }}
          </p>
          <RouterLink
            v-for="c in conversations"
            :key="c.id"
            :to="base + '/' + c.id"
            class="conversation-person"
            :class="{ selected: c.id === id }"
            :aria-current="c.id === id ? 'page' : undefined"
            ><span class="avatar">{{ c.name.slice(0, 1) }}</span>
            <div class="grow">
              <strong dir="auto">{{ c.name }}</strong>
              <p>{{ c.latest || l('Start a conversation', 'ابدأ محادثة') }}</p>
              <small v-if="c.state === 'archived'">{{ l('Archived', 'مؤرشف') }}</small>
            </div>
            <span
              v-if="c.unread"
              class="count"
              :aria-label="c.unread + ' ' + l('unread messages', 'رسائل غير مقروءة')"
              >{{ c.unread }}</span
            ></RouterLink
          >
        </nav>
        <section v-if="current" class="conversation-thread" :aria-label="current.name">
          <header class="thread-heading">
            <h2>{{ current.name }}</h2>
            <RouterLink v-if="coach" :to="'/coach/clients/' + id" class="text-link">{{
              l('Client workspace', 'مساحة المتدرب')
            }}</RouterLink>
          </header>
          <p v-if="error" class="notice error" role="alert">{{ error }}</p>
          <p v-if="notice" class="sr-only" role="status">{{ notice }}</p>
          <button v-if="older" class="text-link" :disabled="olderBusy" @click="loadOlder">
            {{ l('Load earlier messages', 'تحميل رسائل أقدم') }}
          </button>
          <div
            ref="log"
            class="message-log"
            tabindex="0"
            role="log"
            :aria-label="l('Conversation history', 'سجل المحادثة')"
          >
            <p v-if="!messages.length" class="empty-review">
              {{
                l(
                  'Share a question, an update, or something to discuss next time.',
                  'شارك سؤالاً أو تحديثاً أو موضوعاً للمتابعة القادمة.',
                )
              }}
            </p>
            <article
              v-for="m in messages"
              :key="m.id"
              class="message-bubble"
              :class="{ own: m.sender_id === user!.id }"
            >
              <span class="overline">{{
                m.sender_id === user!.id ? l('You', 'أنت') : current.name
              }}</span
              ><RouterLink
                v-if="m.session_id || m.request_id"
                class="message-context"
                :to="contextLink(m)"
                >{{
                  m.request_id
                    ? l('Related response', 'الإجابة المرتبطة')
                    : l('Related workout', 'الحصة المرتبطة')
                }}
                ↗</RouterLink
              >
              <p dir="auto">{{ m.body }}</p>
              <time :datetime="m.created_at"
                >{{ dateLabel(m.created_at) }} ·
                {{
                  new Date(m.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                }}</time
              >
            </article>
          </div>
          <form
            v-if="current.state === 'active' || pending"
            class="message-compose"
            @submit.prevent="send"
          >
            <p v-if="context.session || context.request" class="context-chip">
              {{
                context.request
                  ? l('Linked to a check-in or assessment', 'مرتبطة بمتابعة أو تقييم')
                  : l('Linked to a workout', 'مرتبطة بحصة')
              }}<button
                v-if="!pending"
                type="button"
                class="text-link"
                @click="context = { session: null, request: null }"
              >
                {{ l('Remove link', 'إزالة الرابط') }}
              </button>
            </p>
            <label
              >{{ l('Message', 'الرسالة')
              }}<textarea
                v-model="text"
                :disabled="busy || !!pending"
                rows="3"
                maxlength="4000"
                required
              ></textarea>
            </label>
            <p v-if="pending && !busy" class="notice">
              {{
                l(
                  'Delivery is not confirmed. Retry the saved message; it will only be sent once.',
                  'لم يتأكد الإرسال. أعد محاولة الرسالة المحفوظة؛ ستُرسل مرة واحدة فقط.',
                )
              }}
            </p>
            <button class="button" :disabled="busy || (!text.trim() && !pending)">
              {{
                busy
                  ? l('Sending…', 'جارٍ الإرسال…')
                  : pending
                    ? l('Retry send', 'إعادة محاولة الإرسال')
                    : l('Send message', 'إرسال الرسالة')
              }}
            </button>
          </form>
          <p v-else class="notice">
            {{
              l(
                'This relationship is archived. Conversation history remains available.',
                'العلاقة مؤرشفة. يبقى سجل المحادثة متاحاً.',
              )
            }}
          </p>
        </section>
        <section v-else-if="!id" class="empty-review">
          <h2>{{ l('Choose a conversation', 'اختر محادثة') }}</h2>
          <p>
            {{
              l(
                'Your messages stay with the person and the work they relate to.',
                'تبقى الرسائل مرتبطة بالشخص والعمل المتعلق بها.',
              )
            }}
          </p>
        </section>
      </div></PageState
    >
  </div>
</template>
