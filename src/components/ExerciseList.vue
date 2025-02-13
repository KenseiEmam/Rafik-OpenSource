<template>
  <div>
    <div class="flex justify-between items-center gap-4 mb-6 ">
      <hr class="border w-full border-rafik-sectext" />
      <button
        @click="showAddExerciseModal = true"
        class=" min-w-max btn-sm-outline"
      >
        +ADD CUSTOM EXERCISE
      </button>
    </div>

    <ul v-if="props.exercises?.length > 0" class="grid grid-cols-3 gap-6 items-center">
      <router-link :to="{name:exercise.trainer_id?'personal-details':'public-details', params:{id:exercise.id}  }" v-for="(exercise, index) in props.exercises" :key="exercise.id" class="h-full text-rafik-sectext">
        <div class="card p-6 min-w-96 hover:border-rafik flex justify-between h-full items-center">
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

        </div>
      </router-link>

    </ul>
<div v-else class="space-y-6 flex flex-col  items-center py-12">

  <p  class="text-rafik-pritext">No Exercises found for your query.</p>

</div>
<div class="flex justify-between items-center gap-4 my-6">
      <!-- Tabs Navigation -->
      <p class="header-small min-w-max"> Page {{ page }}</p>
      <hr class="border w-full border-rafik-sectext" />
      <button
        @click="updatePage(pageEdit - 1)"
        v-if="props.page > 1"
        class="px-4 py-2 text-rafik-sectext min-w-max hover:text-rafik-pritext"
      >
        Previous Page
      </button>

      <button
        class="px-4 py-2 text-rafik-sectext min-w-max hover:text-rafik-pritext"
         @click="updatePage(pageEdit + 1)"
         v-if="props.page < Math.ceil(props.count / 9)"
      >
        Next Page
      </button>
    </div>
    <AddExerciseModal
      :visible="showAddExerciseModal"
      @close="showAddExerciseModal = false"
      @submit="addExercise"
    />
  </div>
</template>
<script lang="ts" setup>
import router from '@/router';
import { ref, watch  } from 'vue';
import { useExerciseStore } from '@/stores/exercisestores';
import AddExerciseModal from './ExerciseTabs/AddExerciseModal.vue';
const exerciseStore = useExerciseStore();
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
const props = defineProps<{
  exercises:Exercise[],
  page:number,
  count:number,
}>()

// Add exercise
function addExercise(exercise:any) {
  exerciseStore.createExercise(exercise);
  showAddExerciseModal.value = false;
}
const pageEdit =  ref(props.page)
const showAddExerciseModal = ref(false);


watch(() => props.page, (newPage) => {
  pageEdit.value = newPage;
});
const emits = defineEmits(['updatePage']);
function updatePage(page: number) {
  const maxPage = Math.ceil(props.count / 9);
  if (page < 1 || page > maxPage) return;
  emits('updatePage', page);
}
</script>

<style scoped>
.card:hover{
  background-image: linear-gradient(135deg, #081411 36%, #295f42);
}
</style>
