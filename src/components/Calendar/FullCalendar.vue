<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { CalendarOptions } from '@fullcalendar/core';
import BookModal from './BookModal.vue';
import { useTemplateStore } from '@/stores/templatestores';
import { useSlotStore } from '@/stores/slotstores';
import { useUserStore } from '@/stores/user';
const slotStore = useSlotStore();
const templateStore = useTemplateStore();
const userStore= useUserStore();
import type { EventInput } from '@fullcalendar/core';
import ViewModal from './ViewModal.vue';
import { supabase } from '@/lib/supabaseClient';

const calendarEvents = ref<EventInput[]>([]);

function slotsToEvents(slots: any[]): EventInput[] {
  return slots.map(slot => {
    let bgc = ''
    switch(slot.type)
    {
      case 'meeting':
      bgc='#CB901C'
      break;
      case 'assessment':
      bgc='#2EBE71'
      break;
      case 'game':
      bgc='#B02DEF'
      break;
      case 'away':
      bgc='#FF0000'
      break;
      default:
        bgc= '#081411'
    }
    return  {
    id: String(slot.id),
    title: slot.type,
    start: slot.time_start,
    end: slot.time_end,
    backgroundColor:bgc,
    display:'block'
  }
  }
   );
}

import Swal from 'sweetalert2';

function showSuccess(message: string) {
  Swal.fire({
    title: 'Success!',
    text: message,
    icon: 'success',
    toast: true,
    position: 'top-right',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    background: '#081411',
    color: '#E8F3ED',
  });
}

function showError(message: string) {
  Swal.fire({
    title: 'Error!',
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED',
  });
}

async function handleDeleteSlot() {
  if (!viewSlot.value || !viewSlot.value.id) return;

  try {
    const { error } = await supabase.from('slots').delete().eq('id', viewSlot.value.id);

    if (error) throw error;

    showSuccess('Slot deleted successfully.');

    // Refresh slots
    await loadSlots();

    // Reset view slot
    resetView();
  } catch (err: any) {
    console.error(err);
    showError(`Failed to delete slot: ${err.message || 'Unknown error'}`);
  }
}

const viewSlot = ref<any>(null)
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
  eventClick: function(info) {
    viewSlot.value = slotStore.AllSlots.find(slot => slot.id === parseInt(info.event.id));

  },
  headerToolbar: {
    left: 'prev,next',
    center: 'title',
    right: 'dayGridWeek,dayGridDay,dayGridMonth' // user can switch between the two
  },
  dateClick: handleDateClick,
});

const templateData = ref({ date: null });

async function handleSubmit(slot: any, assessment:any) {
  // Slot is handled externally, just reload slots & calendar here

  showCalendar.value = false;
  if(slot.type === 'assessment')
    {
  await slotStore.insertAssessmentSlot(slot,assessment).then(()=>{
    loadSlots().then(() => {
    showCalendar.value = true;
    showModal.value = false;
    templateData.value.date = null
  });
  })
}
else{
  await slotStore.insertSlot(slot).then(()=>{
    loadSlots().then(() => {
    showCalendar.value = true;
    showModal.value = false;
    templateData.value.date = null
  });
  })

}


}
function resetView(){
  viewSlot.value = null
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
    templateStore.fetchTemplates(userStore.userProfile).then(()=>{

      showCalendar.value = true;
    })
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
      :myTemplates="templateStore.AllTemplates"
    />
    <ViewModal
      :visible="viewSlot !== null"
      @close="resetView"
      @delete="handleDeleteSlot"
      :templateData="viewSlot"
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
  @apply text-rafik-pribg rounded px-2 py-0.5 font-semibold cursor-pointer;
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
