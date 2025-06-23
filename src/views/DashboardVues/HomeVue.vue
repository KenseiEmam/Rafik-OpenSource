<script setup lang="ts">
import CoachDashboard from '@/components/DashboardTabs/CoachDashboard.vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user';
import AdminDashboard from '@/components/DashboardTabs/AdminDashboard.vue';
const userStore = useUserStore()
interface User {
  first_name: string;
  last_name: string;
  avatar: string;
  // Add other fields if needed
}

const props = defineProps<{
  user: User;
}>();

const { t, locale } = useI18n();
</script>

<template>
  <div
    class="px-8 py-12 flex-1 flex flex-col w-full h-full 2xl:px-12 2xl:py-24"
    :dir="locale === 'ar' ? 'rtl' : 'ltr'"
  >
    <div
      class="card w-full bg-rafik-secbg dark:bg-rafik-darksecbg p-8 2xl:py-16 flex gap-6 2xl:gap-10 border-0 items-center"
      v-if="props.user"
    >
      <!-- User Avatar -->
      <img
        :src="
          props.user.avatar ||
          'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'
        "
        class="w-32 h-32 2xl:w-52 2xl:h-52 ring-rafik ring-1 rounded-full self-center"
        alt="User Avatar"
      />

      <!-- Welcome Text Section -->
      <div class="w-1/2 flex flex-col justify-center">
        <h2 class="header-small text-rafik-sectext dark:text-rafik-darksectext">
          {{ t('dashboard.home.welcomeBack') }}
        </h2>
        <h2 class="title-small">{{ props.user.first_name }}</h2>
        <p class="text-body mt-6">
          {{ t('dashboard.home.description') }}
        </p>
      </div>

      <!-- Button Section -->
      <div :class="locale === 'ar'?'border-r':'border-l'"
        class=" border-rafik-sectext dark:border-rafik-darksectext  px-8 flex flex-col gap-4 ms-auto py-4 h-full 2xl:h-44 justify-between"
      >
        <router-link :to="{ name: 'trainer-profile' }" class=" opacity-50 text-rafik-sectext dark:text-rafik-darksectext hover:text-rafik-pritext hover:dark:text-rafik-darkpritext 2xl:text-xl">
          {{ t('dashboard.home.button.viewProfile') }}
        </router-link>
        <router-link to="" disabled class=" opacity-50 text-rafik-sectext dark:text-rafik-darksectext hover:text-red-500 2xl:text-xl">
          {{ t('dashboard.home.button.checkCharts') }}
        </router-link>
        <router-link :to="{ name: 'settings' }" class=" opacity-50 text-rafik-sectext dark:text-rafik-darksectext hover:text-rafik-pritext hover:dark:text-rafik-darkpritext 2xl:text-xl">
          {{ t('dashboard.home.button.settings') }}
        </router-link>
      </div>
    </div>
    <div v-if="userStore.userProfile?.roles" class="space-y-8 flex-1 flex flex-col h-full w-full items-center justify-center over-flow-auto w-64">
      <CoachDashboard v-if="userStore.userProfile?.roles.includes('Trainer') ||
          userStore.userProfile?.roles.includes('Organization Trnr')" :user="props.user"/>
      <AdminDashboard v-else :user="props.user"/>
    </div>
  </div>
</template>
