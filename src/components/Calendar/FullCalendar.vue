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
import BookBulkModal from './BookBulkModal.vue';
const slotStore = useSlotStore();
const templateStore = useTemplateStore();
const userStore= useUserStore();
import type { EventInput } from '@fullcalendar/core';
import ViewModal from './ViewModal.vue';
import { supabase } from '@/lib/supabaseClient';
// @ts-ignore
import { RRule, RRuleSet, rrulestr } from 'rrule';
const bulkBook = ref(false)
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
  if (!viewSlot.value) return;

  // If this is a recurring event occurrence, offer both options in a popup
  const isRecurringOccurrence = viewSlot.value.assessment && viewSlot.value.occurrenceDate && viewSlot.value.slot?.recurrence_rule;

  if (isRecurringOccurrence) {
    const result = await Swal.fire({
      title: 'Delete Assessment',
      text: 'Do you want to delete just this occurrence, or the entire series?',
      icon: 'warning',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Just this occurrence',
      denyButtonText: 'Entire series',
      cancelButtonText: 'Cancel',
      background: '#081411',
      color: '#E8F3ED',
    });

    if (result.isConfirmed) {
      // Delete just this occurrence (assessment instance)
      try {
        const dateStr = viewSlot.value.occurrenceDate instanceof Date
          ? viewSlot.value.occurrenceDate.toISOString().split('T')[0]
          : String(viewSlot.value.occurrenceDate);
        await supabase
          .from('assessment')
          .delete()
          .eq('id', viewSlot.value.assessment.id);
        // Add exception to slot
        await slotStore.addSlotException(viewSlot.value.slot.id, dateStr);
        await loadSlots();
        resetView();
        Swal.fire('Deleted!', 'This occurrence has been deleted.', 'success');
      } catch (err) {
        console.error('Error deleting occurrence:', err);
        Swal.fire('Error', 'Failed to delete occurrence.', 'error');
      }
      return;
    } else if (result.isDenied) {
      // Delete the entire series (slot and all assessments)
      try {
        await slotStore.deleteSlot(viewSlot.value.slot.id);
        await loadSlots();
        resetView();
        Swal.fire('Deleted!', 'The entire series has been deleted.', 'success');
      } catch (err) {
        Swal.fire('Error', 'Failed to delete series.', 'error');
      }
      return;
    } else {
      // Cancelled
      return;
    }
  }

  // Non-recurring or non-assessment event: delete the slot as before
  if (!viewSlot.value.slot?.id) return;

  const result = await Swal.fire({
    title: 'Delete Event?',
    text: 'This will permanently delete the slot and its associated assessment. This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    background: '#081411',
    color: '#E8F3ED',
  });

  if (!result.isConfirmed) return;

  try {
    await slotStore.deleteSlot(viewSlot.value.slot.id);
    await loadSlots();
    resetView();
  } catch (err) {
    // Error handling is already done in the store
  }
}

async function handleDeleteOccurrence() {
  if (!viewSlot.value?.assessment?.id) return;
  try {
    await supabase
      .from('assessment')
      .delete()
      .eq('id', viewSlot.value.assessment.id);
    await loadSlots();
    resetView();
    Swal.fire('Deleted!', 'This occurrence has been deleted.', 'success');
  } catch (err) {
    console.error('Error deleting occurrence:', err);
    Swal.fire('Error', 'Failed to delete occurrence.', 'error');
  }
}

async function handleDeleteSeries() {
  if (!viewSlot.value?.slot?.id) return;
  try {
    await slotStore.deleteSlot(viewSlot.value.slot.id);
    await loadSlots();
    resetView();
    Swal.fire('Deleted!', 'The entire series has been deleted.', 'success');
  } catch (err) {
    Swal.fire('Error', 'Failed to delete series.', 'error');
  }
}

