<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { user, profile } from '../../app/auth'
import { backend, rows } from '../../lib/backend'
import { language as l, locale } from '../../lib/i18n'
import type { Relationship } from '../../lib/domain'
import { appointmentTime, type Appointment } from './model'
const props = defineProps<{ coach?: boolean }>()
const appointments = ref<Appointment[]>([])
onMounted(async () => {
  try {
    const relationships = await rows<Relationship>(
      'coach_clients',
      props.coach ? 'coach_id' : 'client_id',
      user.value!.id,
    )
    const ids = relationships.map((r) => r.id)
    if (!ids.length) return
    const { data } = await backend
      .from('appointments')
      .select('*')
      .in('relationship_id', ids)
      .eq('state', 'booked')
      .gte('starts_at', new Date().toISOString())
      .lte('starts_at', new Date(Date.now() + 7 * 86400000).toISOString())
      .order('starts_at')
      .limit(3)
    appointments.value = data || []
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
