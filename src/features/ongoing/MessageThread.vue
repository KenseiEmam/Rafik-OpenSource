<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { PhArrowLeft, PhPaperclip, PhPaperPlaneTilt, PhArrowClockwise } from '@phosphor-icons/vue'
import { user } from '../../app/auth'
import { downloadResource, type Resource, type Share } from '../resources/files'
import { request, rpc, rows } from '../../lib/backend'
import { language as l, errorMessage, dateLabel } from '../../lib/i18n'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { commandRejected } from './helpers'
import type { Conversation, Message } from './types'
import PageState from '../../components/PageState.vue'
const emit = defineEmits<{ inbox: [items: Conversation[]] }>()
const route = useRoute(),
  coach = route.path.startsWith('/coach'),
  base = coach ? '/coach/messages' : '/messages',
  id = String(route.params.id || '')
const key = `message:${user.value!.id}:${id}`
const log = ref<HTMLElement>()
const composer = ref<HTMLTextAreaElement>()
const search = ref('')
const attachmentOpen = ref(false)
const newMessages = ref(false)
const visibleConversations = computed(() =>
  conversations.value.filter((c) =>
    c.name.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase()),
  ),
)
let disposed = false
async function observeLatest() {
  const el = log.value
  if (!el || el.scrollHeight - el.scrollTop - el.clientHeight > 80 || document.hidden || disposed)
    return
  newMessages.value = false
  const last = messages.value.at(-1)
  if (last && current.value?.unread) {
    try {
      await rpc('mark_conversation_read', { p_relationship: id, p_sequence: last.sequence })
      if (current.value) current.value.unread = 0
    } catch {
      /* A later visible refresh retries the read cursor. */
    }
  }
}
const scrollEnd = async () => {
  await nextTick()
  if (log.value) log.value.scrollTop = log.value.scrollHeight
  await observeLatest()
}
type Pending = {
  id: string
  body: string
  session: string | null
  request: string | null
  resource: string | null
}
const requestedContext = () => ({
  resource: typeof route.query.resource === 'string' ? route.query.resource : null,
  session: typeof route.query.session === 'string' ? route.query.session : null,
  request: typeof route.query.request === 'string' ? route.query.request : null,
})
const conversations = ref<Conversation[]>([]),
  messages = ref<Message[]>([]),
  text = ref(''),
  pending = ref<Pending>(),
  context = ref(requestedContext())
watch(
  () => route.query,
  () => {
    const next = requestedContext()
    if (!pending.value && Object.values(next).some(Boolean)) context.value = next
  },
)
const resources = ref<Resource[]>([]),
  shares = ref<Share[]>([])
