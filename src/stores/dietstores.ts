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
};
type Diet = {
  id:number;
  profile_id:number;
  client_id:number;
  workout_id?:Date;
  date_logged?:Date;
  breakfast?:any[];
  lunch?:any[];
  dinner?:any[];
  supper?:any[];
  breakfast_macros?:number[];
  lunch_macros?:number[];
  dinner_macros?:number[];
  supper_macros?:number[];
  overall_macros?:number[];
  goal_macros?:number[];
  workout_details?: any | null; // Store the workout details here
};
export const useDietStore = defineStore('Diet', () => {

  const AllDiets = ref<Diet[]>([]); // Ensure it's typed as an array
  const Diet = ref<Diet | null>(null); // Ensure Diet can be null

  async function getDiet(id: string) {
    try {
      // Fetch the diet sheet based on the provided ID
      const { data: diet_data, error } = await supabase
        .from('nutritional_sheets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch the user ID from the profiles table
      const { data: client, error: errorProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', diet_data.profile_id)
        .single();

      if (errorProfile) throw errorProfile;

      // Initialize Diet object with the client ID
      let dietRecord: Diet = { client_id: client?.user_id, ...diet_data };

      // Check for a matching workout based on the date_logged field
      if (diet_data.date_logged) {
        const { data: workout_data, error: workoutError } = await supabase
          .from('workout_sheets')
          .select('*')
          .eq('created_for_date', diet_data.date_logged)
          .single();

        if (workoutError && workoutError.code !== 'PGRST116') throw workoutError; // Ignore "No rows found" error

        if (workout_data) {
          dietRecord.workout_details = workout_data;
        }
      }

      Diet.value = dietRecord;
      return Diet.value;

    } catch (error: any) {
      console.error(error);
      showError(`Failed to load diet: ${error.message || 'Unknown error'}`);
      return null;
    }
  }

  async function getAllDiets(id: number) {
    try {
      // Fetch the user profile based on the provided user ID (id)
      const { data:diet_data, error } = await supabase
        .from('nutritional_sheets')
        .select('*')
        .eq('profile_id', id)
        .order('created_at', { ascending: false }); // Most recent first
      if (error) throw error



      AllDiets.value = diet_data

      return AllDiets.value;

    } catch (error: any) {
      console.error(error);
      showError(`Failed to load diets: ${error.message || 'Unknown error'}`);
      return null;
    }
  }



  return { Diet, AllDiets, getDiet, getAllDiets }
})
