<template>
  <div
    v-if="props.visible"
    class="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
  >
    <div class="card rounded-lg shadow p-6 min-w-128 w-1/3">
      <h2 class="contentH-small">Change Program</h2>
      <p class="text-body mb-4">
        Click on one of the programs below to add it to have it overwrite the clients workouts and program details, please understand this will not change the status or price of the client subscription.
      </p>
      <div v-if="loading" class=" h-full flex flex-col gap-2 items-center justify-center text-center w-full text-body">
          <img src="@/assets/Large Icon.png"  class="w-24 h-24 animate-bounce" alt="">
          <p class="text-lg animate-pulse">
          Loading...
        </p>
      </div>
      <div v-else-if="!programStore.AllPrograms?.length " class="flex flex-col gap-3 items-center">
        <p  class="mt-16 text-center text-red-400"> Seems you have no other programs just yet, get ahead and add one to your arsenal at our </p>
      <RouterLink :to="{name:'programs-list'}" class="mb-16 mx-auto text-center w-full"> Program Listing Page </RouterLink>
      </div>
      <ul class="flex flex-col gap-4 w-full mb-16">
        <li v-for="program in programStore.AllPrograms" :key="program.id" @click="importExercise(program)" class="card p-4 flex items-center gap-3 group hover:border-rafik cursor-pointer">
          <div>
            <h2 class="subheader-small text-rafik-pritext group-hover:text-rafik">{{ program.program_name }}</h2>
            <p class="text-xs text-body  group-hover:text-rafik-pritext">{{ program.program_description }}</p>
          </div>
        </li>
      </ul>
      <div class="flex justify-end">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-md bg-red-500 border-red-500 hover:bg-red-400 rounded mr-2"
          >
            Cancel
          </button>

        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useProgramStore } from "@/stores/programstores";
import { supabase } from "@/lib/supabaseClient"; // Ensure Supabase is correctly set up
import Swal from 'sweetalert2';
const props = defineProps({
  visible: Boolean,
});
const loading = ref(true)
const programStore = useProgramStore()
const emits = defineEmits(["close", "submit"]);

function importExercise(program:any){
  Swal.fire({
    title: "Change program to "+program.program_name,
    text: "This will overwrite the user program workouts and details permanently and all previous changes will be lost. Subscription plan will not change.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, overwrite!",
    confirmButtonColor: "#CB901C",
    cancelButtonColor: "#d33",
      background:"#081411",
      color:"#E8F3ED",
  }).then((result) => {
    if (result.isConfirmed) {
      emits('submit',{workouts:program.workouts, program_id:program.id})
    }
  });

}
onMounted(()=>{
  programStore.getAllPrograms().then(()=>{
    loading.value=false
  })
})

</script>
<style scoped>
li:hover{
  background-image: linear-gradient(135deg, #081411 36%, #295f42);
}
</style>
