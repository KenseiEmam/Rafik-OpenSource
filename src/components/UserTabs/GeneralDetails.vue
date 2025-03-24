<template>
  <div class="flex-1 2xl:space-y-16 space-y-6 pb-6 h-full">
    <div class="grid grid-cols-2 gap-6  flex-1 h-full">
      <div class="flex flex-col card gap-3  2xl:gap-5 p-6 ">
        <h3 class="contentH-small text-sm 2xl:text-xl mb-6 2xl:mb-8">User Profile:</h3>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">Age</p>
          <p class="text-rafik-secondary">{{ calculateAge(props.client.dob) || 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">Gender</p>
          <p class="text-rafik-secondary">{{ props.client.sex || 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">Nationality</p>
          <p class="text-rafik-secondary">{{ props.client.nationality || 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">Phone</p>
          <p class="text-rafik-secondary">{{ props.client.phone || 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">Roles</p>
          <div class="flex flex-wrap gap-3 ">

            <p class="text-rafik-secondary"v-for="role,index in props.client.roles" :key="index">{{ role }}</p>
          </div>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">Money Generated</p>
          <p class="text-rafik-secondary">Coming Soon</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">Money Spent</p>
          <p class="text-rafik-secondary">Coming Soon</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">Money Owed</p>
          <p class="text-rafik-secondary">Coming Soon</p>
        </div>
      </div>
      <div class="flex flex-col card gap-3  2xl:gap-5 p-6 ">
        <h3 class="contentH-small text-sm 2xl:text-xl mb-6 2xl:mb-8">Audit Logs:</h3>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">Logs update coming soon!</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { supabase } from "../../lib/supabaseClient";
import Swal from "sweetalert2";
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
  client: {
    type: Object,
    required: true,
  },
});

function calculateAge(dob:Date) {
      if (!dob) return null;
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      // Adjust age if birthday hasn't happened yet this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }



</script>

<style scoped>
/* Your styles */
</style>
