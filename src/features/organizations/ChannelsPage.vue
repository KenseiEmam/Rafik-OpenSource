<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { request } from '../../lib/backend'
import { language as l, errorMessage } from '../../lib/i18n'
import { useCommand } from '../teams/commands'
import CommandStatus from '../teams/CommandStatus.vue'
import OrganizationNav from './OrganizationNav.vue'
import ChannelEditor from './ChannelEditor.vue'
import ChannelThread from './ChannelThread.vue'
const route = useRoute(),
  router = useRouter(),
  workspace = String(route.params.workspace),
  view = String(route.params.view),
  id = String(route.params.channel || ''),
  base = `/organization/${workspace}/${view}/messages`
type Channel = {
  id: string
  title: string
  unread: number
  last_body: string | null
  archived: boolean
}
const thread = ref<InstanceType<typeof ChannelThread>>()
async function refresh() {
  await Promise.all([load(), thread.value?.refresh()])
}
const items = ref<Channel[]>([]),
  search = ref(String(route.query.search || '')),
  next = ref<number | null>(null),
  loading = ref(true),
  error = ref(''),
  creating = ref(false),
  manage = ref(false)
async function load(append = false) {
  loading.value = true
  error.value = ''
  try {
    const result = await request<{ items: Channel[]; next: number | null }>(
      `/v1/workspaces/${workspace}/communication?view=${view}&search=${encodeURIComponent(search.value)}&offset=${append ? next.value || 0 : 0}&manage=${manage.value}`,
    )
    items.value = append ? [...items.value, ...result.items] : result.items
    next.value = result.next
  } catch (e) {
    error.value = errorMessage(e)
    items.value = []
  } finally {
    loading.value = false
  }
}
const join = useCommand<'join'>(
  `channel-join:${workspace}:${view}`,
  async (_, __, args) => {
    await router.push(base + '/' + args.id)
  },
  (_, args) =>
    request(`/v1/workspaces/${workspace}/communication`, {
      method: 'POST',
      body: JSON.stringify(args),
    }),
)
const locked = computed(() => join.state.busy || !!join.state.pending)
const joinConversation = (id: string) =>
  join.run('join', { id, view, action: 'join', operation: crypto.randomUUID() })
async function opened(key: string) {
  creating.value = false
  await router.push(base + '/' + key)
}
onMounted(() => load())
</script>
<template>
  <OrganizationNav />
  <div
    class="container page messages-page organization-messages"
    :class="{ 'has-thread': !!id, 'is-creating': creating }"
  >
    <header class="messages-heading">
      <h1>{{ l('Messages', 'الرسائل') }}</h1>
      <div class="actions">
        <button v-if="view !== 'trainee'" class="text-link" @click="creating = !creating">
          {{ l('New conversation', 'محادثة جديدة') }}</button
        ><button class="text-link" @click="refresh">{{ l('Refresh', 'تحديث') }}</button>
      </div>
    </header>
    <ChannelEditor
      v-if="creating"
      :workspace="workspace"
      :view="view"
      @close="creating = false"
      @saved="opened"
    />
    <CommandStatus :command="join" />
    <p v-if="error" role="alert" class="notice error">
      {{ error }}
      <button class="text-link" @click="load()">{{ l('Try again', 'حاول مجدداً') }}</button>
    </p>
    <div v-if="!creating" class="conversation-layout">
      <aside class="conversation-inbox">
        <form class="conversation-search" @submit.prevent="load()">
          <label
            >{{ l('Find a conversation', 'ابحث عن محادثة')
            }}<input v-model="search" type="search" /></label
          ><button class="text-link">{{ l('Search', 'بحث') }}</button
          ><label v-if="view === 'admin'" class="check-label small-print"
            ><input v-model="manage" type="checkbox" @change="load()" />{{
              l('Discover organization conversations', 'عرض محادثات المؤسسة')
            }}</label
          >
        </form>
        <p v-if="loading && !items.length" role="status" class="notice">
          {{ l('Loading…', 'جارٍ التحميل…') }}
        </p>
        <nav class="conversation-list" :aria-label="l('Conversations', 'المحادثات')">
          <p v-if="!loading && !items.length" class="notice">
            {{
              l(
                'No matching conversations. Your organization staff can start one with you.',
                'لا توجد محادثات مطابقة. يستطيع موظفو المؤسسة بدء محادثة معك.',
              )
            }}
          </p>
          <template v-for="c in items" :key="c.id"
            ><article v-if="manage" class="conversation-person">
              <div class="grow">
                <strong dir="auto">{{ c.title }}</strong>
                <p>
                  {{
                    l(
                      'Join to read the conversation. Your name will be visible to everyone.',
                      'انضم لقراءة المحادثة. سيظهر اسمك للجميع.',
                    )
                  }}
                </p>
                <button class="text-link" :disabled="locked" @click="joinConversation(c.id)">
                  {{ l('Join conversation', 'الانضمام للمحادثة') }}
                </button>
              </div>
            </article>
            <RouterLink
              v-else
              :to="base + '/' + c.id + (search ? '?search=' + encodeURIComponent(search) : '')"
              class="conversation-person"
              :class="{ selected: c.id === id }"
              ><span class="avatar">{{ c.title.slice(0, 1) }}</span>
              <div class="grow">
                <strong dir="auto">{{ c.title }}</strong>
                <p>{{ c.last_body || l('Start a conversation', 'ابدأ محادثة') }}</p>
                <small v-if="c.archived">{{ l('Archived', 'مؤرشفة') }}</small>
              </div>
              <span
                v-if="c.unread"
                class="count"
                :aria-label="c.unread + ' ' + l('unread messages', 'رسائل غير مقروءة')"
                >{{ c.unread }}</span
              ></RouterLink
            ></template
          ><button v-if="next !== null" class="text-link" @click="load(true)">
            {{ l('Load more', 'تحميل المزيد') }}
          </button>
        </nav>
      </aside>
      <ChannelThread
        ref="thread"
        v-if="id"
        :id="id"
        :workspace="workspace"
        :view="view"
        :base="base"
        @refresh="load()"
      />
      <div v-else class="conversation-placeholder">
        <h2>{{ l('Keep the group in sync', 'ابقَ على تواصل مع المجموعة') }}</h2>
        <p>
          {{
            l(
              'Choose a conversation. Each one has its own visible participant list.',
              'اختر محادثة. لكل محادثة قائمة واضحة بمشاركيها.',
            )
          }}
        </p>
      </div>
    </div>
  </div>
</template>
<style scoped>
.organization-messages {
  min-width: 0;
}
.organization-messages.is-creating :deep(.channel-editor) {
  flex: none;
  overflow: visible;
  width: 100%;
}
.conversation-search {
  display: grid;
  gap: 8px;
  align-content: start;
  margin: 0;
  flex: none;
}
.conversation-search label {
  margin: 0;
}
.conversation-search button {
  margin: 0;
  justify-self: start;
  min-height: 32px;
}
.messages-heading .actions {
  margin: 0;
}
.messages-heading {
  flex-wrap: wrap;
}
.organization-messages > .conversation-layout {
  min-height: 0;
}
.conversation-placeholder h2 {
  font-size: 1.25rem;
}
</style>

<style>
/* Short viewports may scroll the page; the footer must never cover the inbox. */
#app:has(.organization-messages.is-creating) {
  height: auto;
  min-height: 100dvh;
}
#app:has(.organization-messages) {
  min-height: 44rem;
}
</style>
