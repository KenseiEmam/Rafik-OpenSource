<template>
  <div
    v-if="visible  && userStore.userProfile?.roles"
    class="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
  >
    <div class="card rounded-lg shadow p-8 w-128  ">
      <h2 class="contentH-medium mb-6">
        Book Slot for {{ templateData.date }}
      </h2>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Template Name and Description -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">
             Starting Time
            </label>
            <VueDatePicker
            :dark="darkness === 'true'"

            @update:model-value="onTimeStartChange"
            v-model="showDate"
            placeholder="Select Time"
            minutes-increment="30"
            :is-24="false"
            time-picker
            :enable-date-picker="false"
          />
          </div>
            <div>
            <label class="block text-sm font-medium mb-2">
             Ending Time
            </label>
         <VueDatePicker
          :dark="darkness === 'true'"
           @update:model-value="onTimeEndChange"
           v-model="showendDate"
          placeholder="Select Time"
          minutes-increment="30"
          :is-24="false"
          time-picker
          :enable-date-picker="false"
          class=""
        />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">
              Event Type
            </label>
            <select
              @change="changeType"
              class="rafik-text-input w-full"
              required
            >
              <option disabled selected value="">Select event type</option>
              <option value="meeting">Meeting</option>
              <option value="assessment" >Assessment</option>
              <option value="game">Team Game</option>
              <option value="away">Away</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div v-if=" template.type !== 'assessment'">
            <div v-if="userStore.userProfile?.roles.includes('Organization Admin')">
              <label class="block text-sm font-medium mb-2">
            Assign Users
          </label>
            <MultiSelect v-if="availableUsers.length > 0"
              v-model="template.users"
              :options="availableUsers"
              :dark="darkness === 'true'"
              searchable
            />
            </div>
            <div v-else class="flex items-center gap-3">
              <span class="bg-rafik animate-pulse w-4 h-4 rounded-full content"></span>
              <p class="text-body">Self Assigning this scheduled event.</p>
            </div>

          </div>
          <div v-else class="space-y-4">

            <div v-if="userStore.userProfile?.roles.includes('Organization Admin')" class="relative trainer-dropdown">
           <!-- Trainer Selection -->
              <div class="w-full">
                <label
                  class="block text-sm font-medium text-rafik-sectext dark:text-rafik-darksectext mb-1"
                >
                  {{ t('dashboard.auditPrograms.list.selectTrainer.label') }}
                </label>
                <div class="relative">
                  <!-- Search Input -->
                  <input
                    type="search"
                    v-model="searchQuery"
                    @focus="dropdownVisible = true"
                    @input="fetchFilteredTrainers"
                    @blur="handleBlur"
                    class="w-full p-3 border rounded-md bg-rafik-secbg dark:bg-rafik-darksecbg text-rafik-sectext dark:text-rafik-darksectext focus:outline-none"
                    :placeholder="t('dashboard.auditPrograms.list.selectTrainer.placeholder')"
                  />
                  <!-- Dropdown -->
                  <div
                    v-if="dropdownVisible && trainerOptions.length"
                    class="absolute z-10 mt-1 w-full bg-rafik-secbg dark:bg-rafik-darksecbg border border-rafik-sectext dark:border-rafik-darksectext max-h-60 overflow-auto"
                  >
                    <div
                      v-for="trainer in trainerOptions"
                      :key="trainer.id"
                      @click="selectOption(trainer)"
                      class="p-3 hover:bg-rafik-secondary hover:text-rafik-pritext cursor-pointer"
                    >
                      {{ (trainer.first_name || 'no') + ' '+ (trainer.last_name || 'name')  }}
                      <span class="text-xs opacity-50"> {{ trainer.email }}</span>
                    </div>
                  </div>
                </div>
              </div>
          </div>
          <div v-else class="flex items-center gap-3">
              <span class="bg-rafik animate-pulse w-4 h-4 rounded-full content"></span>
              <p class="text-body">Self Assigning this scheduled assessment.</p>
            </div>
          <div class="relative trainee-dropdown">
           <!-- Trainee Selection -->
              <div class="w-full">
                <label
                  class="block text-sm font-medium text-rafik-sectext dark:text-rafik-darksectext mb-1"
                >
                  {{ t('dashboard.settings.selectTrainees') }}
                </label>
                <div class="relative">
                  <!-- Search Input -->
                  <input
                    type="search"
                    v-model="searchQuery2"
                    @focus="dropdownVisible2 = true"
                    @input="fetchFilteredTrainees"
                    @blur="handleTraineeBlur"
                    class="w-full p-3 border rounded-md bg-rafik-secbg dark:bg-rafik-darksecbg text-rafik-sectext dark:text-rafik-darksectext focus:outline-none"
                    :placeholder="t('dashboard.settings.searchAndSelectTrainees')"
                  />
                  <!-- Dropdown -->
                  <div
                    v-if="dropdownVisible2 && traineeOptions.length"
                    class="absolute z-10 mt-1 w-full bg-rafik-secbg dark:bg-rafik-darksecbg border border-rafik-sectext dark:border-rafik-darksectext max-h-60 overflow-auto"
                  >
                    <div
                      v-for="trainee in traineeOptions"
                      :key="trainee.id"
                      @click="selectTraineeOption(trainee)"
                      :class="[
                        'p-3 cursor-pointer',
                        assessment.trainees.includes(trainee.id) 
                          ? 'bg-rafik-secondary text-rafik-pritext' 
                          : 'hover:bg-rafik-secondary hover:text-rafik-pritext'
                      ]"
                    >
                      {{ (trainee.first_name || 'no') + ' '+ (trainee.last_name || 'name')  }}
                      <span class="text-xs opacity-50"> {{ trainee.email }}</span>
                      <span v-if="assessment.trainees.includes(trainee.id)" class="text-xs ml-2">✓ Selected</span>
                    </div>
                  </div>
                </div>
              </div>
          </div>

          <!-- Selected Trainees Display -->
          <div v-if="assessment.trainees.length > 0" class="bg-rafik-secbg dark:bg-rafik-darksecbg p-3 rounded-lg">
            <label class="block text-sm font-medium text-rafik-sectext dark:text-rafik-darksectext mb-2">
              {{ t('dashboard.settings.selectedTrainees') }}
            </label>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="traineeId in assessment.trainees"
                :key="traineeId"
                class="bg-rafik-pribg dark:bg-rafik-darkpribg px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                <span>{{ getTraineeName(traineeId) }}</span>
                <button
                  @click="removeTrainee(traineeId)"
                  class="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">
              Choose Template
            </label>
            <select
              v-model="assessment.template"
              class="rafik-text-input w-full"
              required
            >
              <option selected :value="null">Select assessment template</option>
              <option v-for="temp in myTemplates" :value="temp.id">{{temp.template_name}}</option>
            </select>
          </div>

          <!-- Recurring Schedule Options -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">
                {{ t('dashboard.settings.repeatEvery') }}
              </label>
              <select
                v-model="recurringSchedule.repeatType"
                class="rafik-text-input w-full"
                @change="onRepeatTypeChange"
              >
                <option value="none">{{ t('dashboard.settings.noRepeat') }}</option>
                <option value="daily">{{ t('dashboard.settings.everyDay') }}</option>
                <option value="weekly">{{ t('dashboard.settings.everyWeek') }}</option>
                <option value="monthly">{{ t('dashboard.settings.everyMonth') }}</option>
                <option value="custom">{{ t('dashboard.settings.custom') }}</option>
              </select>
            </div>

            <!-- Custom Repeat Options -->
            <div v-if="recurringSchedule.repeatType === 'custom'" class="space-y-4">
              <div class="flex gap-4">
                <div class="flex-1">
                  <label class="block text-sm font-medium mb-2">
                    Repeat Every
                  </label>
                  <input
                    v-model="recurringSchedule.customInterval"
                    type="number"
                    min="1"
                    class="rafik-text-input w-full"
                    placeholder="1"
                  />
                </div>
                <div class="flex-1">
                  <label class="block text-sm font-medium mb-2">
                    &nbsp;
                  </label>
                  <select
                    v-model="recurringSchedule.customUnit"
                    class="rafik-text-input w-full"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- End Date for Recurring Events (Optional) -->
            <div v-if="recurringSchedule.repeatType !== 'none'">
              <label class="block text-sm font-medium mb-2">
                {{ t('dashboard.settings.endDate') }} (Optional)
              </label>
              <VueDatePicker
                :dark="darkness === 'true'"
                v-model="recurringSchedule.endDate"
                :placeholder="'Select end date (optional)'"
                :min-date="new Date()"
                date-picker
                :enable-time-picker="false"
              />
              <p class="text-xs text-gray-500 mt-1">Leave empty to continue indefinitely</p>
            </div>

            <!-- Days Off Selection -->
            <div v-if="recurringSchedule.repeatType !== 'none'">
              <label class="block text-sm font-medium mb-2">
                {{ t('dashboard.settings.daysOff') }}
              </label>
              <div class="flex flex-wrap gap-2">
                <label
                  v-for="day in weekDays"
                  :key="day.value"
                  class="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :value="day.value"
                    v-model="recurringSchedule.daysOff"
                    class="form-checkbox h-4 w-4 text-rafik"
                  />
                  <span class="text-sm">{{ day.label }}</span>
                </label>
              </div>
            </div>
          </div>
          </div>
        </div>
     <p v-if="(template.time_end <= template.time_start) && showendDate" class="text-red-500 ">
  End time cannot be before or equal to start time!
