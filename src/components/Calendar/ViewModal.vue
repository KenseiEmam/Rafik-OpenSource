<template>
  <!-- root overlay: key change is :dir binding -->
  <div
    v-if="visible"
    :dir="locale === 'ar' ? 'rtl' : 'ltr'"
    class="fixed inset-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
  >
    <div class="card rounded-lg shadow p-8 w-128">
     <!-- Show time here as day -->
        <h2 class="contentH-medium mb-6">
         {{ templateData.type}} for {{ formattedDay }}
        </h2>

        <div class="space-y-6">


          <!-- Show time here as hours -->
          <div class="flex w-full items-center justify-between">
            <p class="block text-sm font-medium mb-2">
              Starting Time:
            </p>
            <h3 class="text-rafik-secondary">{{ formattedStart }}</h3>
          </div>

          <!-- Show time here as hours -->
          <div class="flex w-full items-center justify-between">
            <p class="block text-sm font-medium mb-2">
              Ending Time:
            </p>
            <h3 class="text-rafik-secondary">{{ formattedEnd }}</h3>
          </div>



        <p v-if="loading">Loading User Data</p>

        <div v-else>
          <!-- Show Users if Not Assessment -->
          <div
            v-if="templateData.type !== 'assessment'"
            class="flex flex-col w-full gap-2"
          >
            <p class="block text-sm font-medium mb-2">
              Users:
            </p>
            <div class="flex w-full flex-wrap gap-3">
              <div
                v-for="user in users"
                :key="user.id"
                class="gradient-bg p-3 rounded flex gap-3 items-center"
              >
              <img :src="user.avatar||
                  'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'" class="rounded-full h-16 w-16 border border-rafik-secondary" alt="">
              <div>
                <h3 class="text-lg text-rafik-secondary">{{ user.first_name }} {{ user.last_name }}</h3>
                <p class="text-xs" >{{ user.email }}</p>
              </div>
              </div>
            </div>
          </div>

          <!-- Show Assessors if Assessment -->
          <div v-else class="space-y-4">
           <div>
             <p class="block text-sm font-medium mb-2">
              Assessors:
            </p>
            <div class="flex w-full flex-wrap gap-3">
              <div
                v-for="user in filterAssessors"
                :key="user.id"
                class="gradient-bg p-3 rounded flex gap-3 items-center"
              >
              <img :src="user.avatar||
                  'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'" class="rounded-full h-16 w-16 border border-rafik-secondary" alt="">
              <div>
                <h3 class="text-lg text-rafik-secondary">{{ user.first_name }} {{ user.last_name }}</h3>
                <p class="text-xs" >{{ user.email }}</p>
              </div>
              </div>
            </div>
           </div>
           <div>
             <p class="block text-sm font-medium mb-2">
              Trainees:
            </p>
            <div class="flex w-full flex-wrap gap-3">
              <div
                v-for="user in filterTrainees"
                :key="user.id"
                class="gradient-bg p-3 rounded flex gap-3 items-center"
              >
              <img :src="user.avatar||
                  'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'" class="rounded-full h-16 w-16 border border-rafik-secondary" alt="">
              <div>
                <h3 class="text-lg text-rafik-secondary">{{ user.first_name }} {{ user.last_name }}</h3>
                <p class="text-xs" >{{ user.email }}</p>
              </div>
              </div>
            </div>
           </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div
          class="flex justify-end rtl:justify-start gap-4 mt-8 wrap w-full"
        >
                  <button
            @click="emit('delete')" v-if="checkPermssion"
            class="btn-md bg-red-500 border-red-500 hover:bg-red-400 rounded disabled:bg-gray-400 disabled:text-gray-700 disabled:cursor-not-allowed"
          >
            Delete
          </button>
          <button
            type="button"
            @click="handleClose"
            class="btn-md-outline rounded"
          >
            Close
          </button>
          <router-link :to="{name:'assessment-details', params:{id:templateData.assessment}}" v-if="templateData.assessment && !loading" class="btn-md rounded">
            View Assessment
          </router-link>
        <!-- Reschedule button for assessment slots -->

        </div>
        <div v-if="true || templateData.type === 'assessment' && templateData.status === 'scheduled' && canReschedule()" class="flex flex-1 items-center  w-full justify-between">
            <button
              @click="handleRescheduleClick"
              class="btn-md w-full"
            >
              Reschedule Assessment
            </button>
          </div>
      </div>
    </div>
  </div>

  <!-- Reschedule Modal -->
  <RescheduleModal
    :visible="showRescheduleModal"
    :assessmentData="selectedAssessment"
    :slotData="selectedSlot"
    @close="showRescheduleModal = false"
    @rescheduled="handleRescheduleComplete"
  />
</template>

