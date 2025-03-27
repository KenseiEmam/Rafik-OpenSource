<template>
  <div
    v-if="settingstores.settings"
    :class="settingstores.settings.dark_mode ? 'dark' : ''"
    :dir="locale === 'ar' ? 'rtl' : 'ltr'"
    class="flex h-screen overflow-hidden w-full gradient-bg"
  >
    <DashboardSideBar />

    <div class="flex-1 overflow-y-auto">
      <router-view class="relative" :user="userStore.userProfile" v-slot="{ Component }">
        <transition name="slide-fade">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    <PostOffice />
  </div>
  <div
    v-else
    :dir="locale === 'ar' ? 'rtl' : 'ltr'"
    class="h-screen flex flex-col gap-2 items-center justify-center text-center text-white w-full text-body"
  >
    <img
      src="@/assets/Large Icon.png"
      class="w-24 h-24 animate-bounce hidden dark:inline-block"
      alt=""
    />
    <img src="@/assets/Large Icon Light.png" class="w-24 h-24 animate-bounce dark:hidden" alt="" />
    <p class="text-lg animate-pulse">{{ t('general.loading') }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { useSettingsStore } from '@/stores/settingstores';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const userStore = useUserStore();
const settingstores = useSettingsStore();
const localSettings = localStorage.getItem('dark_mode');
onMounted(() => {
  userStore.getUserProfileNO();
});
import DashboardSideBar from '../../components/Navigation/DashboardSideBar.vue';
import PostOffice from '../../components/Offcanvas/PostOffice.vue';
</script>
