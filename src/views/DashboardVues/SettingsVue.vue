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
        <!-- General Settings Tab -->
        <button
          :class="
            activeTab === 'General Setting' ? 'text-rafik-pritext dark:text-rafik-darkpritext' : ''
          "
          class="nav-btn"
          @click="setActiveTab('General Setting')"
        >
          {{ t('dashboard.settings.generalSettingsTab') }}
        </button>

        <!-- Trainer Settings Tab -->
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

        <!-- Roles & Permissions Tab -->
        <button
          v-if="userStore.userProfile.roles.includes('Administrator') || userStore.userProfile.roles.includes('Organization Admin')"
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

        <!-- Notifcations  -->
        <button
          :class="
            activeTab === 'Notifications'
              ? 'text-rafik-pritext dark:text-rafik-darkpritext'
              : ''
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Notifications')"
        >
          {{ t('dashboard.settings.notificationsTab') }}
        </button>

        <!-- Organization Settings Tab (Only if user is Organization Admin) -->
        <button
          v-if="userStore.userProfile.roles.includes('Organization Admin')"
          :class="
            activeTab === 'Organization Settings'
              ? 'text-rafik-pritext dark:text-rafik-darkpritext'
              : ''
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Organization Settings')"
        >
          {{ t('dashboard.settings.organizationSettingsTab') }}
        </button>
      </div>

      <!-- Tab Contents -->
      <div>
        <transition name="slide-fade">
          <!-- General Settings -->
          <GeneralSettings v-if="activeTab === 'General Setting'" />

          <!-- Trainer Settings -->
          <TrainerSettings
            v-else-if="
              activeTab === 'Trainer Settings' && userStore.userProfile.roles.includes('Trainer')
            "
          />

          <!-- Roles & Permissions -->
          <RolesandPerms
            v-else-if="
              activeTab === 'Roles and Permissions' &&
              (userStore.userProfile.roles.includes('Administrator') || userStore.userProfile.roles.includes('Organization Admin'))
            "
          />
          <!-- Notification Settings -->
          <Notifications
           v-else-if="
              activeTab === 'Notifications'
            "
          />
          <!-- Organization Settings -->
          <OrganizationSettings
            v-else-if="
              activeTab === 'Organization Settings' &&
              userStore.userProfile.roles.includes('Organization Admin')
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
import { useI18n } from 'vue-i18n';
import PageTitle from '@/components/Navigation/PageTitle.vue';
import GeneralSettings from '@/components/SettingsTabs/GeneralSettings.vue';
import TrainerSettings from '@/components/SettingsTabs/TrainerSettings.vue';
import RolesandPerms from '@/components/SettingsTabs/RolesandPerms.vue';
import OrganizationSettings from '@/components/SettingsTabs/OrganizationSettings.vue';
import Notifications from '@/components/SettingsTabs/Notifications.vue';

const { t } = useI18n();
const userStore = useUserStore();

const activeTab = ref('General Setting');

// Change active tab handler
function setActiveTab(tab: string) {
  activeTab.value = tab;
}
</script>

<style scoped>
.form-control label {
  margin-bottom: 0.25rem;
}
.switch-mt {
  margin-top: 2rem !important;
}
.switch-label {
  margin-bottom: 0 !important;
}
</style>
