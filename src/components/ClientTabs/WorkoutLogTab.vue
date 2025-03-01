<template>
  <div class="my-12">
    <!-- Search Section -->
    <div class="flex items-center justify-between mb-4 gap-6">
      <div class="flex gap-3">
        <!-- Search Bar -->
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name... "
          class="rafik-text-input border rounded-lg w-64"
        />
      </div>
      <hr class="w-full border-rafik-sectext border-b">
      <span class="text-sm">Showing {{ filteredWorkouts.length }} row(s)</span>
    </div>

    <!-- workout Table -->
    <table class="w-full text-center ">
      <thead class="contentH-small">
        <tr>
          <th>Completed</th>
          <th>Name</th>
          <th>Created</th>
          <th>Performance</th>
          <th>Feel</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="workout in filteredWorkouts" :key="workout.id" class="border-b border-rafik-sectext h-12">
          <td>
            {{ workout.date_completed ? new Date(workout.date_completed).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) : '-' }}
          </td>
          <td >
            {{ workout.workout_name }}
          </td>
          <td>
            {{ workout.created_at ? new Date(workout.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) : '-' }}
          </td>
          <td>
            {{ workout.average_intensity && workout.predicted_intensity ? Math.ceil((workout.average_intensity/workout.predicted_intensity)*100) : 'N/A' }}
          </td>
          <td>
            {{ workout.feel ? feels[workout.feel-1] : 'N/A' }}
          </td>
          <td class="px-3 relative" >
              <Router-link :to="{name:'workout-sheet', params:{id:workout.id}}" class="px-3 py-5 hover:bg-rafik-pribg hover:text-rafik-pritext rounded text-xs">More Details</Router-link>

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
import { useWorkoutStore } from '@/stores/workoutstores';
import { onMounted, ref, computed } from 'vue';

const workoutStore = useWorkoutStore();
const props = defineProps(['program']);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;
const show_action = ref();
const feels = ref(["Terrible", "Poor", "Average", "Good", "Excellent"]);
onMounted(() => {
  workoutStore.getAllWorkouts(props.program.id);
});

function handleLeave(){
  setTimeout(() => {
  show_action.value=null
}, 500)
}
// Computed property for filtered Workouts based on search query
const filteredWorkouts = computed(() => {
  const lowerSearchQuery = searchQuery.value.toLowerCase();
  const filtered = workoutStore.AllWorkouts.filter(wrkout =>
    wrkout.workout_name?.toLowerCase().includes(lowerSearchQuery)
  );

  // Pagination: slice the array based on current page
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return filtered.slice(startIndex, endIndex);
});

// Computed property for total pages
const totalPages = computed(() => {
  const filtered = workoutStore.AllWorkouts.filter(workout =>
    workout.workout_name?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
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
