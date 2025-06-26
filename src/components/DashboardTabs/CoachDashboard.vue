<template>
  <div v-if="user"
    class="grid grid-cols-3 grid w-full my-3 rows-3 items-center relative flex-1 gap-4 items-stretch"
  >
  <div class="card row-span-2 p-6">
    <h3 class="2xl:contentH-small ">Performance Target</h3>
  </div>
  <div class="card  p-6">
    <h3 class="2xl:contentH-small ">Best Trainee</h3>
    <p class="my-6">To be introduced</p>
  </div>
  <div class="card row-span-3 p-6">
    <h3 class="2xl:contentH-small ">Trainees Forms</h3>
  </div>
  <div class="card p-6">
    <h3 class="2xl:contentH-small ">Trainees at Risk</h3>
    <p class="my-6">None currently.</p>
  </div>
  <div class="card col-span-2 p-6">
    <div class="flex justify-between items-center">

      <h3 class="2xl:contentH-small ">Today's Assessments <span v-if="!loadAssessments">({{ assessments.length }})</span></h3>
      <router-link class="btn-sm-outline" :to="{name:'assessments'}">View My Asessments</router-link>
    </div>
    <div class="h-full w-full flex overflow-x-auto gap 3 ">
      <p class="m-auto" v-if="loadAssessments && assessments.length <= 0">Loading Assessment Data...</p>
      <p class="m-auto" v-else-if="!loadAssessments && assessments.length <= 0">No assessments for today.</p>
      <div class="flex flex-1 overflow-x-auto gap-3 items-center  " v-else>
           <router-link
        :to="{
          name: 'assessment-details',
          params: { id: assessment.id }
        }"
        v-for="(assessment, index) in assessments"
        :key="assessment.id"
        class=" text-rafik-sectext dark:text-rafik-darksectext"
      >
        <div
          class="gradient-bg card p-6 w-full hover:border-rafik border border-transparent flex flex-col"
        >
          <!-- Top Section: Trainee Details -->
          <div v-if="assessment.trainees" class="flex items-center border-b-2 py-4 border-rafik-pribg dark:border-rafik-darkpribg justify-between gap-4 mb-4">
            <div class="flex items-center gap-3 ">
              <img
                :src="
                  assessmentStore.trainees[assessment.trainees?.[0]]?.avatar ||
                  '/user-placeholder.jpg'
                "
                alt="Trainee Avatar"
                class="w-14 h-14 2xl:w-24 2xl:h-24 rounded-full border-2 border-rafik object-cover"
              />
              <div>
                <p class="header-small">
                  {{
                    assessmentStore.trainees[assessment.trainees?.[0]]
                      ? `${assessmentStore.trainees[assessment.trainees?.[0]].first_name || ''} ${assessmentStore.trainees[assessment.trainees?.[0]].last_name || ''}`.trim() ||
                        'Unknown Trainee'
                      : 'Loading...'
                  }}
                </p>
               <!-- Middle Section: Assessment Template Name and Date -->
          <div class="flex-1 mb-4">
            <h2 class="title-small text-base 2xl:text-xl mb-2">
              {{
                assessment.template && assessmentStore.templateData[assessment.template]
                  ? assessmentStore.templateData[assessment.template].template_name ||
                    assessmentStore.templateData[assessment.template].name ||
                    'Untitled Assessment'
                  : 'Loading...'
              }}
            </h2>
            <p class="label text-rafik-pritext dark:text-rafik-darkpritext">
              {{ formatDate(assessment.created_at) }}
            </p>
              </div>
            </div>

          </div>
            <!-- Status Badge -->
            <div class="mt-3">
              <span
                class="px-3 py-1 rounded-full font-semibold uppercase"
                :class="getStatusClasses(assessment.status)"
              >
                {{ assessment.status }} 
              </span>
            </div>
            
            <!-- Reschedule Button (only for scheduled assessments) -->
            <div v-if="assessment.status === 'scheduled' && canReschedule(assessment)" class="mt-3">
              <button
                @click.stop="handleRescheduleClick(assessment)"
                class="btn-sm bg-rafik-secondary hover:bg-rafik text-white px-3 py-1 rounded text-xs"
              >
                {{ t('dashboard.settings.rescheduleAssessmentButton') }}
              </button>
            </div>
          </div>
        </div>
      </router-link>
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { supabase } from '@/lib/supabaseClient'; // Ensure Supabase is correctly set up
import { useI18n } from 'vue-i18n';
import { useAssessmentStore } from '@/stores/assessmentstores';
import { useUserStore } from '@/stores/user';
import { useSlotStore } from '@/stores/slotstores';
import RescheduleModal from '@/components/Calendar/RescheduleModal.vue';
type Assessment = {
  id: number;
  created_at: string;
  slot: number;
  assessors?: string[]; // Array of user IDs (users table)
  drills?: any[];
  trainees?: string[]; // Array of user IDs (users table)
  started?: string | null;
  ended?: string | null;
  trainee_results?: any;
  overall_performance?: any;
  comments?: any[];
  summary?: string | null;
  status: string;
  organization?: number | null;
  template?: string | null; // The assessment_template id from the assessment_templates table
  template_data?: any; // To be fetched from the assessment_templates table
};
const { t, locale } = useI18n();
const assessments = ref<Assessment[]>([])
const loadAssessments = ref(false)
const assessmentStore = useAssessmentStore()
const userStore = useUserStore()
const slotStore = useSlotStore()

// Reschedule modal state
const showRescheduleModal = ref(false);
const selectedAssessment = ref<Assessment | null>(null);
const selectedSlot = ref<any>(null);

const props = defineProps({
  user: Object
});
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
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

// Check if user can reschedule this assessment
function canReschedule(assessment: Assessment): boolean {
  const userRoles = userStore.userProfile?.roles || [];
  const userId = localStorage.getItem('UserID');
  
  // Organization Admin can reschedule any assessment
  if (userRoles.includes('Organization Admin')) {
    return true;
  }
  
  // Organization Trnr can only reschedule assessments they're assigned to
  if (userRoles.includes('Organization Trnr') && userId) {
    return assessment.assessors?.includes(userId) || false;
  }
  
  return false;
}

// Handle reschedule button click
async function handleRescheduleClick(assessment: Assessment) {
  try {
    // Find the associated slot
    const slot = slotStore.AllSlots.find(s => s.assessment === assessment.id);
    if (!slot) {
      console.error('No slot found for assessment:', assessment.id);
      return;
    }
    
    selectedAssessment.value = assessment;
    selectedSlot.value = slot;
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
  
  // Refresh the assessments by refetching today's assessments
  if (props.user) {
    const result = await assessmentStore.getTodaysAssessments(props.user);
    assessments.value = result || [];
  }
}

onMounted(async () => {
  loadAssessments.value = true;

  try {
    const result = await assessmentStore.getTodaysAssessments(props.user);
    assessments.value = result || []; // fallback to empty array
  } catch (error) {
    console.error("Failed to load today's assessments:", error);
    assessments.value = [];
  } finally {
    loadAssessments.value = false;
  }
});


</script>
