<template>
  <div
    v-if="props.visible"
    class="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
  >
    <div class="card border shadow p-0 overflow-hidden rounded-lg shadow min-w-128 w-1/3">
      <!-- Header -->
      <div
        class="p-6 gradient-bg border-b border-rafik-sectext dark:border-rafik-darksectext w-full flex justify-between items-center"
      >
        <div class="flex items-center gap-4" v-if="group">
          <img
            :src="
              group.group_avatar ||
              'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'
            "
            alt=""
            class="rounded-full border-2 border-rafik-secondary object-cover w-16 h-16"
          />
          <div>
            <h3 class="header-small text-base">{{ group.group_name }}</h3>
            <p class="subheader-small text-sm line-clamp-2 w-3/4">{{ group.group_description }}</p>
          </div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          stroke="currentColor"
          fill="currentColor"
          class="w-6 h-6 text-rafik-pritext dark:text-rafik-darkpritext hover:text-rafik cursor-pointer"
          viewBox="0 0 384 512"
          @click="$emit('close')"
        >
          <path
            d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
          />
        </svg>
      </div>

      <!-- Messages -->
      <ul
        v-if="group"
        class="h-64 2xl:h-96 p-6 overflow-y-auto space-y-5 bg-rafik-secbg dark:bg-rafik-darksecbg"
        ref="chatContainer"
      >
        <!-- Loading Spinner -->
        <div
          v-if="loading"
          class="h-full flex flex-col gap-2 items-center justify-center text-center w-full text-body"
        >
          <img
            src="@/assets/Large Icon.png"
            class="w-24 h-24 animate-bounce hidden dark:inline-block"
            alt="spinner"
          />
          <img
            src="@/assets/Large Icon Light.png"
            class="w-24 h-24 animate-bounce dark:hidden"
            alt="spinner"
          />
          <p class="text-lg animate-pulse">Loading...</p>
        </div>

        <!-- Each Message -->
        <div class="flex flex-col" v-for="message in messages" :key="message.id">
          <div
            :id="String(message.id)"
            class="flex items-start gap-2"
            :class="getUser(message.sent_by)? 'justify-start' : 'justify-end'"
          >
          <div class="max-w-[75%]">

          <div class="flex gap-2 items-center " v-if="users.find((u:any) => u.id == message.sent_by) && getUser(message.sent_by)">
              <!-- Avatar for received messages -->
            <img

              :src="
              users.find((u:any) => u.id == message.sent_by).avatar ||
                'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'
              "
              class="w-8 h-8 rounded-full border border-rafik-sectext dark:border-rafik-darksectext"
            />
              <h2 class="contentH-small text-sm line-clamp-1">{{users.find((u:any) => u.id == message.sent_by).first_name}} {{ users.find((u:any) => u.id == message.sent_by).last_name }}</h2>
            </div>

              <!-- Message Bubble -->
            <div
              class="p-3 rounded-lg w-full"
              :class="
                getUser(message.sent_by)
                  ? 'bg-rafik-pribg dark:bg-rafik-darkpribg text-left '
                  : 'bg-rafik-pribg dark:bg-rafik-darkpribg text-right'
              "
            >

              <p :class="!message.seen_at ? 'text-rafik-pritext dark:text-rafik-darkpritext' : ''">
                {{ message.content }}
              </p>
              <span class="text-xs block mt-1 text-gray-300">
                {{ formatDate(message.created_at) }}

              </span>
              <!-- /End form section -->
            </div>
          </div>


          </div>
        </div>
      </ul>

      <!-- Text Response -->
      <form
        @submit.prevent="submitMessage"
        action=""
        class="p-2 flex border-t garadient-bg w-full relative items-center"
      >
        <input
          v-model="sending"
          placeholder="Type your message here ..."
          type="text"
          class="w-full border-0 ring-0 outline-none focus:outline-none focus:ring-0 rafik-text-input bg-transparent"
        />
        <button type="submit" :disabled="!sending.trim()">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            stroke="currentColor"
            fill="currentColor"
            class="w-6 h-6 text-rafik-pritext dark:text-rafik-darkpritext hover:text-rafik cursor-pointer mr-8"
            :class="{ 'opacity-50 cursor-not-allowed': !sending.trim() }"
          >
            <path
              d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480l0-83.6c0-4 1.5-7.8 4.2-10.8L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z"
            />
          </svg>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted, computed, onMounted } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import Swal from 'sweetalert2';
import { useGroupStore } from '@/stores/groupstores';

type Message = {
  id: number;
  content: string;
  media?: string;
  seen_at?: Date | null;
  sent_by: number | string;
  sent_to: number | string;
  user_program: number;
  created_at: string;
  form?: number | null;
  sender?:any;// if there's a form ID
};

// PROPS
const props = defineProps<{
  visible: boolean;
  group: any;
  messageId?: number; // optional: scroll to this message on mount
}>();

const emits = defineEmits(['close']);

