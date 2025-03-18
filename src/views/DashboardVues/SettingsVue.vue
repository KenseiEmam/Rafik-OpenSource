<template>
  <div class="flex h-screen overflow-auto">
    <div  class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 space-y-6">
      <!-- Page Title -->
      <PageTitle subheader="Settings &" header="Preferences" />


    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useSettingsStore } from '@/stores/settingstores'
import PageTitle from '@/components/Navigation/PageTitle.vue'
import Cetifications from '@/components/ProfileTabs/Cetifications.vue'
import Swal from 'sweetalert2'


// Success and Error Alerts
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
    color: '#E8F3ED',
  })
}

function showError(message: string) {
  Swal.fire({
    title: 'Error!',
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED',
  })
}


</script>



<style scoped>
/* Example styling for demonstration purposes; adjust as needed */
.form-control label {
  margin-bottom: 0.25rem;
}
</style>
