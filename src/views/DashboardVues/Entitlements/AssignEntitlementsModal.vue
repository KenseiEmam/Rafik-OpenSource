<template>
  <!-- Modal Wrapper -->
  <div
    v-if="visible"
    class="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
  >
    <!-- Modal Content -->
    <div class="card rounded-lg shadow p-6 w-128">
      <h2 class="contentH-small">ASSIGN ENTITLEMENTS</h2>
      <p class="text-body mb-4">Available: {{ availableCount }}</p>

      <!-- Form -->
      <form @submit.prevent="submitForm">
        <!-- Program Selection -->
        <div class="mb-4">
          <label for="program" class="block text-sm font-medium">Select Program</label>
          <select
            id="program"
            v-model="selectedProgram"
            class="rafik-text-input"
            required
            :class="{ 'border-red-500': errors.selectedProgram }"
          >
            <option v-for="program in programs" :key="program.id" :value="program.id">
              {{ program.program_name }}
            </option>
          </select>
          <span v-if="errors.selectedProgram" class="text-red-500 text-sm">
            {{ errors.selectedProgram }}
          </span>
        </div>

        <!-- Emails Textarea -->
        <div class="mb-4">
          <label for="emails" class="block text-sm font-medium">Add Assignee Emails:</label>
          <textarea
            id="emails"
            v-model="emailsText"
            class="rafik-text-input"
            rows="4"
            placeholder="Separate multiple emails with commas"
            :class="{ 'border-red-500': errors.emailsText }"
          ></textarea>
          <span v-if="errors.emailsText" class="text-red-500 text-sm">
            {{ errors.emailsText }}
          </span>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-md bg-red-500 border-red-500 hover:bg-red-400 rounded mr-2"
          >
            Cancel
          </button>
          <button type="submit" class="btn-md rounded">Assign</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Program } from '@/stores/programstores'
import { ref } from 'vue'

/** PROPS:
 * 1) visible: Boolean - Controls whether the modal is shown.
 * 2) availableCount: Number - How many entitlements are available.
 * 3) programs: Array - A list of program objects to populate the select.
 */
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  availableCount: {
    type: Number,
    default: 0,
  },
  programs: {
    type: Array<Program>,
    default: () => [],
  },
})

/**
 * EMITS:
 * - "close"   => parent listens for this event to hide the modal.
 * - "submit"  => parent receives the final form data { programId, emails }.
 */
const emits = defineEmits(['close', 'submit'])

// Local form data
const selectedProgram = ref('')
const emailsText = ref('')
const errors = ref<Record<string, string>>({})

/** Basic validations before submitting */
function validateForm() {
  errors.value = {}

  if (!selectedProgram.value) {
    errors.value.selectedProgram = 'Please select a program.'
  }
  if (!emailsText.value) {
    errors.value.emailsText = 'Please enter at least one email.'
  }

  return Object.keys(errors.value).length === 0
}

/** Submit the form data to the parent */
function submitForm() {
  if (!validateForm()) return

  // Parse emails
  const emails = emailsText.value
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e !== '')

  // Additional check: user can't enter more emails than available entitlements
  if (emails.length > props.availableCount) {
    errors.value.emailsText = `You cannot assign more than ${props.availableCount} entitlements.`
    return
  }

  // Emit the final data to the parent
  emits('submit', {
    programId: selectedProgram.value,
    emails,
  })

  // Reset fields
  selectedProgram.value = ''
  emailsText.value = ''
}
</script>
