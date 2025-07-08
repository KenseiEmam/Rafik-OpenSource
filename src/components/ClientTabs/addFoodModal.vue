<template>
  <div
    v-if="props.meal"
    class="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
  >
    <div class=" rounded-lg shadow  h-3/4   min-w-128 w-1/3">
      <div class="h-full card p-6 flex flex-col my-auto" v-if="!mainfood">
        <h2 class="contentH-small">
       Add item to {{ meal }}
      </h2>
      <p class="text-body mb-4">
        Use the search bar below to look through the food database then choose an item to add.
      </p>
      <!-- Search bar -->
      <form class=" mx-auto w-full">
        <div class="relative">
          <input
            type="search"
            @input="handleSearch"
            class="block w-full p-4 text-sm text-rafik-sectext dark:text-rafik-darksectext border rounded-lg bg-rafik-pribg dark:bg-rafik-darkpribg"
            :placeholder="t('Type here, try: eggs ')"
            required
          />
        </div>
      </form>
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
          {{ t('dashboard.tabs.clients.changeProgram.loading') }}
        </p>
      </div>

    <div v-else-if="foods.length === 0" class="flex flex-col gap-3 my-auto items-center">
        <p class="my-auto text-center ">
          Start searching to display food items!
        </p>

      </div>
      <ul v-else class="flex flex-col gap-2 w-full mb-16 overflow-y-auto py-4">
        <li
          v-for="food in foods"
          :key="food"
          @click="selectedFood = food"
          class="card gradient-bg p-4 flex items-center gap-3 group  cursor-pointer"
        >
          <div>
            <h2
              class="subheader-small text-rafik-pritext dark:text-rafik-darkpritext group-hover:text-rafik"
            >
              {{ food.food_name }}
            </h2>
            <p
              class="text-sm text-body "
            >
              {{ food.food_type !== 'Brand' ? food.food_type : food.brand_name  }}
            </p>
            <p class="label text-xs">Click to this food</p>
          </div>
        </li>
      </ul>
      <div class="flex justify-end mt-auto">
        <button
          type="button"
          @click="cancelAdd"
          class="btn-md bg-red-500 border-red-500 hover:bg-red-400 rounded mr-2"
        >
          {{ t('dashboard.tabs.clients.changeProgram.cancel') }}
        </button>
      </div>
      </div>
      <div class=" card flex p-6 flex-col" v-else>
           <h2 class="contentH-small">
       Add {{mainfood.food_name}} to {{ meal }}
      </h2>
      <p class="text-body">{{mainfood.food_type}}</p>
        <form class=" mx-auto w-full space-y-4 my-8">
        <div v-if=" mainfood.servings.serving[0]" class="relative">
          <label for=""> Select Serving Size</label>
          <select class="rafik-text-input" name="" v-model="currentServing" id="">
            <option v-for="serving in mainfood.servings.serving" :value="serving">
              {{ serving.serving_description }}
            </option>
          </select>
        </div>
        <p class="text-rafik-secondary">Serving is : {{mainfood.servings.serving.serving_description}}</p>
        <div class="relative">
          <label for=""> Select Amount</label>
          <input type="number" class="rafik-text-input" v-model.number="servingAmount">
        </div>
      </form>

      <div v-if="currentServing" :key="servingAmount" class="my-3 divide-y divide-rafik-sectext dark:divide-rafik-darksectext">
        <p class="text-sm flex items-center gap-2 text-rafik py-3 "> <span class="w-4 h-4 bg-rafik rounded-full content"></span>Protein {{ currentServing.protein *  Number(servingAmount)  }}g</p>
        <p class="text-sm flex items-center gap-2 text-rafik-alternate py-3 "> <span class="w-4 h-4 bg-rafik-alternate rounded-full content"></span>Carbohydrates {{ currentServing.carbohydrate *  Number(servingAmount)  }}g</p>
        <p class="text-sm flex items-center gap-2 text-rafik-teritiart py-3 "> <span class="w-4 h-4 bg-rafik-teritiary rounded-full content"></span>Fats {{ currentServing.fat *  Number(servingAmount)  }}g</p>
        <p class="header-small py-3 "> Energy {{ currentServing.calories * servingAmount }} kcal</p>

      </div>
      <!-- Serving Amount -->




      <div class="flex justify-end mt-auto">
        <button
          type="button"
          @click="addFood"
          class="btn-md rounded mr-2"
        >
          Add Food
        </button>
        <button
          type="button"
          @click="resetFood"
          class="btn-md bg-red-500 border-red-500 hover:bg-red-400 rounded mr-2"
        >
          Back to Search
        </button>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useProgramStore } from '@/stores/programstores';
