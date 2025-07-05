<template>
  <!-- Modal Content -->
  <div class="text-left">
    <h2 class="header-small mb-6">
      {{ isCoachMode ? t('dashboard.entitlements.modal.assignToCoach') : t('dashboard.entitlements.modal.assignEntitlements') }}
    </h2>

    <!-- Form -->
    <form @submit.prevent="submitForm">
      <!-- Assignment Type Toggle -->
      <div class="mb-6">
        <label class="block text-sm font-medium mb-3">
          {{ t('dashboard.entitlements.modal.assignmentType') }}
        </label>
        <div class="flex gap-4">
          <label class="flex items-center cursor-pointer">
            <input
              type="radio"
              v-model="assignmentType"
              value="program"
              class="mr-2"
              @change="handleAssignmentTypeChange"
            />
            <span class="text-sm">{{ t('dashboard.entitlements.modal.assignToProgram') }}</span>
          </label>
          <label class="flex items-center cursor-pointer">
            <input
              type="radio"
              v-model="assignmentType"
              value="coach"
              class="mr-2"
              @change="handleAssignmentTypeChange"
            />
            <span class="text-sm">{{ t('dashboard.entitlements.modal.assignToCoachDirectly') }}</span>
          </label>
        </div>
        <span v-if="errors.assignmentType" class="text-red-500 text-sm">
          {{ errors.assignmentType }}
        </span>
      </div>

      <!-- Program Selection (only show in program mode) -->
      <div v-if="!isCoachMode" class="mb-4">
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
          <option v-for="program in programs" :key="program.id" :value="program.id">
            {{ program.program_name }}
          </option>
        </select>
        <span v-if="errors.selectedProgram" class="text-red-500 text-sm">
          {{ errors.selectedProgram }}
        </span>
      </div>

      <!-- Coach Selection (only show in coach mode) -->
      <div v-if="isCoachMode" class="mb-4">
        <label for="coach" class="block text-sm font-medium mb-3">
          {{ t('dashboard.entitlements.modal.coachToAssign') }}
        </label>
        <select
          id="coach"
          v-model="selectedCoach"
          class="rafik-text-input"
          required
          :class="{ 'border-red-500': errors.selectedCoach }"
        >
          <option selected value="">
            {{ t('dashboard.entitlements.modal.chooseCoachPlaceholder') }}
          </option>
          <option v-for="coach in organizationTrainers" :key="coach.id" :value="coach.id">
            {{ coach.first_name }} {{ coach.last_name }} ({{ coach.email }})
          </option>
        </select>
        <span v-if="errors.selectedCoach" class="text-red-500 text-sm">
          {{ errors.selectedCoach }}
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
</template>

<script setup lang="ts">
import type { Program } from '@/stores/programstores';
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/lib/supabaseClient';

const { t, locale } = useI18n();

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
const assignmentType = ref('program');
const selectedProgram = ref('');
const selectedCoach = ref('');
const emailsText = ref('');
const errors = ref<Record<string, string>>({});
const organizationTrainers = ref<any[]>([]);

// Computed properties
const isCoachMode = computed(() => assignmentType.value === 'coach');

// Fetch organization trainers
async function fetchOrganizationTrainers() {
  try {
    const orgID = localStorage.getItem('OrgID');
    if (!orgID) return;

    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('organization', orgID)
      .contains('roles', ['Organization Trnr']);

    if (error) {
      console.error('Error fetching organization trainers:', error);
      return;
    }

    organizationTrainers.value = data || [];
  } catch (error) {
    console.error('Error fetching organization trainers:', error);
  }
}

// Handle assignment type change
function handleAssignmentTypeChange() {
  // Reset selections when switching modes
  selectedProgram.value = '';
  selectedCoach.value = '';
  errors.value = {};
}

/** Basic validations before submitting */
function validateForm() {
  errors.value = {};

  if (!assignmentType.value) {
    errors.value.assignmentType = t('dashboard.entitlements.modal.assignmentTypeRequired');
  }

  if (isCoachMode.value) {
    if (!selectedCoach.value) {
      errors.value.selectedCoach = t('dashboard.entitlements.modal.coachRequired');
    }
  } else {
    if (!selectedProgram.value) {
      errors.value.selectedProgram = t('dashboard.entitlements.modal.programRequired');
    }
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

  // Additional check: user can't enter more emails than available entitlements (only for program mode)
  if (!isCoachMode.value && emails.length > props.availableCount) {
    errors.value.emailsText = t('dashboard.entitlements.modal.emailsCountExceeded', {
      count: props.availableCount
    });
    return;
  }

  // Emit the final data to the parent
  emits('submit', {
    type: assignmentType.value,
    programId: selectedProgram.value,
    coachId: selectedCoach.value,
    emails
  });

  // Reset fields
  selectedProgram.value = '';
  selectedCoach.value = '';
  emailsText.value = '';
  assignmentType.value = 'program';
}

// Load organization trainers on mount
onMounted(() => {
  fetchOrganizationTrainers();
});
</script>
