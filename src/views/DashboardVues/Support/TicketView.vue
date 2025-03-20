<template>
  <div class="flex h-screen overflow-auto">
    <div class="flex-1 px-8 py-8 flex flex-col w-full 2xl:px-12 gap-6">
      <!-- Page Title -->

      <!-- Ticket Details Card -->
      <div v-if="ticket" class="card rounded-xl p-8 mb-4">
        <PageTitle
          :header="ticket?.subject"
          :subheader="`Status: ${ticket?.status || 'Unspecified'}`"
        />
        <p class="text-body mb-2">
          Created on:
          {{
            new Date(ticket.created_at).toLocaleDateString('en-GB', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          }}
        </p>
        <p class="text-body">
          {{ ticket.message }}
        </p>
      </div>

      <!-- Conversation Thread -->
      <div v-if="ticketMessages.length" class="card border flex-1 overflow-auto p-8">
        <div
          v-for="msg in ticketMessages"
          :key="msg.id"
          class="card gradient-bg rounded-xl p-6 mb-4 flex gap-4 items-start"
          :class="[msg.sender_role === 'user' ? '' : 'ring-rafik ring-1']"
        >
          <div
            class="w-12 h-12 rounded-full bg-gray-500 flex-shrink-0 flex items-center justify-center text-white"
          >
            <!-- Icon/Initial based on sender role -->
            <!-- <span v-if="msg.sender_role === 'support'">S</span>
            <span v-else>U</span> -->
            <img
              :src="
                ticketUsers[msg.sender_id]?.avatar ||
                'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'
              "
              class="w-12 h-12 ring-rafik ring-1 rounded-full self-center"
              alt="User Avatar"
            />
          </div>
          <div class="flex-1">
            <div class="w-full flex justify-between">
              <p class="header-small mb-1">
                {{ userName(msg) }}
              </p>
              <span class="subheader-small ml-auto">
                {{
                  new Date(msg.created_at).toLocaleTimeString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                }}
              </span>
            </div>
            <p class="text-body">{{ msg.message }}</p>
          </div>
        </div>
      </div>
      <p v-else class="text-center my-auto">No messages yet. Start the conversation!</p>

      <!-- Add New Message Form -->
      <div class="card rounded-xl p-8 mt-4">
        <h3 class="header-small mb-4">Add a Response</h3>
        <form @submit.prevent="submitResponse">
          <textarea
            v-model="newMessage"
            class="rafik-text-input w-full mb-4"
            rows="3"
            placeholder="Type your message..."
            required
          ></textarea>
          <button type="submit" class="btn-sm w-full">Send Response</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  type Ticket,
  type TicketMessage,
  type TicketUsers,
  useSupportStore,
} from '@/stores/supportStore'
import { useRoute } from 'vue-router'
import PageTitle from '@/components/Navigation/PageTitle.vue'
import Swal from 'sweetalert2'

const ticketStore = useSupportStore()
const route = useRoute()

const ticket = ref<Ticket | null>(null)
const ticketMessages = ref<TicketMessage[]>([])
const ticketUsers = ref<TicketUsers>({})
const newMessage = ref('')

// Load ticket details and conversation thread on mount
onMounted(async () => {
  const ticketId = Number(route.params.id)
  await ticketStore.getTicket(ticketId)
  ticket.value = ticketStore.selectedTicket
  ticketMessages.value = ticketStore.ticketMessages
  ticketUsers.value = ticketStore.ticketUsers
})

// Submit a new response message
async function submitResponse() {
  if (!newMessage.value.trim()) {
    Swal.fire({
      title: 'Error!',
      text: 'Message cannot be empty.',
      icon: 'error',
      background: '#081411',
      color: '#E8F3ED',
    })
    return
  }
  const ticketId = Number(route.params.id)
  // Assuming current user is the sender
  const currentUserId = Number(localStorage.getItem('UserID'))
  await ticketStore.addResponse(ticketId, {
    sender_id: currentUserId,
    sender_role: 'user',
    message: newMessage.value.trim(),
  })
  // Refresh the messages
  await ticketStore.getTicketMessages(ticketId)
  ticketMessages.value = ticketStore.ticketMessages
  ticketUsers.value = ticketStore.ticketUsers
  newMessage.value = ''
}

function userName(msg: TicketMessage): string {
  console.log(ticketUsers.value[msg.sender_id])
  if (ticketUsers.value[msg.sender_id] && ticketUsers.value[msg.sender_id].first_name) {
    return `${ticketUsers.value[msg.sender_id].first_name} ${ticketUsers.value[msg.sender_id].last_name}`
  } else {
    return msg.sender_role === 'user' ? 'You' : 'Support'
  }
}
</script>

<style scoped></style>
