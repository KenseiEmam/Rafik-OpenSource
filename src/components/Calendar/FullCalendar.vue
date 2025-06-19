<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { CalendarOptions } from '@fullcalendar/core';
import BookModal from './BookModal.vue';
import { useSlotStore } from '@/stores/slotstores';

const slotStore = useSlotStore();
import type { EventInput } from '@fullcalendar/core';

const calendarEvents = ref<EventInput[]>([]);

function slotsToEvents(slots: any[]): EventInput[] {
  return slots.map(slot => ({
    id: String(slot.id),
    title: slot.type,
    start: slot.time_start,
    end: slot.time_end,
  }));
}

// Load slots and update calendar events
async function loadSlots() {
  await slotStore.getAllSlots();
  calendarEvents.value = slotsToEvents(slotStore.AllSlots);
}

// FullCalendar options, events bound reactively
const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  height: '100%',
  events: calendarEvents.value,
  dateClick: handleDateClick,
});

const templateData = ref({ date: null });

async function handleSubmit(slot: any) {
  // Slot is handled externally, just reload slots & calendar here

  showCalendar.value = false;
  await slotStore.insertSlot(slot).then(()=>{
    loadSlots().then(() => {
    showCalendar.value = true;
    showModal.value = false;
    templateData.value.date = null
  });
  })

}

function handleDateClick(event: any) {
  // Pass date string without time to modal
  const dateOnly = event.dateStr.split('T')[0];
  templateData.value.date = dateOnly;
}

// Control flags for rendering
const showCalendar = ref(false);
const showModal = ref(false);

function closeModal() {
  templateData.value.date = null;
}

onMounted(() => {
  loadSlots().then(() => {
    showCalendar.value = true;
  });
});

// Keep calendarOptions.events in sync with calendarEvents ref
watch(calendarEvents, (newEvents) => {
  calendarOptions.value = {
    ...calendarOptions.value,
    events: newEvents,
  };
});
</script>

<template>
  <div class="rafik-pribg dark:rafik-darkpribg rounded-lg p-4 h-full">
    <BookModal
      :visible="templateData.date !== null"
      @close="closeModal"
      @submit="handleSubmit"
      :templateData="templateData"
    />
    <FullCalendar v-if="showCalendar" :options="calendarOptions" />
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
  @apply text-rafik dark:text-rafik-darkpritext font-semibold text-lg;
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
/* Column headers */
:deep(.fc-col-header) {
  @apply bg-rafik-pribg dark:bg-rafik-darkpribg rounded px-2 py-0.5 font-semibold cursor-pointer;
  border: none !important;
}
:deep(.fc-col-header-cell-cushion) {
  @apply bg-rafik-pribg dark:bg-rafik-darkpribg dark:text-rafik-darkpritext text-rafik-pritext rounded px-2 py-0.5 font-semibold cursor-pointer;
  border: none !important;
}
</style>
