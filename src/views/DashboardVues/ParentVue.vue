<template>
  <div class="flex h-screen overflow-hidden w-full ">
    <DashboardSideBar/>

    <div v-if="userStore.userProfile" class="flex-1 overflow-y-auto ">
      <router-view class="relative" :user="userStore.userProfile" v-slot="{ Component }">
        <transition name="slide-fade">
          <component :is="Component" />
        </transition>
      </router-view>

    </div>
    <div v-else class="flex flex-col flex-1 h-full items-center justify-center">
      <h2 class="subheader-medium">Loading...</h2>
    </div>
    <PostOffice />

  </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

 const userStore = useUserStore();
  onMounted(() => {
    userStore.getUserProfileNO()
  })
import DashboardSideBar from '../../components/DashboardSideBar.vue'
import PostOffice from '../../components/PostOffice.vue'
</script>
