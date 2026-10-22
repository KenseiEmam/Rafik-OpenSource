<script setup lang="ts">
import { institutionContext } from '../../app/institution'

import { useRoute } from 'vue-router'
import AthletePlans from './AthletePlans.vue'
import OrganizationTraining from './OrganizationTraining.vue'
const route = useRoute()
</script>
<template>
  <OrganizationTraining v-if="institutionContext().view === 'trainee'" /><AthletePlans v-else />
</template>
