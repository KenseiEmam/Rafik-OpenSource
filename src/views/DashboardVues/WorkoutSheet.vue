<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useWorkoutStore } from '@/stores/workoutstores';
import Swal from 'sweetalert2';
import router from '@/router';
import { supabase } from '@/lib/supabaseClient';
import { useUserStore } from '@/stores/user';
import { useI18n } from 'vue-i18n';

const { t, tm, rt } = useI18n();

// Access the route object
const route = useRoute();
const workoutStore = useWorkoutStore();
const clientStore = useUserStore();
const loading = ref(false)
// Function to refresh the route/component
function refreshComponent() {
  router.go(0); // This reloads the current route
}
interface BestPerf {
  exercise: string
  orm: number
}
function getBestPerf(exerciseId:any) {

  return workoutStore.Workout?.best_perf?.find(ex => ex.exercise == exerciseId);
}
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
    background: '#132e3d',
    color: '#ececec'
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
    background: '#132e3d',
    color: '#ececec'
  });
}
const difficulty = ref(['Too Hard', 'Challenging', 'Just Right', 'Easy', 'Too Easy']);
const pumps = ref(['Not there', 'Temporary', 'Alright', 'Pumped', 'Insane pump']);
const enjoyment = ref(['Hated', 'Poor', 'Ok', 'Nice', 'Loved']);
const exhaust = ref(['No sweat', 'Warmed Up', 'Just Right', 'Tired', 'Exhausted']);
function fetchWorkout(){
  loading.value=true
  const workoutId = route.params.id as string;
  if (workoutId) {
    workoutStore
      .getWorkout(workoutId)
      .then(() => {
        if (workoutStore.Workout?.client_id) clientStore.getClient(workoutStore.Workout.client_id).then(()=>{
          loading.value = false
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
          src="@/assets/ts-trans-dark.png"
          class="w-24 h-24 animate-bounce hidden dark:inline-block"
          alt=""
        />
        <img
          src="@/assets/ts-trans-light.png"
          class="w-24 h-24 animate-bounce dark:hidden"
          alt=""
        />
        <p class="text-lg animate-pulse">
          {{ t('dashboard.profile.edit.loading') }}
        </p>
      </div>
    <div
      v-else-if="workoutStore.Workout && clientStore.Client"
      class="flex-1 px-8 py-12 w-full 2xl:px-12 2xl:py-24 space-y-8 2xl:space-y-6"
    >
      <!-- Upper Header Area -->
      <div
        class="border group flex flex-col relative gradient-bg border-topsets-alternate rounded-lg overflow-hidden"
      >
        <div class="p-8 2xl:p-16 2xl:py-24 space-y-4 relative gap-6 items-stretch grid grid-cols-4">
          <div class="pr-6 space-y-4 col-span-2">
            <div class="flex items-center gap-6">
              <div class="space-y-2">
                <h2 class="subheader-small">
                  {{ t('dashboard.workoutSheet.workoutLogFor') }}
                </h2>
                <h1 class="title-small">
                  {{
                    workoutStore.Workout?.date_started?.toString().split('T')[0] ||
                    t('dashboard.workoutSheet.loading')
                  }}
                </h1>
                <h1 class="title-small">
                  {{ workoutStore.Workout?.workout_name || t('dashboard.workoutSheet.loading') }}
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
          <div class="flex flex-col gap-4 justify-between">
            <div class="uppercase flex justify-between gap-3 text-sm 2xl:text-base">
              <p class="text-topsets-pritext dark:text-topsets-darkpritext">
                {{ t('dashboard.workoutSheet.program') }}
              </p>
              <router-link
                :to="{
                  name: 'program-details',
                  params: { id: clientStore.Client.program_details.program_id }
                }"
                class="text-topsets-secondary"
              >
                {{ workoutStore.Workout.program_name }}
              </router-link>
            </div>
            <div class="uppercase flex justify-between gap-3 text-sm 2xl:text-base">
              <p class="text-topsets-pritext dark:text-topsets-darkpritext">
                {{ t('dashboard.workoutSheet.workoutIteration') }}
              </p>
              <p class="text-topsets-secondary">{{ workoutStore.Workout.iteration }}</p>
            </div>
            <div class="uppercase flex justify-between gap-3 text-sm 2xl:text-base">
              <p class="text-topsets-pritext dark:text-topsets-darkpritext">
                {{ t('dashboard.workoutSheet.week') }}
              </p>
              <p class="text-topsets-secondary">{{ workoutStore.Workout.week_of_program }}</p>
            </div>
          </div>
          <!-- Second Group of Columns  -->
          <div class="flex flex-col gap-4 justify-between ">
            <router-link v-if="workoutStore.Workout.next_workout" class="text-topsets-pritext dark:text-topsets-darkpritext nav-btn" :to="{name:'workout-sheet', params:{id: workoutStore.Workout.next_workout}}"> {{ t('dashboard.workoutSheet.next') }}</router-link>
            <router-link v-if="workoutStore.Workout.previous_id" class="text-topsets-pritext dark:text-topsets-darkpritext nav-btn" :to="{name:'workout-sheet', params:{id: workoutStore.Workout.previous_id}}"> {{ t('dashboard.workoutSheet.previous') }}</router-link>
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
              v-for="exercise in workoutStore.Workout.exercises"
              :key="exercise.id"
              class="card p-8 2xl:py-12"
            >
              <h3 class="title-small text-lg 2xl:text-2xl">
                {{ exercise.exercise_name || t('dashboard.workoutSheet.olderVariableName') }}
              </h3>
              <h3 class="subheader-small uppercase">
                {{ exercise.type || t('dashboard.workoutSheet.olderVariableType') }}
              </h3>
              <div v-if="workoutStore.Workout.best_perf" class="flex justify-between w-full my-3">

                <p v-if="getBestPerf(exercise.id)" class="text-body">
                  Estimated ORM : {{ getBestPerf(exercise.id)?.orm ?? 'N/A' }}
                </p>
                <p class="text-topsets"
                v-if="
                (clientStore.Client.profile.best_perf
                  ?.find((ex: BestPerf) => ex.exercise === exercise.id)
                  ?.orm ?? 0
                ) <= (
                  workoutStore.Workout.best_perf
                    ?.find((ex: BestPerf) => ex.exercise === exercise.id)
                    ?.orm ?? 0
                )
              "
              >
               🏆 New Best!
              </p>
              </div>
              <div v-if="exercise.type !== 'multi-set'" class="grid grid-cols-4">
                <div class="col-span-3 flex-col flex gap-2">
                  <h4 class="text-topsets-pritext dark:text-topsets-darkpritext text-body opacity-0">
                    {{ t('dashboard.workoutSheet.filler') }}
                  </h4>
                  <div
                    v-for="(set, index) in exercise.true_sets"
                    :key="set"
                    class="flex gap-3 w-full items-center"
                  >
                    <p class="text-topsets-pritext dark:text-topsets-darkpritext min-w-max">
                      {{ t('dashboard.workoutSheet.setLabel', { number: index + 1 }) }}
                    </p>
                    <hr class="border border-topsets-sectext dark:border-topsets-darksectext w-full" />
                  </div>

                </div>

                <div class="grid-cols-2 grid gap-3">
                  <div class="flex-col flex gap-2 items-center min-w-max">
                    <h4 class="text-topsets-pritext dark:text-topsets-darkpritext text-body">
                      {{ exercise.intensity_mod || 'Load(Kg)' }}
                    </h4>
                    <div
                      v-for="(set, index) in exercise.true_sets"
                      :key="set"

                      :class="{
                        'text-red-500': set.weight_done < set.intensity,
                        'text-green-500': set.weight_done > set.intensity,
                        'text-topsets-secondary': set.weight_done == set.intensity
                      }"
                    >
                      {{ set.weight_done }}<span v-if="set.weight_done != set.intensity" class="text-topsets-sectext dark:text-topsets-darksectext text-xs">({{ set.intensity }})</span> {{ t('dashboard.workoutSheet.kg') }}
                    </div>
                  </div>
                  <div  class="flex-col flex gap-2 items-center min-w-max">
                    <h4 class="text-topsets-pritext dark:text-topsets-darkpritext text-body">
                      {{ exercise.volume_mod || 'Reps' }}
                    </h4>
                    <div
                      v-for="(set, index) in exercise.true_sets"
                      :key="set"

                      :class="{
                        'text-red-500': set.reps_done < set.reps,
                        'text-green-500': set.reps_done > set.reps,
                        'text-topsets-secondary': set.reps_done == set.reps
                      }"
                    >
                      {{ set.reps_done }}<span v-if="set.reps_done != set.reps" class="text-topsets-sectext dark:text-topsets-darksectext text-xs">({{ set.reps }})</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="flex flex-col gap-4 ps-3 border-s border-topsets-sectext dark:border-topsets-darksectext">
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
                        <h4 class="text-topsets-pritext dark:text-topsets-darkpritext text-body opacity-0">
                          {{ t('dashboard.workoutSheet.filler') }}
                        </h4>
                        <div
                          v-for="(set, index) in embed.true_sets"
                          :key="set"
                          class="flex gap-3 w-full items-center"
                        >
                          <p class="text-topsets-pritext dark:text-topsets-darkpritext min-w-max">
                            {{ t('dashboard.workoutSheet.setLabel', { number: index + 1 }) }}
                          </p>
                          <hr class="border border-topsets-sectext dark:border-topsets-darksectext w-full" />
                        </div>

                      </div>

                      <div class="grid-cols-2 grid gap-3">
                        <div class="flex-col flex gap-2 items-center min-w-max">
                          <h4 class="text-topsets-pritext dark:text-topsets-darkpritext text-body">
                            {{ t('dashboard.workoutSheet.weight') }}
                          </h4>
                          <div
                            v-for="(set, index) in embed.true_sets"
                            :key="set"

                            :class="{
                              'text-red-500': set.weight_done < set.intensity,
                              'text-green-500': set.weight_done > set.intensity,
                              'text-topsets-secondary': set.weight_done == set.intensity
                            }"
                          >
                            {{ set.weight_done }}<span v-if="set.weight_done != set.intensity" class="text-topsets-sectext dark:text-topsets-darksectext text-xs">({{ set.intensity }})</span> {{ t('dashboard.workoutSheet.kg') }}
                          </div>
                        </div>
                        <div  class="flex-col flex gap-2 items-center min-w-max">
                          <h4 class="text-topsets-pritext dark:text-topsets-darkpritext text-body">
                            {{ t('dashboard.workoutSheet.reps') }}
                          </h4>
                          <div
                            v-for="(set, index) in embed.true_sets"
                            :key="set"

                            :class="{
                              'text-red-500': set.reps_done < set.reps,
                              'text-green-500': set.reps_done > set.reps,
                              'text-topsets-secondary': set.reps_done == set.reps
                            }"
                          >
                            {{ set.reps_done }}<span v-if="set.reps_done != set.reps" class="text-topsets-sectext dark:text-topsets-darksectext text-xs">({{ set.reps }})</span>
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
        <!-- Metrics -->
        <div>
          <h3 class="contentH-small mb-6">
            {{ t('dashboard.workoutSheet.relevantMetrics') }}
          </h3>
          <div class="card p-8 2xl:py-12 flex flex-col items-center gap-6" style="height: 60vh">
            <div class="flex w-full justify-between items-center">
              <p class="text-topsets font-semibold"> {{ t('dashboard.workoutSheet.enjoyment') }} </p>
              <p> {{  workoutStore.Workout.feel?.enjoyment ? enjoyment[workoutStore.Workout.feel?.enjoyment-1] : t('general.na') }}</p>
            </div>
            <div class="flex w-full justify-between items-center">
              <p class="text-topsets font-semibold"> {{ t('dashboard.workoutSheet.pump') }} </p>
              <p> {{ workoutStore.Workout.feel?.pump ? pumps[workoutStore.Workout.feel?.pump-1] : t('general.na') }}</p>
            </div>
            <div class="flex w-full justify-between items-center">
              <p class="text-topsets font-semibold"> {{ t('dashboard.workoutSheet.exhaust') }} </p>
              <p> {{ workoutStore.Workout.feel?.exhaustion? exhaust[workoutStore.Workout.feel?.exhaustion-1] : t('general.na') }}</p>
            </div>
            <div class="flex w-full justify-between items-center">
              <p class="text-topsets font-semibold"> {{ t('dashboard.workoutSheet.difficulty') }} </p>
              <p> {{ workoutStore.Workout.feel?.difficulty? difficulty[workoutStore.Workout.feel?.difficulty-1] : t('general.na') }}</p>
            </div>
            <div class="spece-y-3 w-full">
              <p class="text-topsets font-semibold"> {{ t('dashboard.workoutSheet.extras') }} </p>
              <p> {{ workoutStore.Workout.feel?.comments || t('dashboard.workoutSheet.featureComingSoon') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
