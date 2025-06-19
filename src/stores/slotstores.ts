import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'
import Swal from 'sweetalert2'

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
};

export const useSlotStore = defineStore('Slot', () => {
  const AllSlots = ref<Slot[]>([]);
  const SlotItem = ref<Slot | null>(null);

  // Fetch a single slot by ID
  async function getSlot(id: number) {
    try {
      const { data, error } = await supabase
        .from('slots')
        .select('*')
        .eq('id', id)
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
      let query = supabase
        .from('slots')
        .select('*')
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
  // Clear the current slot item
  function clearSlot() {
    SlotItem.value = null;
  }

  return {
    AllSlots,
    SlotItem,
    getSlot,
    insertSlot,
    getAllSlots,
    clearSlot,
  };
});
