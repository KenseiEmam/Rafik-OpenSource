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
    <div v-else class=" h-full flex flex-col gap-2 items-center justify-center text-center w-full text-body">
          <img src="@/assets/Large Icon.png"  class="w-24 h-24 animate-bounce" alt="">
          <p >
          Loading...
        </p>
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
import DashboardSideBar from '../../components/Navigation/DashboardSideBar.vue'
import PostOffice from '../../components/Offcanvas/PostOffice.vue'
</script>
