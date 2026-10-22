<script setup lang="ts">
import { institutionContext } from '../../app/institution'

import { useRoute } from 'vue-router'
import NutritionPlans from './NutritionPlans.vue'
import OrganizationNutrition from './OrganizationNutrition.vue'
const route = useRoute()
</script>
<template>
  <OrganizationNutrition
    v-if="institutionContext().view === 'trainee' || route.query.member"
    :key="String(route.query.member || 'self') + ':' + String(route.query.plan || 'current')"
  /><NutritionPlans v-else />
</template>
