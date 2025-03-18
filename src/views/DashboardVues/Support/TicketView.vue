<template>
  <div class="flex h-screen overflow-auto">
    <div class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 gap-6">
      <!-- Page Title -->
      <PageTitle header="Ticket Details" subheader="Conversation" />

      <!-- Ticket Details Card -->
      <div v-if="ticket" class="card rounded-xl p-8 mb-6">
        <h2 class="header-medium mb-2">{{ ticket.subject }}</h2>
        <p class="subheader-small mb-2">
          Status: <span class="uppercase">{{ ticket.status }}</span>
        </p>
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
      <div v-if="ticketMessages.length" class="flex-1 overflow-auto">
        <div
          v-for="msg in ticketMessages"
          :key="msg.id"
          class="card rounded-xl p-6 mb-4 flex gap-4 items-start"
        >
          <div
            class="w-12 h-12 rounded-full bg-gray-500 flex-shrink-0 flex items-center justify-center text-white"
          >
            <!-- Icon/Initial based on sender role -->
            <span v-if="msg.sender_role === 'support'">S</span>
            <span v-else>U</span>
          </div>
          <div class="flex-1">
            <p class="header-small mb-1">
              {{ msg.sender_role === 'support' ? 'Support' : 'You' }}
              <span class="subheader-small ml-2">
                {{
                  new Date(msg.created_at).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                }}
              </span>
            </p>
            <p class="text-body">{{ msg.message }}</p>
          </div>
        </div>
      </div>
      <p v-else class="text-center my-auto">No messages yet. Start the conversation!</p>

      <!-- Add New Message Form -->
      <div class="card rounded-xl p-8 mt-6">
        <h3 class="header-small mb-4">Add a Response</h3>
        <form @submit.prevent="submitResponse">
          <textarea
            v-model="newMessage"
            class="rafik-text-input w-full mb-4"
            rows="3"
            placeholder="Type your message..."
            required
          ></textarea>
          <button type="submit" class="btn-lg w-full">Send Response</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { type Ticket, type TicketMessage, useSupportStore } from '@/stores/supportStore'
import { useRoute } from 'vue-router'
import PageTitle from '@/components/Navigation/PageTitle.vue'
import Swal from 'sweetalert2'

const ticketStore = useSupportStore()
const route = useRoute()

const ticket = ref<Ticket | null>(null)
const ticketMessages = ref<TicketMessage[]>([])
const newMessage = ref('')

// Load ticket details and conversation thread on mount
onMounted(async () => {
  const ticketId = Number(route.params.id)
  await ticketStore.getTicket(ticketId)
  ticket.value = ticketStore.selectedTicket
  ticketMessages.value = ticketStore.ticketMessages
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
  newMessage.value = ''
}
</script>

<style scoped>
.card {
  background-color: var(--rafik-secbg, #f8f9fa);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
