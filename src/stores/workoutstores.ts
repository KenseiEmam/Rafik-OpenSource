import { ref} from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'
import router from '@/router'
import Swal from "sweetalert2"
// Success and Error Alerts
  function showSuccess(message: string) {
    Swal.fire({
      title: "Success!",
      showConfirmButton:false,
      timerProgressBar:true,
      timer:1500,
      text: message,
      toast: true,
      position: "top-right",
      icon: "success",
      background: "#081411",
      color: "#E8F3ED",
    });
  }

  // Function to show error alerts
function showError(message: string) {
  Swal.fire({
    title: "Error!",
    text: message,
    icon: "error",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#d33",
      background:"#081411",
      color:"#E8F3ED",
  });
}

type Exercise = {
  id: string;
  exercise_name?: string;
  type?: string;
  intensity?: string;
  sets?: number;
  reps?: number;
  true_sets?:any[];
};
type Workout = {
  id:number;
  workout_name: string;
  workout_summary?: string;
  time_to_complete?: string;
  sets_per_session?: number;
  rest_day?: boolean;
  predicted_intensity?:number;
  average_volume?:number;
  average_intensity?:number;
  exercises: Exercise[];
  week_of_program?:number;
  iteration?: number;
  created_at?:Date;
  date_started?:Date;
  date_completed?:Date;
  feel?:number;
  sets_muscle?:any[];
  client_id?:number;
  done?:boolean;
  program_name?:string;
  user_program_id?:number;
};
export const useWorkoutStore = defineStore('Workout', () => {

  const AllWorkouts = ref<Workout[]>([]); // Ensure it's typed as an array
  const Workout = ref<Workout | null>(null); // Ensure Workout can be null


  async function getWorkout(id: string) {
    try {
      // Fetch the workout based on the provided  ID (id)
      const { data:workout_data, error } = await supabase
        .from('workout_sheets')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error

      // Fetch user_programs where user_program matches the given id
      const { data: uprogram, error: programError } = await supabase
        .from('user_programs')
        .select('*')
        .eq('id', workout_data.user_program_id)
        .single();

      if (programError) {
        throw new Error(`Error fetching user programs: ${programError.message}`);
      }
      // Fetch user_programs where user_program matches the given id
      const { data: program_data, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .eq('id', uprogram.program_id)
        .single();

      if (programsError) {
        throw new Error(`Error fetching parentprograms: ${programsError.message}`);
      }

      Workout.value = {...workout_data, program_name:program_data.program_name }

      return Workout.value;

    } catch (error: any) {
      console.error(error);
      showError(`Failed to load workout: ${error.message || 'Unknown error'}`);
      return null;
    }
  }

  async function getAllWorkouts(id: number) {
    try {
      const { data: workout_data, error } = await supabase
      .from('workout_sheets')
      .select('*')
      .eq('done', true)
      .eq('user_program_id', id)
      .order('created_at', { ascending: false }); // Most recent first

    if (error) throw error;



      AllWorkouts.value = workout_data

      return AllWorkouts.value;

    } catch (error: any) {
      console.error(error);
      showError(`Failed to load workouts: ${error.message || 'Unknown error'}`);
      return null;
    }
  }



  return { Workout, AllWorkouts, getWorkout, getAllWorkouts }
})
