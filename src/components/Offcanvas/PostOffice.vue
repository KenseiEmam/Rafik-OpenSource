
<template>
  <div
    :dir="locale === 'ar' ? 'rtl' : 'ltr'"
    :class="[open ? (locale === 'ar' ? 'left-0 h-screen' : 'right-0 h-screen') : (locale === 'ar' ? '-left-128 h-0' : '-right-128 h-0')]"
    class="absolute flex items-start"
  >
    <!-- Drawer Toggle Button -->
    <button
      @click="open = !open"
      :class="locale === 'ar'
        ? 'rounded-r-full bg-rafik-secbg dark:bg-rafik-darksecbg border-2 border-rafik-sectext dark:border-rafik-darksectext border-l-0 px-8 py-4 mt-64 relative right-1 z-20'
        : 'rounded-l-full bg-rafik-secbg dark:bg-rafik-darksecbg border-2 border-rafik-sectext dark:border-rafik-darksectext border-r-0 px-8 py-4 mt-64 relative left-1 z-20'"
    >
      <span
        v-if="checkNew"
        :class="locale === 'ar'
          ? 'absolute flex size-4 top-2 left-6'
          : 'absolute flex size-4 top-2 right-6'"
      >
        <span
          class="absolute inline-flex h-full w-full animate-ping rounded-full bg-rafik opacity-75"
        ></span>
        <span class="relative inline-flex size-4 rounded-full bg-rafik"></span>
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        fill="currentColor"
        class="text-rafik-sectext dark:text-rafik-darksectext w-8"
      >
        <path
          d="M224 32L64 32C46.3 32 32 46.3 32 64l0 64c0 17.7 14.3 32 32 32l377.4 0c4.2 0 8.3-1.7 11.3-4.7l48-48
             c6.2-6.2 6.2-16.4 0-22.6l-48-48c-3-3-7.1-4.7-11.3-4.7L288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32zM480 256c0-17.7-14.3-32
             -32-32l-160 0 0-32-64 0 0 32L70.6 224c-4.2 0-8.3 1.7-11.3 4.7l-48 48c-6.2 6.2-6.2 16.4 0 22.6l48 48c3 3 7.1 4.7
             11.3 4.7L448 352c17.7 0 32-14.3 32-32l0-64zM288 480l0-96-64 0 0 96c0 17.7 14.3 32 32 32s32-14.3 32-32z"
        />
      </svg>
    </button>

    <!-- Drawer Content -->
    <div
      :class="open ? 'h-screen' : 'h-0'"
      class="border-rafik-sectext dark:border-rafik-darksectext border-x w-128 bg-rafik-secbg dark:bg-rafik-darksecbg items-between justify-between gap-10 flex flex-col p-8 2xl:py-16 h-full relative z-10"
    >
      <!-- Header Section -->
      <div class="flex gap-10 justify-between">
        <div>
          <h2 class="subheader-medium">{{ t('dashboard.offCanvas.postOffice.post') }}</h2>
          <h2 class="header-medium">{{ t('dashboard.offCanvas.postOffice.office') }}</h2>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          stroke="currentColor"
          viewBox="0 0 448 512"
          class="w-6 text-rafik-sectext dark:text-rafik-darksectext"
        >
          <path
            d="M224 0c-17.7 0-32 14.3-32 32l0 19.2C119 66 64 130.6 64 208l0 18.8c0 47-17.3 92.4-48.5
               127.6l-7.4 8.3c-8.4 9.4-10.4 22.9-5.3 34.4S19.4 416 32 416l384 0c12.6 0 24-7.4
               29.2-18.9s3.1-25-5.3-34.4l-7.4-8.3C401.3 319.2 384 273.9 384 226.8l0-18.8
               c0-77.4-55-142-128-156.8L256 32c0-17.7-14.3-32-32-32zm45.3 493.3c12-12 18.7-28.3
               18.7-45.3l-64 0-64 0c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3
               -18.7z"
          />
        </svg>
      </div>

      <!-- Client List -->
      <div class="space-y-4 flex-1 flex flex-col overflow-auto w-full">
        <div
          v-for="client in sortedChatClients"
          :key="client.id"
          @click="activateChat(client)"
          :class="{
            'border-rafik-pritext dark:border-rafik-darkpritext':
              !client.seen_at && client.sent_by == client.id
          }"
          class="p-6 border hover:border-rafik-secondary card cursor-pointer rounded-xl bg-rafik-secbg dark:bg-rafik-darksecbg flex gap-6 w-full items-center"
        >
          <img
            :src="client.avatar ||
              'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'"
            alt=""
            class="rounded-full border-2 2xl:h-24 2xl:w-24 border-rafik-secondary object-cover w-16 h-16"
          />
          <div class="flex-1">
            <h2 class="header-small text-rafik-secondary">
              {{ client.first_name }} {{ client.last_name }}
            </h2>
            <p
              :class="{
                'text-rafik-pritext dark:text-rafik-darkpritext': !client.seen_at && client.sent_by == client.id
              }"
              class="text-body line-clamp-1 text-sm mb-2"
            >
              {{
                client.latestMessage
                  ? client.latestMessage
                  : t('dashboard.offCanvas.postOffice.reachOut', {
                      name: client.first_name + ' ' + client.last_name
                    })
              }}
            </p>

            <!-- Seen Tick -->
            <div
              v-if="client.seen_at && client.sent_by !== client.id"
              class="text-rafik-teritiary flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4 text-rafik-teritiary"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 4.293a1 1 0 0 0-1.414 0L8 11.586 4.707 8.293a1 1 0 1 0-1.414 1.414l4 4a1 1 0 0 0 1.414 0l8-8a1 1 0 0 0 0-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
              <span :class="locale === 'ar' ? 'mr-2 text-sm' : 'ml-2 text-sm'">
                {{ t('dashboard.offCanvas.postOffice.seen') }}
              </span>
            </div>

            <!-- If the trainer has sent a message to the client, but the client hasn't seen it -->
            <p
              v-else-if="!client.seen_at && client.sent_by !== client.id"
              class="text-sm opacity-70 flex text-body items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4 text-rafik-sectext dark:text-rafik-darksectext"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 4.293a1 1 0 0 0-1.414 0L8 11.586 4.707 8.293a1 1 0 1 0-1.414 1.414l4 4a1 1 0 0 0 1.414 0l8-8a1 1 0 0 0 0-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
              <span :class="locale === 'ar' ? 'mr-2 text-sm' : 'ml-2 text-sm'">
                {{ t('dashboard.offCanvas.postOffice.sent') }}
              </span>
            </p>

            <!-- If the client has read the message and the message was from them originally -->
            <p
              v-else-if="client.seen_at && client.sent_by === client.id"
              class="text-sm opacity-70 flex text-body items-center"
            >
              <span class="text-sm">
                {{ t('dashboard.offCanvas.postOffice.opened') }}
              </span>
            </p>

            <!-- Else we show that the trainer received the message at some time -->
            <p v-else class="text-sm opacity-70 flex text-body items-center">
              <span class="text-sm">
                {{ t('dashboard.offCanvas.postOffice.received') }}
                {{ humanizeDate(client.lastMessageTime) }}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
    <!-- Chat Window -->
    <ChatWindow :visible="chatActive" :Client="chatClient" @close="chatActive = false" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { supabase } from '@/lib/supabaseClient';
