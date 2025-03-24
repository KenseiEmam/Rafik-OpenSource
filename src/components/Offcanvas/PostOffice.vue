<template>
  <div :class="open ? 'right-0 h-screen' : '-right-128 h-0'" class="absolute flex items-start">
    <button @click="open = !open" class="rounded-l-full bg-rafik-pribg dark:bg-rafik-darkpribg border border-r-0 border-rafik-sectext dark:border-rafik-darksectext px-8 py-4 mt-64 relative left-1 z-20">
      <span v-if="checkNew" class="absolute flex size-4 top-2 right-6 ">
        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-rafik opacity-75"></span>
        <span class="relative inline-flex size-4 rounded-full bg-rafik"></span>
      </span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="text-rafik-sectext dark:text-rafik-darksectext w-8">
        <path d="M224 32L64 32C46.3 32 32 46.3 32 64l0 64c0 17.7 14.3 32 32 32l377.4 0c4.2 0 8.3-1.7 11.3-4.7l48-48c6.2-6.2 6.2-16.4 0-22.6l-48-48c-3-3-7.1-4.7-11.3-4.7L288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32zM480 256c0-17.7-14.3-32-32-32l-160 0 0-32-64 0 0 32L70.6 224c-4.2 0-8.3 1.7-11.3 4.7l-48 48c-6.2 6.2-6.2 16.4 0 22.6l48 48c3 3 7.1 4.7 11.3 4.7L448 352c17.7 0 32-14.3 32-32l0-64zM288 480l0-96-64 0 0 96c0 17.7 14.3 32 32 32s32-14.3 32-32z"/>
      </svg>
    </button>
    <div :class="open ? 'h-screen' : 'h-0'" class="border-rafik-sectext dark:border-rafik-darksectext border-l w-128 bg-rafik-pribg dark:bg-rafik-darkpribg items-between justify-between gap-10 flex flex-col p-8 2xl:py-16 h-full relative z-10">
      <div class="flex gap-10 justify-between">
        <div>
          <h2 class="subheader-medium">POST</h2>
          <h2 class="header-medium">OFFICE</h2>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" stroke="currentColor" viewBox="0 0 448 512" class="w-6 text-rafik-sectext dark:text-rafik-darksectext">
          <path d="M224 0c-17.7 0-32 14.3-32 32l0 19.2C119 66 64 130.6 64 208l0 18.8c0 47-17.3 92.4-48.5 127.6l-7.4 8.3c-8.4 9.4-10.4 22.9-5.3 34.4S19.4 416 32 416l384 0c12.6 0 24-7.4 29.2-18.9s3.1-25-5.3-34.4l-7.4-8.3C401.3 319.2 384 273.9 384 226.8l0-18.8c0-77.4-55-142-128-156.8L256 32c0-17.7-14.3-32-32-32zm45.3 493.3c12-12 18.7-28.3 18.7-45.3l-64 0-64 0c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7z"/>
        </svg>
      </div>
      <div class="space-y-4 flex-1 flex flex-col  overflow-auto w-full">
        <div @click="activateChat(client)" v-for="client in sortedChatClients" :key="client.id" :class="{' border-rafik-pritext dark:border-rafik-darkpritext': !client.seen_at && client.sent_by == client.id}" class="p-6 border hover:border-rafik-secondary card cursor-pointer rounded-xl bg-rafik-secbg dark:bg-rafik-darksecbg flex gap-6 w-full items-center">
          <img :src="client.avatar || 'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'" alt="" class="rounded-full border-2 2xl:h-24 2xl:w-24 border-rafik-secondary object-cover w-16 h-16">
          <div class="flex-1">
            <h2 class="header-small text-rafik-secondary">{{ client.first_name }} {{ client.last_name }}</h2>
            <p :class="{'text-rafik-pritext dark:text-rafik-darkpritext': !client.seen_at && client.sent_by == client.id}" class="text-body line-clamp-1 text-sm mb-2">
              {{ client.latestMessage || "Reach out to " + client.first_name + " " + client.last_name + "!" }}
            </p>
            <!-- Seen Tick -->
            <div v-if="client.seen_at && client.sent_by !== client.id " class="text-rafik-teritiary flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-rafik-teritiary" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 4.293a1 1 0 0 0-1.414 0L8 11.586 4.707 8.293a1 1 0 1 0-1.414 1.414l4 4a1 1 0 0 0 1.414 0l8-8a1 1 0 0 0 0-1.414z" clip-rule="evenodd" />
              </svg>
              <span class="ml-2 text-xs">Seen</span>
            </div>
            <p v-else-if="!client.seen_at && client.sent_by !== client.id" class="text-xs opacity-70 flex text-body items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-rafik-sectext dark:text-rafik-darksectext" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 4.293a1 1 0 0 0-1.414 0L8 11.586 4.707 8.293a1 1 0 1 0-1.414 1.414l4 4a1 1 0 0 0 1.414 0l8-8a1 1 0 0 0 0-1.414z" clip-rule="evenodd" />
              </svg>
              <span class="ml-2 text-xs">Sent</span>
            </p>
            <p v-else-if="client.seen_at && client.sent_by === client.id" class="text-xs opacity-70 flex text-body items-center">
              <span class="text-xs">Opened</span>
            </p>
            <p v-else class="text-xs opacity-70 flex text-body items-center">
              <span class="text-xs">Recieved {{ humanizeDate(client.lastMessageTime) }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
    <ChatWindow :visible="chatActive" :Client="chatClient" @close="chatActive = false"/>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from "vue";
import { useUserStore } from "@/stores/user";
import { supabase } from "@/lib/supabaseClient";
import ChatWindow from "@/components/ChatWindow.vue";
import { formatDistanceToNow,parseISO } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

function humanizeDate(date: any, timeZone: string = "UTC") {
  if (!date) {
    return null;
  }

  // Convert date to UTC using the provided time zone
  const utcDate = fromZonedTime(parseISO(date), timeZone);

  return formatDistanceToNow(utcDate, { addSuffix: true });
}
const chatActive =ref(false);
const open = ref(false);
const clientStore = useUserStore();
const chatClient = ref()
const latestMessages = ref<Record<string, { content: string; created_at: string, seen_at: string | null , sent_by: number}>>({});

onMounted(async () => {
  await clientStore.getChatClients();
  await fetchLatestMessages();
  subscribeToChatMessages(); // Start listening to updates
});
const checkNew = computed(() => {
  const userId = localStorage.getItem("UserID");
  const userIdInt = userId ? parseInt(userId, 10) : null; // Convert to int or null

  return Object.values(latestMessages.value).some(
    msg => !msg.seen_at && msg.sent_by !== userIdInt
  );
});
function activateChat(client:any){
  chatClient.value = client;
  chatActive.value= true;
}
// Fetch latest messages for all user programs
async function fetchLatestMessages() {
  try {
    const userProgramIds = clientStore.ChatClients.flatMap(client => client.program_details?.id || []);
    if (userProgramIds.length === 0) return;

    const { data, error } = await supabase.rpc("get_latest_messages2", { program_ids: userProgramIds });

    if (error) throw new Error(`Error fetching messages: ${error.message}`);

    latestMessages.value = data.reduce((acc: any, msg: any) => {
      acc[msg.user_program] = {
        content: msg.content,
        created_at: msg.created_at,
        seen_at: msg.seen_at, // Adding seen_at,
        sent_by:msg.sent_by
      };

      return acc;
    }, {});
  } catch (error: any) {
    console.error(error);
  }
}

// Subscribe to real-time updates from chat_messages
function subscribeToChatMessages() {
  const channel = supabase.channel("chat_messages");

  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "chat_messages" },
    async () => {
      console.log("New message received, refetching...");
      await fetchLatestMessages();
    }
  ).subscribe();
}

// Cleanup on component unmount
onUnmounted(() => {
  supabase.channel("chat_messages").unsubscribe();
});

// Compute sorted clients by latest message timestamp
const sortedChatClients = computed(() => {
  return [...clientStore.ChatClients]
    .map(client => ({
      ...client,
      latestMessage: latestMessages.value[client.program_details?.id]?.content || null,
      lastMessageTime: latestMessages.value[client.program_details?.id]?.created_at || "1970-01-01",
      sent_by: latestMessages.value[client.program_details?.id]?.sent_by || "1",
      seen_at: latestMessages.value[client.program_details?.id]?.seen_at || null // Pass the seen_at
    }))
    .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
});
</script>

<style scoped>
.dark .card:hover{
  background-image: linear-gradient(135deg, #081411 36%, #295f42);
}
.card:hover{
  background-image:linear-gradient(135deg, #f3eeeb 36%, #fff2cb)
}
</style>
