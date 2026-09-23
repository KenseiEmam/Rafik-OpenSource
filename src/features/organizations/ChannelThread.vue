<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { user, profile } from '../../app/auth'
import { request } from '../../lib/backend'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { language as l, errorMessage, locale } from '../../lib/i18n'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import ChannelEditor from './ChannelEditor.vue'
const props = defineProps<{ workspace: string; view: string; id: string; base: string }>(),
  emit = defineEmits<{ refresh: [] }>()
type Message = {
  id: string
  sequence: number
  sender_id: string
  body: string
  name: string
  created_at: string
}
type Detail = {
  channel: { id: string; title: string; revision: number; archived: boolean }
  self: string
  canManage: boolean
  people: { id: string; name: string; manager: boolean; active: boolean }[]
  messages: Message[]
  more: boolean
}
const endpoint = `/v1/workspaces/${props.workspace}/communication`,
  key = `org-message:${user.value!.id}:${props.workspace}:${props.view}:${props.id}`
const data = ref<Detail>(),
  messages = ref<Message[]>([]),
  text = ref(''),
  error = ref(''),
  loading = ref(true),
  more = ref(false),
  newMessages = ref(false),
  editing = ref(false),
  showPeople = ref(false),
  ready = ref(false),
  draftError = ref(''),
  draftSaved = ref(false),
  historyGap = ref(false),
  log = ref<HTMLElement>(),
  composer = ref<HTMLTextAreaElement>()
let disposed = false,
  lastRead = 0,
  reading = false,
  poll: ReturnType<typeof setInterval>
const post = (args: Record<string, unknown>) =>
  request(endpoint, {
    method: 'POST',
    body: JSON.stringify({
      id: props.id,
      view: props.view,
      operation: crypto.randomUUID(),
      ...args,
    }),
  })
