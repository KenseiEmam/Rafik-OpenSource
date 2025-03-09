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
        :class=" activeTab === index? ' border-rafik text-rafik-pritext':'text-rafik-sectext border-transparent'"
        class="px-4 py-2  min-w-max border-b-2"
      >
        {{ workout.workout_name ? workout.workout_name : (workout.rest_day? 'Rest Day':'Workout ' + (index + 1)) }}
      </button>

      <div class="ml-auto">
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
    <div class="card p-0  flex flex-col" v-if="editedWorkouts.length">
      <label v-if="isEditing" class="flex items-center w-full mr-4 space-x-2 cursor-pointer border-b border-rafik-sectext bg-rafik-secbg p-8 rounded-t-xl">
                  <input type="checkbox" v-model="editedWorkouts[activeTab].rest_day" class="hidden">
                  <div
                    class="w-12 h-6 flex items-center border-rafik-pritext border-2  rounded-full transition-all"
                    :class="{ 'bg-rafik': editedWorkouts[activeTab].rest_day }">
                    <div class="w-6 h-6 bg-rafik-pritext rounded-full shadow-md transform transition-transform"
                        :class="{ 'translate-x-6': editedWorkouts[activeTab].rest_day }"></div>
                  </div>
                  <p class="header-small text-sm">Rest Day</p>
        </label>
      <div class="p-8" v-if="!editedWorkouts[activeTab].rest_day">

        <!-- Editable Workout Fields -->
         <div class="flex justify-between items-center gap-6">

            <div class="w-2/3 space-y-3">

              <input
                v-if="isEditing"
                v-model="editedWorkouts[activeTab].workout_name"
                class="rafik-text-input border-0 bg-transparent text-rafik-sectext focus:ring-0 pb-1 border-b focus:border-rafik-alternate rounded-none text-3xl  text-rafik contentH-medium mb-2"
                placeholder="Workout Name"
              />
              <h3 v-else class="text-rafik contentH-medium">{{ editedWorkouts[activeTab].workout_name || "Edit to add name..."}}</h3>

              <textarea
                v-if="isEditing"
                v-model="editedWorkouts[activeTab].workout_summary"
                class="rafik-text-input border-0 bg-transparent text-rafik-sectext focus:ring-0 pb-1 border-b focus:border-rafik-alternate rounded-none   mb-4"
                placeholder="Workout Summary"
              ></textarea>
              <p v-else class="text-body mb-4">{{ editedWorkouts[activeTab].workout_summary || "Edit to add workout summary..."}}</p>
            </div>
            <div class="space-y-6 mb-auto ">
              <div class="flex justify-between text-rafik-pritexttext w-full gap-12 ">
              <p>Completion Time (mins)</p>
              <p class="text-rafik-secondary" v-if="!isEditing">{{ editedWorkouts[activeTab].time_to_complete + "mins" || "00 mins"}}</p>
              <input
                v-if="isEditing"
                v-model="editedWorkouts[activeTab].time_to_complete"
                class="rafik-text-input border-0 bg-transparent text-rafik-sectext mb-auto focus:ring-0 pb-1 border-b focus:border-rafik-alternate rounded-none  "
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
         <div class=" mt-4 mb-3 p-6 bg-rafik-secbg ">
           <h4  class="header-small  w-2/3 mx-auto text-center">Exercises</h4>
           <h4  class="header-small mb-3 w-2/3 mx-auto text-center">••••••</h4>
           <h4 v-if="editedWorkouts[activeTab].exercises.length===0 && !isEditing" class="text-body text-center gap-2 mt-6 text-sm">No exercises added yet! Edit to add!</h4>
           <div class=" flex flex-col gap-4 mb-5">
             <div
               class=" gradient-bg border border-rafik-sectext rounded-xl shadow-xl p-6"
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


               <div class="ml-auto space-y-3" >
                <div v-if="isEditing" class="flex gap-4 justify-between items-end " >
                   <label class="text-body">Total Sets:</label>
                   <input type="number" v-model.number="exercise.sets" class="rafik-text-input w-16 border-0 focus:ring-0 pb-1 border-rafik-sectext border-b focus:border-rafik-alternate rounded-none  " placeholder="Sets" />
                 </div>
                <div v-else class="flex justify-between gap-4 w-full text-rafik-sectext ">
                 <p>Total Sets:</p>
                 <p class="text-rafik-pritext">{{ exercise.sets }}</p>
               </div>
               <div class="flex justify-between gap-4 w-full text-rafik-sectext text-body ">
                 <p>Average Intensity:</p>
                 <p class="text-rafik-pritext">{{ exercise.intensity }} kg</p>
               </div>

               <div class="flex justify-between gap-4 w-full text-rafik-sectext text-body ">
                 <p>Average Repetitions:</p>
                 <p class="text-rafik-pritext">{{ exercise.reps }}</p>
               </div>
               </div>
             </div>

               <div  class=" flex gap-6">

                 <div class="space-y-2 w-full" >
                   <div class="flex w-full justify-between w-full items-end py-2 border-b border-rafik-sectext" v-for="set,index in exercise.true_sets" :key="index">
                    <h2 class="header-small text-sm">Set {{ index +1 }}</h2>
                    <div class="space-y-2">
                      <p class="text-rafik-pritext">Weight (KG)</p>
                      <input :disabled="!isEditing"  type="number" v-model.number="set.intensity" class="rafik-text-input border-0 focus:ring-0 pb-1  focus:border-rafik-alternate rounded-none  " placeholder="Sets" />
                    </div>
                    <div class="space-y-2">
                      <p class="text-rafik-pritext">Reps</p>
                      <input :disabled="!isEditing" type="number" v-model.number="set.reps" class="rafik-text-input border-0 focus:ring-0 pb-1  focus:border-rafik-alternate rounded-none  " placeholder="Sets" />
                    </div>
                   </div>
                 </div>

                 <div v-if="isEditing" class="flex justify-between ml-auto min-w-max mt-auto ">
                   <button class="hover:text-red-400 text-red-500" @click="removeExercise(activeTab, exerciseIndex)">Remove Exercise</button>
                 </div>
                </div>
            </div>
          </div>
          <ExerciseOffcanvas @addExercises="handleAdd(activeTab, $event)" v-if="isEditing" />
        </div>

      </div>
      <div v-else class="my-auto text-center text-rafik contentH-medium uppercase p-8">
          Rest and Recover</div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, reactive, watch, defineProps } from "vue";
