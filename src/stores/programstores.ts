import { ref } from 'vue';
import { defineStore } from 'pinia';
import { supabase } from '../lib/supabaseClient';
import router from '@/router';


// Define the Program type with the new program_focus property
type Program = {
  id: string;
  program_name?: string;
  program_description?: string;
  program_focus?: string[]; // Add program_focus here (assumed to be an array of strings)
  status?: string;
  trainer_id?: number,
  difficulty_level?: string;
  avg_session_time?: number;
  avg_days_per_week?: number;
  overall_rating?: number;
  price_one?: number;
  price_three?: number;
  price_six?: number;
  price_year?: number;
  tags?:string[];
  workouts?:Workout[];
  program_photo?: string;
  weekly_cycle?:number;
  promos?:PromoCode[];
  induction?:Question[];
  follow?:Question[];
  referral?:string;
  // Add any other properties your program might have
};
interface Question  {
  type:string;
  question?:string;
  answer?:any;
}
// Promo Codes
type PromoCode = {
  code: string;
  value: number;
};
type Exercise = {
  id: string;
  exercise_name?: string;
  type?: string;
  intensity?: string;
  sets?: number;
  reps?: number;
};
type Workout = {
  workout_name: string;
  workout_summary?: string;
  time_to_complete?: string;
  sets_per_session?: number;
  rest_day?: boolean;
  exercises: Exercise[];
};
export const useProgramStore = defineStore('Program', () => {
  const AllPrograms = ref<Program[] | null>(null);
  const ActivePrograms = ref<Program[] | null>(null);
  const DraftedPrograms = ref<Program[] | null>(null);

  const Program = ref<Program>();

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

  // Fetch singular Program
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
  async function updateProgram(updateData: Program) {
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
  // Add Program
// Add Program
async function createProgram(newProgram: Program) {
  try {
    // Initialize with 7 empty workouts
    newProgram.workouts = Array.from({ length: 7 }, () => ({
      workout_name: "",
      workout_summary: "",
      time_to_complete: "",
      sets_per_session: 0,
      rest_day: false,
      exercises: [],
    }));

    const { data, error } = await supabase
      .from("programs")
      .insert(newProgram)
      .select();

    if (error) throw new Error(error.message);

    if (data !== null) {
      AllPrograms.value?.push(data[0]);
      splitProgramsByStatus();
      router.push({ name: "program-details", params: { id: data[0].id } });
    } // Add to local state

  } catch (error) {
    alert("Error creating program:"+error);
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
    fetchProgram,
    createProgram
  };
});
