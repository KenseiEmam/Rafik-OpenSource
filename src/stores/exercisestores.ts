import { ref } from 'vue';
import { defineStore } from 'pinia';
import { supabase } from '../lib/supabaseClient';



// Define the Exercise type with the new exercise_focus property
type Exercise= {
  id: string;
  exercise_name?: string;
  exercise_detail?: string;
  prime?: string[];
  synergist?: string[];
  antagonist?: string[];
  type?: string;
  rest?: number,
  safety?:string[];
  steps?:string[];
  equipment?:string[];
  media?: string;
  embeds?:number[];
  // Add any other properties your exercise might have
};

export const useExerciseStore = defineStore('Exercise', () => {
  const AllExercises = ref<Exercise[] | null>(null);
  const ActiveExercises = ref<Exercise[] | null>(null);
  const DraftedExercises = ref<Exercise[] | null>(null);

  const Exercise = ref<Exercise>();

  // Fetch all exercises
  async function getAllExercises() {
    const UserID = localStorage.getItem('UserID');

    if (!UserID) {
      throw new Error('No user ID found in localStorage.');
    }

    try {
      const { data, error } = await supabase
        .from('exercises')
        .select()
        .or(`trainer_id.eq.${UserID},trainer_id.is.null`);

      if (error) {
        throw new Error(`Error fetching exercises: ${error.message}`);
      }

      AllExercises.value = data || [];
      return AllExercises.value;
    } catch (error: any) {
      console.error(error);
      alert(`Failed to load exercises: ${error.message || 'Unknown error'}`);
    }

  }



  // Fetch singular Exercise
  async function fetchExercise(id: string) {
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select()
        .eq("id", id)
        .single(); // Expect a single record

      if (error) throw new Error(error.message);

      Exercise.value = data;
    } catch (error) {
      console.error("Error fetching exercise:", error);
    }
  }



  // Update Exercise
  async function updateExercise(updateData: Exercise) {
    try {
      const { error } = await supabase
        .from("exercises")
        .update(updateData)
        .eq("id", updateData.id);

      if (error) throw new Error(error.message);

      // Update local state
      if (Exercise.value?.id === updateData.id) {
        Object.assign(Exercise.value, updateData);
      }
    } catch (error) {
      console.error("Error updating exercise:", error);
    }
  }
  // Add Exercise
  async function createExercise(newExercise: Exercise) {
    try {
      const { data, error } = await supabase
        .from("exercises")
        .insert(newExercise)
        .select()

      if (error) throw new Error(error.message);

      if (data!==null)
      {
        AllExercises.value?.push(data[0]);
      } // Add to local state

    } catch (error) {
      console.error("Error updating exercise:", error);
    }
  }

  return {
    AllExercises,
    ActiveExercises,
    DraftedExercises,
    Exercise,
    getAllExercises,
    updateExercise,
    fetchExercise,
    createExercise
  };
});