</p>

<!-- Action Buttons -->
<div class="flex justify-end gap-4 mt-8">
  <button
    type="button"
    @click="handleClose"
    class="btn-md bg-red-500 border-red-500 hover:bg-red-400 rounded"
  >
    {{ t('dashboard.tabs.program.template.cancel') }}
  </button>
  <button
    :disabled="template.time_end <= template.time_start"
    type="submit"
      class="btn-md rounded disabled:bg-gray-400 disabled:text-gray-700 disabled:cursor-not-allowed"
  >
    {{ isEditing ? t('dashboard.tabs.program.template.save') : t('dashboard.tabs.program.template.create') }}
  </button>
</div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch , onMounted, computed, type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user';
const startTime = ref({ hours: 0, minutes: 0 });
const searchQuery = ref('');
const searchQuery2 = ref('');
const dropdownVisible = ref(false);
const dropdownVisible2 = ref(false);
const { t, locale } = useI18n();
const loading = ref(true);
const darkness = localStorage.getItem('dark_mode');
const userStore = useUserStore()
const traineeOptions = ref<any[]>([]);
const trainerOptions = ref<any[]>([]);
const selectedTrainees = ref<any[]>([]);

// Recurring schedule configuration
const recurringSchedule = ref({
  repeatType: 'none',
  customInterval: 1,
  customUnit: 'days',
  endDate: null as Date | null,
  daysOff: [] as number[]
});

