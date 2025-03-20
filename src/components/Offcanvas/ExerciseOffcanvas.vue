<template>
  <!-- Drawer toggle button -->
  <div class="text-center">
    <button @click="openModal" class="header-small p-4 border border-rafik-pritext dark:border-rafik-darkpritext text-sm rounded hover:opacity-70">
      Add Exercise +
      <br><span class="text-xs text-rafik-sectext dark:text-rafik-darksectext">Straight Exercise </span>
    </button>
  </div>

  <!-- Drawer component -->
  <div v-if="ModalOn" class="fixed top-0 right-0 z-40 w-full h-screen flex justify-end" style="background-color: #000000AA;">
    <div class="flex-1 w-full h-full content" @click="ModalOn = false"></div>
    <div class="p-8 py-12 border-l border-rafik-sectext dark:border-rafik-darksectext  bg-rafik-pribg dark:bg-rafik-darkpribg w-128 h-full space-y-8 relative">
      <div>
        <h2 class="subheader-medium uppercase">Exercise</h2>
        <h2 class="header-large font-black">LIBRARY</h2>
      </div>

      <!-- Close button -->
      <button @click="ModalOn = false" type="button" class="absolute w-16 h-16 top-2.5 end-2.5">
        <svg class="w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
        </svg>
      </button>

      <!-- Search bar -->
      <form class="max-w-md mx-auto">
        <div class="relative">
          <input type="search" @input="handleSearch" class="block w-full p-4 text-sm text-rafik-sectext dark:text-rafik-darksectext border rounded-lg bg-rafik-pribg dark:bg-rafik-darkpribg" placeholder="Type to Search Exercises..." required />
        </div>
      </form>
      <div
        @click="showAddExerciseModal = true"
        class="border-2 border-dashed flex p-3 hover:cursor-pointer hover:opacity-70 W-FULL items-center justify-center border-rafik-sectext dark:border-rafik-darksectext bg-rafik-pribg dark:bg-rafik-darkpribg rounded-lg overflow-hidden"
      >
        <p class="text-center header-small uppercase ">+<br> ADD CUSTOM EXERCISE</p>
      </div>
      <!-- Exercise list -->
      <div class="h-5/6 pb-96 overflow-y-auto" v-if="exerciseStore.AllExercises && exerciseStore.AllExercises.length">
        <ul class="overflow-auto space-y-4">
          <li v-for="exercise in exerciseStore.AllExercises" :key="exercise.id">
            <div class="card p-6 border-rafik gradient-bg flex justify-between items-center text-left border">
              <div>
                <h2 class="header-small">{{ exercise.exercise_name }}</h2>
                <h2 class="subheader-small uppercase mb-6">{{ exercise.type }}</h2>
                <p class="label text-rafik-secondary">Prime Movers:</p>
                <div class="flex gap-2 flex-wrap">
                  <p class="label text-rafik-secondary" v-for="(mover, index) in exercise.prime" :key="index">{{ mover }}</p>
                </div>
              </div>

              <!-- Select Button -->
              <button
                @click="toggleSelection(exercise)"
                :class="{'bg-rafik': isSelected(exercise), 'bg-gray-500': !isSelected(exercise)}"
                class="px-4 py-2 text-white rounded-lg"
                :disabled="maxSelectable !== null && !isSelected(exercise) && selectedExercises.length >= maxSelectable">
                {{ isSelected(exercise) ? 'Selected' : 'Select' }}
              </button>
            </div>
          </li>
        </ul>
      </div>
      <p v-else>No exercises found.</p>

      <!-- Selected Exercises Section -->
      <div class="fixed bottom-0 p-6 border-l border-rafik-sctext bg-rafik-secbg dark:bg-rafik-darksecbg flex flex-col w-128 right-0 gap-4">
        <h4 class="contentH-small uppercase">Selected ({{ selectedExercises.length }}{{ maxSelectable !== null ? '/' + maxSelectable : '' }})</h4>

        <div class="flex flex-wrap gap-2">
          <div v-for="exercise in selectedExercises" :key="exercise.id" class="px-3 py-1 card text-white rounded-full flex items-center gap-2">
            <span>{{ exercise.exercise_name }}</span>
            <button @click="toggleSelection(exercise)" class="text-xs text-red-500 px-2 py-0.5 rounded-full">X</button>
          </div>
        </div>

        <button @click="handleSubmit" class="btn-lg mt-2" :disabled="selectedExercises.length === 0">
          ADD EXERCISES
        </button>
      </div>
    </div>
  </div>
   <!-- Add Exercise Modal -->
   <AddExerciseModal
      :visible="showAddExerciseModal"
      @close="showAddExerciseModal = false"
      @submit="addExercise"
    />
</template>

<script lang="ts" setup>

import { ref, watch } from 'vue';
import debounce from 'lodash/debounce';
import { useExerciseStore } from '@/stores/exercisestores';
import AddExerciseModal from '@/components/ExerciseTabs/AddExerciseModal.vue';
const ModalOn = ref<boolean>(false);
const exerciseStore = useExerciseStore();
const selectedExercises = ref<any[]>([]);
  const showAddExerciseModal = ref(false);
// Add exercise
function addExercise(exercise:any) {
  exerciseStore.createExercise(exercise);
  showAddExerciseModal.value = false;
}

const props = defineProps({
  maxSelectable: {
    type: Number,
    default: null // Allows infinite selection if not provided
  }
});

const emits = defineEmits(['addExercises']);

// Debounced function to fetch relevant exercises
const debouncedFetchExercises = debounce((query: string) => {
  if (query) {
    exerciseStore.fetchRelevantExercises(query);
  }
}, 500);

watch(ModalOn, (newVal) => {
  if (!newVal) selectedExercises.value = [];
});

function openModal() {
  ModalOn.value = true;
  exerciseStore.getAllExercises(); // Fetch all exercises when modal opens
}

function handleSubmit() {
  if (confirm(`Confirm adding ${selectedExercises.value.length} exercises?`)) {
    emits('addExercises', selectedExercises.value);
    ModalOn.value = false;
  }
}

// Handle input change
function handleSearch(event: Event) {
  const target = event.target as HTMLInputElement;
  debouncedFetchExercises(target.value);
}

// Toggle exercise selection
function toggleSelection(exercise: any) {
  const index = selectedExercises.value.findIndex(e => e.id === exercise.id);
  if (index === -1) {
    if (props.maxSelectable === null || selectedExercises.value.length < props.maxSelectable) {
      selectedExercises.value.push(exercise);
    }
  } else {
    selectedExercises.value.splice(index, 1);
  }
}

// Check if exercise is selected
function isSelected(exercise: any) {
  return selectedExercises.value.some(e => e.id === exercise.id);
}
</script>
