<template>
  <div class="flex-1 2xl:space-y-16 space-y-6 pb-6 h-full">
    <div class="grid grid-cols-5 gap-6  ">


      <div class="flex flex-col col-span-3 card p-6 gap-3 pl-3 2xl:gap-5">
        <h3 class="contentH-small text-sm 2xl:text-xl mb-6">Trainer Bio:</h3>
        <p class="text-body">{{ trainer.bio }}</p>
      </div>

      <div class="flex flex-col card col-span-2 p-6 gap-3 pl-3 2xl:gap-5">
        <h3 class="contentH-small text-sm 2xl:text-xl mb-6">Trainer Data:</h3>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">Title</p>
          <p class="text-rafik-secondary">{{ props.trainer.title|| 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">Years of Experience</p>
          <p class="text-rafik-secondary" >{{ props.trainer.years_of_experience|| 'N/A' }} years</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">Maximum Clients:</p>
          <p class="text-rafik-secondary" >{{ props.trainer.seats_available|| 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">Available Hours:</p>
          <p class="text-rafik-secondary" >{{ props.trainer.available_hours|| 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">Works with</p>
          <div class="flex flex-wrap gap-3 ">
            <p class="text-rafik-secondary" v-for="diet,index in props.trainer.preferred_clients" :key="diet">{{ diet}}<span v-if="index+1 !== props.trainer.preferred_clients.length">, </span></p>
          </div>


        </div>
      </div>

      <div class="card p-8 2xl:min-h-96 col-span-5">
      <div class="flex flex-col gap-6">
        <h3 class="contentH-small text-sm 2xl:text-xl mb-6">List of Programs</h3>

        <div class="grid grid-cols-3 2xl:grid-cols-6 gap-6 my-auto">
          <div class="p-6  border-rafik border rounded-xl gradient-bg flex flex-col" v-for="program in programStore.AllPrograms">
            <h2 class="header-small">{{ program.program_name }}</h2>
            <p class="text-rafik-alternate">{{ program.status }}</p>
            <p class="text-body" v-if="program.created_at">Created: {{ new Date (program.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })  }} </p>
            <button class="text-rafik-teritiary text-center mt-auto mx-auto">View Program</button>
          </div>
        </div>
      </div>

    </div>
    </div>

  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { supabase } from "../../lib/supabaseClient";
import Swal from "sweetalert2";
import { useProgramStore } from "@/stores/programstores";
const programStore = useProgramStore()
 // Success and Error Alerts
  function showSuccess(message: string) {
    Swal.fire({
      title: "Success!",
      showConfirmButton:false,
      timerProgressBar:true,
      timer:1500,
      text: message,
      toast: true,
      position: "top-right",
      icon: "success",
      background: "#081411",
      color: "#E8F3ED",
    });
  }

  function showError(message: string) {
    Swal.fire({
      title: "Error!",
      text: message,
      icon: "error",
      confirmButtonColor: "#d33",
      background: "#081411",
      color: "#E8F3ED",
    });
  }
// Props to receive the program object
const props = defineProps({
  trainer: {
    type: Object,
    required: true,
  },
});



// Fetch the weight when the component mounts
onMounted(async () => {
  programStore.wipeOutAll()
  programStore.getTrainersPrograms(props.trainer.user_id)
});
</script>

<style scoped>
/* Your styles */
</style>
