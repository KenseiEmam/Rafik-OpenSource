<template>
  <div class="flex-1 flex flex-col space-y-6 py-6" style="min-height: 50vh;">
    <!-- Toolbar -->
    <div class="flex justify-between items-center gap-4 ">
      <div class="flex text-rafik-pritext dark:text-rafik-darkpritext min-w-max gap-3 items-center">

        <p>4 Meal Plan</p>
      </div>

      <hr class="w-full">
      <div  class="ms-auto">
        <button v-if="!isEditing" class="btn-sm-outline min-w-max" @click="enableEditMode">
          Edit Plan
        </button>
        <div v-else class="flex gap-2">
          <button class="btn-sm-outline" @click="cancelEdit">
            {{ t('dashboard.tabs.program.planner.cancel') }}
          </button>
          <button class="btn-sm" @click="submitChanges">
            {{ t('dashboard.tabs.program.planner.submit') }}
          </button>
        </div>
      </div>
    </div>
    <!-- Meal Plan  to be made into grid-->
     <div class="grid gap-6 flex-1 h-full items-stretch">
      <!-- <div class="space-y-4">
        <h2 class="contentH-small">Notes 📝</h2>
        <div class="card h-full p6 flex items-center justify-center">
          <p > Coming soon</p>
        </div>
      </div> -->
      <div class="space-y-4  ">
        <!-- <h2 class="contentH-small">Food</h2> -->
        <div class="grid h-full grid-cols-4 gap-4">
          <div class="card p-6">
            <div class="flex justify-between gap-6 items-center">
              <div class="w-1/2">
                <h3 class="header-small">Breakfast</h3>
                <p class="text-body text-xs mt-3"> Below are the food items suggested to the trainee when logging their breakfast. Click edit plan to add or remove any items. You cannot change serving amounts as of now.</p>
                <p class="text-rafik-secondary mt-3" > Timing is: {{ editedDiet.timings.breakfast }} </p>
              </div>
              <button class="btn-sm-outline" v-if="isEditing">ADD FOOD</button>
            </div>
            <div class="space-y-3 mt-4">
              <div class="card p-4 gradient-bg" v-for="food,index in editedDiet.suggested_meals.breakfast" >
                <div class="flex justify-between gap-6 items-center">
                  <div>
                    <h4 class="text-rafik-pritext dark:text-rafik-darkpritext "> {{ food.food_name }}</h4>
                    <p class="text-body">{{food.serving_amount}} x {{ food.serving_name }}</p>
                  </div>
                  <button v-if="isEditing" class="btn-sm bg-red-500 hover:bg-red-400 border-red-500 mt-4 text-xs uppercase" @click="removeExercise('breakfast',index)">Remove</button>
                </div>
              </div>
            </div>

          </div>
          <div class="card p-6">
            <div class="flex justify-between gap-6 items-center">
              <div class="w-1/2">
                <h3 class="header-small">Lunch</h3>
                <p class="text-body text-xs mt-3"> Below are the food items suggested to the trainee when logging their lunch. Click edit plan to add or remove any items. You cannot change serving amounts as of now.</p>
                <p class="text-rafik-secondary mt-3" > Timing is: {{ editedDiet.timings.lunch }} </p>
              </div>
              <button class="btn-sm-outline" v-if="isEditing">ADD FOOD</button>
            </div>
            <div class="space-y-3 mt-4">
              <div class="card p-4 gradient-bg" v-for="food,index in editedDiet.suggested_meals.lunch">
                <div class="flex justify-between gap-6 items-center">
                  <div>
                    <h4 class="text-rafik-pritext dark:text-rafik-darkpritext "> {{ food.food_name }}</h4>
                    <p class="text-body">{{food.serving_amount}} x {{ food.serving_name }}</p>
                  </div>
                  <button v-if="isEditing" class="btn-sm bg-red-500 hover:bg-red-400 border-red-500 mt-4 text-xs uppercase" @click="removeExercise('lunch',index)">Remove</button>
                </div>
              </div>
            </div>

          </div>
          <div class="card p-6">
            <div class="flex justify-between gap-6 items-center">
              <div class="w-1/2">
                <h3 class="header-small">Dinner</h3>
                <p class="text-body text-xs mt-3"> Below are the food items suggested to the trainee when logging their dinner. Click edit plan to add or remove any items. You cannot change serving amounts as of now.</p>
                <p class="text-rafik-secondary mt-3" > Timing is: {{ editedDiet.timings.dinner }} </p>
              </div>
              <button class="btn-sm-outline" v-if="isEditing">ADD FOOD</button>
            </div>
            <div class="space-y-3 mt-4">
              <div class="card p-4 gradient-bg" v-for="food,index in editedDiet.suggested_meals.dinner">
                <div class="flex justify-between gap-6 items-center">
                  <div>
                    <h4 class="text-rafik-pritext dark:text-rafik-darkpritext "> {{ food.food_name }}</h4>
                    <p class="text-body">{{food.serving_amount}} x {{ food.serving_name }}</p>
                  </div>
                  <button v-if="isEditing" class="btn-sm bg-red-500 hover:bg-red-400 border-red-500 mt-4 text-xs uppercase" @click="removeExercise('dinner',index)">Remove</button>
                </div>
              </div>
            </div>

          </div>
          <div class="card p-6">
            <div class="flex justify-between gap-6 items-center">
              <div class="w-1/2">
                <h3 class="header-small">Supper</h3>
                <p class="text-body text-xs mt-3"> Below are the food items suggested to the trainee when logging their supper. Click edit plan to add or remove any items. You cannot change serving amounts as of now.</p>
                <p class="text-rafik-secondary mt-3" > Timing is: {{ editedDiet.timings.supper }} </p>
              </div>
              <button class="btn-sm-outline" v-if="isEditing">ADD FOOD</button>
            </div>
            <div class="space-y-3 mt-4">
              <div class="card p-4 gradient-bg" v-for="food,index in editedDiet.suggested_meals.supper">
                <div class="flex justify-between gap-6 items-center">
                  <div>
                    <h4 class="text-rafik-pritext dark:text-rafik-darkpritext "> {{ food.food_name }}</h4>
                    <p class="text-body">{{food.serving_amount}} x {{ food.serving_name }}</p>
                  </div>
                  <button v-if="isEditing" class="btn-sm bg-red-500 hover:bg-red-400 border-red-500 mt-4 text-xs uppercase" @click="removeExercise('supper',index)">Remove</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
     </div>

  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, defineProps, computed } from 'vue';