import { useProgramStore } from "@/stores/programstores";
import ExerciseOffcanvas from "../Offcanvas/ExerciseOffcanvas.vue";
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
type true_set = {

}
type Exercise = {
  id: string;
  exercise_name?: string;
  type?: string;
  intensity?: string;
  sets?: number;
  reps?: number;
  true_sets?: any[];
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
    ...list.map(e => ({ ...e, sets: 3, reps: 0, intensity: 0, true_sets:[{reps:0, intensity:0}, {reps:0, intensity:0}, {reps:0, intensity:0}] }))
  );
};
watch(
  () => editedWorkouts.value,
  (newWorkouts) => {
    newWorkouts.forEach((workout:Workout) => {
      workout.exercises.forEach((exercise: any) => {
        const setCount = exercise.sets || 0;

        // Preserve existing `true_sets` values if possible, otherwise initialize new ones
        if (exercise.true_sets.length !== setCount) {
          exercise.true_sets = Array.from({ length: setCount }, (_, i) =>
            exercise.true_sets[i] ?? { reps: 0, intensity: 0 }
          );
        }

         // Calculate average intensity and reps from `true_sets`
         if (exercise.true_sets.length > 0) {
          const totalReps = exercise.true_sets.reduce((sum:any, set:any) => sum + set.reps, 0);
          const totalIntensity = exercise.true_sets.reduce((sum:any, set:any) => sum + set.intensity, 0);

          exercise.reps = Math.round(totalReps / exercise.true_sets.length);
          exercise.intensity = Math.round(totalIntensity / exercise.true_sets.length);
        } else {
          exercise.reps = 0;
          exercise.intensity = 0;
        }
      });
    });
  },
  { deep: true }
);
</script>
