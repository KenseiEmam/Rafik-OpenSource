<template>
  <div
    v-if="visible"
    class="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
  >
    <div class="card rounded-lg shadow p-8 w-128">
      <h2 class="contentH-medium mb-6">
        {{ t('dashboard.settings.rescheduleAssessment') }}
      </h2>

      <div v-if="assessmentData" class="space-y-6">
        <!-- Current Assessment Info -->
        <div class="bg-rafik-secbg dark:bg-rafik-darksecbg p-4 rounded-lg">
          <h3 class="font-semibold mb-2">{{ t('dashboard.settings.currentAssessmentDetails') }}</h3>
          <div class="space-y-2 text-sm">
            <p><strong>{{ t('dashboard.settings.trainee') }}:</strong> {{ getTraineeName() }}</p>
            <p><strong>{{ t('dashboard.settings.template') }}:</strong> {{ getTemplateName() }}</p>
            <p><strong>{{ t('dashboard.settings.currentTime') }}:</strong> {{ formatCurrentTime() }}</p>
            <p><strong>Status:</strong> 
              <span class="px-2 py-1 rounded text-xs" :class="getStatusClasses(assessmentData.status)">
                {{ assessmentData.status }}
              </span>
            </p>
          </div>
        </div>

        <!-- New Time Selection -->
        <div class="space-y-4">
          <!-- Date Selection -->
          <div>
            <label class="block text-sm font-medium mb-2">
              New Date
            </label>
            <VueDatePicker
              :dark="darkness === 'true'"
              @update:model-value="onDateChange"
              v-model="newDate"
              :placeholder="t('dashboard.settings.selectDate')"
              :min-date="new Date()"
              date-picker
              :enable-time-picker="false"

            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">
              {{ t('dashboard.settings.newStartTime') }}
            </label>
            <VueDatePicker
              :dark="darkness === 'true'"
              @update:model-value="onTimeStartChange"
              v-model="newStartTime"
              :placeholder="t('dashboard.settings.selectStartTime')"
              minutes-increment="30"
              :is-24="false"
              :start-time="startTime"
              time-picker
              :enable-date-picker="false"
              :min-date="new Date()"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">
              {{ t('dashboard.settings.newEndTime') }}
            </label>
            <VueDatePicker
              :dark="darkness === 'true'"
              @update:model-value="onTimeEndChange"
              v-model="newEndTime"
              :placeholder="t('dashboard.settings.selectEndTime')"
              minutes-increment="30"
              :is-24="false"
              :start-time="startTime"
              time-picker
              :enable-date-picker="false"
              :min-date="new Date()"
            />
          </div>
        </div>

        <!-- Validation Error -->
        <p v-if="timeError" class="text-red-500 text-sm">
          {{ timeError }}
        </p>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-4 mt-8">
          <button
            type="button"
            @click="handleClose"
            class="btn-md bg-red-500 border-red-500 hover:bg-red-400 rounded"
          >
            {{ t('dashboard.settings.cancel') }}
          </button>
          <button
            :disabled="!canSubmit"
            type="submit"
            @click="handleReschedule"
            class="btn-md rounded disabled:bg-gray-400 disabled:text-gray-700 disabled:cursor-not-allowed"
          >
            {{ t('dashboard.settings.rescheduleAssessmentButton') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user';
import { useAssessmentStore } from '@/stores/assessmentstores';
import { useSlotStore } from '@/stores/slotstores';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

const { t } = useI18n();
const userStore = useUserStore();
const assessmentStore = useAssessmentStore();
const slotStore = useSlotStore();

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  assessmentData: {
    type: Object as () => any,
    default: null
  },
  slotData: {
    type: Object as () => any,
    default: null
  }
});

const emit = defineEmits(['close', 'rescheduled']);

const darkness = localStorage.getItem('dark_mode');
const startTime = ref({ hours: 0, minutes: 0 });
const newStartTime = ref<Date | null>(null);
const newEndTime = ref<Date | null>(null);
const newDate = ref<Date | null>(null);
const timeError = ref('');

// Store time values separately to avoid proxy issues
const startTimeValue = ref<{ hours: number, minutes: number, seconds: number } | null>(null);
const endTimeValue = ref<{ hours: number, minutes: number, seconds: number } | null>(null);

// Computed properties
const canSubmit = computed(() => {
  const hasDate = !!newDate.value;
  const hasStartTime = !!startTimeValue.value;
  const hasEndTime = !!endTimeValue.value;
  const noError = !timeError.value;
  
  // Create Date objects for comparison only when needed
  let validTimeRange = false;
  if (hasDate && hasStartTime && hasEndTime) {
    const startDate = new Date(
      newDate.value!.getFullYear(),
      newDate.value!.getMonth(),
      newDate.value!.getDate(),
      startTimeValue.value!.hours,
      startTimeValue.value!.minutes,
      startTimeValue.value!.seconds
    );
    
    const endDate = new Date(
      newDate.value!.getFullYear(),
      newDate.value!.getMonth(),
      newDate.value!.getDate(),
      endTimeValue.value!.hours,
      endTimeValue.value!.minutes,
      endTimeValue.value!.seconds
    );
    
    validTimeRange = startDate < endDate;
  }
  
  return hasDate && hasStartTime && hasEndTime && noError && validTimeRange;
});