import { useProgramStore } from '@/stores/programstores';
import { useUserStore } from '@/stores/user';
import { debounce } from 'lodash';
import Swal from 'sweetalert2';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/lib/supabaseClient';
// Success and Error Alerts
const { t , locale } = useI18n();
function showSuccess(message: string) {
  Swal.fire({
    title: 'Success!',
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 1500,
    text: message,
    toast: true,
    position: 'top-right',
    icon: 'success',
    background: '#081411',
    color: '#E8F3ED'
  });
}

// Function to show error alerts
function showError(message: string) {
  Swal.fire({
    title: 'Error!',
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}

const props = defineProps<{ client: any; }>();
const programStore = useProgramStore();
const clientStore = useUserStore();
const isEditing = ref(false);
const activeTab = ref(0);
const drag = ref(true);
// Deep copy workouts to avoid mutating props directly
const editedDiet = ref(
  props.client.diet_profile ? JSON.parse(JSON.stringify(props.client.diet_profile)) : []
);
console.log(editedDiet.value[0])
// Watch for changes in `props.client` and update `editedDiet`
watch(
  () => props.client.diet_profile,
  (newWorkouts) => {
    editedDiet.value = newWorkouts ? JSON.parse(JSON.stringify(newWorkouts)) : [];

  },
  { deep: true }
);

const enableEditMode = () => {
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
  editedDiet.value = props.client?.diet_profile
    ? JSON.parse(JSON.stringify(props.client.diet_profile))
    : [];
};



const removeExercise = (meal: string, foodIndex: number) => {
  editedDiet.value.suggested_meals[meal].splice(foodIndex, 1);
};

const submitChanges = () => {
  isEditing.value = false;

    updateClientProgram(props.client.user_id);

};
// Function to update client workout plan
async function updateClientProgram(user: number) {
  if (!props.client.id) return;
  const {data,error} = await supabase.from('profiles').update({diet_profile:editedDiet.value}).eq('id',props.client.id)

  if(error)
  showError('Error while updating meal plan: '+ error.message)
  else
 { showSuccess('Meal Plan Updated!')
  await clientStore.getClient(user);
 }


}

const handleAdd = (workoutIndex: number, list: any[]) => {
  editedDiet.value[workoutIndex].exercises.push(
    ...list.map((e) => ({
      ...e,
      sets: 3,
      reps: 0,
      intensity: 0,
      rest:90,
      true_sets: [
        { reps: 0, intensity: 0, weight_done: 0, reps_done: 0 },
        { reps: 0, intensity: 0, weight_done: 0, reps_done: 0 },
        { reps: 0, intensity: 0, weight_done: 0, reps_done: 0 }
      ],
      intensity_mod: "Load(Kg)",
      volume_mod: "Reps"
    }))
  );
};


</script>
