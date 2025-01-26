import { ref } from 'vue';
import { defineStore } from 'pinia';
import { supabase } from '../lib/supabaseClient';

export const useProgramStore = defineStore('Program', () => {
  const AllPrograms = ref<any[] | null>(null);
  const ActivePrograms = ref<any[] | null>(null);
  const DraftedPrograms = ref<any[] | null>(null);
  const Program = ref<any | null>(null); // Adjust type based on your `programs` table structure.

  // Fetch all programs
  async function getAllPrograms() {
    const UserID = localStorage.getItem('UserID');

    if (!UserID) {
      throw new Error('No user ID found in localStorage.');
    }

    try {
      const { data, error } = await supabase
        .from('programs')
        .select()
        .eq('trainer_id', UserID);

      if (error) {
        throw new Error(`Error fetching programs: ${error.message}`);
      }

      AllPrograms.value = data || [];
      splitProgramsByStatus();
      return AllPrograms.value;
    } catch (error: any) {
      console.error(error);
      alert(`Failed to load programs: ${error.message || 'Unknown error'}`);
    }
  }

  // Split programs by status
  function splitProgramsByStatus() {
    if (!AllPrograms.value) return;

    ActivePrograms.value = AllPrograms.value.filter(
      (program) => program.status === 'Active'
    );
    DraftedPrograms.value = AllPrograms.value.filter(
      (program) => program.status !== 'Active'
    );
  }

  // Fetch only active programs
  async function getActivePrograms() {
    if (!AllPrograms.value) {
      await getAllPrograms(); // Ensure all programs are fetched first
    }
    return ActivePrograms.value;
  }

  // Fetch only drafted programs
  async function getDraftedPrograms() {
    if (!AllPrograms.value) {
      await getAllPrograms(); // Ensure all programs are fetched first
    }
    return DraftedPrograms.value;
  }

  return {
    AllPrograms,
    ActivePrograms,
    DraftedPrograms,
    Program,
    getAllPrograms,
    getActivePrograms,
    getDraftedPrograms,
  };
});