const attachments = computed(() =>
  resources.value.filter(
    (r) =>
      r.state === 'ready' &&
      shares.value.some((s) => s.resource_id === r.id && s.relationship_id === id),
  ),
)
async function openResource(resource: string) {
  try {
    const r = resources.value.find((r) => r.id === resource)
    if (!r) throw Error('resource_unavailable')
    await downloadResource(r)
  } catch (e) {
    error.value = errorMessage(e)
  }
}
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
  return request<Message[]>(
    '/v1/conversations/' + id + (before !== undefined ? '?before=' + before : ''),
  )
}
async function refresh() {
  if (refreshing || document.hidden || disposed) return
  refreshing = true
  try {
    const inbox = await rpc<Conversation[]>('conversation_inbox')
    if (disposed) return
    conversations.value = inbox
      .filter((c) => (coach ? c.coach_id : c.client_id) === user.value!.id)
      .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
    emit('inbox', conversations.value)
    if (id) {
      if (!current.value) throw Error('forbidden')
      const follow =
        !messages.value.length ||
        !log.value ||
        log.value.scrollHeight - log.value.scrollTop - log.value.clientHeight < 80
      const [latest, files, shared] = await Promise.all([
        pageMessages(),
        rows<Resource>('resources'),
        rows<Share>('resource_shares'),
      ])
      if (disposed) return
      resources.value = files
      shares.value = shared
      older.value = messages.value.length ? older.value : latest.length === 50
      // If more than one page arrived between polls, replace the window rather than hiding a gap.
      const lastKnown = messages.value.at(-1)?.sequence
      const gap =
        lastKnown !== undefined && latest.length === 50 && latest.at(-1)!.sequence > lastKnown
      if (gap) older.value = true
      const merged = new Map([...(gap ? [] : messages.value), ...latest].map((m) => [m.id, m]))
      messages.value = [...merged.values()].sort((a, b) => a.sequence - b.sequence)
      if (follow) await scrollEnd()
      else if (latest.some((m) => m.sequence > (lastKnown || 0) && m.sender_id !== user.value!.id))
        newMessages.value = true
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
    }
    await persist()
    const p = pending.value
    const delivered = await rpc<Message>('send_message', {
      p_id: p.id,
      p_relationship: id,
      p_body: p.body,
      p_session: p.session,
      p_request: p.request,
      p_resource: p.resource || null,
    })
    messages.value = [
      ...new Map([...messages.value, delivered].map((m) => [m.id, m])).values(),
    ].sort((a, b) => a.sequence - b.sequence)
    ready = false
    pending.value = undefined
    text.value = ''
    context.value = { session: null, request: null, resource: null }
    await removeDraft(key).catch(() => {
      error.value = l(
        'Message sent, but this device could not clear its saved draft.',
        'أُرسلت الرسالة، لكن تعذّر حذف مسودتها من هذا الجهاز.',
      )
    })
    ready = true
    await refresh()
    await scrollEnd()
    attachmentOpen.value = false
    busy.value = false
    await nextTick()
    composer.value?.focus({ preventScroll: true })
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
defineExpose({ refresh })
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
        context.value =
          !d.pending && Object.values(requestedContext()).some(Boolean)
            ? requestedContext()
            : { ...d.context, resource: d.context.resource || null }
      }
    }
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    ready = true
    loading.value = false
    await scrollEnd()
  }
  if (disposed) return
  timer = setInterval(() => void refresh(), 20000)
  window.addEventListener('focus', focus)
  document.addEventListener('visibilitychange', focus)
})
onBeforeRouteLeave(async () => {
  if (ready && id) await persist()
})
onUnmounted(() => {
  disposed = true
  clearInterval(timer)
  window.removeEventListener('focus', focus)
  document.removeEventListener('visibilitychange', focus)
})
</script>
<template>
  <PageState :loading="loading" :error="!current ? error : ''" @retry="refresh">
    <section v-if="current" class="conversation-thread" :aria-label="current.name">
      <header class="thread-heading">
        <div class="thread-person">
          <RouterLink
            :to="base"
            class="icon-button conversation-back"
            :aria-label="l('Back to conversations', 'العودة إلى المحادثات')"
            ><PhArrowLeft :size="22" aria-hidden="true" /></RouterLink
          ><span class="avatar small">{{ current.name.slice(0, 1) }}</span>
          <h2 dir="auto">{{ current.name }}</h2>
        </div>
        <RouterLink v-if="coach" :to="'/coach/clients/' + id" class="text-link">{{
          l('Client workspace', 'مساحة المتدرب')
        }}</RouterLink>
      </header>
      <p v-if="error && current.state !== 'active' && !pending" class="notice error" role="alert">
        {{ error }}
      </p>
      <p v-if="notice" class="sr-only" role="status">{{ notice }}</p>
      <div
        ref="log"
        class="message-log"
        @scroll="observeLatest"
        tabindex="0"
        role="log"
        :aria-label="l('Conversation history', 'سجل المحادثة')"
      >
        <button
          v-if="older"
          class="text-link earlier-messages"
          :disabled="olderBusy"
          @click="loadOlder"
        >
          {{
            olderBusy
              ? l('Loading…', 'جارٍ التحميل…')
              : l('Load earlier messages', 'تحميل رسائل أقدم')
          }}
        </button>
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
          <button
            v-if="m.resource_id"
            class="text-link attachment-link"
            :disabled="!resources.some((r) => r.id === m.resource_id && r.state === 'ready')"
            @click="openResource(m.resource_id)"
          >
            {{
              resources.find((r) => r.id === m.resource_id && r.state === 'ready')?.title ||
              l('File no longer shared', 'لم يعد الملف مشاركاً')
            }}
            ↓
          </button>
          <time :datetime="m.created_at"
            >{{ dateLabel(m.created_at) }} ·
            {{
              new Date(m.created_at).toLocaleTimeString(l('en', 'ar'), {
                hour: '2-digit',
                minute: '2-digit',
              })
            }}</time
          >
        </article>
      </div>
      <button v-if="newMessages" class="new-messages text-link" @click="scrollEnd">
        {{ l('New messages ↓', 'رسائل جديدة ↓') }}
      </button>
      <form
        v-if="current.state === 'active' || pending"
        class="message-compose"
        @submit.prevent="send"
      >
        <p v-if="error" class="notice error" role="alert">{{ error }}</p>
        <p v-if="context.session || context.request" class="context-chip">
          {{
            context.request
              ? l('Linked to a check-in or assessment', 'مرتبطة بمتابعة أو تقييم')
              : l('Linked to a workout', 'مرتبطة بحصة')
          }}<button
            v-if="!pending"
            type="button"
            class="text-link"
            @click="context = { session: null, request: null, resource: null }"
          >
            {{ l('Remove link', 'إزالة الرابط') }}
          </button>
        </p>
        <label
          ><span class="sr-only">{{ l('Message', 'الرسالة') }}</span
          ><textarea
            ref="composer"
            :placeholder="l('Write a message…', 'اكتب رسالة…')"
            v-model="text"
            :disabled="busy || !!pending"
            rows="2"
            maxlength="4000"
            required
          ></textarea>
        </label>
        <div v-if="attachmentOpen || context.resource" class="message-attachments">
          <label
            >{{ l('Attach a shared file', 'إرفاق ملف مشارك')
            }}<select v-model="context.resource" :disabled="busy || !!pending">
              <option :value="null">{{ l('No attachment', 'بدون مرفق') }}</option>
              <option v-for="r in attachments" :key="r.id" :value="r.id">{{ r.title }}</option>
            </select></label
          >
          <RouterLink class="text-link" :to="coach ? '/coach/resources' : '/resources'">{{
            l('Upload or share a file', 'رفع ملف أو مشاركته')
          }}</RouterLink>
        </div>
        <p v-if="pending && !busy" class="notice">
          {{
            l(
              'Delivery is not confirmed. Retry the saved message; it will only be sent once.',
              'لم يتأكد الإرسال. أعد محاولة الرسالة المحفوظة؛ ستُرسل مرة واحدة فقط.',
            )
          }}
        </p>
        <div class="composer-actions">
          <button
            type="button"
            class="text-link attach-toggle"
            :aria-expanded="attachmentOpen"
            :disabled="busy || !!pending"
            @click="attachmentOpen = !attachmentOpen"
          >
            <PhPaperclip :size="20" aria-hidden="true" />{{ l('Attach a file', 'إرفاق ملف') }}
          </button>
          <button class="button small" :disabled="busy || (!text.trim() && !pending)">
            <PhPaperPlaneTilt :size="18" aria-hidden="true" />
            {{
              busy
                ? l('Sending…', 'جارٍ الإرسال…')
                : pending
                  ? l('Retry send', 'إعادة محاولة الإرسال')
                  : l('Send message', 'إرسال الرسالة')
            }}
          </button>
        </div>
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
  </PageState>
</template>
