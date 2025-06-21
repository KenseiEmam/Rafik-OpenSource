<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAssessmentStore } from '@/stores/assessmentstores';
import Swal from 'sweetalert2';
import router from '@/router';
import { supabase } from '@/lib/supabaseClient';
import { useUserStore } from '@/stores/user';
import { useTemplateStore } from '@/stores/templatestores';
import { useI18n } from 'vue-i18n';
import { useSlotStore } from '@/stores/slotstores';
const { t, tm, rt } = useI18n();

// Access the route object
const route = useRoute();
const assessmentStore = useAssessmentStore();
const clientStore = useUserStore();
const templateStore =useTemplateStore();
const slotStore =useSlotStore();
const loading = ref(false)
const activeTab = ref('Details');
const timeElapsedSeconds = ref(0);
const formattedTimeElapsed = ref('00:00:00');
let timerInterval: any = null;
// Handler to change active tab
function setActiveTab(tab: string) {
  activeTab.value = tab;
}
// Function to refresh the route/component
function refreshComponent() {
  router.go(0); // This reloads the current route
}
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
 return  localStorage.getItem("UserID")|| '0'
}
// function getBestPerf(exerciseId:any) {

onUnmounted(() => {
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
const difficulty = ref(['Too Hard', 'Challenging', 'Just Right', 'Easy', 'Too Easy']);
const pumps = ref(['Not there', 'Temporary', 'Alright', 'Pumped', 'Insane pump']);
const enjoyment = ref(['Hated', 'Poor', 'Ok', 'Nice', 'Loved']);
const exhaust = ref(['No sweat', 'Warmed Up', 'Just Right', 'Tired', 'Exhausted']);
function fetchWorkout(){

  loading.value=true
  const assessmentId = route.params.id as string;
  if (assessmentId) {
    assessmentStore
      .getAssessment(parseInt(assessmentId))
      .then(() => {
        if (assessmentStore.AssessmentItem?.trainees && assessmentStore.AssessmentItem?.trainees.length > 0) clientStore.fetchUser(parseInt(assessmentStore.AssessmentItem?.trainees[0])).then(()=>{

        if (assessmentStore.AssessmentItem?.slot ) slotStore.getSlot(assessmentStore.AssessmentItem?.slot ).then(()=>{
          if (assessmentStore.AssessmentItem?.template ) templateStore.fetchTemplateById(assessmentStore.AssessmentItem?.template ).then(()=>{
            if(slotStore.SlotItem?.time_start)
           {
             const start = new Date(slotStore.SlotItem?.time_start).getTime();
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

            loading.value = false
        });
        });

        });
      })
      .catch(() => {
        showError(t('dashboard.workoutSheet.failedToLoadWorkoutDetails'));
      });
  }
}
// Fetch the Workout when the component mounts
onMounted(() => {
 fetchWorkout()
});
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
          <div class="uppercase flex justify-between gap-3 text-sm 2xl:text-base">
            <p class="text-rafik-pritext dark:text-rafik-darkpritext">
              Scheduled Start:
            </p>
            <p class="text-rafik-secondary">
              {{ new Date(slotStore.SlotItem.time_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </p>
          </div>

          <!-- Estimated End -->
          <div class="uppercase flex justify-between gap-3 text-sm 2xl:text-base">
            <p class="text-rafik-pritext dark:text-rafik-darkpritext">
              Estimated End:
            </p>
            <p class="text-rafik-secondary">
              {{ new Date(slotStore.SlotItem.time_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </p>
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
            <button v-if="assessmentStore.AssessmentItem.assessors?.includes(getUserID()) && assessmentStore.AssessmentItem.status == 'scheduled'" class="text-rafik-secondary dark:text-rafik nav-btn">Start Assessment </button>
            <button v-if="assessmentStore.AssessmentItem.assessors?.includes(getUserID()) && assessmentStore.AssessmentItem.status == 'active'" class="text-rafik-pritext dark:text-rafik-darkpritext nav-btn">End Assessment </button>
            <button v-if=" assessmentStore.AssessmentItem.status == 'scheduled'" class="text-rafik-pritext dark:text-rafik-darkpritext nav-btn">Change Template </button>
            <button v-if="assessmentStore.AssessmentItem.assessors?.includes(getUserID()) && assessmentStore.AssessmentItem.status == 'completed'" class="text-rafik-pritext dark:text-rafik-darkpritext nav-btn">Edit Assessment </button>
            <button v-if="assessmentStore.AssessmentItem.status == 'completed'" class="text-yellow-500 dark:text-yellow-400 nav-btn">Dispute Assessment </button>
            <button  class="text-red-500 dark:text-red-400 nav-btn">Cancel Assessment </button>
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
        <div class="p-6 card">
          <h3 class="contentH-small ">Assessment Summary </h3>
          <p class="text-body">
            {{ templateStore.TemplateItem?.template_description }}
          </p>
          <div class="mt-6">
            <p class="dark:text-rafik-darkpritext text-rafik-pritext text-sm md:text-base">{{ templateStore.TemplateItem?.etc }} minutes to complete.</p>
          </div>
          <div class="mt-6">
            <p class="dark:text-rafik-darkpritext text-rafik-pritext text-sm md:text-base">({{ templateStore.TemplateItem?.drills?.length }}) drills in total.</p>
          </div>
        </div>
        <div class="p-6 card">
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
        <div class="p-6 card">
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

      <!-- Drills Tab -->
          <ul v-if="activeTab === 'Drills'" class="flex gap-3 flex-col w-full pb-16 overflow-y-auto" style="max-height: 60vh">
            <li
              v-for="exercise in templateStore.TemplateItem?.drills"
              :key="exercise.id"
              class="card p-8 2xl:py-12"
            >
              <h3 class="title-small text-lg 2xl:text-2xl">
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
              <div  class="grid grid-cols-4">
                <div class="col-span-3 flex-col flex gap-2">
                  <h4 class="text-rafik-pritext dark:text-rafik-darkpritext text-body opacity-0">
                    {{ t('dashboard.workoutSheet.filler') }}
                  </h4>
                  <div
                    v-for="(set, index) in exercise.true_sets"
                    :key="set"
                    class="flex gap-3 w-full items-center"
                  >
                    <p class="text-rafik-pritext dark:text-rafik-darkpritext min-w-max">
                       Round {{  index + 1 }}
                    </p>
                    <hr class="border border-rafik-sectext dark:border-rafik-darksectext w-full" />
                  </div>

                </div>


                  <div class="flex-col flex gap-2 items-center min-w-max">
                    <h4 class="text-rafik-pritext dark:text-rafik-darkpritext text-body">
                      {{ exercise.primary_variable || 'Load(Kg)' }}
                    </h4>
                    <div
                      v-for="(set, index) in exercise.true_sets"
                      :key="set"

                      :class="{
                        'text-red-500': set.primary_done < set.intensity,
                        'text-green-500': set.primary_done > set.intensity,
                        'text-rafik-secondary': set.primary_done == set.intensity
                      }"
                    >
                      {{ set.primary_done }} {{ t('dashboard.workoutSheet.kg') }}
                    </div>
                  </div>

              </div>

            </li>
          </ul>




        </div>
        <!-- Notes -->
        <div>
          <h3 class="contentH-small mb-6">
            📝 Notes:
          </h3>
          <div class="card p-8 2xl:py-12 flex flex-col items-center gap-6" style="height: 60vh">
            <p class="text-body "> Feature to be added soon</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
