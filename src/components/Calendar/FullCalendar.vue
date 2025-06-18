<script setup lang="ts">
import { ref } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { CalendarOptions } from '@fullcalendar/core';

const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  height: '100%',
  aspectRatio: 1,
  events: [],
});
</script>

<template>
  <div
    class="rafik-pribg dark:rafik-darkpribg rounded-lg p-4 h-full"
  >
    <FullCalendar :options="calendarOptions" />
  </div>
</template>

<style scoped>
/* Override FullCalendar styles to use Rafik colors */

/* General calendar background and text */
:deep(.fc) {
  background-color: var(--tw-bg-opacity) !important;
  color: var(--tw-text-opacity) !important;
  border-radius: 0.5rem;
}

/* Toolbar title (month/year) */
:deep(.fc-toolbar-title) {
  @apply text-rafik  dark:text-rafik-darkpritext font-semibold text-lg;
}

/* Buttons */
:deep(.fc-button) {
  @apply bg-rafik-alternate text-rafik-darkpritext border-none rounded-md px-3 py-1.5 transition-colors duration-200;
}
:deep(.fc-button:hover),
:deep(.fc-button:focus) {
  @apply bg-rafik-alternate text-white outline-none;
}

/* Day cells */
:deep(.fc-daygrid-day) {
  @apply bg-rafik-secbg bg-opacity-50 dark:bg-rafik-darksecbg dark:bg-opacity-50 border border-rafik-sectext dark:border-rafik-darksectext rounded-sm;
}

:deep(.fc-daygrid-day-number) {
  @apply text-rafik-pritext dark:text-rafik-darkpritext font-medium;
}

:deep(.fc-day-today) {
  @apply bg-rafik-secbg dark:bg-rafik-darksecbg !important;
  color: white !important;
}

/* Events */
:deep(.fc-event) {
  @apply bg-rafik text-rafik-pribg rounded px-2 py-0.5 font-semibold cursor-pointer;
  border: none !important;
}
/* Events */
:deep(.fc-col-header) {
  @apply bg-rafik-pribg dark:bg-rafik-darkpribg rounded px-2 py-0.5 font-semibold cursor-pointer;
  border: none !important;
}
:deep(.fc-col-header-cell-cushion) {
  @apply bg-rafik-pribg dark:bg-rafik-darkpribg dark:text-rafik-pritext text-rafik-pritext  rounded px-2 py-0.5 font-semibold cursor-pointer;
  border: none !important;
}
</style>
