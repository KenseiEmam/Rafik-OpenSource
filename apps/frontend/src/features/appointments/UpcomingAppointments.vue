<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { user, profile } from '../../app/auth'
import { request } from '../../lib/backend'
import { language as l, locale } from '../../lib/i18n'
import type { Relationship } from '../../lib/domain'
import { appointmentTime, type Appointment } from './model'
const props = defineProps<{ coach?: boolean }>()
const appointments = ref<Appointment[]>([])
onMounted(async () => {
  try {
    appointments.value = await request<Appointment[]>(
      '/v1/appointments/upcoming?coach=' + Boolean(props.coach),
    )
  } catch {
    /* The full calendar retains explicit error and retry controls. */
  }
})
</script>
<template>
  <section v-if="appointments.length" class="panel upcoming-appointments">
    <h2>{{ l('Coming up this week', 'مواعيد هذا الأسبوع') }}</h2>
    <RouterLink
      v-for="a in appointments"
      :key="a.id"
      :to="(coach ? '/coach' : '') + '/appointments'"
      >{{ a.title }} ·
      {{ appointmentTime(a.starts_at, profile?.timezone || 'UTC', locale) }}</RouterLink
    >
  </section>
</template>
