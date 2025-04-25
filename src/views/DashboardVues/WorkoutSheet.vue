<script setup lang="ts">
import { ref, onMounted } from 'vue';
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

// Function to refresh the route/component
function refreshComponent() {
  router.go(0); // This reloads the current route
}

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

// Fetch the Workout when the component mounts
onMounted(() => {
  const workoutId = route.params.id as string;
  if (workoutId) {
    workoutStore
      .getWorkout(workoutId)
      .then(() => {
        if (workoutStore.Workout?.client_id) clientStore.getClient(workoutStore.Workout.client_id);
      })
      .catch(() => {
        showError(t('dashboard.workoutSheet.failedToLoadWorkoutDetails'));
      });
  }
});
</script>

<template>
  <div class="flex h-screen overflow-auto">
    <div
      v-if="workoutStore.Workout && clientStore.Client"
      class="flex-1 px-8 py-12 w-full 2xl:px-12 2xl:py-24 space-y-8 2xl:space-y-6"
    >
      <!-- Upper Header Area -->
      <div
        class="border group flex flex-col relative gradient-bg border-rafik-alternate rounded-lg overflow-hidden"
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
              <p class="text-rafik-pritext dark:text-rafik-darkpritext">
                {{ t('dashboard.workoutSheet.program') }}
              </p>
              <router-link
                :to="{
                  name: 'program-details',
                  params: { id: clientStore.Client.program_details.program_id }
                }"
                class="text-rafik-secondary"
              >
                {{ workoutStore.Workout.program_name }}
              </router-link>
            </div>
            <div class="uppercase flex justify-between gap-3 text-sm 2xl:text-base">
              <p class="text-rafik-pritext dark:text-rafik-darkpritext">
                {{ t('dashboard.workoutSheet.workoutIteration') }}
              </p>
              <p class="text-rafik-secondary">{{ workoutStore.Workout.iteration }}</p>
            </div>
            <div class="uppercase flex justify-between gap-3 text-sm 2xl:text-base">
              <p class="text-rafik-pritext dark:text-rafik-darkpritext">
                {{ t('dashboard.workoutSheet.week') }}
              </p>
              <p class="text-rafik-secondary">{{ workoutStore.Workout.week_of_program }}</p>
            </div>
          </div>
          <!-- Second Group of Columns  -->
          <div class="flex flex-col gap-4 justify-between">
            <div class="uppercase flex justify-between gap-3 text-sm 2xl:text-base">
              <p class="text-rafik-pritext dark:text-rafik-darkpritext">
                {{ t('dashboard.workoutSheet.setsDone') }}
              </p>
              <p class="text-rafik-secondary">
                {{ workoutStore.Workout.average_volume || t('dashboard.workoutSheet.notRecorded') }}
              </p>
            </div>
            <div class="uppercase flex justify-between gap-3 text-sm 2xl:text-base">
              <p class="text-rafik-pritext dark:text-rafik-darkpritext">
                {{ t('dashboard.workoutSheet.avgIntensity') }}
              </p>
              <p class="text-rafik-secondary">
                {{
                  workoutStore.Workout.average_intensity || t('dashboard.workoutSheet.notRecorded')
                }}
              </p>
            </div>
            <div class="uppercase flex justify-between gap-3 text-sm 2xl:text-base">
              <p class="text-rafik-pritext dark:text-rafik-darkpritext">
                {{ t('dashboard.workoutSheet.feel') }}
              </p>
              <p class="text-rafik-secondary">
                {{
                  workoutStore.Workout.feel
                    ? rt(tm('dashboard.workoutSheet.feels')[workoutStore.Workout.feel - 1])
                    : t('dashboard.workoutSheet.na')
                }}
              </p>
            </div>
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
              <div class="grid grid-cols-4">
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
                      {{ t('dashboard.workoutSheet.weight') }}
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
                  <div class="flex-col flex gap-2 items-center min-w-max">
                    <h4 class="text-rafik-pritext dark:text-rafik-darkpritext text-body">
                      {{ t('dashboard.workoutSheet.reps') }}
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
            </li>
          </ul>
        </div>
        <!-- Metrics -->
        <div>
          <h3 class="contentH-small mb-6">
            {{ t('dashboard.workoutSheet.relevantMetrics') }}
          </h3>
          <div class="card p-8 2xl:py-12 flex flex-col items-center" style="height: 60vh">
            <div class="space-y-8 my-auto flex flex-col items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                stroke="currentColor"
                class="w-12 text-rafik-sectext dark:text-rafik-darksectext"
                viewBox="0 0 448 512"
              >
                <path
                  d="M176 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l16 0 0 34.4C92.3 113.8 16 200 16 304c0 114.9 93.1 208 208 208s208-93.1 208-208c0-41.8-12.3-80.7-33.5-113.2l24.1-24.1c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L355.7 143c-28.1-23-62.2-38.8-99.7-44.6L256 64l16 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L224 0 176 0zm72 192l0 128c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-128c0-13.3 10.7-24 24-24s24 10.7 24 24z"
                />
              </svg>
              <p>
                {{ t('dashboard.workoutSheet.featureComingSoon') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
