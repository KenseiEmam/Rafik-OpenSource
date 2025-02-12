import { ref } from 'vue';
import { defineStore } from 'pinia';
import { supabase } from '../lib/supabaseClient';

// Define the Exercise type
type Exercise = {
  id: string;
  exercise_name?: string;
  exercise_detail?: string;
  prime?: string[];
  synergist?: string[];
  antagonist?: string[];
  type?: string;
  rest?: number;
  safety?: string[];
  steps?: string[];
  equipment?: string[];
  media?: string;
  embeds?: number[];
  cues?: string[];
  alternatives?: string[];
  trainer_id?: string | null; // Used to differentiate Personal and Public exercises
};

export const useExerciseStore = defineStore('Exercise', () => {
  const PersonalExercises = ref<Exercise[] | null>(null);
  const AllExercises = ref<Exercise[] | null>(null);
  const PublicExercises = ref<Exercise[] | null>(null);
  const AlternateExercises = ref<Exercise[] | null>(null);
  const Exercise = ref<Exercise>();

  const getUserID = () => localStorage.getItem('UserID');

  // Fetch all exercises and separate them into Personal and Public
  async function getAllExercises() {
    const UserID = getUserID();
    if (!UserID) {
      console.warn('No user ID found in localStorage.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('exercises')
        .select()
        .or(`trainer_id.eq.${UserID},trainer_id.is.null`);

      if (error) throw error;
      AllExercises.value = data || [];
      // Separate exercises into Personal and Public
      PersonalExercises.value = data.filter(ex => ex.trainer_id === UserID);
      PublicExercises.value = data.filter(ex => ex.trainer_id === null);

      return { personal: PersonalExercises.value, public: PublicExercises.value };
    } catch (error: any) {
      console.error('Failed to load exercises:', error.message);
    }
  }

  // Fetch a single exercise by ID
  async function fetchExercise(id: string) {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select()
        .eq('id', id)
        .single();

      if (error) throw error;

      Exercise.value = data;
    } catch (error) {
      console.error('Error fetching exercise:', error);
    }
  }

  // Update an exercise (only if it's personal)
  async function updateExercise(updateData: Exercise) {
    const UserID = getUserID();
    if (!UserID || (updateData.trainer_id !== UserID && updateData.trainer_id  ) ) {
      console.warn('Unauthorized update attempt.');
      return;
    }

    try {
      const { error } = await supabase
        .from('exercises')
        .update(updateData)
        .eq('id', updateData.id);

      if (error) throw error;

      // Update local state if necessary
      if (Exercise.value?.id === updateData.id) {
        Object.assign(Exercise.value, updateData);
      }
    } catch (error) {
      console.error('Error updating exercise:', error);
    }
  }

  // Create a new Personal Exercise
  async function createExercise(newExercise: Exercise) {
    const UserID = getUserID();
    if (!UserID) {
      console.warn('No user ID found. Cannot create exercise.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('exercises')
        .insert({ ...newExercise, trainer_id: UserID })
        .select();

      if (error) throw error;

      if (data !== null) {
        PersonalExercises.value?.push(data[0]);
      }
    } catch (error) {
      console.error('Error creating exercise:', error);
    }
  }
  async function fetchExercisesByIds(ids: string[]) {
    if (!ids || ids.length === 0) {
      console.warn('No exercise IDs provided.');
      AlternateExercises.value = [];
      return;
    }

    try {
      const { data, error } = await supabase
        .from('exercises')
        .select()
        .in('id', ids);

      if (error) throw error;

      AlternateExercises.value = data;
    } catch (error) {
      console.error('Error fetching exercises by IDs:', error);
    }
  }
  // Search exercises across both Personal and Public
  async function fetchRelevantExercises(searchQuery: string) {
    const UserID = getUserID();
    if (!UserID) {
      console.warn('No user ID found in localStorage.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('exercises')
        .select()
        .or(`trainer_id.eq.${UserID},trainer_id.is.null`)
        .ilike('exercise_name', `%${searchQuery}%`);

      if (error) throw error;
      AllExercises.value = data || [];
      PersonalExercises.value = data.filter(ex => ex.trainer_id === UserID);
      PublicExercises.value = data.filter(ex => ex.trainer_id === null);
    } catch (error) {
      console.error('Error fetching relevant exercises:', error);
    }
  }

  return {
    AllExercises,
    AlternateExercises,
    PersonalExercises,
    PublicExercises,
    Exercise,
    fetchExercisesByIds,
    getAllExercises,
    updateExercise,
    fetchExercise,
    createExercise,
    fetchRelevantExercises,
  };
});