const viewSlot = ref<any>(null)
// Load slots and update calendar events
async function loadSlots() {
  await slotStore.getAllSlots();
  const slots = slotStore.AllSlots;
  const events: EventInput[] = [];

  // Use a generous range for recurring events (2 years forward, 1 month back)
  const now = new Date();
  const calendarStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const calendarEnd = new Date(now.getFullYear() + 2, now.getMonth(), 0);

  for (const slot of slots) {
    if (slot.recurrence_rule) {
      // Expand recurring events using rrule.js
      const freqMap: { [key: string]: any } = {
        'DAILY': RRule.DAILY,
        'WEEKLY': RRule.WEEKLY,
        'MONTHLY': RRule.MONTHLY,
        'YEARLY': RRule.YEARLY
      };

      const ruleOptions = {
        freq: freqMap[slot.recurrence_rule.freq.toUpperCase()] || RRule.DAILY,
        dtstart: new Date(slot.time_start),
        until: slot.recurrence_rule.endDate ? new Date(slot.recurrence_rule.endDate) : undefined,
        interval: slot.recurrence_rule.customInterval || 1,
        byweekday: slot.recurrence_rule.daysOff && slot.recurrence_rule.daysOff.length < 7
          ? [0,1,2,3,4,5,6].filter(d => !slot.recurrence_rule.daysOff.includes(d)).map(d => {
              // Map day numbers to RRule weekdays (0=Sunday, 1=Monday, etc.)
              const weekdayMap = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];
              return weekdayMap[d];
            })
          : undefined
      };

      // Debug: Log the rule configuration
      if (slot.type === 'assessment') {
        console.log(`Slot ${slot.id} rule config:`, {
          freq: slot.recurrence_rule.freq,
          interval: slot.recurrence_rule.customInterval,
          daysOff: slot.recurrence_rule.daysOff,
          byweekday: ruleOptions.byweekday,
          start: slot.time_start,
          end: slot.recurrence_rule.endDate
        });
      }

      const rule = new RRule(ruleOptions);
      const occurrences = rule.between(calendarStart, calendarEnd, true);

      // Debug: Log the rule and occurrences for troubleshooting
      if (slot.type === 'assessment' && occurrences.length > 0) {
        console.log(`Slot ${slot.id}: Generated ${occurrences.length} occurrences from ${occurrences[0]?.toISOString()} to ${occurrences[occurrences.length - 1]?.toISOString()}`);
      }

      // For recurring assessments, batch generate instances for current month
      if (slot.type === 'assessment') {
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Filter occurrences for current month only
        const currentMonthOccurrences = occurrences.filter((occ:any) =>
          occ >= currentMonth && occ <= nextMonth
        );

        if (currentMonthOccurrences.length > 0) {
          try {
            const baseAssessment = slot.assessment_data || {
              assessors: slot.users || [],
              trainees: slot.users || [],
              template: null,
              status: 'scheduled'
            };

            // Batch generate assessments for current month
            await slotStore.batchGenerateAssessmentInstances(slot.id, currentMonthOccurrences, baseAssessment);
          } catch (error) {
            console.error('Error generating assessment instances for current month:', error);
          }
        }
      }

      // Add all occurrences to events (for display)
      const exceptions = Array.isArray(slot.exceptions) ? slot.exceptions : [];
      for (const occ of occurrences) {
        const occDateStr = occ.toISOString().split('T')[0];
        if (exceptions.includes(occDateStr)) continue; // skip exception dates
        events.push({
          id: `${slot.id}-${occ.toISOString()}`,
          title: slot.type,
          start: occ,
          end: new Date(occ.getTime() + (new Date(slot.time_end).getTime() - new Date(slot.time_start).getTime())),
          backgroundColor: '#2EBE71',
          display: 'block',
        });
      }
    } else {
      // Non-recurring event
      events.push({
        id: String(slot.id),
        title: slot.type,
        start: slot.time_start,
        end: slot.time_end,
        backgroundColor: '#2EBE71',
        display: 'block',
      });
    }
  }
  calendarEvents.value = events;
}

// FullCalendar options, events bound reactively
const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  height: '100%',
  events: calendarEvents.value,
  eventClick: async function(info) {
    // Parse slotId and occurrence date from event.id
    let slotId = null;
    let occurrenceDate = null;
    const dashIdx = info.event.id.indexOf('-');
    if (dashIdx !== -1) {
      slotId = parseInt(info.event.id.substring(0, dashIdx));
      const isoDateStr = info.event.id.substring(dashIdx + 1);
      occurrenceDate = new Date(isoDateStr);
    } else {
      slotId = parseInt(info.event.id);
    }

    // Find the slot
    const slot = slotStore.AllSlots.find(slot => slot.id === slotId);
    let assessmentInstance = null;
    if (slot && occurrenceDate && slot.type === 'assessment') {
      // Bulletproof helper to get YYYY-MM-DD from Date, Proxy, or string
      function toDateString(val: any): string {
        // Unwrap Vue Proxy if present
        if (val && typeof val === 'object' && val.__v_raw) {
          val = val.__v_raw;
        }
        // If it's a Date or Proxy-wrapped Date
        if (val && typeof val === 'object' && typeof val.getTime === 'function') {
          return new Date(val.getTime()).toISOString().split('T')[0];
        }
        // If it's a string
        if (typeof val === 'string' && val.length >= 10) {
          return val.split('T')[0];
        }
        return String(val);
      }
      const occurrenceDateStr = toDateString(occurrenceDate);
      console.log('Supabase assessment fetch: slot', slotId, 'occurrenceDateStr', occurrenceDateStr, 'raw occurrenceDate', occurrenceDate);
      const { data, error } = await supabase
        .from('assessment')
        .select('*')
        .eq('slot', slotId)
        .eq('occurrence_date', occurrenceDateStr)
        .maybeSingle();
      if (!error && data) {
        assessmentInstance = data;
      }
    }
    // Pass slot, assessmentInstance, and occurrenceDate to the modal
    viewSlot.value = {
      slot,
      assessment: assessmentInstance,
      occurrenceDate: occurrenceDate ? occurrenceDate : (slot ? new Date(slot.time_start) : null)
    };
  },
  headerToolbar: {
    left: 'prev,next',
    center: 'title',
    right: 'dayGridWeek,dayGridDay,dayGridMonth' // user can switch between the two
  },
  dateClick: handleDateClick,
  datesSet: function(info) {
    // Generate assessments for the new month being viewed
    generateAssessmentsForMonth(info.start, info.end);
  },
});