// Methods
function getTraineeName(): string {
  if (!props.assessmentData?.trainees?.[0]) return 'Unknown Trainee';
  
  const trainee = assessmentStore.trainees[props.assessmentData.trainees[0]];
  if (!trainee) return 'Loading...';
  
  return `${trainee.first_name || ''} ${trainee.last_name || ''}`.trim() || 'Unknown Trainee';
}

function getTemplateName(): string {
  if (!props.assessmentData?.template) return 'No Template';
  
  const template = assessmentStore.templateData[props.assessmentData.template];
  if (!template) return 'Loading...';
  
  return template.template_name || template.name || 'Untitled Template';
}

function formatCurrentTime(): string {
  if (!props.slotData?.time_start || !props.slotData?.time_end) return 'No time set';
  
  const start = new Date(props.slotData.time_start);
  const end = new Date(props.slotData.time_end);
  
  return `${start.toLocaleString()} - ${end.toLocaleString()}`;
}

function getStatusClasses(status: string): string {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'complete':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    case 'canceled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

function mergeDateAndTime(dateString: string, time: { hours: number, minutes: number, seconds?: number }): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  
  return new Date(
    year,
    month - 1,
    day,
    time.hours,
    time.minutes,
    time.seconds || 0
  );
}

function onDateChange(date: Date) {
  newDate.value = date;
  
  // Update the Date objects for the time pickers if times are already selected
  if (startTimeValue.value) {
    newStartTime.value = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      startTimeValue.value.hours,
      startTimeValue.value.minutes,
      startTimeValue.value.seconds
    );
  }
  
  if (endTimeValue.value) {
    newEndTime.value = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      endTimeValue.value.hours,
      endTimeValue.value.minutes,
      endTimeValue.value.seconds
    );
  }
  
  validateTimes();
}

function onTimeStartChange(time: any) {
  if (!newDate.value) {
    return;
  }
  
  // Store the time value
  startTimeValue.value = {
    hours: time.hours,
    minutes: time.minutes,
    seconds: time.seconds || 0
  };
  
  // Update the Date object for the picker
  newStartTime.value = new Date(
    newDate.value.getFullYear(),
    newDate.value.getMonth(),
    newDate.value.getDate(),
    time.hours,
    time.minutes,
    time.seconds || 0
  );
  
  validateTimes();
}

function onTimeEndChange(time: any) {
  if (!newDate.value) {
    return;
  }
  
  // Store the time value
  endTimeValue.value = {
    hours: time.hours,
    minutes: time.minutes,
    seconds: time.seconds || 0
  };
  
  // Update the Date object for the picker
  newEndTime.value = new Date(
    newDate.value.getFullYear(),
    newDate.value.getMonth(),
    newDate.value.getDate(),
    time.hours,
    time.minutes,
    time.seconds || 0
  );
  
  validateTimes();
}

function validateTimes() {
  timeError.value = '';
  
  if (startTimeValue.value && endTimeValue.value) {
    const startDate = new Date(
      newDate.value!.getFullYear(),
      newDate.value!.getMonth(),
      newDate.value!.getDate(),
      startTimeValue.value.hours,
      startTimeValue.value.minutes,
      startTimeValue.value.seconds
    );
    
    const endDate = new Date(
      newDate.value!.getFullYear(),
      newDate.value!.getMonth(),
      newDate.value!.getDate(),
      endTimeValue.value.hours,
      endTimeValue.value.minutes,
      endTimeValue.value.seconds
    );
    
    if (startDate >= endDate) {
      timeError.value = t('dashboard.settings.endTimeAfterStart');
    }
  }
}

async function handleReschedule() {
  if (!props.slotData?.id || !startTimeValue.value || !endTimeValue.value || !newDate.value) {
    return;
  }

  try {
    const startDate = new Date(
      newDate.value.getFullYear(),
      newDate.value.getMonth(),
      newDate.value.getDate(),
      startTimeValue.value.hours,
      startTimeValue.value.minutes,
      startTimeValue.value.seconds
    );
    
    const endDate = new Date(
      newDate.value.getFullYear(),
      newDate.value.getMonth(),
      newDate.value.getDate(),
      endTimeValue.value.hours,
      endTimeValue.value.minutes,
      endTimeValue.value.seconds
    );
    
    await slotStore.rescheduleSlot(
      props.slotData.id,
      startDate.toISOString(),
      endDate.toISOString()
    );
    
    emit('rescheduled');
    handleClose();
  } catch (error) {
    console.error('Reschedule failed:', error);
  }
}

function handleClose() {
  newStartTime.value = null;
  newEndTime.value = null;
  newDate.value = null;
  startTimeValue.value = null;
  endTimeValue.value = null;
  timeError.value = '';
  emit('close');
}

// Watch for prop changes to reset form and preload current date
watch(() => props.visible, (newValue) => {
  if (newValue && props.slotData?.time_start) {
    // Preload with current date from the slot
    const currentDate = new Date(props.slotData.time_start);
    newDate.value = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  } else if (!newValue) {
    handleClose();
  }
});
</script>

<style scoped>
/* Add any custom styles here */
</style> 