<template>
  <div v-if="visible" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 transition-opacity" aria-hidden="true">
        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white dark:bg-rafik-darksecbg rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="px-6 py-4">
          <!-- Header -->
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-rafik-pritext dark:text-rafik-darkpritext">
              {{ t('dashboard.users.list.assignUserModal.title') }}
            </h3>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- User Info -->
          <div class="mb-6 p-4 bg-gray-50 dark:bg-rafik-darkpribg rounded-lg">
            <div class="flex items-center gap-3">
              <img
                :src="user?.avatar || 'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'"
                class="w-12 h-12 rounded-full border-2 border-rafik"
                alt="User Avatar"
              />
              <div>
                <p class="font-medium text-rafik-pritext dark:text-rafik-darkpritext">
                  {{ user?.first_name }} {{ user?.last_name }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ user?.email }}</p>
              </div>
            </div>
          </div>

          <!-- Assignment Type Toggle -->
          <div class="mb-6">
            <label class="block text-sm font-medium mb-3 text-rafik-pritext dark:text-rafik-darkpritext">
              {{ t('dashboard.users.list.assignUserModal.assignmentType') }}
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
                <span class="text-sm text-rafik-pritext dark:text-rafik-darkpritext">
                  {{ t('dashboard.users.list.assignUserModal.assignToProgram') }}
                </span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input
                  type="radio"
                  v-model="assignmentType"
                  value="coach"
                  class="mr-2"
                  @change="handleAssignmentTypeChange"
                />
                <span class="text-sm text-rafik-pritext dark:text-rafik-darkpritext">
                  {{ t('dashboard.users.list.assignUserModal.assignToCoachDirectly') }}
                </span>
              </label>
            </div>
            <span v-if="errors.assignmentType" class="text-red-500 text-sm">
              {{ errors.assignmentType }}
            </span>
          </div>

          <!-- Program Selection (only show in program mode) -->
          <div v-if="!isCoachMode" class="mb-4">
            <label for="program" class="block text-sm font-medium mb-3 text-rafik-pritext dark:text-rafik-darkpritext">
              {{ t('dashboard.users.list.assignUserModal.programToAssign') }}
            </label>
            <select
              id="program"
              v-model="selectedProgram"
              class="rafik-text-input"
              required
              :class="{ 'border-red-500': errors.selectedProgram }"
            >
              <option selected value="">
                {{ t('dashboard.users.list.assignUserModal.chooseProgramPlaceholder') }}
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
            <label for="coach" class="block text-sm font-medium mb-3 text-rafik-pritext dark:text-rafik-darkpritext">
              {{ t('dashboard.users.list.assignUserModal.coachToAssign') }}
            </label>
            <select
              id="coach"
              v-model="selectedCoach"
              class="rafik-text-input"
              required
              :class="{ 'border-red-500': errors.selectedCoach }"
            >
              <option selected value="">
                {{ t('dashboard.users.list.assignUserModal.chooseCoachPlaceholder') }}
              </option>
              <option v-for="coach in organizationTrainers" :key="coach.id" :value="coach.id">
                {{ coach.first_name }} {{ coach.last_name }} ({{ coach.email }})
              </option>
            </select>
            <span v-if="errors.selectedCoach" class="text-red-500 text-sm">
              {{ errors.selectedCoach }}
            </span>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-3 mt-6">
            <button
              @click="$emit('close')"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              {{ t('dashboard.users.list.assignUserModal.cancel') }}
            </button>
            <button
              @click="submitForm"
              :disabled="processing"
              class="px-4 py-2 text-sm font-medium text-white bg-rafik border border-transparent rounded-md hover:bg-rafik-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="processing">{{ t('dashboard.users.list.assignUserModal.processing') }}</span>
              <span v-else>{{ t('dashboard.users.list.assignUserModal.assign') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Program } from '@/stores/programstores';
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/lib/supabaseClient';

const { t } = useI18n();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: null
  },
  programs: {
    type: Array<Program>,
    default: () => []
  },
  availableEntitlements: {
    type: Number,
    default: 0
  }
});

const emits = defineEmits(['close', 'submit']);

// Local form data
const assignmentType = ref('program');
const selectedProgram = ref('');
const selectedCoach = ref('');
const errors = ref<Record<string, string>>({});
const organizationTrainers = ref<any[]>([]);
const processing = ref(false);

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
    errors.value.assignmentType = t('dashboard.users.list.assignUserModal.assignmentTypeRequired');
  }

  if (isCoachMode.value) {
    if (!selectedCoach.value) {
      errors.value.selectedCoach = t('dashboard.users.list.assignUserModal.coachRequired');
    }
  } else {
    if (!selectedProgram.value) {
      errors.value.selectedProgram = t('dashboard.users.list.assignUserModal.programRequired');
    }
    
    // Check if there are available entitlements
    if (props.availableEntitlements <= 0) {
      errors.value.selectedProgram = t('dashboard.users.list.assignUserModal.noEntitlementsAvailable');
    }
  }

  return Object.keys(errors.value).length === 0;
}

/** Submit the form data to the parent */
function submitForm() {
  if (!validateForm()) return;

  processing.value = true;

  // Emit the final data to the parent
  emits('submit', {
    type: assignmentType.value,
    programId: selectedProgram.value,
    coachId: selectedCoach.value,
    user: props.user
  });

  // Reset fields
  selectedProgram.value = '';
  selectedCoach.value = '';
  assignmentType.value = 'program';
  processing.value = false;
}

// Load organization trainers on mount
onMounted(() => {
  fetchOrganizationTrainers();
});
</script> 