const command = useCommand<'send' | 'archive'>(
  key,
  async (name, _, args) => {
    if (name === 'send') {
      ready.value = false
      text.value = ''
      await removeDraft(key)
      ready.value = true
    }
    await load(false, true)
    emit('refresh')
    await nextTick()
    composer.value?.focus()
  },
  (_, args) => request(endpoint, { method: 'POST', body: JSON.stringify(args) }),
)
const locked = computed(() => command.state.busy || !!command.state.pending || !command.state.ready)
async function observe() {
  const el = log.value,
    last = messages.value.at(-1)
  if (
    reading ||
    !last ||
    last.sequence <= lastRead ||
    document.hidden ||
    disposed ||
    !el ||
    el.scrollHeight - el.scrollTop - el.clientHeight > 70
  )
    return
  reading = true
  try {
    await post({ action: 'read', sequence: last.sequence })
    lastRead = last.sequence
    newMessages.value = false
    emit('refresh')
  } catch {
    /* A later visible refresh retries the read cursor. */
  } finally {
    reading = false
  }
}
async function bottom() {
  await nextTick()
  if (log.value) log.value.scrollTop = log.value.scrollHeight
  await observe()
}
async function load(older = false, forceBottom = false) {
  if (disposed) return
  error.value = ''
  const el = log.value,
    atBottom = !el || el.scrollHeight - el.scrollTop - el.clientHeight < 70,
    oldHeight = el?.scrollHeight || 0,
    oldTop = el?.scrollTop || 0
  try {
    const result = await request<Detail>(
      endpoint +
        `?view=${props.view}&id=${props.id}${older && messages.value.length ? '&before=' + messages.value[0]!.sequence : ''}`,
    )
    if (disposed) return
    data.value = result
    if (older) {
      messages.value = [...result.messages, ...messages.value]
      more.value = result.more
      await nextTick()
      if (log.value) log.value.scrollTop = oldTop + log.value.scrollHeight - oldHeight
    } else {
      if (!messages.value.length) more.value = result.more
      const previous = messages.value.at(-1)?.sequence || 0
      const separated =
        previous > 0 && result.more && !result.messages.some((m) => m.sequence === previous)
      if (separated) {
        messages.value = result.messages
        more.value = result.more
        historyGap.value = true
      } else {
        messages.value = Array.from(
          new Map([...messages.value, ...result.messages].map((m) => [m.id, m])).values(),
        ).sort((a, b) => a.sequence - b.sequence)
      }
      if (forceBottom || atBottom) await bottom()
      else if ((messages.value.at(-1)?.sequence || 0) > previous) newMessages.value = true
    }
  } catch (e) {
    error.value = errorMessage(e)
    if ((e as { statusCode?: number }).statusCode === 403) {
      data.value = undefined
      messages.value = []
    }
  } finally {
    loading.value = false
  }
}
async function afterMembers() {
  editing.value = false
  await load()
}
defineExpose({ refresh: () => load() })
function send() {
  return command.run('send', {
    action: 'send',
    id: props.id,
    view: props.view,
    operation: crypto.randomUUID(),
    message: crypto.randomUUID(),
    body: text.value.trim(),
  })
}
function archive() {
  return command.run('archive', {
    action: 'archive',
    id: props.id,
    view: props.view,
    operation: crypto.randomUUID(),
    revision: data.value!.channel.revision,
    archived: !data.value!.channel.archived,
  })
}
function stamp(value: string) {
  return new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-AE' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: profile.value?.timezone || 'UTC',
  }).format(new Date(value))
}
watch(text, async () => {
  draftSaved.value = false
  if (!ready.value) return
  try {
    const savedText = text.value
    await storeDraft(key, savedText)
    draftSaved.value = savedText === text.value
    draftError.value = ''
  } catch (e) {
    draftError.value = errorMessage(e)
  }
})
onMounted(async () => {
  text.value = (await getDraft<string>(key).catch(() => undefined)) || ''
  ready.value = true
  await load(false, true)
  poll = setInterval(() => {
    if (!document.hidden && !editing.value) void load()
  }, 20000)
})
onUnmounted(() => {
  disposed = true
  clearInterval(poll)
})
</script>
<template>
  <section class="conversation-thread">
    <header class="thread-heading">
      <div class="thread-person">
        <RouterLink :to="base" class="conversation-back text-link">{{
          l('Back', 'رجوع')
        }}</RouterLink>
        <h2>{{ data?.channel.title || l('Conversation', 'المحادثة') }}</h2>
      </div>
      <button v-if="data" class="text-link" @click="showPeople = !showPeople">
        {{ l('Participants', 'المشاركون') }} ({{ data.people.length }})
      </button>
    </header>
    <div v-if="showPeople && data" class="channel-people">
      <p>
        {{
          l('Everyone below can read this history.', 'يستطيع جميع الأشخاص أدناه قراءة هذا السجل.')
        }}
      </p>
      <ul>
        <li v-for="p in data.people" :key="p.id">
          {{ p.name }}
          {{ !p.active ? l('(inactive)', '(غير نشط)') : p.manager ? l('· manager', '· مدير') : '' }}
        </li>
      </ul>
      <div v-if="data.canManage" class="actions">
        <button class="text-link" @click="editing = !editing" :disabled="locked">
          {{ l('Manage participants', 'إدارة المشاركين') }}</button
        ><button class="text-link" @click="archive" :disabled="locked">
          {{
            data.channel.archived
              ? l('Reopen conversation', 'إعادة فتح المحادثة')
              : l('Archive conversation', 'أرشفة المحادثة')
          }}
        </button>
      </div>
    </div>
    <ChannelEditor
      v-if="editing && data"
      :workspace="workspace"
      :view="view"
      :initial="{ ...data.channel, people: data.people }"
      @close="editing = false"
      @saved="afterMembers"
    />
    <p v-if="loading" role="status" class="notice">
      {{ l('Loading messages…', 'جارٍ تحميل الرسائل…') }}
    </p>
    <p v-if="error" role="alert" class="notice error">
      {{ error }}
      <button class="text-link" @click="load()">{{ l('Try again', 'حاول مجدداً') }}</button>
    </p>
    <p v-if="historyGap" class="small-print">
      {{
        l(
          'Showing the latest messages. Use Earlier messages to continue through the history.',
          'نعرض أحدث الرسائل. استخدم الرسائل الأقدم لمتابعة السجل.',
        )
      }}
    </p>
    <div
      v-if="data && !editing"
      ref="log"
      class="message-log"
      role="log"
      tabindex="0"
      :aria-label="l('Conversation messages', 'رسائل المحادثة')"
      aria-live="polite"
      @scroll="observe"
    >
      <button v-if="more" class="text-link earlier-messages" @click="load(true)">
        {{ l('Earlier messages', 'الرسائل الأقدم') }}
      </button>
      <p v-if="!messages.length" class="small-print">
        {{ l('Start with a useful update or a question.', 'ابدأ بتحديث مفيد أو سؤال.') }}
      </p>
      <article
        v-for="message in messages"
        :key="message.id"
        class="message-bubble"
        :class="{ own: message.sender_id === data.self }"
      >
        <p class="overline">
          {{ message.sender_id === data.self ? l('You', 'أنت') : message.name }}
        </p>
        <p dir="auto">{{ message.body }}</p>
        <time :datetime="message.created_at">{{ stamp(message.created_at) }}</time>
      </article>
    </div>
    <button v-if="newMessages" class="text-link new-messages" @click="bottom">
      {{ l('New messages ↓', 'رسائل جديدة ↓') }}
    </button>
    <form v-if="data && !editing" class="message-compose" @submit.prevent="send">
      <CommandStatus :command="command" />
      <small v-if="text && draftSaved && !locked" role="status">{{
        l('Draft saved on this device', 'حُفظت المسودة على هذا الجهاز')
      }}</small>
      <p v-if="draftError" role="alert" class="notice error">{{ draftError }}</p>
      <p v-if="data.channel.archived" class="notice">
        {{
          l(
            'Archived. History stays available; new messages are paused.',
            'مؤرشفة. يبقى السجل متاحاً ويتوقف إرسال الرسائل الجديدة.',
          )
        }}
      </p>
      <template v-else
        ><label class="sr-only" :for="'compose-' + id">{{
          l('Write a message', 'اكتب رسالة')
        }}</label
        ><textarea
          :id="'compose-' + id"
          ref="composer"
          v-model="text"
          :disabled="locked"
          maxlength="4000"
          rows="2"
          :placeholder="l('Write a message…', 'اكتب رسالة…')"
        />
        <div class="composer-actions">
          <small>{{
            l('Only this conversation’s participants', 'المشاركون في هذه المحادثة فقط')
          }}</small
          ><button class="button" :disabled="locked || !text.trim()">
            {{ l('Send message', 'إرسال الرسالة') }}
          </button>
        </div></template
      >
    </form>
  </section>
</template>
<style scoped>
.channel-people {
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
  max-height: 35%;
  overflow: auto;
  font-size: 0.85rem;
}
.channel-people ul {
  padding-inline-start: 20px;
}
.conversation-thread :deep(.channel-editor) {
  overflow: auto;
  max-height: 100%;
  margin: 0;
  border: 0;
}
.thread-heading {
  flex-wrap: wrap;
}
.message-bubble p {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
