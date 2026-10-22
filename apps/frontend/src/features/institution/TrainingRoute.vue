<script setup lang="ts">
import { institutionContext } from '../../app/institution'

import { useRoute } from 'vue-router'
import AthletePlans from './AthletePlans.vue'
import AthleteTraining from './AthleteTraining.vue'
const route = useRoute()
</script>
<template>
  <AthleteTraining v-if="institutionContext().view === 'trainee'" /><AthletePlans v-else />
</template>