import { supabase } from '@/lib/supabaseClient'; // Ensure Supabase is correctly set up
import Swal from 'sweetalert2';
import { useI18n } from 'vue-i18n';
import { debounce } from 'lodash';
import { emit } from 'process';
const { t , locale } = useI18n();
type Food = {
  food_id: number;
  food_name: string;
  food_type: string;
  serving_id: string;
  serving_name: string;
  serving_amount: number;
  calories: number;
  protein: number;
  fat: number;
  carbohydrate: number;
};

const props = defineProps({
  meal: String
});
const servingAmount = ref<number>(1)
const currentServing = ref<any>()
const selectedFood = ref<any | null>(null); // ← only for ID and name
const mainfood = ref<any>(null); // ← gets populated with full details
const loading = ref(false);
const foods = ref<any>([])

const emits = defineEmits(['close', 'submit']);
// Handle input change
function handleSearch(event: Event) {
  const target = event.target as HTMLInputElement;
  debouncedFetchExercises(target.value);
}
function resetFood(){
  selectedFood.value = undefined
  mainfood.value = undefined
}
function cancelAdd(){
  selectedFood.value = undefined
  mainfood.value = undefined
  emits('close')
}
const debouncedFetchExercises = debounce(async (query: string) => {
  if (!query) return;
  loading.value = true;

  try {
    // ✅ Await the session and safely extract the token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token || '';

    const response = await fetch(`https://pexviywnztvqomfosvho.supabase.co/functions/v1/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        method: "GET",
        path: "foods.search",
        search_expression: query,
        format: "json",
        endpoint: "fat-secret"
      }),
    });

    const result = await response.json();
    foods.value = result?.foods.food || [];
  } catch (error) {
    console.error("Error fetching foods:", error);
    foods.value = [];
  } finally {
    loading.value = false;
  }
}, 500);
function addFood() {
  Swal.fire({
    title: "Check the servings!",
    text: "This food will be added to your meal and cannot be edited unless removed.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Add Item',
    confirmButtonColor: '#CB901C',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  }).then((result) => {
    if (result.isConfirmed) {
       const foodPayload: Food = {
        food_id: mainfood.value.food_id,
        food_name: mainfood.value.food_name,
        food_type: mainfood.value.food_type,
        serving_id: currentServing.value.serving_id,
        serving_name: currentServing.value.serving_description,
        serving_amount: servingAmount.value,
        calories: Math.round(currentServing.value.calories * servingAmount.value),
        protein: Number((currentServing.value.protein * servingAmount.value).toFixed(2)),
        fat: Number((currentServing.value.fat * servingAmount.value).toFixed(2)),
        carbohydrate: Number((currentServing.value.carbohydrate * servingAmount.value).toFixed(2)),
      };
      resetFood()
      emits('submit', foodPayload);
    }
  });
}

watch(selectedFood, async (selectedFood:any) => {
  if (!selectedFood) return;

  loading.value = true;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token || '';

    const response = await fetch(`https://pexviywnztvqomfosvho.supabase.co/functions/v1/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        method: "GET",
        path: "food.get",
        food_id: selectedFood.food_id,
        format: "json",
        endpoint: "fat-secret"
      }),
    });

    const result = await response.json();
    if (result?.food) {
      mainfood.value = result.food;
      if (result.food.servings.serving[0])
      currentServing.value = result.food.servings.serving[0]
      else
      currentServing.value = result.food.servings.serving
    }
  } catch (error) {
    console.error('Failed to fetch main food details:', error);
  } finally {
    loading.value = false;
  }
});
</script>
<style scoped>
li:hover {
  background-image: linear-gradient(135deg, #f3eeeb 36%, #fff2cb);
}
.dark li:hover {
  background-image: linear-gradient(135deg, #081411 36%, #295f42);
}
</style>
