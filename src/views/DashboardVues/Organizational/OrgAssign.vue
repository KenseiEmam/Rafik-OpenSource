<template>
  <!-- Modal Content -->
  <div   v-if="props.visible"
  class="fixed top-0 left-0 w-full  h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
  <div
  class="card rounded-lg shadow p-6 w-1/2 flex content-stretch gap-8 relative"
>
  <div class="flex flex-col justify-between items-start flex-1">
    <h2 class="header-small mb-6">
      {{ t('dashboard.entitlements.modal.assignEntitlements') }}
    </h2>
    <p class="contentH-large 2xl:text-7xl mt-auto">
      {{ entitlementstores.entitlements.filter((e:any) => !e.client_email).length }}
    </p>
    <h2 class="contentH-small text-rafik-secondary uppercase font-semibold mb-6">
      {{ t('dashboard.entitlements.list.avlEntitlements') }}
    </h2>
    <button
      type="button"
      @click="$emit('close')"
      class="btn-lg bg-red-500 border-red-500 hover:bg-red-400 "
    >
            {{ t('dashboard.users.list.addUserModal.cancel') }}
    </button>
  </div>

  <!-- Form -->
  <form class="form-control" @submit.prevent="submitForm">
    <!-- Program Selection -->
    <div class="mb-4">
      <label for="program" class="block text-sm font-medium mb-3">
        {{ t('dashboard.entitlements.modal.programToAssign') }}
      </label>
      <select
        id="program"
        v-model="selectedProgram"
        class="rafik-text-input"
        required
        :class="{ 'border-red-500': errors.selectedProgram }"
      >
        <option selected value="">
          {{ t('dashboard.entitlements.modal.chooseProgramPlaceholder') }}
        </option>
        <option
          v-for="program in programs"
          :key="program.id"
          :value="program.id"
        >
          {{ program.program_name }}
        </option>
      </select>
      <span v-if="errors.selectedProgram" class="text-red-500 text-sm">
        {{ errors.selectedProgram }}
      </span>
    </div>

    <!-- Emails Textarea -->
    <div class="mb-4">
      <label for="emails" class="block text-sm font-medium mb-3">
        {{ t('dashboard.entitlements.modal.assigneeEmailsLabel') }}
      </label>
      <textarea
        id="emails"
        v-model="emailsText"
        class="rafik-text-input"
        rows="4"
        :placeholder="t('dashboard.entitlements.modal.emailsPlaceholder')"
        :class="{ 'border-red-500': errors.emailsText }"
      ></textarea>
      <span v-if="errors.emailsText" class="text-red-500 text-sm">
        {{ errors.emailsText }}
      </span>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end w-full">
      <button type="submit" class="btn-lg w-full">
        {{ t('dashboard.entitlements.modal.assignButton') }}
      </button>
    </div>
  </form>
</div>

</div>

</template>

<script setup lang="ts">
import type { Program } from '@/stores/programstores';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEntitlementStore } from '@/stores/entitlementstores';
const { t , locale } = useI18n();

const entitlementstores = useEntitlementStore()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  availableCount: {
    type: Number,
    default: 0
  },
  programs: {
    type: Array<Program>,
    default: () => []
  }
});

const emits = defineEmits(['close', 'submit']);

// Local form data
const selectedProgram = ref('');
const emailsText = ref('');
const errors = ref<Record<string, string>>({});

/** Basic validations before submitting */
function validateForm() {
  errors.value = {};

  if (!selectedProgram.value) {
    errors.value.selectedProgram = t('dashboard.entitlements.modal.programRequired');
  }
  if (!emailsText.value) {
    errors.value.emailsText = t('dashboard.entitlements.modal.emailsRequired');
  }

  return Object.keys(errors.value).length === 0;
}

/** Submit the form data to the parent */
function submitForm() {
  if (!validateForm()) return;

  // Parse emails
  const emails = emailsText.value
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e !== '');

  // Additional check: user can't enter more emails than available entitlements
  if (emails.length > props.availableCount) {
    errors.value.emailsText = t('dashboard.entitlements.modal.emailsCountExceeded', {
      count: props.availableCount
    });
    return;
  }

  // Emit the final data to the parent
  emits('submit', {
    programId: selectedProgram.value,
    emails
  });

  // Reset fields
  selectedProgram.value = '';
  emailsText.value = '';
}
</script>