// Week days for days off selection
const weekDays = ref([
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]);

const assessment = ref<{
  assessors: number[],
  slot: any,
  trainees: number[],
  status: string,
  template: any,
  organization: any
}>({
  assessors: [],
  slot: null,
  trainees: [],
  status: 'scheduled',
  template: null,
  organization: null
});

import { supabase } from '@/lib/supabaseClient';

import 'vue-multiselect/dist/vue-multiselect.css';
import MultiSelect from '../MultiSelect.vue';
interface Option {
  id: number;
  name: string;
}
interface myTemp {
  id: string | number;
  template_name: string;
}
const availableUsers = ref<{ id: number; name: string }[]>([]);
// The selected trainer (if needed for your filters)
const selectedTrainer = ref(null);
const selectedTrainee = ref(null);
const isOrg = !!localStorage.getItem('OrgID');

// Set the selected trainer and hide dropdown
function selectOption(option: any) {
  selectedTrainer.value = option;
  searchQuery.value = `${option.first_name} ${option.last_name}`  ;
  dropdownVisible.value = false;
  if(option.id)
  assessment.value.assessors.push(option.id);

}
// Set the selected trainee and hide dropdown
function selectTraineeOption(option: any) {
  // Check if trainee is already selected
  if (!assessment.value.trainees.includes(option.id)) {
    assessment.value.trainees.push(option.id);
    selectedTrainees.value.push(option);
  }
  searchQuery2.value = '';
  // Keep dropdown open for a moment to show the selection was made
  setTimeout(() => {
    dropdownVisible2.value = false;
  }, 100);
}
// Optional: Hide the dropdown if clicking outside
document.addEventListener('click', (e: any) => {
  const target = e.target as HTMLElement;
  
  // Check if click is outside trainer dropdown
  const trainerDropdown = document.querySelector('.trainer-dropdown');
  if (trainerDropdown && !trainerDropdown.contains(target)) {
    dropdownVisible.value = false;
  }
  
  // Check if click is outside trainee dropdown
  const traineeDropdown = document.querySelector('.trainee-dropdown');
  if (traineeDropdown && !traineeDropdown.contains(target)) {
    dropdownVisible2.value = false;
  }
});
async function fetchFilteredTrainers() {
  dropdownVisible.value = true;
  if (!searchQuery.value) {
    trainerOptions.value = [];
    return;
  }
 const orgId = userStore.userProfile?.organization;

  if (orgId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .eq('organization', orgId)
    .contains('roles', ['Organization Trnr'])
    .or(
      `first_name.ilike.%${searchQuery.value}%, last_name.ilike.%${searchQuery.value}%, email.ilike.%${searchQuery.value}%`
    );

  if (error) {
    console.error('Error fetching trainers:', error.message);
    return;
  }

  trainerOptions.value = data;
}
}
async function fetchFilteredTrainees() {
  dropdownVisible2.value = true;
  if (!searchQuery2.value) {
    // Show all trainees when input is empty
    const orgId = userStore.userProfile?.organization;
    if (orgId) {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('organization', orgId)
        .contains('roles', ['Organization Trnee'])
        .limit(20); // Limit to prevent too many results

      if (error) {
        console.error('Error fetching trainees:', error.message);
        return;
      }

      traineeOptions.value = data || [];
    }
    return;
  }
 const orgId = userStore.userProfile?.organization;

  if (orgId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .eq('organization', orgId)
    .contains('roles', ['Organization Trnee'])
    .or(
      `first_name.ilike.%${searchQuery2.value}%, last_name.ilike.%${searchQuery2.value}%, email.ilike.%${searchQuery2.value}%`
    );

  if (error) {
    console.error('Error fetching trainees:', error.message);
    return;
  }

  traineeOptions.value = data;
}
}
// Reset filter when search input is cleared (native clear button)
watch(searchQuery, (newValue) => {
  if (!newValue) resetFilter();
});

