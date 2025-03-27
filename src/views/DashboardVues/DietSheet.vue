<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useDietStore } from '@/stores/dietstores';
import Swal from 'sweetalert2';
import router from '@/router';
import { supabase } from '@/lib/supabaseClient';
import { useUserStore } from '@/stores/user';
import 'vue3-circle-progress/dist/circle-progress.css';
// @ts-ignore
import CircleProgress from 'vue3-circle-progress';
import { useI18n } from 'vue-i18n';

const { t , locale } = useI18n();

interface mealInterface {
  meal_name: String;
  protein: Number;
  carbohydrates: Number;
  fats: Number;
  calories: Number;
  foods?: any[];
}
const route = useRoute();
const dietStore = useDietStore();
const clientStore = useUserStore();
const meals = ref<mealInterface[]>([]);
function refreshComponent() {
  router.go(0);
}
const showAddProgramModal = ref(false);
const showCancelModal = ref(false);
function showSuccess(message: string) {
  Swal.fire({
    title: t('dashboard.dietSheet.successTitle'),
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
function showError(message: string) {
  Swal.fire({
    title: t('dashboard.dietSheet.errorTitle'),
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}
function populateMeal(breakfast: number[], lunch: number[], dinner: number[], supper: number[]) {
  meals.value = [
    {
      meal_name: 'Breakfast',
      protein: Math.ceil(breakfast[0]),
      carbohydrates: Math.ceil(breakfast[1]),
      fats: Math.ceil(breakfast[2]),
      calories: Math.ceil(breakfast[3]),
      foods: dietStore.Diet?.breakfast
    },
    {
      meal_name: 'Lunch',
      protein: Math.ceil(lunch[0]),
      carbohydrates: Math.ceil(lunch[1]),
      fats: Math.ceil(lunch[2]),
      calories: Math.ceil(lunch[3]),
      foods: dietStore.Diet?.lunch
    },
    {
      meal_name: 'Dinner',
      protein: Math.ceil(dinner[0]),
      carbohydrates: Math.ceil(dinner[1]),
      fats: Math.ceil(dinner[2]),
      calories: Math.ceil(dinner[3]),
      foods: dietStore.Diet?.dinner
    },
    {
      meal_name: 'Supper',
      protein: Math.ceil(supper[0]),
      carbohydrates: Math.ceil(supper[1]),
      fats: Math.ceil(supper[2]),
      calories: Math.ceil(supper[3]),
      foods: dietStore.Diet?.supper
    }
  ];
}
function formatServing(amount: number, servingName: string): string {
  const match = servingName.match(/(\d*\.?\d+)/);
  if (match) {
    const extractedNumber = parseFloat(match[0]);
    const newAmount = extractedNumber * amount;
    return servingName.replace(match[0], newAmount.toString());
  }
  return `${amount} ${servingName}`;
}
const feels = ref(['Terrible', 'Poor', 'Average', 'Good', 'Excellent']);
onMounted(() => {
  const dietId = route.params.id as string;
  if (dietId) {
    dietStore
      .getDiet(dietId)
      .then(() => {
        if (dietStore.Diet?.client_id) clientStore.getClient(dietStore.Diet.client_id);
        if (
          dietStore.Diet?.breakfast_macros &&
          dietStore.Diet?.lunch_macros &&
          dietStore.Diet?.dinner_macros &&
          dietStore.Diet?.supper_macros
        )
          populateMeal(
            dietStore.Diet?.breakfast_macros,
            dietStore.Diet?.lunch_macros,
            dietStore.Diet?.dinner_macros,
            dietStore.Diet?.supper_macros
          );
      })
      .catch(() => {
        showError(t('dashboard.dietSheet.loadDietFail'));
      });
  }
});
</script>
<template>
  <div class="flex h-screen overflow-auto">
    <div
      v-if="dietStore.Diet && clientStore.Client"
      class="flex-1 px-8 py-12 w-full 2xl:px-12 2xl:py-24 space-y-8 2xl:space-y-6"
    >
      <!-- Upper Header Area -->
      <div
        class="border group flex flex-col relative gradient-bg border-rafik-alternate rounded-lg overflow-hidden"
      >
        <div
          v-if="dietStore.Diet.overall_macros && dietStore.Diet.goal_macros"
          class="p-8 2xl:p-16 2xl:py-24 space-y-4 relative gap-12 items-center grid grid-cols-4"
        >
          <div class="pr-6 space-y-4">
            <div class="flex items-center gap-6">
              <div class="space-y-2">
                <h2 class="subheader-small">
                  {{ t('dashboard.dietSheet.dietLogFor') }}
                </h2>
                <h1 class="title-small">
                  {{
                    dietStore.Diet?.date_logged?.toString().split('T')[0] ||
                    t('dashboard.dietSheet.loading')
                  }}
                </h1>
                <router-link
                  :to="{ name: 'client-details', params: { id: clientStore.Client.id } }"
                  class="header-small font-black uppercase my-3"
                >
                  {{ t('dashboard.dietSheet.by') }}
                  {{
                    clientStore.Client?.first_name + ' ' + clientStore.Client?.last_name ||
                    t('dashboard.dietSheet.loading')
                  }}
                </router-link>
              </div>
            </div>
          </div>
          <!-- First Group of Columns -->
          <div class="flex flex-col gap-4 items-center justify-between col-span-2">
            <circle-progress
              fill-color="#D7BD21"
              empty-color="#000503"
              :percent="Math.ceil(dietStore.Diet.overall_macros[3] / dietStore.Diet.goal_macros[3])"
            />
            <p class="text-rafik-pritext dark:text-rafik-darkpritext flex uppercase">
              {{ t('dashboard.dietSheet.totalCalories') }}:
              <span class="ml-12 text-rafik mr-3">
                {{ Math.ceil(dietStore.Diet.overall_macros[3]) }}
              </span>
              / {{ Math.ceil(dietStore.Diet.goal_macros[3]) }}
            </p>
          </div>
          <!-- Second Group of Columns  -->
          <div class="flex flex-col gap-4 justify-between">
            <div class="uppercase flex flex-col w-full gap-3 text-sm 2xl:text-base">
              <div
                class="h-6 w-full bg-rafik-secbg dark:bg-rafik-darksecbg rounded-full overflow-auto"
              >
                <div
                  class="bg-rafik-secondary h-6 rounded-full"
                  :style="
                    'width:' +
                    Math.ceil(dietStore.Diet.overall_macros[0] / dietStore.Diet.goal_macros[0]) +
                    '%'
                  "
                ></div>
              </div>
              <p class="text-rafik-pritext dark:text-rafik-darkpritext flex w-full">
                {{ t('dashboard.dietSheet.protein') }}:
                <span class="ms-auto text-rafik-secondary mr-3">
                  {{ Math.ceil(dietStore.Diet.overall_macros[0]) }}
                </span>
                / {{ Math.ceil(dietStore.Diet.goal_macros[0]) }}
              </p>
            </div>
            <div class="uppercase flex flex-col w-full gap-3 text-sm 2xl:text-base">
              <div
                class="h-6 w-full bg-rafik-secbg dark:bg-rafik-darksecbg rounded-full overflow-auto"
              >
                <div
                  class="bg-rafik-teritiary h-6 rounded-full"
                  :style="
                    'width:' +
                    Math.ceil(dietStore.Diet.overall_macros[1] / dietStore.Diet.goal_macros[1]) +
                    '%'
                  "
                ></div>
              </div>
              <p class="text-rafik-pritext dark:text-rafik-darkpritext flex w-full">
                {{ t('dashboard.dietSheet.carbohydrates') }}:
                <span class="ms-auto text-rafik-teritiary mr-3">
                  {{ Math.ceil(dietStore.Diet.overall_macros[1]) }}
                </span>
                / {{ Math.ceil(dietStore.Diet.goal_macros[1]) }}
              </p>
            </div>
            <div class="uppercase flex flex-col w-full gap-3 text-sm 2xl:text-base">
              <div
                class="h-6 w-full bg-rafik-secbg dark:bg-rafik-darksecbg rounded-full overflow-auto"
              >
                <div
                  class="bg-rafik-alternate h-6 rounded-full"
                  :style="
                    'width:' +
                    Math.ceil(dietStore.Diet.overall_macros[2] / dietStore.Diet.goal_macros[2]) +
                    '%'
                  "
                ></div>
              </div>
              <p class="text-rafik-pritext dark:text-rafik-darkpritext flex w-full">
                {{ t('dashboard.dietSheet.fats') }}:
                <span class="ms-auto text-rafik-alternate mr-3">
                  {{ Math.ceil(dietStore.Diet.overall_macros[2]) }}
                </span>
                / {{ Math.ceil(dietStore.Diet.goal_macros[2]) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="grid itemsstretch gap-6 grid-cols-2 2xl:grid-cols-3">
        <!-- Meal Breakdown -->
        <div class="2xl:col-span-2">
          <h3 class="contentH-small mb-6">{{ t('dashboard.dietSheet.mealBreakdown') }}</h3>
          <ul class="flex gap-3 flex-col w-full pb-16 overflow-y-auto" style="max-height: 50vh">
            <li v-for="(meal, index) in meals" :key="index" class="card p-8 2xl:py-12">
              <h3 class="title-small text-lg 2xl:text-2xl">
                {{ meal.meal_name || t('dashboard.dietSheet.olderVariableName') }}
              </h3>
              <h3 class="subheader-small font-bold">
                P: {{ meal.protein }}g , C: {{ meal.carbohydrates }}g , F: {{ meal.fats }}g ,
                <span class="text-rafik-secondary font-bold">
                  {{ t('dashboard.dietSheet.energy') }}: {{ meal.calories }}kCal
                </span>
              </h3>
              <div v-if="meal.foods && meal.foods.length > 0" class="grid grid-cols-4">
                <div class="col-span-3 flex-col flex gap-2">
                  <h4 class="text-rafik-pritext dark:text-rafik-darkpritext text-body opacity-0">
                    Filler
                  </h4>
                  <div
                    v-for="(food, index) in meal.foods"
                    :key="food"
                    class="flex gap-3 w-full items-center"
                  >
                    <p class="text-rafik-pritext dark:text-rafik-darkpritext min-w-max">
                      {{ food.food_name }}
                    </p>
                    <hr class="border border-rafik-sectext dark:border-rafik-darksectext w-full" />
                  </div>
                </div>
                <div>
                  <div class="flex-col flex gap-2 items-center">
                    <h4 class="text-rafik-pritext dark:text-rafik-darkpritext text-body">
                      {{ t('dashboard.dietSheet.servings') }}
                    </h4>
                    <div
                      v-for="(food, index) in meal.foods"
                      :key="food"
                      class="text-rafik-secondary"
                    >
                      {{ formatServing(food.serving_amount, food.serving_name) }}
                    </div>
                  </div>
                </div>
              </div>
              <div
                v-else
                class="h-32 flex items-center subheader-small justify-center uppercase text-red-500 w-full"
              >
                {{ t('dashboard.dietSheet.mealNotLogged') }}
              </div>
            </li>
          </ul>
        </div>
        <!-- Metrics -->
        <div>
          <h3 class="contentH-small mb-6">{{ t('dashboard.dietSheet.relevantMetrics') }}</h3>
          <div class="card p-8 2xl:py-12 flex flex-col items-center" style="height: 50vh">
            <div v-if="!dietStore.Diet.workout_id" class="space-y-8">
              {{ t('dashboard.dietSheet.noWorkoutLogged') }}
              {{
                dietStore.Diet?.date_logged?.toString().split('T')[0] ||
                t('dashboard.dietSheet.loading')
              }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
