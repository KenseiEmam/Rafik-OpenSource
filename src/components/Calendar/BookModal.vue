<template>
  <div
    v-if="visible"
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
            :start-time="startTime"
            time-picker
            :min-date="new Date()"
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
          :start-time="startTime"
          time-picker
          :min-date="new Date()"
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
              <option value="assessment" disabled>Assessment</option>
              <option value="game">Team Game</option>
              <option value="away">Away</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div v-if="template.type !== 'assessment'">
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
        </div>
     <p v-if="(template.time_end <= template.time_start) && template.time_end !== new Date()" class="text-red-500 ">
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
import { ref, watch , onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user';
const startTime = ref({ hours: 0, minutes: 0 });
const { t } = useI18n();
const darkness = localStorage.getItem('dark_mode');
const userStore = useUserStore()
import { supabase } from '@/lib/supabaseClient';

import 'vue-multiselect/dist/vue-multiselect.css';
import MultiSelect from '../MultiSelect.vue';
interface Option {
  id: string | number;
  name: string;
}
const availableUsers = ref<{ id: number; name: string }[]>([]);
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
};

const handleSubmit = () => {
  if (!template.value.time_start || !template.value.time_end) {
    return;
  }

  // Safely convert user objects to IDs if necessary
  if (Array.isArray(template.value.users)) {
    template.value.users = template.value.users.map((u: any) =>
      typeof u === 'object' && u !== null && 'id' in u ? u.id : u
    );
  }

  emit('submit', template.value);
  resetForm();
};


const handleClose = () => {
  resetForm();
  emit('close');
};


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
