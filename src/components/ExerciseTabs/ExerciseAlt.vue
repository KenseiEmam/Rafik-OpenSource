<template>
  <div class="p-4 2xl:p-6 flex flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h3 class="contentH-small">Exercise Alternatives</h3>
        <p class="text-body">Below is a list of alternatives. You can add up to 3 alternatives of your liking.</p>
      </div>
      <h3 class="contentH-small ">You have selected {{editedAlts.length }}/3</h3>
    </div>

    <ul v-if="editedAlts.length > 0" class="grid grid-cols-3 gap-6 items-center">
      <li v-for="(exercise, index) in editedAlts" :key="exercise.id" class="h-full">
        <div class="card p-6 min-w-96 border-rafik gradient-bg flex justify-between h-full items-center">
          <div>
            <h2 class="title-small text-xl">{{ exercise.exercise_name }}</h2>
            <h2 class="header-small text-lg uppercase">{{ exercise.type }}</h2>
            <p class="text-sm my-4 "> {{ exercise.exercise_detail}}</p>
            <!-- Prime Movers -->
            <p class="label text-rafik-pritext">Prime Movers:</p>
            <div class="flex gap-2 flex-wrap mb-2">
              <p class="label text-rafik-secondary" v-for="(mover, i) in exercise.prime ?? []" :key="'prime-' + i">
                {{ mover }}
              </p>
            </div>

            <!-- Synergists -->
            <p class="label text-rafik-pritext">Synergists:</p>
            <div class="flex gap-2 flex-wrap mb-2">
              <p class="label text-rafik-secondary" v-for="(synergist, i) in exercise.synergist ?? []" :key="'synergist-' + i">
                {{ synergist }}
              </p>
            </div>

            <!-- Antagonists -->
            <p class="label text-rafik-pritext">Antagonists:</p>
            <div class="flex gap-2 flex-wrap">
              <p class="label text-rafik-secondary" v-for="(antagonist, i) in exercise.antagonist ?? []" :key="'antagonist-' + i">
                {{ antagonist }}
              </p>
            </div>
          </div>

          <!-- Remove Alternative Button -->
          <button @click="removeAlternative(index)" class="px-4 py-2 bg-red-500 text-white rounded-lg">Remove</button>
        </div>
      </li>
      <ExerciseOffcanvas
      v-if="remainingSlots > 0"
      @addExercises="addAlternative"
      :max-selectable="remainingSlots"
    />
    </ul>
<div v-else class="space-y-6 flex flex-col  items-center py-12">

  <p  class="text-rafik-pritext">No alternatives found. Click the button below to add some.</p>
  <ExerciseOffcanvas

      @addExercises="addAlternative"
      :max-selectable="remainingSlots"
    />
</div>

    <!-- Add Alternative Button & Exercise Offcanvas Drawer -->

  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import ExerciseOffcanvas from '@/components/ExerciseOffcanvas.vue';

// Define the Exercise type
type Exercise = {
  id: string;
  exercise_name?: string;
  exercise_detail?: string;
  prime?: string[];
  synergist?: string[];
  antagonist?: string[];
  type?: string;
  rest?: number;
  safety?: string[];
  steps?: string[];
  equipment?: string[];
  media?: string;
  embeds?: number[];
  cues?: string[];
  alternatives?: string[];
  trainer_id?: string | null; // Used to differentiate Personal and Public exercises
};

// Props
const props = defineProps<{
  exercise: Exercise;
  alternatives: Exercise[];
}>();

// Reactive state for alternatives
const editedAlts = ref([...props.alternatives]);

// Emits event
const emits = defineEmits(['updateAlternatives']);

// Computed property to track remaining slots
const remainingSlots = computed(() => Math.max(3 - editedAlts.value.length, 0));

// Add selected alternative exercises
function addAlternative(selectedExercises: Exercise[]) {
  // Prevent duplicates
  const newExercises = selectedExercises.filter(
    (ex) => !editedAlts.value.some((alt) => alt.id === ex.id)
  );

  // Add only up to remaining slots
  editedAlts.value = [...editedAlts.value, ...newExercises].slice(0, 3);

  // Emit updated list
  emits('updateAlternatives', editedAlts.value.map((e) => e.id));
}

// Remove an alternative exercise
function removeAlternative(index: number) {
  editedAlts.value.splice(index, 1);
  emits('updateAlternatives', editedAlts.value.map(e => e.id.toString()));
}
</script>
