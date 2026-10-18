<script setup lang="ts">
import { useRoute } from 'vue-router'
import AthletePlans from './AthletePlans.vue'
import OrganizationTraining from './OrganizationTraining.vue'
const route = useRoute()
</script>
<template>
  <OrganizationTraining v-if="route.params.view === 'trainee'" /><AthletePlans v-else />
</template>
