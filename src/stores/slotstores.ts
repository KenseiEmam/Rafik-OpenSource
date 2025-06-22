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
    background: '#132e3d',
    color: '#ececec',
  });
}

function showError(message: string) {
  Swal.fire({
    title: 'Error!',
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#132e3d',
    color: '#ececec',
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

  // Fetch all slots, optionally filtered by assessment
  async function getAllSlots(assessmentId?: number) {
    try {
      const orgId = userStore.userProfile?.organization;
      let query = supabase
        .from('slots')
        .select('*')
        .eq('organization',orgId)
        .order('time_start', { ascending: true });

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
    newSlot.organization = orgId
    const { data, error } = await supabase
      .from('slots')
      .insert([newSlot])
      .select()
      .single();

    if (error) throw error;

    if (data) {
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
async function insertAssessmentSlot(newSlot: Omit<Slot, 'id' | 'created_at'| 'date'>, newAssessment:Assessment) {
  try {
    const orgId = userStore.userProfile?.organization;
    if(orgId)
    newSlot.organization = orgId
    let asesid   = null
    // Insert Assessment if applicable
    if(newSlot.type === "assessment")
    {
    if(orgId)
    newAssessment.organization = orgId
      const { data:ases, error:erses } = await supabase
      .from('assessment')
      .insert([newAssessment])
      .select()
      .single();

    if (erses) throw erses;

    if(ases)
      {
        newSlot.assessment = ases.id
        asesid = ases.id
      }

  }

    const { data, error } = await supabase
      .from('slots')
      .insert([newSlot])
      .select()
      .single();

    if (error) throw error;

    if (data) {

         // Update Assessment to link Slot
    if (asesid && data?.id) {
      const { error: ersas } = await supabase
        .from('assessment')
        .update({ slot: data.id }) // ✅ fix here
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
  // Clear the current slot item
  function clearSlot() {
    SlotItem.value = null;
  }

  return {
    AllSlots,
    SlotItem,
    getSlot,
    insertSlot,
    insertAssessmentSlot,
    getAllSlots,
    clearSlot,
  };
});
