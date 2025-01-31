<template>
  <!-- <table>
    <thead>
      <th></th>
      <th>Name</th>
      <th>Name</th>
    </thead>
  </table> -->
  <div >
    {{userStore.AllClients}}
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { onMounted } from 'vue'
const userStore = useUserStore()
  onMounted(()=>{
    userStore.getClients()
  })
</script>

<style>

</style>