import ChatWindow from '@/components/ChatWindow.vue';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

function humanizeDate(date: any, timeZone: string = 'UTC') {
  if (!date) {
    return null;
  }

  // Convert date to UTC using the provided time zone
  const utcDate = fromZonedTime(parseISO(date), timeZone);

  return formatDistanceToNow(utcDate, { addSuffix: true });
}

const chatActive = ref(false);
const open = ref(false);
const clientStore = useUserStore();
const chatClient = ref<any>(null);
const latestMessages = ref<
  Record<
    string,
    {
      content: string;
      created_at: string;
      seen_at: string | null;
      sent_by: number;
    }
  >
>({});

onMounted(async () => {
  await clientStore.getChatClients();
  await fetchLatestMessages();
  subscribeToChatMessages();
});

onUnmounted(() => {
  supabase.channel('chat_messages').unsubscribe();
});

// Computed to check if there's an unread message from a client
const checkNew = computed(() => {
  const userId = localStorage.getItem('UserID');
  const userIdInt = userId ? parseInt(userId, 10) : null;

  return Object.values(latestMessages.value).some(
    (msg) => !msg.seen_at && msg.sent_by !== userIdInt
  );
});

function activateChat(client: any) {
  chatClient.value = client;
  chatActive.value = true;
}

// Fetch the latest messages
async function fetchLatestMessages() {
  try {
    const userProgramIds = clientStore.ChatClients.flatMap(
      (client) => client.program_details?.id || []
    );
    if (userProgramIds.length === 0) return;

    const { data, error } = await supabase.rpc('get_latest_messages2', {
      program_ids: userProgramIds
    });

    if (error) throw new Error(`Error fetching messages: ${error.message}`);

    latestMessages.value = data.reduce((acc: any, msg: any) => {
      acc[msg.user_program] = {
        content: msg.content,
        created_at: msg.created_at,
        seen_at: msg.seen_at,
        sent_by: msg.sent_by
      };
      return acc;
    }, {});
  } catch (error: any) {
    console.error(error);
  }
}

// Real-time subscription
function subscribeToChatMessages() {
  const channel = supabase.channel('chat_messages');

  channel
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, async () => {
      console.log('New message received, refetching...');
      await fetchLatestMessages();
    })
    .subscribe();
}

// Sort clients by latest message timestamp
const sortedChatClients = computed(() => {
  return [...clientStore.ChatClients]
    .map((client) => ({
      ...client,
      latestMessage: latestMessages.value[client.program_details?.id]?.content || null,
      lastMessageTime: latestMessages.value[client.program_details?.id]?.created_at || '1970-01-01',
      sent_by: latestMessages.value[client.program_details?.id]?.sent_by || '1',
      seen_at: latestMessages.value[client.program_details?.id]?.seen_at || null
    }))
    .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
});
</script>

<style scoped>
.dark .card:hover {
  background-image: linear-gradient(135deg, #081411 36%, #295f42);
}
.card:hover {
  background-image: linear-gradient(135deg, #f3eeeb 36%, #fff2cb);
}
</style>
```