watch(searchQuery2, (newValue) => {
  if (!newValue) resetTraineeFilter();
});
function resetFilter() {
  assessment.value.assessors = [];
  trainerOptions.value = [];
  dropdownVisible.value = false;
}
function resetTraineeFilter() {
  traineeOptions.value = [];
  dropdownVisible2.value = false;
}

// Get trainee name by ID
function getTraineeName(traineeId: number): string {
  const trainee = selectedTrainees.value.find(t => t.id === traineeId);
  if (trainee) {
    return `${trainee.first_name || ''} ${trainee.last_name || ''}`.trim();
  }
  return 'Unknown Trainee';
}

// Remove trainee from selection
function removeTrainee(traineeId: number) {
  const index = assessment.value.trainees.indexOf(traineeId);
  if (index > -1) {
    assessment.value.trainees.splice(index, 1);
  }
  // Also remove from selectedTrainees
  const traineeIndex = selectedTrainees.value.findIndex(t => t.id === traineeId);
  if (traineeIndex > -1) {
    selectedTrainees.value.splice(traineeIndex, 1);
  }
}

// Handle repeat type change
function onRepeatTypeChange() {
  if (recurringSchedule.value.repeatType === 'none') {
    recurringSchedule.value.endDate = null;
    recurringSchedule.value.daysOff = [];
  }
}
function handleBlur() {
  setTimeout(() => {
    dropdownVisible.value = false;
  }, 200);
}
function handleTraineeBlur() {
  setTimeout(() => {
    dropdownVisible2.value = false;
  }, 200);
}
onMounted(async () => {
  const orgId = userStore.userProfile?.organization;

  if (orgId) {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('organization', orgId);

    if (!error && data) {
      availableUsers.value = data
        .filter(user => user.first_name || user.last_name) // Only users with both names
        .map((user) => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
        }));

      console.log(availableUsers.value);
    }
  }
});
function changeType(event:any){
  template.value.type = event.target.value
  template.value.users = []
}
const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  templateData: {
    type: Object,
    default: () => ({})
  },
  myTemplates: {
    type: Array as PropType<myTemp[]>,
    default: () => []
  }
});
const showDate = ref(null)
const showendDate = ref(null)
const emit = defineEmits(['close', 'submit']);
// Merge time into date from templateData.date
function mergeDateAndTime(dateString: string, time: { hours: number, minutes: number, seconds?: number }): Date {
  const [year, month, day] = dateString.split('-').map(Number);

  const news = new Date(
    year,
    month - 1, // JavaScript months are 0-based
    day,
    time.hours,
    time.minutes,
    time.seconds || 0
  );

  return news
}


function onTimeStartChange(time: any) {

  template.value.time_start = mergeDateAndTime(props.templateData.date, time);
  console.log(template.value.time_start)
}

function onTimeEndChange(time: any) {
  template.value.time_end = mergeDateAndTime(props.templateData.date, time);
  console.log(template.value.time_end)
}
const template = ref<{
  time_start: Date;
  time_end: Date;
  users: Option[];
  groups: number[];
  type: string;
  assessment: any | null;
  recurringSchedule?: any;
  recurrence_rule?: any; // Added for recurrence rule
  assessment_data?: any; // Added for assessment data
}>({
  time_start: new Date(),
  time_end: new Date(),
  users: [],
  groups: [],
  type: 'meeting',
  assessment: null,
});


