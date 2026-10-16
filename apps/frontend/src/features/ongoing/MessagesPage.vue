<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { PhArrowClockwise } from '@phosphor-icons/vue'
import { user } from '../../app/auth'
import { rpc } from '../../lib/backend'
import { language as l, errorMessage } from '../../lib/i18n'
import type { Conversation } from './types'
import MessageThread from './MessageThread.vue'
const route = useRoute(),
  coach = route.path.startsWith('/coach'),
  base = coach ? '/coach/messages' : '/messages'
const id = computed(() => String(route.params.id || ''))
const conversations = ref<Conversation[]>([]),
  search = ref(''),
  error = ref(''),
  loading = ref(true)
const thread = ref<InstanceType<typeof MessageThread>>()
const visibleConversations = computed(() =>
  conversations.value.filter((c) =>
    c.name.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase()),
  ),
)
let disposed = false
function receive(items: Conversation[]) {
  if (!disposed) conversations.value = items
}
async function refreshMessages() {
  error.value = ''
  try {
    if (thread.value) await thread.value.refresh()
    else
      receive(
        (await rpc<Conversation[]>('conversation_inbox'))
          .filter((c) => (coach ? c.coach_id : c.client_id) === user.value!.id)
          .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '')),
      )
  } catch (e) {
    if (!disposed) error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(refreshMessages)
onUnmounted(() => {
  disposed = true
})
</script>
<template>
  <div class="container page messages-page" :class="{ 'has-thread': !!id }">
    <header class="messages-heading">
      <h1>{{ l('Messages', 'الرسائل') }}</h1>
      <button class="text-link message-refresh" @click="refreshMessages">
        <PhArrowClockwise :size="18" />{{ l('Refresh messages', 'تحديث الرسائل') }}
      </button>
    </header>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <div class="conversation-layout">
      <aside class="conversation-inbox">
        <label class="conversation-search"
          >{{ l('Find a conversation', 'ابحث عن محادثة')
          }}<input v-model="search" type="search" :placeholder="l('Search by name', 'ابحث بالاسم')"
        /></label>
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
            v-for="c in visibleConversations"
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
          <p v-if="conversations.length && !visibleConversations.length" class="notice">
            {{ l('No matching conversations.', 'لا توجد محادثات مطابقة.') }}
          </p>
        </nav>
      </aside>

      <MessageThread v-if="id" :key="id" ref="thread" @inbox="receive" />
      <section v-else class="empty-review conversation-placeholder">
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
    </div>
  </div>
</template>
