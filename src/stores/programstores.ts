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
// fetch singular Program
  async function fetchProgram(id: string) {
    try {
      const { data, error } = await supabase
        .from("programs")
        .select()
        .eq("id", id)
        .single(); // Expect a single record

      if (error) throw new Error(error.message);

      Program.value = data;
    } catch (error) {
      console.error("Error fetching program:", error);
    }
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

  // Update Program
  async function updateProgram(updateData: { id: string; program_name?: string; program_description?: string }) {
    try {
      const { error } = await supabase
        .from("programs")
        .update(updateData)
        .eq("id", updateData.id);

      if (error) throw new Error(error.message);

      // Update local state
      if (Program.value?.id === updateData.id) {
        Object.assign(Program.value, updateData);
      }
    } catch (error) {
      console.error("Error updating program:", error);
    }
  }


  return {
    AllPrograms,
    ActivePrograms,
    DraftedPrograms,
    Program,
    getAllPrograms,
    getActivePrograms,
    getDraftedPrograms,
    updateProgram,
    fetchProgram
  };
});
