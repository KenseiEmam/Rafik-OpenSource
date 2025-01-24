<template>
  <div class="flex h-screen overflow-hidden">
    <DashboardSideBar/>

    <div v-if="userStore.userProfile" class="flex-1">
      <router-view :user="userStore.userProfile" />

    </div>
    <PostOffice/>

  </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

 const userStore = useUserStore();
  onMounted(() => {
    userStore.getUserProfile()
  })
import DashboardSideBar from '../../components/DashboardSideBar.vue'
import PostOffice from '../../components/PostOffice.vue'
</script>
