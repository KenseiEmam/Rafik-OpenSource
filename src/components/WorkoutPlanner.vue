<template>
  <div class="flex-1 space-y-6 pt-6">
    <!-- Toolbar -->
    <div class="flex justify-between items-center gap-4">
      <p class="text-body min-w-max">{{ program.weekly_cycle }} DAY CYCLE</p>
      <hr class="border w-full border-rafik-sectext" />
      <div>
        <button
          v-if="!isEditing"
          class="btn-sm-outline min-w-max"
          @click="enableEditMode"
        >
          EDIT PROGRAM
        </button>
        <div v-else class="flex gap-2">
          <button
            class="btn-sm-outline"
            @click="cancelEdit"
          >
            CANCEL
          </button>
          <button
            class="btn-sm"
            @click="submitChanges"
          >
            SUBMIT
          </button>
        </div>
      </div>
    </div>
    <!-- Workout Grid -->
    <div class="grid grid-cols-4 gap-4">
      <div
        class="card p-8 flex flex-col"
        v-for="(workout, workoutIndex) in editedWorkouts"
        :key="workoutIndex"
      >
        <div v-if="!workout.rest_day">
          <!-- Editable Workout Fields -->
          <div>
            <div v-if="isEditing" class="flex items-center mt-2 mb-8 uppercase">
              <input
                type="checkbox"
                v-model="workout.rest_day"
                class="mr-2 "
                :class="{'accent-rafik': workout.rest_day, 'accent-rafik-pribg': !workout.rest_day}"
                style="transform: scale(1.5);"
              />
              <p>Rest Day</p>
            </div>
            <input
              v-if="isEditing"
              v-model="workout.workout_name"
              class="rafik-text-input text-sm text-rafik contentH-medium mb-2"
              placeholder="Workout Name"
            />
            <h3 v-else class="text-rafik contentH-medium">{{ workout.workout_name }}</h3>

            <textarea
              v-if="isEditing"
              v-model="workout.workout_summary"
              class="rafik-text-input text-sm mb-4"
              placeholder="Workout Summary"
            ></textarea>
            <p v-else class="text-body mb-4">{{ workout.workout_summary }}</p>
          </div>
          <div class="flex justify-between w-full text-rafik-sectext label">
            <p>Completion Time</p>
            <p v-if="!isEditing">{{ workout.time_to_complete }}</p>
            <input
              v-if="isEditing"
              v-model="workout.time_to_complete"
              class="rafik-text-input text-sm"
              placeholder="Completion Time"
            />
          </div>
          <div v-if="!isEditing" class="flex justify-between w-full text-rafik-sectext label">
            <p>Total Sets</p>
            <p>{{ calculateTotalSets(workout.exercises) }}</p>
          </div>


          <!-- Editable Exercises -->
          <h4 class="contentH-small flex gap-2 mt-4 mb-3 ">
            List of Exercises:
          </h4>
          <div class="border-l border-rafik-sectext pl-2 flex flex-col gap-4">
            <div
              class="card"
              v-for="(exercise, exerciseIndex) in workout.exercises"
              :key="exercise.id"
            >
              <h2 class="text-rafik-pritext">{{ exercise.exercise_name }}</h2>
              <div v-if="isEditing" class="space-y-2">
                <label class="text-sm text-rafik-sectext">Intensity</label>
                <input
                  v-model="exercise.intensity"
                  class="rafik-text-input text-sm"
                  placeholder="Intensity"
                />

                <label class="text-sm text-rafik-sectext">Sets</label>
                <input
                  type="number"
                  v-model.number="exercise.sets"
                  class="rafik-text-input text-sm"
                  placeholder="Sets"
                />

                <label class="text-sm text-rafik-sectext">Repetitions</label>
                <input
                  type="number"
                  v-model.number="exercise.reps"
                  class="rafik-text-input text-sm"
                  placeholder="Repetitions"
                />
                <div class="flex justify-between">
                  <button
                    class="hover:text-red-400 text-red-500"
                    @click="removeExercise(workoutIndex, exerciseIndex)"
                  >
                    Remove Exercise
                  </button>
                </div>
              </div>
              <div v-else>
                <p class="text-rafik-secondary label mb-4">{{ exercise.type }}</p>
                <div class="flex justify-between w-full text-rafik-sectext label">
                  <p>Intensity</p>
                  <p>{{ exercise.intensity }}</p>
                </div>
                <div class="flex justify-between w-full text-rafik-sectext label">
                  <p>Sets</p>
                  <p>{{ exercise.sets }}</p>
                </div>
                <div class="flex justify-between w-full text-rafik-sectext label">
                  <p>Repetitions</p>
                  <p>{{ exercise.reps }}</p>
                </div>
              </div>
            </div>
                <!-- Offcanvas -->
     <ExerciseOffcanvas @addExercises="handleAdd(workoutIndex,$event)" v-if="isEditing"/>
          </div>
        </div>
        <div v-else class="my-auto">
          <div v-if="isEditing" class="flex items-center mt-2">
            <input
              type="checkbox"
              v-model="workout.rest_day"
              class="mr-2"
            />
            <p>Rest Day</p>
          </div>
          <p v-if="!isEditing" class="text-rafik contentH-medium text-center uppercase">Rest and recover</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from "vue";
