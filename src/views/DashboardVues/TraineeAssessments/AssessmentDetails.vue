<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed, reactive, toRaw } from 'vue';
import { useRoute } from 'vue-router';
import { useAssessmentStore } from '@/stores/assessmentstores';
import Swal from 'sweetalert2';
import router from '@/router';
import { supabase } from '@/lib/supabaseClient';
import { useUserStore } from '@/stores/user';
import { useTemplateStore } from '@/stores/templatestores';
import { useI18n } from 'vue-i18n';
import { useSlotStore } from '@/stores/slotstores';
import RescheduleModal from '@/components/Calendar/RescheduleModal.vue';
const { t, tm, rt } = useI18n();

// Access the route object
const route = useRoute();

const assessmentStore = useAssessmentStore();
const clientStore = useUserStore();
const templateStore =useTemplateStore();
const previousAssessmentWithSameTemplate = ref<any>(null);
const slotStore =useSlotStore();
const loading = ref(false)
const activeTab = ref('Details');
const editing = ref(false);
const timeElapsedSeconds = ref(0);
const formattedTimeElapsed = ref('00:00:00');
const commentValue =ref('')

// Reactive object to hold users keyed by user ID
const commentUsers = reactive<Record<string, any>>({});
const getUserById = (userId: string) => {
  return commentUsers[userId] || null;
};
async function fetchUsersForComments() {
  const comments = assessmentStore.AssessmentItem?.comments || [];

  // Extract unique user IDs from comments
  const userIds = [...new Set(comments.map(c => c.user).filter(Boolean))];

  if (userIds.length === 0) return;

  // Fetch user details from Supabase in one query
  const { data, error } = await supabase
    .from('users') // or your actual users table name
    .select('id, first_name, last_name, email, avatar') // adjust columns as needed
    .in('id', userIds);

  if (error) {
    console.error('Error fetching users for comments:', error.message);
    return;
  }

  if (data) {
    // Clear previous entries
    for (const key in commentUsers) delete commentUsers[key];
    // Populate commentUsers object keyed by user id for quick access
    data.forEach(user => {
      commentUsers[user.id] = user;
    });
  }
}
let timerInterval: any = null;
// Handler to change active tab
function setActiveTab(tab: string) {
  activeTab.value = tab;
}
// Function to refresh the route/component
function refreshComponent() {
  router.go(0); // This reloads the current route
}
function checkAbide(event:any, exercise:any, set:any){
  if(event.target.value ==  exercise.metric)
set.control_abide = true
else
set.control_abide = false
}
const isWithin30Min = computed(() => {
  if (!slotStore.SlotItem?.time_start) return false;
  const now = new Date();
  const start = new Date(slotStore.SlotItem.time_start);
  const diffInMinutes = Math.abs((now.getTime() - start.getTime()) / 60000);
  return diffInMinutes <= 30;
});
function checkStart(){
   Swal.fire({
    title: 'Starting Assessment',
    text: 'This begins logging, however this also begins the timer and assessment time is logged.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Start anyway',
    confirmButtonColor: '#CB901C',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  }).then((result) => {
    if (result.isConfirmed) {
      activateAssessment()
    }
  });
}
function checkEdit(): void {

  Swal.fire({
    title: 'Update Performance',
    text: 'This logs your results and changes performance. Summarize the assessment.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Complete',
    confirmButtonColor: '#CB901C',
    cancelButtonColor: '#d33',

    background: '#081411',
    color: '#E8F3ED'
  }).then((result) => {
    if (result.isConfirmed) {
      updateAssessment();
    }
  });
}


function checkEnd(){
   Swal.fire({
  title: 'Completing Assessment',
  icon: 'warning',
  showCancelButton: true,
  confirmButtonText: 'Complete',
  confirmButtonColor: '#CB901C',
  cancelButtonColor: '#d33',
  input: 'textarea',
  inputLabel: 'Enter a summary of the trainee performance',
  inputValue: '', // optional: you can prefill with something like assessmentStore.AssessmentItem?.summary || ''
  inputValidator: (value: string): string | null => {
    if (!value) {
      return 'You need to write a summary!';
    }
    return null;
  },
  background: '#081411',
  color: '#E8F3ED'
}).then((result) => {
  if (result.isConfirmed) {
    EndAssessment(result.value); // Pass the summary to your function if needed
  }
});

}

