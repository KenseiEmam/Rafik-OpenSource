<template>
  <div class="flex-1 space-y-6 py-6">
    <!-- Toolbar -->
    <div class="flex justify-between items-center gap-4">
      <p class="text-body min-w-max">{{ program.weekly_cycle }} DAY CYCLE:</p>
      <!-- Tabs Navigation -->

      <button
        v-for="(workout, index) in editedWorkouts"
        :key="index"
        @click="activeTab = index"
        :class="{'border-b-2 border-rafik-primary text-rafik-primary': activeTab === index}"
        class="px-4 py-2 text-rafik-sectext min-w-max"
      >
        Day {{ index + 1 }}
      </button>
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
          <button class="btn-sm-outline" @click="cancelEdit">CANCEL</button>
          <button class="btn-sm" @click="submitChanges">SUBMIT</button>
        </div>
      </div>
    </div>



    <!-- Active Workout Content -->
    <div class="card p-8 flex flex-col" v-if="editedWorkouts.length">
      <div v-if="!editedWorkouts[activeTab].rest_day">
        <!-- Editable Workout Fields -->
         <div class="flex justify-between items-center gap-6">
            <div class="w-2/3">
              <div v-if="isEditing" class="flex items-center mt-2 mb-8 uppercase">
                <input
                  type="checkbox"
                  v-model="editedWorkouts[activeTab].rest_day"
                  class="mr-2"
                  :class="{'accent-rafik': editedWorkouts[activeTab].rest_day}"
                  style="transform: scale(1.5);"
                />
                <p>Rest Day</p>
              </div>
              <input
                v-if="isEditing"
                v-model="editedWorkouts[activeTab].workout_name"
                class="rafik-text-input border-0 focus:ring-0 pb-1 bg-transparent border-b focus:border-rafik-alternate rounded-none text-3xl  text-rafik contentH-medium mb-2"
                placeholder="Workout Name"
              />
              <h3 v-else class="text-rafik contentH-medium">{{ editedWorkouts[activeTab].workout_name }}</h3>

              <textarea
                v-if="isEditing"
                v-model="editedWorkouts[activeTab].workout_summary"
                class="rafik-text-input border-0 focus:ring-0 pb-1 bg-transparent border-b focus:border-rafik-alternate rounded-none   mb-4"
                placeholder="Workout Summary"
              ></textarea>
              <p v-else class="text-body mb-4">{{ editedWorkouts[activeTab].workout_summary }}</p>
            </div>
            <div class="space-y-6 ">
              <div class="flex justify-between text-rafik-pritexttext w-full gap-12 ">
              <p>Completion Time</p>
              <p class="text-rafik-secondary" v-if="!isEditing">{{ editedWorkouts[activeTab].time_to_complete }}</p>
              <input
                v-if="isEditing"
                v-model="editedWorkouts[activeTab].time_to_complete"
                class="rafik-text-input border-0 focus:ring-0 pb-1 bg-transparent border-b focus:border-rafik-alternate rounded-none  "
                placeholder="Completion Time"
              />
            </div>

            <div v-if="!isEditing" class="flex justify-between text-rafik-pritexttext w-full ">
              <p>Total Sets</p>
              <p class="text-rafik-secondary">{{ calculateTotalSets(editedWorkouts[activeTab].exercises) }}</p>
            </div>
            </div>

         </div>


        <!-- Editable Exercises -->
        <h4 class="subheader-medium flex gap-2 mt-4 mb-3">List of Exercises:</h4>
        <div class=" flex flex-col gap-4 mb-5">
          <div
            class=" bg-rafik-secbg rounded-xl shadow-xl p-6"
            v-for="(exercise, exerciseIndex) in editedWorkouts[activeTab].exercises"
            :key="exercise.id"
          >
          <div class="flex gap-3 items-center mb-4">
            <video
              v-if="exercise.media.endsWith('.mp4') || exercise.media.includes('video')"
              class="w-24 h-24 card border p-0 object-cover rounded-lg"
              :src="exercise.media"
              ref="videoRef"
              muted
              loop
            ></video>
            <div v-else class="w-24 h-24 card border flex items-center justify-center">
              <p class="text-xs"> No Media</p>
            </div>

            <div>
              <h2 class="contentH-small">{{ exercise.exercise_name }}</h2>
            <p class="text-rafik-pritext capitalize ">{{ exercise.type }} Exercise</p>
            </div>
          </div>

            <div v-if="isEditing" class=" flex gap-6">
              <div class="space-y-2">
                <label class="text-rafik-sectext">Intensity</label>
                <input v-model="exercise.intensity" class="rafik-text-input border-0 focus:ring-0 pb-1 bg-transparent border-b focus:border-rafik-alternate rounded-none  " placeholder="Intensity" />
              </div>
              <div class="space-y-2">
                <label class="text-rafik-sectext">Sets</label>
                <input type="number" v-model.number="exercise.sets" class="rafik-text-input border-0 focus:ring-0 pb-1 bg-transparent border-b focus:border-rafik-alternate rounded-none  " placeholder="Sets" />
              </div>
              <div class="space-y-2">

                <label class="text-rafik-sectext">Repetitions</label>
                <input type="number" v-model.number="exercise.reps" class="rafik-text-input border-0 focus:ring-0 pb-1 bg-transparent border-b focus:border-rafik-alternate rounded-none  " placeholder="Repetitions" />
              </div>
              <div class="flex justify-between ml-auto">
                <button class="hover:text-red-400 text-red-500" @click="removeExercise(activeTab, exerciseIndex)">Remove Exercise</button>
              </div>
            </div>
            <div v-else>

              <div class="flex justify-between w-full text-rafik-sectext ">
                <p>Intensity</p>
                <p class="text-rafik-pritext">{{ exercise.intensity }}</p>
              </div>
              <div class="flex justify-between w-full text-rafik-sectext ">
                <p>Sets</p>
                <p class="text-rafik-pritext">{{ exercise.sets }}</p>
              </div>
              <div class="flex justify-between w-full text-rafik-sectext ">
                <p>Repetitions</p>
                <p class="text-rafik-pritext">{{ exercise.reps }}</p>
              </div>
            </div>
          </div>
        </div>
        <ExerciseOffcanvas @addExercises="handleAdd(activeTab, $event)" v-if="isEditing" />
      </div>
      <div v-else class="my-auto text-center text-rafik contentH-medium uppercase">
        <div v-if="isEditing" class="flex items-center mt-2 mb-8 uppercase">
            <input
              type="checkbox"
              v-model="editedWorkouts[activeTab].rest_day"
              class="mr-2"
              :class="{'accent-rafik': editedWorkouts[activeTab].rest_day}"
              style="transform: scale(1.5);"
            />
            <p>Rest Day</p>
          </div>
          Rest and Recover</div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, reactive, watch, defineProps } from "vue";