const resetForm = () => {
  template.value = {
  time_start: new Date(),
  time_end: new Date(),
  users: [],      // Array of user IDs
  groups: [],     // Array of group IDs
  type: "meeting",
  assessment: null, // Optional assessment relation
  };
  assessment.value={
  assessors:[],
  slot:null,
  trainees:[],
  status:'scheduled',
  template:null,
  organization:null
}
  // Reset recurring schedule
  recurringSchedule.value = {
    repeatType: 'none',
    customInterval: 1,
    customUnit: 'days',
    endDate: null,
    daysOff: []
  };
  // Reset selected trainees
  selectedTrainees.value = [];
}

const handleSubmit = () => {
  if (!template.value.time_start || !template.value.time_end) {
    return;
  }

  // Validation for assessment events
  if (template.value.type === 'assessment') {
    // Check if at least one trainer is selected
    if (assessment.value.assessors.length === 0) {
      alert('Please select at least one trainer for the assessment.');
      return;
    }
    
    // Check if at least one trainee is selected
    if (assessment.value.trainees.length === 0) {
      alert('Please select at least one trainee for the assessment.');
      return;
    }
    
    // Check if assessment template is selected
    // if (!assessment.value.template) {
    //   alert('Please select an assessment template.');
    //   return;
    // }
  }

  if(!userStore.userProfile?.roles?.includes('Organization Admin')) {
    const uid = localStorage.getItem('UserID')
    if(uid) {
      if (template.value.type === 'assessment')
        assessment.value.assessors.push(parseInt(uid))
      else
        template.value.users.push({id:parseInt(uid), name:'blade'})
    }
  }
  if (template.value.type === 'assessment') {
    const assessors = assessment.value.assessors.map(id => ({
      id,
      name: getUserNameById(id)
    }));
    const trainees = assessment.value.trainees.map(id => ({
      id,
      name: getUserNameById(id)
    }));
    template.value.users = [...assessors, ...trainees];
  }

  // Safely convert user objects to IDs if necessary
  if (Array.isArray(template.value.users)) {
    template.value.users = template.value.users.map((u: any) =>
      typeof u === 'object' && u !== null && 'id' in u ? u.id : u
    );
  }

  // Build recurrence rule JSON
  let recurrenceRule = null;
  if (recurringSchedule.value.repeatType !== 'none') {
    recurrenceRule = {
      freq: recurringSchedule.value.repeatType,
      customInterval: recurringSchedule.value.customInterval,
      customUnit: recurringSchedule.value.customUnit,
      endDate: recurringSchedule.value.endDate,
      daysOff: recurringSchedule.value.daysOff
    };
  }

  // Add recurrence_rule to the template
  template.value.recurrence_rule = recurrenceRule;

  // For recurring assessments, store the assessment data in the slot for later use
  if (template.value.type === 'assessment' && template.value.recurrence_rule && template.value.recurrence_rule.freq !== 'none') {
    template.value.assessment_data = {
      assessors: assessment.value.assessors,
      trainees: assessment.value.trainees,
      template: assessment.value.template,
      status: 'scheduled'
    };
  }

  emit('submit', template.value, assessment.value);
  resetForm();
};


const handleClose = () => {
  resetForm();
  emit('close');
};

function getUserNameById(id: number) {
  const trainee = selectedTrainees.value.find(u => u.id === id);
  if (trainee) return `${trainee.first_name || ''} ${trainee.last_name || ''}`.trim();
  const trainer = trainerOptions.value.find(u => u.id === id);
  if (trainer) return `${trainer.first_name || ''} ${trainer.last_name || ''}`.trim();
  return '';
}

// Set default end date for recurring events to 6 months from the selected start date
watch(
  () => recurringSchedule.value.repeatType,
  (newType) => {
    if (newType !== 'none' && props.templateData.date) {
      const startDate = new Date(props.templateData.date);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 6);
      recurringSchedule.value.endDate = endDate;
    } else if (newType === 'none') {
      recurringSchedule.value.endDate = null;
    }
  }
);

// Also set default end date when modal opens with a repeat type already selected
watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible && recurringSchedule.value.repeatType !== 'none' && props.templateData.date && !recurringSchedule.value.endDate) {
      const startDate = new Date(props.templateData.date);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 6);
      recurringSchedule.value.endDate = endDate;
    }
  }
);

</script>
<style scoped>
/* in your app.scss of laravel */
.multiselect__tags {
    background: none !important;
}

.multiselect__tags .multiselect__single {
    @apply dark:bg-gray-900
}

.multiselect .multiselect__input {
    @apply dark:bg-gray-900
}

.multiselect .multiselect__content-wrapper {
    @apply dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800
}

.multiselect .multiselect__option--selected {
    @apply dark:bg-gray-700 dark:text-gray-300
}
</style>
