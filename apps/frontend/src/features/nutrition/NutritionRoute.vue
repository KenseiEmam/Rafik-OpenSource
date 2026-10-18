<script setup lang="ts">
import { useRoute } from 'vue-router'
import NutritionPlans from './NutritionPlans.vue'
import OrganizationNutrition from './OrganizationNutrition.vue'
const route = useRoute()
</script>
<template>
  <OrganizationNutrition
    v-if="route.params.view === 'trainee' || route.query.member"
    :key="String(route.query.member || 'self') + ':' + String(route.query.plan || 'current')"
  /><NutritionPlans v-else />
</template>