import { useProgramStore } from "@/stores/programstores";
import ExerciseOffcanvas from "../ExerciseOffcanvas.vue";
import { useUserStore } from "@/stores/user";
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
  price_year?: number;
  tags?:string[];
  workouts?:Workout[];
  program_photo?: string;
  weekly_cycle?:number;
  promos?:PromoCode[];
  induction?:Question[];
  follow?:Question[];
  referral?:string;
  // Add any other properties your program might have
};

interface Question  {
  type:string;
  question?:string;
  answer?:any;
}
// Promo Codes
type PromoCode = {
  code: string;
  value: number;
};
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
const props = defineProps<{ program: Program, user?:string}>();
const programStore = useProgramStore();
const clientStore =  useUserStore();
const isEditing = ref(false);
const activeTab = ref(0);

// Deep copy workouts to avoid mutating props directly
const editedWorkouts = ref(props.program.workouts ? JSON.parse(JSON.stringify(props.program.workouts)) : []);

// Watch for changes in `props.program` and update `editedWorkouts`
watch(() => props.program.workouts, (newWorkouts) => {
  editedWorkouts.value = newWorkouts ? JSON.parse(JSON.stringify(newWorkouts)) : [];
}, { deep: true });

const enableEditMode = () => { isEditing.value = true; };

const cancelEdit = () => {
  isEditing.value = false;
  editedWorkouts.value = props.program?.workouts ? JSON.parse(JSON.stringify(props.program.workouts)) : [];
};

const submitChanges = () => {
  isEditing.value = false;
  if(!props.user)
  programStore.updateProgram({ ...props.program, workouts: editedWorkouts.value });
  else
  {
    updateClientProgram(props.user)
  }

};
// Function to update client workout plan
async function updateClientProgram(user:string) {
  if (!props.program.id) return ;

  try {
    await clientStore.updateClientProgram({
      id: props.program.id,
      workouts: editedWorkouts.value,
    });

    await clientStore.getClient(user.toString());

  } catch (error) {

    console.error(`Error updating Client program:`, error);
  }
}
const calculateTotalSets = (exercises: any[]) => exercises.reduce((total, ex) => total + (ex.sets || 0), 0);

const removeExercise = (workoutIndex: number, exerciseIndex: number) => {
  editedWorkouts.value[workoutIndex].exercises.splice(exerciseIndex, 1);
};

const handleAdd = (workoutIndex: number, list: any[]) => {
  editedWorkouts.value[workoutIndex].exercises.push(
    ...list.map(e => ({ ...e, sets: 0, reps: 0, intensity: 0 }))
  );
};
</script>