// Function to generate assessments for a specific month range
async function generateAssessmentsForMonth(start: Date, end: Date) {
  const slots = slotStore.AllSlots;

  for (const slot of slots) {
    if (slot.type === 'assessment' && slot.recurrence_rule && slot.recurrence_rule.repeatType !== 'none') {
      const freqMap: { [key: string]: any } = {
        'DAILY': RRule.DAILY,
        'WEEKLY': RRule.WEEKLY,
        'MONTHLY': RRule.MONTHLY,
        'YEARLY': RRule.YEARLY
      };

      const ruleOptions = {
        freq: freqMap[slot.recurrence_rule.freq.toUpperCase()] || RRule.DAILY,
        dtstart: new Date(slot.time_start),
        until: slot.recurrence_rule.endDate ? new Date(slot.recurrence_rule.endDate) : undefined,
        interval: slot.recurrence_rule.customInterval || 1,
        byweekday: slot.recurrence_rule.daysOff && slot.recurrence_rule.daysOff.length < 7
          ? [0,1,2,3,4,5,6].filter(d => !slot.recurrence_rule.daysOff.includes(d)).map(d => {
              const weekdayMap = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];
              return weekdayMap[d];
            })
          : undefined
      };

      const rule = new RRule(ruleOptions);
      const occurrences = rule.between(start, end, true);

      if (occurrences.length > 0) {
        try {
          const baseAssessment = slot.assessment_data || {
            assessors: slot.users || [],
            trainees: slot.users || [],
            template: null,
            status: 'scheduled'
          };

          // Use batch generation instead of individual calls
          await slotStore.batchGenerateAssessmentInstances(slot.id, occurrences, baseAssessment);
        } catch (error) {
          console.error('Error generating assessment instances for month navigation:', error);
        }
      }
    }
  }
}

const templateData = ref({ date: null });

async function handleSubmit(slot: any, assessment: any) {
  showCalendar.value = false;
  if (slot.type === 'assessment') {
    await slotStore.insertAssessmentSlot(slot, assessment);
  } else {
    await slotStore.insertSlot(slot);
  }
  await loadSlots().then(() => {
    showCalendar.value = true;
    showModal.value = false;
    templateData.value.date = null;
  });
}
async function handleSubmitBulk(slot: any, assessment: any) {
  showCalendar.value = false;
  if (slot.type === 'assessment') {
    await slotStore.insertAssessmentSlot(slot, assessment);
  } else {
    await slotStore.insertSlot(slot);
  }
  await loadSlots().then(() => {
    showCalendar.value = true;
    showModal.value = false;
    bulkBook.value =false;
  });
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
  bulkBook.value =false;
}

onMounted(() => {
  loadSlots().then(() => {
    templateStore.fetchTemplates(userStore.userProfile).then(()=>{
      showCalendar.value = true;
    })
  });

  // Auto-reschedule missed assessments on calendar load
  slotStore.autoRescheduleMissedAssessments();
});

// Keep calendarOptions.events in sync with calendarEvents ref
watch(calendarEvents, (newEvents) => {
  calendarOptions.value = {
    ...calendarOptions.value,
    events: newEvents,
  };
});

async function handleRescheduled() {
  // Refresh slots and calendar when assessment is rescheduled
  resetView();
  await loadSlots();
}
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
      @delete-occurrence="handleDeleteOccurrence"
      @delete-series="handleDeleteSeries"
      @rescheduled="handleRescheduled"
      :templateData="viewSlot"
    />
    <BookBulkModal
      :visible="bulkBook"
      @close="closeModal"
      @submit="handleSubmitBulk"
      :templateData="templateData"
      :myTemplates="templateStore.AllTemplates"
    />
    <div class="flex py-6 w-full"><button @click="bulkBook = true" class="ms-auto btn-sm-outline">Book Weekly</button></div>
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
