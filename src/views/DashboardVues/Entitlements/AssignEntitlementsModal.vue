<template>

    <!-- Modal Content -->
    <div class="text-left ">
      <h2 class="header-small mb-6">ASSIGN ENTITLEMENTS</h2>


      <!-- Form -->
      <form @submit.prevent="submitForm">
        <!-- Program Selection -->
        <div class="mb-4">
          <label for="program" class="block text-sm font-medium mb-3">Program to Assign</label>
          <select
            id="program"
            v-model="selectedProgram"
            class="rafik-text-input"
            required
            :class="{ 'border-red-500': errors.selectedProgram }"
          >
          <option selected value="">Choose program for List</option>
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
          <label for="emails" class="block text-sm font-medium mb-3">Assignee Emails:</label>
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
        <div class="flex justify-end w-full">
          <button type="submit" class="btn-lg w-full">Assign</button>
        </div>
      </form>
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
