<template>
  <div class="flex h-screen overflow-auto">
    <div
      v-if="userStore.userProfile?.roles"
      class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 2xl:space-y-6 space-y-3"
    >
      <!-- Page Title -->
      <PageTitle
        :subheader="t('dashboard.settings.subheader')"
        :header="t('dashboard.settings.header')"
      />

      <!-- Tabs -->
      <div
        class="flex gap-8 2xl:gap-16 items-center pb-2 border-b border-rafik-sectext dark:border-rafik-darksectext"
      >
        <button
          :class="
            activeTab === 'General Setting' ? 'text-rafik-pritext dark:text-rafik-darkpritext' : ''
          "
          class="nav-btn"
          @click="setActiveTab('General Setting')"
        >
          {{ t('dashboard.settings.generalSettingsTab') }}
        </button>
        <button
          v-if="userStore.userProfile.roles.includes('Trainer')"
          :class="
            activeTab === 'Trainer Settings' ? 'text-rafik-pritext dark:text-rafik-darkpritext' : ''
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Trainer Settings')"
        >
          {{ t('dashboard.settings.trainerSettingsTab') }}
        </button>
        <button
          v-if="userStore.userProfile.roles.includes('Administrator')"
          :class="
            activeTab === 'Roles and Permissions'
              ? 'text-rafik-pritext dark:text-rafik-darkpritext'
              : ''
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Roles and Permissions')"
        >
          {{ t('dashboard.settings.rolesAndPermissionsTab') }}
        </button>
      </div>

      <div>
        <transition name="slide-fade">
          <GeneralSettings v-if="activeTab === 'General Setting'" />
          <TrainerSettings
            v-else-if="
              activeTab === 'Trainer Settings' && userStore.userProfile.roles.includes('Trainer')
            "
          />
          <RolesandPerms
            v-else-if="
              activeTab === 'Roles and Permissions' && userStore.userProfile.roles.includes('Administrator')
            "
          />
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '@/stores/user';
import PageTitle from '@/components/Navigation/PageTitle.vue';
import GeneralSettings from '@/components/SettingsTabs/GeneralSettings.vue';
import TrainerSettings from '@/components/SettingsTabs/TrainerSettings.vue';
import RolesandPerms from '@/components/SettingsTabs/RolesandPerms.vue';
import Swal from 'sweetalert2';
import { useI18n } from 'vue-i18n';

const { t , locale } = useI18n();

const userStore = useUserStore();
const activeTab = ref('General Setting');

// Change active tab handler
function setActiveTab(tab: string) {
  activeTab.value = tab;
}

// Success and Error Alerts (if needed for this page)
function showSuccess(message: string) {
  Swal.fire({
    title: t('dashboard.settings.successTitle'),
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

function showError(message: string) {
  Swal.fire({
    title: t('dashboard.settings.errorTitle'),
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}
</script>

<style scoped>
.form-control label {
  margin-bottom: 0.25rem;
}
</style>