import { useProgramStore } from "@/stores/programstores";
import ExerciseOffcanvas from "./ExerciseOffcanvas.vue";
// Define types
type Exercise = {
  id: string;
  exercise_name?: string;
  type?: string;
  intensity?: string;
  sets?: number;
  reps?: number;
};

type Workout = {
  workout_name: string;
  workout_summary?: string;
  time_to_complete?: string;
  sets_per_session?: number;
  rest_day?: boolean;
  exercises: Exercise[];
};

type Program = {
  id: string;
  program_name?: string;
  program_description?: string;
  program_focus?: string[]; // Add program_focus here (assumed to be an array of strings)
  status?: string;
  trainer_id?: number,
  difficulty_level?: string;
  avg_session_time?: number;
  avg_days_per_week?: number;
  overall_rating?: number;
  price_one?: number;
  price_three?: number;
  price_six?: number;
  price_years?: number;
  tags?:string[];
  workouts?:Workout[];
  program_photo?: string;
  weekly_cycle?:number;
  // Add any other properties your program might have
};
// Props
const props = defineProps<{ program:Program}>();

const programStore = useProgramStore();
const isEditing = ref(false);
const editedWorkouts = reactive<Workout[]>(JSON.parse(JSON.stringify(props.program.workouts)));

const enableEditMode = () => {
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
  Object.assign(editedWorkouts, JSON.parse(JSON.stringify(props.program.workouts)));
};

function handleAdd(workoutIndex: number, list: any[]) {
  console.log("Received exercises:", list); // Check if this logs the expected data

  const newExercises = list.map(e => ({
    ...e,
    sets: 0,
    reps: 0,
    intensity: 0,
  }));

  editedWorkouts[workoutIndex].exercises.push(...newExercises);
}


const submitChanges = () => {
  isEditing.value = false;
  const updatedProgram: Program = {
    ...props.program,
    workouts: editedWorkouts,
  };
  programStore.updateProgram(updatedProgram);
};

const calculateTotalSets = (exercises: Exercise[]) => {
  return exercises.reduce((total, exercise) => total + (exercise.sets || 0), 0);
};

const changeExercise = (workoutIndex: number, exerciseIndex: number) => {
  console.log(`Change exercise at workout ${workoutIndex}, exercise ${exerciseIndex}`);
};

const removeExercise = (workoutIndex: number, exerciseIndex: number) => {
  editedWorkouts[workoutIndex].exercises.splice(exerciseIndex, 1);
};
</script>
