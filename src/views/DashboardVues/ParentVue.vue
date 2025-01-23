<template>
  <div class="flex h-screen overflow-hidden">
    <DashboardSideBar/>

    <div class="p-12">
      <h2>Dashboard {{ $route.params.id }}</h2>
      <router-view />
    </div>
  </div>
</template>
<script setup lang="ts">
import DashboardSideBar from '../../components/DashboardSideBar.vue'
</script>