// Alerts
function showSuccess(message: string) {
  Swal.fire({
    title: 'Success!',
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 1500,
    text: message,
    toast: true,
    position: 'top-right',
    icon: 'success',
    background: '#081411',
    color: '#E8F3ED'
  });
}
function showError(message: string) {
  Swal.fire({
    title: 'Error!',
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}

// State
const messages = ref<Message[]>([]);
const chatContainer = ref<HTMLElement | null>(null);
const chatSubscription = ref<any | null>(null);
const users = ref<any[]>([])
const sending = ref('');
const loading = ref(true);

function getUser(messageid:any){
  const id = localStorage.getItem('UserID')
  if(!id)
  return true
  else if(parseInt(id)===messageid)
  return false
  else
  return true
}
async function loadGroupUsers(){
 if(!props.group.id)
  return

  const {data,error} = await supabase.from('users').select().in('id', props.group.users.concat(props.group.admins))
  if (error) {
      showError('Failed to fetch users.');
      console.error('Supabase error:', error);
      return;
    }
  users.value = data
}
// NEW: We'll store forms by their ID so we can pass them into ChatWindow.
const formsMap = ref<Record<number, any>>({});
// Submit a message
const submitMessage = async () => {
  if (!sending.value.trim()) return; // Prevent empty messages

  const UserID = localStorage.getItem('UserID');
  if (!UserID) {
    showError('No trainer user ID found in local storage!');
    return;
  }

  const newMessage = {
    content: sending.value,
    sent_by: UserID,
    created_at: new Date().toISOString(),
    group:props.group.id,
  };

  const { error } = await supabase.from('chat_messages').insert([newMessage]).select();

  if (error) {
    showError('Failed to send message.');
    console.error('Supabase error:', error);
    return;
  }
  sending.value = '';
  scrollToBottom();
  //props.group.id
  const { error: error2 } = await supabase.from('notifications').insert([
    {
      user_id: props.group.id,
      created_at: new Date().toISOString(),
      title: `New message from your trainer`,
      body: newMessage.content
    }
  ]);

  if (error2) {
    console.error('Supabase error:', error2);
    return;
  }
};

// Watch for changes in props.group to refetch messages
watch(
  () => props.visible,
  async (visible) => {
    if (visible && props.group) {
      await loadGroupUsers();
      await fetchMessages();
      subscribeToChat();
    }
  },
  { immediate: true }
);

// Build an array of form IDs to fetch
const formIds: number[] = [];
const tempMessages: any = {};
// Fetch all messages for this user_program
async function fetchMessages() {
  if (!props.group?.id) return;
  loading.value = true;

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('group', props.group.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    loading.value = false;
  } else {
    messages.value = data || [];
    for (const msg of data) {
      tempMessages[msg.user_program] = {
        content: msg.content,
        created_at: msg.created_at,
        seen_at: msg.seen_at,
        sent_by: msg.sent_by,
        form: msg.form,
        group:msg.group
      };
      if (msg.form) {
        formIds.push(msg.form);
      }
    }

    // If we have any form IDs, fetch them all at once
    if (formIds.length > 0) {
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select('*')
        .in('id', formIds);

      if (formsError) {
        console.error('Error fetching forms:', formsError);
      } else if (formsData) {
        // Store each form object by its ID
        for (const f of formsData) {
          formsMap.value[f.id] = f;
        }
      }
    }
    loading.value = false;
    if (!props.messageId) {
      scrollToBottom();
    } else {
      scrollToMessage(props.messageId);
    }
  }
}

// Subscribe real-time
function subscribeToChat() {
  if (!props.group?.id) return;

  if (chatSubscription.value) {
    chatSubscription.value.unsubscribe();
  }

  chatSubscription.value = supabase
    .channel(`chat_group_${props.group.id}`)
      .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'chat_messages' },
    async (payload) => {
      const newMessage = payload.new as Message;

      // Fetch sender info
      const { data: user, error } = await supabase
        .from('users')
        .select('first_name, last_name, avatar')
        .eq('id', newMessage.sent_by)
        .single();

      if (user && !error) {
        newMessage.sender = user; // optionally append this
      }

      messages.value.push(newMessage);
      scrollToBottom();
    }
    )
    .subscribe();
}



// Format date
function formatDate(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
  return date.toLocaleDateString();
}

// Scroll to a specific message
function scrollToMessage(id: number) {
  const messageElement = document.getElementById(String(id));
  console.log('Message element:', messageElement);
  console.log(String(id));
  if (messageElement && chatContainer.value) {
    console.log('Scrolling to message:', id);
    console.log('Message element:', messageElement.offsetTop);
    console.log('Chat container:', chatContainer.value.offsetTop);
    chatContainer.value.scrollTop = messageElement.offsetTop - chatContainer.value.offsetTop;
  }
}

onMounted(() => {
  if (props.messageId) {
    scrollToMessage(props.messageId);
  } else {

  }
});

watch(
  () => props.messageId,
  (newId) => {
    if (newId) {
      scrollToMessage(newId);
    }
  },
  { immediate: true }
);

// Scroll
function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

// Cleanup subscription
onUnmounted(() => {
  if (chatSubscription.value) {
    chatSubscription.value.unsubscribe();
  }
});
</script>

<style scoped>
.dark li:hover {
  background-image: linear-gradient(135deg, #081411 36%, #295f42);
}
li:hover {
  background-image: linear-gradient(135deg, #f3eeeb 36%, #fff2cb);
}
</style>
