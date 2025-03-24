<template>
  <div class="my-12">
    <!-- Search Section -->
    <div class="flex items-center justify-between mb-4 gap-6">
      <hr class="w-full border-rafik-sectext dark:border-rafik-darksectext border-b">
      <span class="text-sm">Showing {{ filteredDiets.length }} row(s)</span>
    </div>

    <!-- diet Table -->
    <table class="w-full text-center">
      <thead class="font-bold">
        <tr>
          <th>Date Logged</th>
          <th>Calories</th>
          <th>Macro Splot <span class="text-sm text-center">P/C/F</span></th>
          <th>No. of Meals</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="diet in filteredDiets" :key="diet.id" class="border-b border-rafik-sectext dark:border-rafik-darksectext h-12">
          <td>
            {{ diet.date_logged ? new Date(diet.date_logged).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) : '-' }}
          </td>
          <td >
            {{ diet.overall_macros && diet.goal_macros? computeMacros(diet.overall_macros)+"/"+computeMacros(diet.goal_macros): "-"}}
          </td>
          <td>
            {{ diet.overall_macros && diet.overall_macros.length > 0? Math.ceil(diet.overall_macros[0])+"g / "+Math.ceil(diet.overall_macros[1])+"g / "+Math.ceil(diet.overall_macros[2])+"g": "-"}}
          </td>
          <td>
            {{ diet.breakfast?computedMeals(diet):"missing meals"}}
          </td>

          <td class="px-3 relative" >
              <Router-link :to="{name:'diet-sheet', params:{id:diet.id}}" class="px-3 py-5 hover:bg-rafik-pribg dark:bg-rafik-darkpribg hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darkpritext rounded text-sm">More Details</Router-link>

          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div v-if="totalPages>1" class="flex justify-between items-center mt-4 pb-12">
      <button @click="prevPage" :disabled="currentPage === 1" class="px-4 py-2 border rounded-lg hover:border-rafik hover:text-rafik">Prev</button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages" class="px-4 py-2 border rounded-lg hover:border-rafik hover:text-rafik">Next</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDietStore } from '@/stores/dietstores';
import { onMounted, ref, computed } from 'vue';

const dietStore = useDietStore();
const props = defineProps(['profile']);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;
const show_action = ref();
const feels = ref(["Terrible", "Poor", "Average", "Good", "Excellent"]);
onMounted(() => {
  dietStore.getAllDiets(props.profile.id);
});

const computeMacros= ((macros:number[])=>{
  if(macros.length == 0){
    return 0;
  }
  else{
    return Math.ceil(macros[0]*4+macros[1]*4+macros[2]*4);
  }
})
function handleLeave(){
  setTimeout(() => {
  show_action.value=null
}, 500)
}
const computedMeals = (diet:any)=>{
  let value = 0;
  if(diet.breakfast && diet.breakfast.length > 0)value++;
  if(diet.lunch && diet.lunch.length > 0 )value++;
  if(diet.dinner && diet.dinner.length > 0)value++;
  if(diet.supper && diet.supper.lenght > 0)value++;
  return value;
}
// Computed property for filtered Diets based on search query
const filteredDiets = computed(() => {
  const lowerSearchQuery = searchQuery.value;
  const filtered = dietStore.AllDiets

  // Pagination: slice the array based on current page
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return filtered.slice(startIndex, endIndex);
});

// Computed property for total pages
const totalPages = computed(() => {
  const filtered = dietStore.AllDiets
  return Math.ceil(filtered.length / itemsPerPage);
});

// Methods for pagination
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};
</script>

<style scoped>
/* Optional: Style for the search and filter section */
.input, .search-bar {
  width: 100%;
}
</style>