<script setup lang="ts">
import {
  ref,
  watch,
  onMounted,
  computed,
  type PropType
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useAssessmentStore } from '@/stores/assessmentstores';
import { supabase } from '@/lib/supabaseClient';
import { useUserStore } from '@/stores/user';
import { useSlotStore } from '@/stores/slotstores';
import RescheduleModal from './RescheduleModal.vue';

const { t, locale } = useI18n();          // locale already available
const loading = ref(false);
const assessmentStore = useAssessmentStore();
const userStore = useUserStore();
const slotStore = useSlotStore();

// Reschedule modal state
const showRescheduleModal = ref(false);
const selectedAssessment = ref<any>(null);
const selectedSlot = ref<any>(null);

function checkPermssion(){
  const user = localStorage.getItem('UserID')
  const roles = localStorage.getItem('Roles')

  if(!user || !roles)
  return false

  if(roles?.includes('Admin')|| assessmentStore.AssessmentItem?.assessors?.includes(user))
  return true
  else return false
}
interface Option {
  id: string | number;
  name: string;
}
interface myTemp {
  id: string | number;
  template_name: string;
}

const props = defineProps({
  visible: Boolean,
  assessment: {
    type: Number,
    default: null
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

const emit = defineEmits(['close', 'delete', 'rescheduled']);
const users = ref<any[]>([]);

const filterAssessors = computed(() =>
  users.value.filter(u =>
    assessmentStore.AssessmentItem?.assessors?.some(
      (a: any) => a === u.id
    )
  )
);


const filterTrainees = computed(() =>
  users.value.filter(u =>
    assessmentStore.AssessmentItem?.trainees?.some(
      (a: any) => a === u.id
    )
  )
);


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
  assessment: null
});

const resetForm = () => {
  template.value = {
    time_start: new Date(),
    time_end: new Date(),
    users: [],
    groups: [],
    type: 'meeting',
    assessment: null
  };
};
const formattedDay = computed(() => {
  if (!props.templateData.time_start) return '';
  return new Date(props.templateData.time_start).toLocaleDateString(locale.value, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

const formattedStart = computed(() => {
  if (!props.templateData.time_start) return '';
  return new Date(props.templateData.time_start).toLocaleTimeString(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
  });
});

const formattedEnd = computed(() => {
  if (!props.templateData.time_end) return '';
  return new Date(props.templateData.time_end).toLocaleTimeString(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
  });
});

watch(
  () => props.templateData,
  async (templateData) => {

    if (!templateData || Object.keys(templateData).length === 0) return;

    loading.value = true;
 assessmentStore.clearAssessment
    // Extract user IDs
    const userIds = Array.isArray(templateData.users)
      ? templateData.users.map((u: any) =>
          typeof u === 'object' ? u.id : u
        )
      : [];
    if (userIds.length > 0) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);

      if (!error) {
        users.value = data ?? [];
      }
    }

    // Fetch assessment if it exists
    if (templateData.assessment) {
      await assessmentStore.getAssessment(templateData.assessment);
    }

    loading.value = false;
  },
  { immediate: true, deep: true } // fire once on mount and on deep prop changes
);




const handleClose = () => {
  resetForm();
  emit('close');
};

// Check if user can reschedule this assessment
function canReschedule(): boolean {
  const userRoles = userStore.userProfile?.roles || [];
  const userId = localStorage.getItem('UserID');

  // Organization Admin can reschedule any assessment
  if (userRoles.includes('Organization Admin')) {
    return true;
  }

  // Organization Trnr can only reschedule assessments they're assigned to
  if (userRoles.includes('Organization Trnr') && userId) {
    return assessmentStore.AssessmentItem?.assessors?.includes(userId) || false;
  }

  return false;
}

// Handle reschedule button click
async function handleRescheduleClick() {
  try {
    selectedAssessment.value = assessmentStore.AssessmentItem;
    selectedSlot.value = props.templateData;
    showRescheduleModal.value = true;
  } catch (error) {
    console.error('Error preparing reschedule:', error);
  }
}

// Handle reschedule completion
async function handleRescheduleComplete() {
  showRescheduleModal.value = false;
  selectedAssessment.value = null;
  selectedSlot.value = null;

  // Emit rescheduled event to refresh the calendar
  emit('rescheduled');
}
</script>

<style scoped>
/* in your app.scss of laravel */
.multiselect__tags {
  background: none !important;
}

.multiselect__tags .multiselect__single {
  @apply dark:bg-gray-900;
}

.multiselect .multiselect__input {
  @apply dark:bg-gray-900;
}

.multiselect .multiselect__content-wrapper {
  @apply dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800;
}

.multiselect .multiselect__option--selected {
  @apply dark:bg-gray-700 dark:text-gray-300;
}
</style>