function calculateAge(dob: Date) {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // Adjust age if birthday hasn't happened yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
// Reactive reference to store the weight
const weight = ref<string | null>(null);
const program = ref<any>(null);
const goals = ['get_fitter', 'build_physique', 'increase_strength', 'recovery', 'sport_specific'];
// Computed property to fetch weight from Supabase
const fetchWeight = async (weightId: number) => {
  try {
    const { data, error } = await supabase
      .from('weights')
      .select('weight')
      .eq('id', weightId)
      .single();

    if (error) {
      showError('Error fetching weight:' + error.message);
      return null;
    }

    return data?.weight || null;
  } catch (err) {
    showError('Unexpected error fetching weight:' + err);
    return null;
  }
};

const fetchProgram = async (programId: number) => {
  try {
    const { data, error } = await supabase.from('programs').select().eq('id', programId).single();

    if (error) {
      showError('Error fetching program:' + error.message);
      return null;
    }

    return data || null;
  } catch (err) {
    showError('Unexpected error fetching program:' + err);
    return null;
  }
};
interface BestPerf {
  exercise: string
  orm: number
}
function formatTimeElapsed(seconds: number) {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}
function getUserID(){
  const id = localStorage.getItem("UserID")

 return  id|| '0'
}
function checkAssessor() {
  const currentUserId = parseInt(getUserID());
  const assessors = assessmentStore.AssessmentItem?.assessors || [];

  return assessors.some((e: any) => parseInt(e) === currentUserId);
}
function activateAssessment(){
   const assessmentId = route.params.id as string;
   const now = new Date
  if (assessmentId)
{

  assessmentStore.updateAssessment(parseInt(assessmentId),{status:'active', started:now.toISOString(), drills:assessmentStore.AssessmentItem?.drills}).then(()=>{
    fetchWorkout()
  })

}
}
function updateAssessment(){
   const assessmentId = route.params.id as string;
   const now = new Date
  if (assessmentId)
{

  assessmentStore.updateAssessment(parseInt(assessmentId),{drills:assessmentStore.AssessmentItem?.drills}).then(()=>{
    fetchWorkout()
    editing.value =false
  })

}
}
function addComment() {
  const assessmentId = route.params.id as string;
  const user = localStorage.getItem('UserID');
  console.log('err')
  if (!user || !assessmentId) return;

  // Clone the current comments array safely
  const existingComments = assessmentStore.AssessmentItem?.comments || [];
  const rawComments = Array.isArray(existingComments) ? toRaw(existingComments) : [];
  const comment  = commentValue.value
  // Create a new copy
  const newComments = [...rawComments, { user, comment}];

  assessmentStore.updateAssessment(parseInt(assessmentId), {
    comments: newComments
  }).then(() => {
    fetchWorkout();
    editing.value = false;
  }).catch(err => {
    console.error('Failed to add comment:', err.message);
  });
}
function cancelUpdate(){

    fetchWorkout()
    editing.value =false

}
function EndAssessment(summary:any){
   const assessmentId = route.params.id as string;
   const now = new Date
   console.log(assessmentStore.AssessmentItem?.drills)
  if (assessmentId){
  assessmentStore.updateAssessment(parseInt(assessmentId),{status:'complete', ended:now.toISOString(), drills:assessmentStore.AssessmentItem?.drills, summary:summary}).then(()=>{
    fetchWorkout()
    commentValue.value = ''
  })
}
}
// function getBestPerf(exerciseId:any) {

onUnmounted(() => {
  assessmentStore.clearAssessment
  if (timerInterval) clearInterval(timerInterval);
});
//   return assessmentStore.AssessmentItem?.best_perf?.find(ex => ex.exercise == exerciseId);
// }
watch(
  () => route.params.id,
  () => {
    fetchWorkout(); // Assuming you have a function like this
  },
  { immediate: true } // Optional: call once on mount
);
const showAddProgramModal = ref(false);
const showCancelModal = ref(false);

// Reschedule modal state
const showRescheduleModal = ref(false);
const selectedAssessment = ref<any>(null);
const selectedSlot = ref<any>(null);

// Function to show success alerts
function showSuccess(message: string) {
  Swal.fire({
    title: t('dashboard.workoutSheet.successTitle'),
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 1500,
    text: message,
    toast: true,
    position: 'top-right',
    icon: 'success',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}

// Function to show error alerts
function showError(message: string) {
  Swal.fire({
    title: t('dashboard.workoutSheet.errorTitle'),
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}
const newScores = ref(Object)
const difficulty = ref(['Too Hard', 'Challenging', 'Just Right', 'Easy', 'Too Easy']);
const pumps = ref(['Not there', 'Temporary', 'Alright', 'Pumped', 'Insane pump']);
const enjoyment = ref(['Hated', 'Poor', 'Ok', 'Nice', 'Loved']);
const exhaust = ref(['No sweat', 'Warmed Up', 'Just Right', 'Tired', 'Exhausted']);
async function fetchWorkout() {
  loading.value = true;
  const assessmentId = route.params.id as string;

  try {
    if (!assessmentId) return;

    await assessmentStore.getAssessment(parseInt(assessmentId));

    if (
      assessmentStore.AssessmentItem?.trainees &&
      assessmentStore.AssessmentItem.trainees.length > 0
    ) {
      await clientStore.fetchUser(parseInt(assessmentStore.AssessmentItem.trainees[0]));
    }

    if (assessmentStore.AssessmentItem?.slot) {
      await slotStore.getSlot(assessmentStore.AssessmentItem.slot);
    }

    if (assessmentStore.AssessmentItem?.template) {
      await templateStore.fetchTemplateById(assessmentStore.AssessmentItem.template);
    }

    if (slotStore.SlotItem?.time_start) {
      const start = new Date(slotStore.SlotItem.time_start).getTime();
      const now = new Date().getTime();
      timeElapsedSeconds.value = Math.floor((now - start) / 1000);
      formattedTimeElapsed.value = formatTimeElapsed(timeElapsedSeconds.value);

      // Clear existing timer
      if (timerInterval) clearInterval(timerInterval);

      // Start live timer
      timerInterval = setInterval(() => {
        timeElapsedSeconds.value++;
        formattedTimeElapsed.value = formatTimeElapsed(timeElapsedSeconds.value);
      }, 1000);
    }

    if (clientStore.Client?.profile_id) {
      await clientStore.getUserClient(clientStore.Client.profile_id);

      const weightId = clientStore.Client?.profile.weight_id;
      const programId = clientStore.Client?.program_details.program_id;

      if (weightId) {
        const clientWeight = await fetchWeight(weightId);
        weight.value = clientWeight;
      }

      if (programId) {
        const parentProgram = await fetchProgram(programId);
        program.value = parentProgram;
      }
    }


    // Fetch users related to comments after assessment is loaded
    await fetchUsersForComments();

    // Fetch Previous
    if (assessmentStore.AssessmentItem?.template && assessmentStore.AssessmentItem?.id) {
      const traineeId = assessmentStore.AssessmentItem.trainees?.[0];

      const { data, error } = await supabase
  .from('assessment') // ✅ your confirmed table name
  .select('*')
  .eq('template', assessmentStore.AssessmentItem.template)
  .neq('id', assessmentStore.AssessmentItem.id)
  .contains('trainees', [traineeId]) // ✅ correct for PostgreSQL integer[] array field
  .order('created_at', { ascending: false })
  .limit(1);

      if (error) {
        console.error('Error fetching previous assessment:', error.message);
      } else if (data && data.length > 0) {
        previousAssessmentWithSameTemplate.value = data[0];
      }
    }
  } catch (error) {
    showError(t('dashboard.workoutSheet.failedToLoadWorkoutDetails'));
  } finally {
    loading.value = false;
  }
}

// Fetch the Workout when the component mounts
onMounted(() => {
 fetchWorkout()
});

// Check if user can reschedule this assessment
function canReschedule(): boolean {
  const userRoles = localStorage.getItem('Roles') || '';
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
    selectedSlot.value = slotStore.SlotItem;
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
  
  // Refresh the assessment data
  await fetchWorkout();
}
</script>

<template>
  <div class="flex h-screen overflow-auto">
    <!-- Loading Spinner -->
    <div
        v-if="loading"
        class="h-full flex flex-col gap-2 items-center justify-center text-center w-full text-body"
      >
        <img
          src="@/assets/Large Icon.png"
          class="w-24 h-24 animate-bounce hidden dark:inline-block"
          alt=""
        />
        <img
          src="@/assets/Large Icon Light.png"
          class="w-24 h-24 animate-bounce dark:hidden"
          alt=""
        />
        <p class="text-lg animate-pulse">
          {{ t('dashboard.profile.edit.loading') }}
        </p>
      </div>
    <div
      v-else-if="assessmentStore.AssessmentItem && clientStore.UserDetail"
      class="flex-1 px-8 py-12 w-full 2xl:px-12 2xl:py-24 space-y-8 2xl:space-y-6"
    >
      <!-- Upper Header Area -->
      <div
        class="border group flex flex-col relative gradient-bg border-rafik-alternate rounded-lg overflow-hidden"
      >
        <div v-if="slotStore.SlotItem" class="p-8 2xl:p-16 2xl:py-24 space-y-4 relative gap-6 items-stretch grid grid-cols-4">
          <div class="pr-6 space-y-4 col-span-2">
            <div class="flex items-center gap-6">
              <img :src="clientStore.UserDetail.avatar ||
                    'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'" class="2xl:w-32 2xl:h-32 w-24 h-24 rounded-full border-2 border-rafik-secondary"alt="">
              <div class="space-y-2">
                <h1 class="title-small">
                  {{
                    slotStore.SlotItem.time_start?.toString().split('T')[0] ||
                    t('dashboard.workoutSheet.loading')
                  }}
                </h1>
                <h1 class="title-small">
                  {{ templateStore.TemplateItem?.template_name || t('dashboard.workoutSheet.loading') }}
                </h1>
                <router-link
                  :to="{ name: 'client-details', params: { id: clientStore.UserDetail.id } }"
                  class="header-small font-black uppercase my-3"
                >
                  for
                  {{
                    clientStore.UserDetail?.first_name + ' ' + clientStore.UserDetail?.last_name ||
                    t('dashboard.workoutSheet.loading')
                  }}
                </router-link>
              </div>
            </div>
          </div>
          <!-- First Group of Columns -->
          <div v-if="slotStore.SlotItem" class="flex flex-col gap-4 justify-between">
            <div class="uppercase flex justify-between gap-3 text-sm 2xl:text-base">
              <p class="text-rafik-pritext dark:text-rafik-darkpritext">
                Status:
              </p>
              <p class="text-rafik-secondary">{{ assessmentStore.AssessmentItem.status }}</p>
            </div>
          <!-- Scheduled Start -->
          <div class="uppercase flex  gap-2 text-sm 2xl:text-base">
            <p class="text-rafik-pritext dark:text-rafik-darkpritext">
              Scheduled Start:
            </p>
            <p class="ms-auto text-rafik-secondary">
              {{ new Date(slotStore.SlotItem.time_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </p>
            <p v-if="assessmentStore.AssessmentItem.started" class="text-xs my-auto">
              (Actual {{ new Date(assessmentStore.AssessmentItem.started).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }})
            </p>
          </div>

          <!-- Estimated End -->
          <div class="uppercase flex  gap-3 text-sm 2xl:text-base">
            <p class="text-rafik-pritext dark:text-rafik-darkpritext">
              Estimated End:
            </p>
            <p class="ms-auto text-rafik-secondary">
              {{ new Date(slotStore.SlotItem.time_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </p>
            <p v-if="assessmentStore.AssessmentItem.ended" class="text-xs my-auto">
              (Actual {{ new Date(assessmentStore.AssessmentItem.ended).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }})
            </p>
          </div>
          
          <!-- Reschedule button for scheduled assessments -->
          <div v-if="assessmentStore.AssessmentItem.status === 'scheduled' && canReschedule()" class="uppercase flex justify-between gap-3 text-sm 2xl:text-base">
            <button 
              @click="handleRescheduleClick" 
              class="btn-sm bg-rafik-secondary hover:bg-rafik text-white px-4 py-2 rounded text-sm"
            >
              Reschedule Assessment
            </button>
          </div>
            <div v-if="assessmentStore.AssessmentItem.status == 'active'" class="uppercase flex justify-between gap-3 text-sm 2xl:text-base">
              <p class="text-rafik-pritext dark:text-rafik-darkpritext">
               Time Elapsed:
              </p>
              <p class="text-rafik-secondary">{{ formattedTimeElapsed }}</p>
            </div>
          </div>
          <!-- Second Group of Columns  -->
                    <div class="flex flex-col gap-4 justify-center ">
                      <!-- Start Assessment or Missed -->
          <div v-if="checkAssessor() && assessmentStore.AssessmentItem.status == 'scheduled'">
            <button
              @click="checkStart"
              v-if="isWithin30Min"
              class="text-rafik-secondary dark:text-rafik nav-btn"
            >
              Start Assessment
            </button>
            <span
              v-else
              class="text-red-500 dark:text-red-400 uppercase text-sm  text-center font-semibold"
            >
              Cannot start assessment before or after 30 minutes of scheduled time
            </span>
          </div>

            <button @click="checkEnd" v-if="checkAssessor() && assessmentStore.AssessmentItem.status == 'active'" class="text-rafik-pritext dark:text-rafik-darkpritext nav-btn">End Assessment </button>
            <!-- <button v-if=" assessmentStore.AssessmentItem.status == 'scheduled'" class="text-rafik-pritext dark:text-rafik-darkpritext nav-btn">Change Template </button> -->
            <button v-if="checkAssessor() && assessmentStore.AssessmentItem.status == 'complete' && !editing" @click="editing = true" class="text-rafik-pritext dark:text-rafik-darkpritext nav-btn">Edit Assessment </button>
            <button @click="checkEdit" v-if="editing" class="text-rafik nav-btn">Save Edits </button>
            <button @click="cancelUpdate" v-if="editing" class="text-red-500 dark:text-red-400 nav-btn">Cancel Edits </button>
            <!-- <button v-if="assessmentStore.AssessmentItem.status == 'complete' && !editing" class="text-yellow-500 dark:text-yellow-400 nav-btn">Dispute Assessment </button> -->
            <!-- <button v-if="!editing && assessmentStore.AssessmentItem.status == 'scheduled'" class="text-red-500 dark:text-red-400 nav-btn">Cancel Assessment </button> -->
            <!-- <button class="text-red-500 dark:text-red-400 nav-btn">Delete Assessment </button> -->
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="grid itemsstretch gap-6 grid-cols-2 2xl:grid-cols-3">
        <!-- Exercise Sets -->
        <div class="2xl:col-span-2">
           <!-- Tabs Navigation -->
      <div
        class="flex gap-8 2xl:gap-16 items-center pb-2 border-b border-rafik-sectext dark:border-rafik-darksectext"
      >
        <button
          :class="
            activeTab === 'Details'
              ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default'
              : 'hover:opacity-70'
          "
          class="nav-btn"
          @click="setActiveTab('Details')"
        >
          Summary
        </button>
        <button
          :class="
            activeTab === 'Drills'
              ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default'
              : 'hover:opacity-70'
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Drills')"
        >
          Drill Performance
        </button>
        <button
          :class="
            activeTab === 'Trainee'
              ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default'
              : 'hover:opacity-70'
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Trainee')"
        >
          Trainee's Details
        </button>
        <!-- <button
          :class="
            activeTab === 'Audit'
              ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default'
              : 'hover:opacity-70'
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Audit')"
        >
          Audit Logs
        </button> -->
      </div>


      <!-- Tabs Area -->


      <!-- Summary Tab  -->
      <div v-if="activeTab == 'Details'" class="flex flex-col gap-3 w-full py-6">
        <!-- Summary -->
        <div class="p-6 card">
          <h3 class="contentH-small ">Assessment Summary </h3>
          <p class="text-body">
            {{ templateStore.TemplateItem?.template_description }}
          </p>
          <div class="mt-6">
            <p class="dark:text-rafik-darkpritext text-rafik-pritext text-sm md:text-base">{{ templateStore.TemplateItem?.etc }} minutes to complete.</p>
          </div>

        </div>

        <!--  -->
        <div class="flex gap-2 w-full">
          <div class="p-6 card flex-1">
          <h3 class="contentH-small ">Assessors: </h3>
          <div class="space-y-3 divide-y divide-rafik-sectext dark:divide-rafik-darksectext">
              <template v-if="assessmentStore.AssessmentItem.assessors && assessmentStore.AssessmentItem.assessors.length > 0">
                <router-link
                  v-for="(assessorId, index) in assessmentStore.AssessmentItem.assessors"
                  :key="assessorId"
                  :to="{ name: 'single-user', params: { id: assessorId } }"
                  class="flex gap-2 items-center mt-6 hover:background-none"
                  @click.stop
                >
                <img :src="assessmentStore.assessors[assessorId].avatar ||
                    'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'" class="w-16 h-16 rounded-full border-2 border-rafik-secondary">
                <div>
                  <p class="header-small text-lg ">
                     {{
                    assessmentStore.assessors[assessorId]
                      ? `${assessmentStore.assessors[assessorId].first_name || ''} ${assessmentStore.assessors[assessorId].last_name || ''}`.trim() ||
                        'Unknown Assessor'
                      : 'Loading...'
                  }}
                  </p>
                  <p class="text-body text-sm lowercase">
                     {{
                    assessmentStore.assessors[assessorId]
                      ? `${assessmentStore.assessors[assessorId].email}`.trim() ||
                        'Unknown Assessor'
                      : 'Loading...'
                  }}
                  </p>
                </div>

                </router-link>
              </template>
              <span v-else class="label text-rafik-sectext dark:text-rafik-darksectext">
                {{ t('dashboard.assessments.list.noAssessors') }}
              </span>
            </div>
        </div>
        <div class="p-6 card flex-1">
          <h3 class="contentH-small ">Created By: </h3>
          <div class="space-y-3 divide-y divide-rafik-sectext dark:divide-rafik-darksectext">
              <template v-if="templateStore.TemplateItem?.created_by_user ">
                <router-link

                  :to="{ name: 'single-user', params: { id: templateStore.TemplateItem?.created_by_user.id } }"
                  class="flex gap-2 items-center mt-6 hover:background-none"
                  @click.stop
                >
                <img :src="templateStore.TemplateItem?.created_by_user.avatar ||
                    'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'" class="w-16 h-16 rounded-full border-2 border-rafik-secondary">
                <div>
                  <p class="header-small text-lg ">
                     {{
                    templateStore.TemplateItem?.created_by_user
                      ? `${templateStore.TemplateItem?.created_by_user.first_name || ''} ${templateStore.TemplateItem?.created_by_user.last_name || ''}`.trim() ||
                        'Unknown Assessor'
                      : 'Loading...'
                  }}
                  </p>
                  <p class="text-body text-sm lowercase">
                     {{
                    templateStore.TemplateItem?.created_by_user
                      ? `${templateStore.TemplateItem?.created_by_user.email}`.trim() ||
                        'Unknown Assessor'
                      : 'Loading...'
                  }}
                  </p>
                </div>

                </router-link>
              </template>
              <span v-else class="label text-rafik-sectext dark:text-rafik-darksectext mt-6">
                No User Data Found
              </span>
            </div>
        </div>
        </div>
        <!-- Results -->
        <div v-if="assessmentStore.AssessmentItem.summary" class="p-6 card">
          <h3 class="contentH-small ">Assessor Recap </h3>
          <p class="text-body">
            {{assessmentStore.AssessmentItem.summary }}
          </p>
        </div>

        <div v-if="assessmentStore.AssessmentItem.overall_performance " class="p-6 card">
          <h3 class="contentH-small ">Results</h3>
          <p class="text-body">
            Below are the results for drill performances:
          </p>
          <div v-for="perf in assessmentStore.AssessmentItem.overall_performance " class="p-6 gradient-bg card my-2 flex gap-6 items-center justify-between">
            <div >
              <h4 class="header-small">{{ assessmentStore.AssessmentItem.drills?.find(d => d.id == perf.exercise).exercise_name }}</h4>
               <h4 class="subheader-small">{{ assessmentStore.AssessmentItem.drills?.find(d => d.id == perf.exercise).type }}</h4>


            </div>
            <div>
              <p>Best Round: <span class="text-rafik-secondary">{{ perf.orm }}</span></p>
              <p v-if="previousAssessmentWithSameTemplate">Trend: +{{ perf.orm }}</p>
              <p>
              Pass:
              <span v-if=" assessmentStore.AssessmentItem.status === 'complete'"
                :class="(() => {
                  const prevPerf = previousAssessmentWithSameTemplate?.overall_performance?.find(
                    (pr: any) => pr.exercise === perf.exercise
                  );
                  return !prevPerf || perf.orm >= prevPerf.orm ? 'text-green-500' : 'text-red-500';
                })()"
              >
                {{
                  (() => {
                    const prevPerf = previousAssessmentWithSameTemplate?.overall_performance?.find(
                      (pr: any) => pr.exercise === perf.exercise
                    );
                    return !prevPerf || perf.orm >= prevPerf.orm ? 'Yes' : 'No';
                  })()
                }}
              </span>
              <span v-else class="text-rafik">
                TBD
              </span>
              </p>


            </div>
          </div>

        </div>
      </div>

      <!-- Drills Tab -->
      <ul v-else-if="activeTab === 'Drills'" class="flex gap-3 flex-col w-full pb-16 overflow-y-auto" style="max-height: 60vh">
            <li
              v-for="exercise in assessmentStore.AssessmentItem.drills"
              :key="exercise.id"
              class="card p-8 2xl:py-12"
            >
              <h3 class="contentH-small text-lg 2xl:text-2xl">
                {{ exercise.exercise_name || t('dashboard.workoutSheet.olderVariableName') }}
              </h3>
              <h3 class="header-small uppercase">
                {{ exercise.metric }} {{ exercise.control_unit }}
              </h3>
              <!-- <div v-if="assessmentStore.AssessmentItem.best_perf" class="flex justify-between w-full my-3">

                <p v-if="getBestPerf(exercise.id)" class="text-body">
                  Estimated ORM : {{ getBestPerf(exercise.id)?.orm ?? 'N/A' }}
                </p>
                <p class="text-rafik"
                v-if="
                (clientStore.Client.profile.best_perf
                  ?.find((ex: BestPerf) => ex.exercise === exercise.id)
                  ?.orm ?? 0
                ) <= (
                  assessmentStore.AssessmentItem.best_perf
                    ?.find((ex: BestPerf) => ex.exercise === exercise.id)
                    ?.orm ?? 0
                )
              "
              >
               🏆 New Best!
              </p>
              </div> -->
              <div>
                <div class="col-span-3 flex-col flex gap-2">
                  <h4 class="text-rafik-pritext dark:text-rafik-darkpritext text-body opacity-0">
                    {{ t('dashboard.workoutSheet.filler') }}
                  </h4>
                  <div
                    v-for="(set, index) in exercise.true_sets"
                    :key="set"
                    class="flex gap-6 w-full items-center"
                  >
                    <p class="text-rafik-pritext dark:text-rafik-darkpritext min-w-max py-2.5">
                       Round {{  index + 1 }}
                    </p>
                    <hr class="border border-rafik-sectext dark:border-rafik-darksectext w-full" />

                     <div
                    >
                    <div v-if="(assessmentStore.AssessmentItem.status === 'active' || editing) && checkAssessor()  " class="flex gap-2">
                      <div>
                        <p>{{ exercise.primary_variable || 'Load(Kg)' }}</p>
                        <input v-model="set.primary_done"   type="number" class="text-rafik-pritext dark:text-rafik-darkpritext py-2 rafik-text-input" >
                      </div>
                      <div>
                        <p>{{ exercise.control_unit || 'Reps' }}</p>
                      <input @input="checkAbide($event, exercise, set)" type="number" class="text-rafik-pritext dark:text-rafik-darkpritext py-2 rafik-text-input" >
                      </div>
                    </div>

                    <p v-else                       :class="{
                        'text-red-500': !set.control_abide,
                        'text-rafik-secondary': set.control_abide
                      }" class="min-w-max">{{ set.primary_done }} {{ t('dashboard.workoutSheet.kg') }}</p>

                    </div>
                  </div>

                </div>


              </div>

            </li>
      </ul>

      <!-- Trainee Details Tab -->
      <div v-else-if="activeTab === 'Trainee'" class="grid mt-6 gap-3 ">
      <div class="flex flex-col gap-3 pl-3 2xl:gap-5 card">
        <h3 class="contentH-small text-sm 2xl:text-xl mb-3 2xl:mb-3 2xl:mb-8">
          Trainee Profile
        </h3>
        <div v-if="clientStore.UserDetail.dob" class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.clients.details.age') }}
          </p>
          <p class="text-rafik-secondary">{{ calculateAge(clientStore.UserDetail.dob) || 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.clients.details.gender') }}
          </p>
          <p class="text-rafik-secondary">{{ clientStore.UserDetail.gender || 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.clients.details.nationality') }}
          </p>
          <p class="text-rafik-secondary">{{ clientStore.UserDetail.nationality || 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.clients.details.phone') }}
          </p>
          <p class="text-rafik-secondary">{{ clientStore.UserDetail.phone || 'N/A' }}</p>
        </div>
      </div>

      <div class="flex flex-col gap-3 pl-3 2xl:gap-5 card">
        <h3 class="contentH-small text-sm 2xl:text-xl mb-3 2xl:mb-3">
          Trainee Metrics
        </h3>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.clients.details.height') }}
          </p>
          <p class="text-rafik-secondary">
            {{ clientStore.Client?.profile.height || 'N/A' }} {{ t('dashboard.tabs.clients.details.cm') }}
          </p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.clients.details.weight') }}
          </p>
          <!-- Use the computed value for weight -->
          <p class="text-rafik-secondary">
            {{ weight || 'N/A' }} {{ t('dashboard.tabs.clients.details.kg') }}
          </p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.clients.details.goalWeight') }}
          </p>
          <p class="text-rafik-secondary">{{ clientStore.Client?.profile.weight_goal || 'N/A' }} kg</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.clients.details.bodyFatPercent') }}
          </p>
          <p class="text-rafik-secondary">{{ clientStore.Client?.profile.body_fat + '%' || 'N/A' }}</p>
        </div>
      </div>

      <div class="flex flex-col gap-3 pl-3 2xl:gap-5 card">
        <h3 class="contentH-small text-sm 2xl:text-xl mb-3 2xl:mb-3">
          Trainee Fitness
        </h3>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.clients.details.experience') }}
          </p>
          <p class="text-rafik-secondary">
            {{ clientStore.Client?.profile.experience || t('dashboard.tabs.clients.details.NA') }}
          </p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.clients.details.fitnessGoal') }}
          </p>
          <p
            class="text-rafik-secondary"
            v-for="(goal, index) in clientStore.Client?.profile.fitness_goal"
            :key="goal"
          >
            {{ t(`dashboard.tabs.clients.details.goals.${goals[goal - 1]}`) }}
            <span v-if="index + 1 !== clientStore.Client?.profile.fitness_goal.length">,</span>
          </p>
          <p class="text-rafik-secondary" v-if="!clientStore.Client?.profile.fitness_goal">N/A</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.clients.details.sportsPlayed') }}
          </p>
          <p
            class="text-rafik-secondary"
            v-for="(sport, index) in clientStore.Client?.profile.sports_played"
            :key="sport"
          >
            {{ sport }}
            <span v-if="index + 1 !== clientStore.Client?.profile.sports_played.length">,</span>
          </p>
          <p class="text-rafik-secondary" v-if="!clientStore.Client?.profile.sports_played">N/A</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.clients.details.dietPreference') }}
          </p>
          <p
            class="text-rafik-secondary"
            v-for="(diet, index) in clientStore.Client?.profile.diet_preference"
            :key="diet"
          >
            {{ diet
            }}<span v-if="index + 1 !== clientStore.Client?.profile.diet_preference.length">, </span>
          </p>
          <p class="text-rafik-secondary" v-if="!clientStore.Client?.profile.diet_preference">N/A</p>
        </div>
      </div>
      </div>

        </div>
        <!-- Notes -->
        <div>
          <h3 class="contentH-small mb-3 2xl:mb-3">
            📝 Notes:
          </h3>
          <div class="card p-8 2xl:py-12 flex flex-col items-center gap-3 overflow-y-auto" style="height: 60vh">
            <div class="w-full flex gap-3">
              <textarea name="" v-model="commentValue" rows="3" class="rafik-text-input  flex-1" placeholder="Write a comment here" >

              </textarea>
              <button @click="addComment" class="btn-sm-outline  h-full ">
                SEND
              </button>
            </div>
            <p v-if="!assessmentStore.AssessmentItem.comments" class="text-body  text-sm opacity-60 mt-auto"> Nothing yet</p>
            <p v-if="!assessmentStore.AssessmentItem.comments" class="text-body  text-sm opacity-60 mb-auto"> Be the first to start the conversation.</p>
              <div
              class="space-y-2 gradient-bg card w-full p-3"
              v-for="comment in assessmentStore.AssessmentItem.comments"
              :key="comment.comment"
            >
              <div class="space-y-3 divide-y divide-rafik-sectext  dark:divide-rafik-darksectext">
                <template v-if="getUserById(comment.user)">
                  <router-link
                    :to="{ name: 'single-user', params: { id: getUserById(comment.user).id } }"
                    class="flex gap-2 items-center hover:background-none"
                    @click.stop
                  >
                    <img
                      :src="
                        getUserById(comment.user).avatar ||
                        'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'
                      "
                      class="w-12 h-12 rounded-full border-2 border-rafik-secondary"
                      alt="User avatar"
                    />
                    <div>
                      <p class="header-small text-lg">
                        {{
                          `${getUserById(comment.user).first_name || ''} ${getUserById(comment.user).last_name || ''}`.trim() ||
                          'Unknown User'
                        }}
                      </p>
                      <p class="text-body text-sm lowercase">
                        {{ getUserById(comment.user).email || 'Unknown Email' }}
                      </p>
                    </div>
                  </router-link>
                </template>
                <span v-else class="label text-rafik-sectext dark:text-rafik-darksectext mt-6">
                  No User Data Found
                </span>
              </div>
              <p class="pl-6 text-justify text-body">{{ comment.comment }}</p>
            </div>

          </div>
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
