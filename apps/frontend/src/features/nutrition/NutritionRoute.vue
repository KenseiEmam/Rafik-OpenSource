<script setup lang="ts">
import { institutionContext } from '../../app/institution'

import { useRoute } from 'vue-router'
import NutritionPlans from './NutritionPlans.vue'
import InstitutionNutrition from './InstitutionNutrition.vue'
const route = useRoute()
</script>
<template>
  <InstitutionNutrition
    v-if="institutionContext().view === 'trainee' || route.query.member"
    :key="String(route.query.member || 'self') + ':' + String(route.query.plan || 'current')"
  /><NutritionPlans v-else />
</template>
