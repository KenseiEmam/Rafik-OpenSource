<script setup lang="ts">
import { institutionContext } from '../../app/institution'

import { useRoute } from 'vue-router'
import AthletePlans from './AthletePlans.vue'
import InstitutionTraining from './InstitutionTraining.vue'
const route = useRoute()
</script>
<template>
  <InstitutionTraining v-if="institutionContext().view === 'trainee'" /><AthletePlans v-else />
</template>
