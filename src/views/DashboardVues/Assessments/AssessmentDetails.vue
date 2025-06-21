<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
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
// Function to refresh the route/component
function refreshComponent() {
  router.go(0); // This reloads the current route
}
interface BestPerf {
  exercise: string
  orm: number
}
// function getBestPerf(exerciseId:any) {

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
        if (assessmentStore.AssessmentItem?.trainees && assessmentStore.AssessmentItem?.trainees.length > 0) clientStore.getClient(parseInt(assessmentStore.AssessmentItem?.trainees[0])).then(()=>{

        if (assessmentStore.AssessmentItem?.slot ) slotStore.getSlot(assessmentStore.AssessmentItem?.slot ).then(()=>{
          if (assessmentStore.AssessmentItem?.template ) templateStore.fetchTemplateById(assessmentStore.AssessmentItem?.template ).then(()=>{
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
      v-else-if="assessmentStore.AssessmentItem && clientStore.Client"
      class="flex-1 px-8 py-12 w-full 2xl:px-12 2xl:py-24 space-y-8 2xl:space-y-6"
    >
      <!-- Upper Header Area -->
      <div
        class="border group flex flex-col relative gradient-bg border-rafik-alternate rounded-lg overflow-hidden"
      >
        <div v-if="slotStore.SlotItem" class="p-8 2xl:p-16 2xl:py-24 space-y-4 relative gap-6 items-stretch grid grid-cols-4">
          <div class="pr-6 space-y-4 col-span-2">
            <div class="flex items-center gap-6">
              <div class="space-y-2">
                <h2 class="subheader-small">
                  {{ t('dashboard.workoutSheet.workoutLogFor') }}
                </h2>
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
                  :to="{ name: 'client-details', params: { id: clientStore.Client.id } }"
                  class="header-small font-black uppercase my-3"
                >
                  {{ t('dashboard.workoutSheet.by') }}
                  {{
                    clientStore.Client?.first_name + ' ' + clientStore.Client?.last_name ||
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
            <div class="uppercase flex justify-between gap-3 text-sm 2xl:text-base">
              <p class="text-rafik-pritext dark:text-rafik-darkpritext">
                Scheduled Start:
              </p>
              <p class="text-rafik-secondary">{{ slotStore.SlotItem.time_start }}</p>
            </div>
            <div class="uppercase flex justify-between gap-3 text-sm 2xl:text-base">
              <p class="text-rafik-pritext dark:text-rafik-darkpritext">
                Estimated End:
              </p>
              <p class="text-rafik-secondary">{{ slotStore.SlotItem.time_end }}</p>
            </div>
            <div class="uppercase flex justify-between gap-3 text-sm 2xl:text-base">
              <p class="text-rafik-pritext dark:text-rafik-darkpritext">
               Time Elapsed:
              </p>
              <p class="text-rafik-secondary">{{ 0}}</p>
            </div>
          </div>
          <!-- Second Group of Columns  -->
          <div class="flex flex-col gap-4 justify-between ">
            <button class="text-rafik-secondary dark:text-rafik nav-btn">Start Assessment </button>
            <button class="text-rafik-pritext dark:text-rafik-darkpritext nav-btn">End Assessment </button>
            <button class="text-rafik-pritext dark:text-rafik-darkpritext nav-btn">Change Template </button>
            <button class="text-rafik-pritext dark:text-rafik-darkpritext nav-btn">Edit Assessment </button>
            <button class="text-yellow-500 dark:text-yellow-400 nav-btn">Dispute Assessment </button>
            <button class="text-red-500 dark:text-red-400 nav-btn">Cancel Assessment </button>
            <button class="text-red-500 dark:text-red-400 nav-btn">Delete Assessment </button>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="grid itemsstretch gap-6 grid-cols-2 2xl:grid-cols-3">
        <!-- Exercise Sets -->
        <div class="2xl:col-span-2">
          <h3 class="contentH-small mb-6">
            {{ t('dashboard.workoutSheet.setPerformance') }}
          </h3>
          <ul class="flex gap-3 flex-col w-full pb-16 overflow-y-auto" style="max-height: 60vh">
            <li
              v-for="exercise in assessmentStore.AssessmentItem.drills"
              :key="exercise.id"
              class="card p-8 2xl:py-12"
            >
              <h3 class="title-small text-lg 2xl:text-2xl">
                {{ exercise.exercise_name || t('dashboard.workoutSheet.olderVariableName') }}
              </h3>
              <h3 class="subheader-small uppercase">
                {{ exercise.type || t('dashboard.workoutSheet.olderVariableType') }}
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
              <div v-if="exercise.type !== 'multi-set'" class="grid grid-cols-4">
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
                      {{ t('dashboard.workoutSheet.setLabel', { number: index + 1 }) }}
                    </p>
                    <hr class="border border-rafik-sectext dark:border-rafik-darksectext w-full" />
                  </div>

                </div>

                <div class="grid-cols-2 grid gap-3">
                  <div class="flex-col flex gap-2 items-center min-w-max">
                    <h4 class="text-rafik-pritext dark:text-rafik-darkpritext text-body">
                      {{ exercise.intensity_mod || 'Load(Kg)' }}
                    </h4>
                    <div
                      v-for="(set, index) in exercise.true_sets"
                      :key="set"

                      :class="{
                        'text-red-500': set.weight_done < set.intensity,
                        'text-green-500': set.weight_done > set.intensity,
                        'text-rafik-secondary': set.weight_done == set.intensity
                      }"
                    >
                      {{ set.weight_done }}<span v-if="set.weight_done != set.intensity" class="text-rafik-sectext dark:text-rafik-darksectext text-xs">({{ set.intensity }})</span> {{ t('dashboard.workoutSheet.kg') }}
                    </div>
                  </div>
                  <div  class="flex-col flex gap-2 items-center min-w-max">
                    <h4 class="text-rafik-pritext dark:text-rafik-darkpritext text-body">
                      {{ exercise.volume_mod || 'Reps' }}
                    </h4>
                    <div
                      v-for="(set, index) in exercise.true_sets"
                      :key="set"

                      :class="{
                        'text-red-500': set.reps_done < set.reps,
                        'text-green-500': set.reps_done > set.reps,
                        'text-rafik-secondary': set.reps_done == set.reps
                      }"
                    >
                      {{ set.reps_done }}<span v-if="set.reps_done != set.reps" class="text-rafik-sectext dark:text-rafik-darksectext text-xs">({{ set.reps }})</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="flex flex-col gap-4 ps-3 border-s border-rafik-sectext dark:border-rafik-darksectext">
                   <!-- List of embeds -->
                   <li
                    v-for="embed in exercise.embeds"
                    :key="embed.id"
                  >
                    <h3 class="header-small text-lg 2xl:text-2xl">
                      {{ embed.exercise_name || t('dashboard.workoutSheet.olderVariableName') }}
                    </h3>
                    <h3 class="subheader-small uppercase">
                      {{ embed.type || t('dashboard.workoutSheet.olderVariableType') }}
                    </h3>
                    <div  class="grid grid-cols-4">
                      <div class="col-span-3 flex-col flex gap-2">
                        <h4 class="text-rafik-pritext dark:text-rafik-darkpritext text-body opacity-0">
                          {{ t('dashboard.workoutSheet.filler') }}
                        </h4>
                        <div
                          v-for="(set, index) in embed.true_sets"
                          :key="set"
                          class="flex gap-3 w-full items-center"
                        >
                          <p class="text-rafik-pritext dark:text-rafik-darkpritext min-w-max">
                            {{ t('dashboard.workoutSheet.setLabel', { number: index + 1 }) }}
                          </p>
                          <hr class="border border-rafik-sectext dark:border-rafik-darksectext w-full" />
                        </div>

                      </div>

                      <div class="grid-cols-2 grid gap-3">
                        <div class="flex-col flex gap-2 items-center min-w-max">
                          <h4 class="text-rafik-pritext dark:text-rafik-darkpritext text-body">
                            {{ t('dashboard.workoutSheet.weight') }}
                          </h4>
                          <div
                            v-for="(set, index) in embed.true_sets"
                            :key="set"

                            :class="{
                              'text-red-500': set.weight_done < set.intensity,
                              'text-green-500': set.weight_done > set.intensity,
                              'text-rafik-secondary': set.weight_done == set.intensity
                            }"
                          >
                            {{ set.weight_done }}<span v-if="set.weight_done != set.intensity" class="text-rafik-sectext dark:text-rafik-darksectext text-xs">({{ set.intensity }})</span> {{ t('dashboard.workoutSheet.kg') }}
                          </div>
                        </div>
                        <div  class="flex-col flex gap-2 items-center min-w-max">
                          <h4 class="text-rafik-pritext dark:text-rafik-darkpritext text-body">
                            {{ t('dashboard.workoutSheet.reps') }}
                          </h4>
                          <div
                            v-for="(set, index) in embed.true_sets"
                            :key="set"

                            :class="{
                              'text-red-500': set.reps_done < set.reps,
                              'text-green-500': set.reps_done > set.reps,
                              'text-rafik-secondary': set.reps_done == set.reps
                            }"
                          >
                            {{ set.reps_done }}<span v-if="set.reps_done != set.reps" class="text-rafik-sectext dark:text-rafik-darksectext text-xs">({{ set.reps }})</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                  <!-- End embeds -->
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

          </div>
        </div>
      </div>
    </div>
  </div>
</template>
