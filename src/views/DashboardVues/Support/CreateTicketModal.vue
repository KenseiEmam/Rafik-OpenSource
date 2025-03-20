<template>
  <div class="card p-12 items-center text-left">
    <h2 class="header-medium mb-6">Create New Ticket</h2>
    <form @submit.prevent="submitForm">
      <!-- Subject Selection -->
      <div class="mb-4">
        <label for="subject" class="block text-sm font-medium mb-2">Subject</label>
        <select
          id="subject"
          v-model="subject"
          class="rafik-text-input"
          :class="{ 'border-red-500': errors.subject }"
          required
        >
          <option disabled value="">Select a subject</option>
          <option value="General Inquiry">General Inquiry</option>
          <option value="Technical Issue/ Bug">Technical Issue/ Bug</option>
          <option value="Related to a Program">Related to a Program</option>
          <option value="Related to a Client">Related to a Client</option>
        </select>
        <span v-if="errors.subject" class="text-red-500 text-sm">{{ errors.subject }}</span>
      </div>

      <!-- Conditional select for "Related to a Program" -->
      <div v-if="subject === 'Related to a Program'" class="mb-4">
        <label for="relatedProgram" class="block text-sm font-medium mb-2">Select Program</label>
        <div v-if="loadingPrograms" class="text-sm text-gray-400">Loading programs...</div>
        <select
          v-else
          id="relatedProgram"
          v-model="relatedTo"
          class="rafik-text-input"
          :class="{ 'border-red-500': errors.relatedTo }"
          required
        >
          <option disabled value="">Select a program</option>
          <option v-for="program in programOptions" :key="program.id" :value="program.id">
            {{ program.program_name }}
          </option>
        </select>
        <span v-if="errors.relatedTo" class="text-red-500 text-sm">{{ errors.relatedTo }}</span>
      </div>

      <!-- Conditional select for "Related to a Client" -->
      <div v-if="subject === 'Related to a Client'" class="mb-4">
        <label for="relatedClient" class="block text-sm font-medium mb-2">Select Client</label>
        <div v-if="loadingClients" class="text-sm text-gray-400">Loading clients...</div>
        <select
          v-else
          id="relatedClient"
          v-model="relatedTo"
          class="rafik-text-input"
          :class="{ 'border-red-500': errors.relatedTo }"
          required
        >
          <option disabled value="">Select a client</option>
          <option v-for="client in clientOptions" :key="client.id" :value="client.id">
            {{ client.email }}
          </option>
        </select>
        <span v-if="errors.relatedTo" class="text-red-500 text-sm">{{ errors.relatedTo }}</span>
      </div>

      <!-- Message Textarea -->
      <div class="mb-4">
        <label for="message" class="block text-sm font-medium mb-2">Message</label>
        <textarea
          id="message"
          v-model="message"
          class="rafik-text-input"
          rows="4"
          placeholder="Describe your issue..."
          :class="{ 'border-red-500': errors.message }"
          required
        ></textarea>
        <span v-if="errors.message" class="text-red-500 text-sm">{{ errors.message }}</span>
      </div>

      <!-- Media Attachments -->
      <div class="mb-4">
        <label for="media" class="block text-sm font-medium mb-2">Attach Media (Optional)</label>
        <input
          id="media"
          type="file"
          multiple
          @change="handleFileUpload"
          class="rafik-text-input"
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end gap-4">
        <button type="button" class="btn-lg-outline" @click="$emit('close')">Cancel</button>
        <button type="submit" class="btn-lg">Submit Ticket</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useProgramStore } from '@/stores/programstores'
import { useUserStore } from '@/stores/user'

const emits = defineEmits(['close', 'submit'])

// Local form state
const subject = ref('')
const message = ref('')
const relatedTo = ref('') // Holds the selected program/client id
const errors = ref<Record<string, string>>({})

// Media attachments
const media = ref<File[]>([])

// For program options and loading state
const programOptions = ref<any[]>([])
const loadingPrograms = ref(false)

// For client options and loading state
const clientOptions = ref<any[]>([])
const loadingClients = ref(false)

const programStore = useProgramStore()
const userStore = useUserStore()

// Watch for subject changes to fetch appropriate data
watch(subject, async (newValue) => {
  // Reset the relatedTo field when subject changes
  relatedTo.value = ''
  if (newValue === 'Related to a Program') {
    loadingPrograms.value = true
    await programStore.getAllPrograms()
    programOptions.value = programStore.AllPrograms || []
    loadingPrograms.value = false
  } else if (newValue === 'Related to a Client') {
    loadingClients.value = true
    // Using default page 1 and pageSize 100; adjust as needed
    await userStore.getActiveClientsForTrainer(1, 100)
    clientOptions.value = userStore.AllClients || []
    loadingClients.value = false
  }
})

// Handle file upload event and store selected files
function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    media.value = Array.from(target.files)
  }
}

// Basic validation before submission
function validateForm() {
  errors.value = {}
  if (!subject.value) {
    errors.value.subject = 'Please select a subject.'
  }
  if (
    (subject.value === 'Related to a Program' || subject.value === 'Related to a Client') &&
    !relatedTo.value
  ) {
    errors.value.relatedTo = 'Please select an option.'
  }
  if (!message.value) {
    errors.value.message = 'Please enter a message.'
  }
  return Object.keys(errors.value).length === 0
}

// Handle form submission and emit the data to the parent
function submitForm() {
  if (!validateForm()) return
  emits('submit', {
    subject: subject.value,
    message: message.value,
    related_to: relatedTo.value,
    media: media.value,
  })
  // Reset fields
  subject.value = ''
  message.value = ''
  relatedTo.value = ''
  media.value = []
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
