<template>
  <div class="flex h-screen overflow-auto">
    <div v-if="userStore.userProfile?.roles" class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 2xl:space-y-6 space-y-3">
      <!-- Page Title -->
      <PageTitle subheader="Settings &" header="Preferences" />
      <!-- Tabs -->
      <div class="flex  gap-8 2xl:gap-16 items-center pb-2 border-b border-rafik-sectext dark:border-rafik-darksectext">
        <button
          :class="activeTab === 'General Setting' ? 'text-rafik-pritext dark:text-rafik-darkpritext' : ''"
          class="nav-btn "
          @click="setActiveTab('General Setting')"
        >
          General Settings
        </button>
        <button v-if="userStore.userProfile.roles.includes('Trainer')"
          :class="activeTab === 'Trainer Settings' ? 'text-rafik-pritext dark:text-rafik-darkpritext' : ''"
          class="nav-btn uppercase "
          @click="setActiveTab('Trainer Settings')"
        >
          Trainer Settings
        </button>
        <button v-if="userStore.userProfile.roles.includes('Admin')"
          :class="activeTab === 'Roles and Permissions' ? 'text-rafik-pritext dark:text-rafik-darkpritext' : ''"
          class="nav-btn uppercase "
          @click="setActiveTab('Roles and Permissions')"
        >
          Roles and Permissions
        </button>

      </div>
      <div>
        <transition name="slide-fade">
          <GeneralSettings v-if="activeTab === 'General Setting'"/>
          <TrainerSettings v-else-if="activeTab === 'Trainer Settings' && userStore.userProfile.roles.includes('Trainer')"/>
          <RolesandPerms v-else-if="activeTab === 'Roles and Permissions' && userStore.userProfile.roles.includes('Admin')"/>
        </transition>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useUserStore } from '@/stores/user'
import PageTitle from '@/components/Navigation/PageTitle.vue'
import GeneralSettings from '@/components/SettingsTabs/GeneralSettings.vue'
import TrainerSettings from '@/components/SettingsTabs/TrainerSettings.vue'
import Swal from 'sweetalert2'
import RolesandPerms from '@/components/SettingsTabs/RolesandPerms.vue'
const userStore = useUserStore()
const activeTab = ref("General Setting");
// Change active tab handler
function setActiveTab(tab: string) {
  activeTab.value = tab;
}
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
