<script setup lang="ts">
import { computed } from 'vue'
import { language as l, locale } from '../../lib/i18n'
import type { CalendarEvent } from './service-types'
const props = defineProps<{ event: CalendarEvent; to: string; zone: string }>()
const format = (value: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-AE' : 'en-GB', {
    ...options,
    timeZone: props.zone,
  }).format(new Date(value))
const trainees = computed(() => props.event.people?.filter((p) => p.duty === 'trainee') || [])
const attended = computed(() => trainees.value.filter((p) => p.attendance === 'present').length)
const staff = computed(() =>
  (props.event.people || [])
    .filter((p) => p.duty === 'staff')
    .map((p) => p.name)
    .join(' · '),
)
const missingStaff = computed(
  () =>
    !props.event.people?.some((p) => p.duty === 'staff' && p.active && p.roles.includes('trainer')),
)
</script>
<template>
  <RouterLink :to="to" class="agenda-event"
    ><div class="agenda-time">
      <strong>{{
        format(event.starts_at, { weekday: 'short', day: 'numeric', month: 'short' })
      }}</strong
      ><span
        >{{ format(event.starts_at, { hour: '2-digit', minute: '2-digit' }) }} —
        {{ format(event.ends_at, { hour: '2-digit', minute: '2-digit' }) }}</span
      >
    </div>
    <div class="agenda-content">
      <span class="tag">{{
        event.kind === 'assessment' ? l('Assessment', 'تقييم') : l('Training', 'تدريب')
      }}</span>
      <h3 dir="auto">{{ event.title }}</h3>
      <p>{{ event.location || l('Location to be agreed', 'الموقع يحدد لاحقاً') }}</p>
      <p v-if="staff" class="small-print">{{ staff }}</p>
      <p v-if="event.state === 'completed' && trainees.length" class="small-print">
        {{ attended }} / {{ trainees.length }} {{ l('attended', 'حضروا') }}
      </p>
      <p v-if="event.state === 'scheduled' && missingStaff" class="attention-label">
        {{ l('Trainer reassignment needed', 'يلزم إعادة تعيين المدرب') }}
      </p>
    </div>
    <span class="event-state" :class="event.state"
      >{{
        event.state === 'completed'
          ? l('View what happened', 'عرض ما جرى')
          : event.state === 'cancelled'
            ? l('Cancelled', 'ملغي')
            : l('Open session', 'فتح الجلسة')
      }}
      <span aria-hidden="true" class="directional">→</span></span
    ></RouterLink
  >
</template>
<style scoped>
.agenda-event {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) auto;
  align-items: center;
  gap: 24px;
  padding: 20px 0;
  border-block-start: 1px solid var(--line);
  color: inherit;
  text-decoration: none;
}
.agenda-event:hover h3 {
  text-decoration: underline;
}
.agenda-time {
  display: grid;
  gap: 8px;
  font-size: 0.85rem;
}
.agenda-time span,
.event-state {
  color: var(--muted);
  font-size: 0.85rem;
}
.event-state.completed,
.event-state.scheduled {
  color: var(--accent);
  font-weight: 650;
}
.event-state .directional {
  display: inline-block;
}
.agenda-content {
  min-width: 0;
  overflow-wrap: anywhere;
}
.agenda-content h3 {
  font-size: 1.02rem;
  margin: 8px 0 4px;
}
.agenda-content p {
  margin: 2px 0;
}
.attention-label {
  color: var(--accent);
  font-weight: 650;
}
@media (max-width: 650px) {
  .agenda-event {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }
  .agenda-time {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
  }
}
</style>
