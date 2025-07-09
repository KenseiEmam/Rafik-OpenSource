import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'
import Swal from 'sweetalert2'
import { useUserStore } from './user'

// Success and Error Alerts
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

// Slot type based on Supabase schema
type Slot = {
  id: number;
  created_at: string;
  time_start: string;
  time_end: string;
  users?: string[];      // Array of user IDs
  groups?: string[];     // Array of group IDs
  type: string;
  assessment?: number | null; // Optional assessment relation
  organization:number;
  recurringSchedule?: any; // Recurring schedule configuration
  recurrence_rule?: any;
  assessment_data?: any; // Assessment data for recurring assessments
  exceptions?: string[]; // Dates to skip for recurring events
};
type Assessment= {
  assessors: number[];
  trainees: number[];
  template: number;
  slot?:number | null; // Optional assessment relation
  organization:number;
}
export const useSlotStore = defineStore('Slot', () => {
  const AllSlots = ref<Slot[]>([]);
  const SlotItem = ref<Slot | null>(null);
  const userStore = useUserStore()
  // Fetch a single slot by ID
  async function getSlot(id: number) {
    try {
      const orgId = userStore.userProfile?.organization;
      const { data, error } = await supabase
        .from('slots')
        .select('*')
        .eq('id', id)
        .eq('organization',orgId)
        .single();
      if (error) throw error;
      SlotItem.value = data;
      return data;
    } catch (error: any) {
      console.error(error);
      showError(`Failed to load slot: ${error.message || 'Unknown error'}`);
      return null;
    }
  }
async function getAllSlots(assessmentId?: number) {
  try {
    const roles = userStore.userProfile?.roles || [];
    const orgId = userStore.userProfile?.organization;
    const userId = localStorage.getItem('UserID');

    let query = supabase.from('slots').select('*').order('time_start', { ascending: true });

    // If user is Org Trnr or Org Admin, filter by org
    if (roles.includes('Organization Trnr') || roles.includes('Organization Admin')) {
      query = query.eq('organization', orgId);
    }

    // If user is NOT Admin or Org Admin, filter by their presence in users array
    if (!roles.includes('Administrator') && !roles.includes('Organization Admin') && userId) {
      query = query.contains('users', [parseInt(userId)]);
    }

    if (assessmentId) {
      query = query.eq('assessment', assessmentId);
    }

    const { data, error } = await query;
    if (error) throw error;

    AllSlots.value = data || [];
    return AllSlots.value;
  } catch (error: any) {
    console.error(error);
    showError(`Failed to load slots: ${error.message || 'Unknown error'}`);
    return null;
  }
}

async function insertSlot(newSlot: Omit<Slot, 'id' | 'created_at'| 'date'>) {
  try {
    const orgId = userStore.userProfile?.organization;
    if(orgId)
      newSlot.organization = orgId;
    // Remove recurringSchedule property if it exists (it's not a database column)
    const { recurringSchedule: _, ...slotForDatabase } = newSlot;
    const { data, error } = await supabase
      .from('slots')
      .insert([slotForDatabase])
      .select()
      .single();
    if (error) throw error;
    if (data) {
      AllSlots.value.push(data);

    }
    return data;
  } catch (error: any) {
    console.error(error);
    showError(error.message || 'Failed to create slot.');
    throw error;
  }
}

async function insertAssessmentSlot(newSlot: Omit<Slot, 'id' | 'created_at'| 'date'>, newAssessment:Assessment) {
  try {
    const orgId = userStore.userProfile?.organization;
    if(orgId)
      newSlot.organization = orgId;
    // Remove recurringSchedule property if it exists (it's not a database column)
    const { recurringSchedule: _, ...slotForDatabase } = newSlot;
    let asesid   = null;

    // Insert Assessment if applicable
    if(newSlot.type === "assessment") {
      if(orgId)
        newAssessment.organization = orgId;

      // Check if this is a recurring assessment
      if (newSlot.recurrence_rule && newSlot.recurrence_rule.repeatType !== 'none') {
        // For recurring assessments, we don't create the assessment here
        // It will be created on-demand when the calendar expands
        slotForDatabase.assessment = null; // No direct assessment link for recurring
        // Store assessment data for later use
        slotForDatabase.assessment_data = newSlot.assessment_data;
      } else {
        // Single assessment - create it now
        const { data:ases, error:erses } = await supabase
          .from('assessment')
          .insert([newAssessment])
          .select()
          .single();
        if (erses) throw erses;
        if(ases) {
          slotForDatabase.assessment = ases.id;
          asesid = ases.id;
        }
      }
    }

    const { data, error } = await supabase
      .from('slots')
      .insert([slotForDatabase])
      .select()
      .single();
    if (error) throw error;
    if (data) {
      // Update Assessment to link Slot (only for single assessments)
      if (asesid && data?.id) {
        const { error: ersas } = await supabase
          .from('assessment')
          .update({ slot: data.id })
          .eq('id', asesid);
        if (ersas) throw ersas;
      }
      AllSlots.value.push(data);
      showSuccess('Slot created successfully!');
    }
    return data;
  } catch (error: any) {
    console.error(error);
    showError(error.message || 'Failed to create slot.');
    throw error;
  }
}

async function rescheduleSlot(slotId: number, newTimeStart: string, newTimeEnd: string) {
  try {
    const orgId = userStore.userProfile?.organization;
    if (!orgId) {
      throw new Error('No organization ID found');
    }

    // Check for time conflicts with other slots
    const { data: conflictingSlots, error: conflictError } = await supabase
      .from('slots')
      .select('*')
      .eq('organization', orgId)
      .neq('id', slotId)
      .or(`and(time_start.lt.${newTimeEnd},time_end.gt.${newTimeStart})`);

    if (conflictError) throw conflictError;

    if (conflictingSlots && conflictingSlots.length > 0) {
      throw new Error('Time slot conflicts with existing appointments');
    }

    // Update the slot
    const { data, error } = await supabase
      .from('slots')
      .update({
        time_start: newTimeStart,
        time_end: newTimeEnd
      })
      .eq('id', slotId)
      .eq('organization', orgId)
      .select()
      .single();

    if (error) throw error;

    // Update local state
    const slotIndex = AllSlots.value.findIndex(slot => slot.id === slotId);
    if (slotIndex !== -1) {
      AllSlots.value[slotIndex] = { ...AllSlots.value[slotIndex], ...data };
    }

    if (SlotItem.value?.id === slotId) {
      SlotItem.value = { ...SlotItem.value, ...data };
    }

    showSuccess('Assessment rescheduled successfully!');
    return data;
  } catch (error: any) {
    console.error(error);
    showError(error.message || 'Failed to reschedule assessment.');
    throw error;
  }
}
  // Clear the current slot item
  function clearSlot() {
    SlotItem.value = null;
  }

  // Function to automatically reschedule missed assessments
  async function autoRescheduleMissedAssessments() {
    try {
      const orgId = userStore.userProfile?.organization;
      if (!orgId) return;

      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      // Find all scheduled assessments that were missed (past due date)
      const { data: missedSlots, error: slotError } = await supabase
        .from('slots')
        .select('*, assessment!slots_assessment_fkey(*)')
        .eq('organization', orgId)
        .eq('type', 'assessment')
        .lt('time_start', yesterday.toISOString())
        .not('assessment', 'is', null);

      if (slotError) throw slotError;

      if (!missedSlots || missedSlots.length === 0) return;

      // Group by assessment to find recurring patterns
      const assessmentGroups = new Map();
      for (const slot of missedSlots) {
        if (slot.assessment) {
          const key = `${slot.assessment.template}_${slot.assessment.trainees?.join('_')}`;
          if (!assessmentGroups.has(key)) {
            assessmentGroups.set(key, []);
          }
          assessmentGroups.get(key).push(slot);
        }
      }

      // For each group, find the next available date and reschedule
      for (const [key, slots] of assessmentGroups) {
        if (slots.length > 1) {
          // This is likely a recurring assessment, find the next date in the pattern
          const sortedSlots = slots.sort((a: any, b: any) =>
            new Date(a.time_start).getTime() - new Date(b.time_start).getTime()
          );

          const lastSlot = sortedSlots[sortedSlots.length - 1];
          const nextDate = calculateNextRecurringDate(new Date(lastSlot.time_start));

          if (nextDate) {
            // Reschedule the most recent missed slot to the next date
            await rescheduleSlot(lastSlot.id, nextDate.toISOString(),
              new Date(lastSlot.time_end).toISOString());
          }
        } else {
          // Single assessment, reschedule to next available day
          const slot = slots[0];
          const nextDate = new Date(now);
          nextDate.setDate(nextDate.getDate() + 1);
          nextDate.setHours(new Date(slot.time_start).getHours(),
            new Date(slot.time_start).getMinutes());

          await rescheduleSlot(slot.id, nextDate.toISOString(),
            new Date(slot.time_end).toISOString());
        }
      }

      showSuccess('Missed assessments have been automatically rescheduled');
    } catch (error: any) {
      console.error('Error auto-rescheduling missed assessments:', error);
      showError('Failed to auto-reschedule missed assessments');
    }
  }

  // Helper function to calculate next recurring date
  function calculateNextRecurringDate(lastDate: Date): Date | null {
    const now = new Date();
    const nextDate = new Date(lastDate);

    // Try to find the next date that's in the future
    while (nextDate <= now) {
      // Add 7 days (weekly pattern) - you can make this more sophisticated
      nextDate.setDate(nextDate.getDate() + 7);
    }

    return nextDate > now ? nextDate : null;
  }

  // Generate assessment instance for a specific occurrence date
  async function generateAssessmentInstance(slotId: number, occurrenceDate: Date, baseAssessment: any) {
    try {
      const orgId = userStore.userProfile?.organization;
      if (!orgId) throw new Error('No organization ID found');

      const occurrenceDateStr = occurrenceDate.toISOString().split('T')[0];

      // Check if assessment instance already exists for this date
      const { data: existingAssessment, error: checkError } = await supabase
        .from('assessment')
        .select('id')
        .eq('slot', slotId)
        .eq('occurrence_date', occurrenceDateStr)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors

      if (checkError) {
        console.error('Error checking existing assessment:', checkError);
        return null;
      }

      if (existingAssessment) {
        return existingAssessment.id; // Assessment already exists
      }

      // Create new assessment instance
      const assessmentInstance = {
        ...baseAssessment,
        slot: slotId,
        occurrence_date: occurrenceDateStr,
        organization: orgId,
        status: 'scheduled'
      };

      const { data: newAssessment, error: insertError } = await supabase
        .from('assessment')
        .insert([assessmentInstance])
        .select()
        .single();

      if (insertError) {
        // If it's a duplicate key error, try to get the existing one
        if (insertError.code === '23505') {
          const { data: existing } = await supabase
            .from('assessment')
            .select('id')
            .eq('slot', slotId)
            .eq('occurrence_date', occurrenceDateStr)
            .maybeSingle();

          if (existing) {
            return existing.id;
          }
        }
        throw insertError;
      }

      return newAssessment.id;
    } catch (error: any) {
      console.error('Error generating assessment instance:', error);
      return null; // Return null instead of throwing to prevent breaking the calendar
    }
  }

  // Batch generate missing assessment instances for a date range
  async function batchGenerateAssessmentInstances(slotId: number, dateRange: Date[], baseAssessment: any) {
    try {
      const orgId = userStore.userProfile?.organization;
      if (!orgId) throw new Error('No organization ID found');

      // Get all existing assessment dates for this slot
      const { data: existingAssessments, error: fetchError } = await supabase
        .from('assessment')
        .select('occurrence_date')
        .eq('slot', slotId)
        .eq('organization', orgId);

      if (fetchError) {
        console.error('Error fetching existing assessments:', fetchError);
        return;
      }

      // Create a set of existing dates for fast lookup
      const existingDates = new Set(
        existingAssessments?.map(a => a.occurrence_date) || []
      );

      // Find missing dates
      const missingDates = dateRange.filter(date => {
        const dateStr = date.toISOString().split('T')[0];
        return !existingDates.has(dateStr);
      });

      if (missingDates.length === 0) {
        return; // All assessments already exist
      }

      // Batch insert all missing assessments using UPSERT to handle duplicates gracefully
      const assessmentInstances = missingDates.map(date => ({
        ...baseAssessment,
        slot: slotId,
        occurrence_date: date.toISOString().split('T')[0],
        organization: orgId,
        status: 'scheduled'
      }));

      const { error: insertError } = await supabase
        .from('assessment')
        .upsert(assessmentInstances, {
          onConflict: 'slot,occurrence_date',
          ignoreDuplicates: true
        });

      if (insertError) {
        console.error('Error batch upserting assessments:', insertError);
      } else {
        console.log(`Generated ${missingDates.length} assessment instances for slot ${slotId}`);
      }
    } catch (error: any) {
      console.error('Error in batch assessment generation:', error);
    }
  }

  // Delete slot and associated assessment
  async function deleteSlot(slotId: number) {
    try {
      const orgId = userStore.userProfile?.organization;
      if (!orgId) {
        throw new Error('No organization ID found');
      }

      // First, get the slot to check if it has an associated assessment
      const { data: slot, error: slotError } = await supabase
        .from('slots')
        .select('*')
        .eq('id', slotId)
        .eq('organization', orgId)
        .single();

      if (slotError) throw slotError;
      if (!slot) throw new Error('Slot not found');

      // Delete all associated assessments (could be multiple for recurring events)
      const { error: assessmentError } = await supabase
        .from('assessment')
        .delete()
        .eq('slot', slotId)
        .eq('organization', orgId);

      if (assessmentError) {
        console.error('Error deleting assessments:', assessmentError);
        // Continue with slot deletion even if assessment deletion fails
      }

      // Delete the slot
      const { error: deleteError } = await supabase
        .from('slots')
        .delete()
        .eq('id', slotId)
        .eq('organization', orgId);

      if (deleteError) throw deleteError;

      // Remove from local state
      const slotIndex = AllSlots.value.findIndex(s => s.id === slotId);
      if (slotIndex !== -1) {
        AllSlots.value.splice(slotIndex, 1);
      }

      if (SlotItem.value?.id === slotId) {
        SlotItem.value = null;
      }

      // Show appropriate success message
      if (slot.type === 'assessment') {
        showSuccess('Slot and all associated assessments deleted successfully!');
      } else {
        showSuccess('Slot deleted successfully!');
      }
      return true;
    } catch (error: any) {
      console.error(error);
      showError(error.message || 'Failed to delete slot.');
      throw error;
    }
  }

  // Add an exception date to a slot's exceptions array
  async function addSlotException(slotId: number, dateStr: string) {
    try {
      // Fetch current exceptions
      const { data: slot, error: fetchError } = await supabase
        .from('slots')
        .select('exceptions')
        .eq('id', slotId)
        .maybeSingle();
      if (fetchError) throw fetchError;
      let exceptions = Array.isArray(slot?.exceptions) ? slot.exceptions : [];
      if (!exceptions.includes(dateStr)) {
        exceptions.push(dateStr);
      }
      // Update slot
      const { error: updateError } = await supabase
        .from('slots')
        .update({ exceptions })
        .eq('id', slotId);
      if (updateError) throw updateError;
      return true;
    } catch (error) {
      console.error('Error adding slot exception:', error);
      return false;
    }
  }

  return {
    AllSlots,
    SlotItem,
    getSlot,
    insertSlot,
    insertAssessmentSlot,
    getAllSlots,
    clearSlot,
    rescheduleSlot,
    autoRescheduleMissedAssessments,
    deleteSlot,
    generateAssessmentInstance,
    batchGenerateAssessmentInstances,
    addSlotException,
  };
});
