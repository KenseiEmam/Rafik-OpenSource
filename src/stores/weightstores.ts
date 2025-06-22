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
      background: "#132e3d",
      color: "#ececec",
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
      background:"#132e3d",
      color:"#ececec",
  });
}

type Weight = {
  id:number;
  profile_id:number;
  created_at: Date;
  weight:number;
  goal_weight?:number;
  previous?:number;
  image?:string;
};
export const useWeightStore = defineStore('Weight', () => {

  const AllWeights = ref<Weight[]>([]); // Ensure it's typed as an array
  const Count = ref<number>(0);



  async function getAllWeights(id: number, page: number, pageSize: number) {
    try {


      const start = (page - 1) * pageSize;
      const end = page * pageSize - 1;

      // Fetch the user profile based on the provided user ID (id)
      const { data:Weight_data, error, count } = await supabase
        .from('weights')
        .select('*', { count: 'exact' })
        .eq('profile_id', id)
        .order('created_at', { ascending: false })
        .range(start, end); // Most recent first
      if (error) throw error



      AllWeights.value = Weight_data
      if (count) Count.value = count;
      return AllWeights.value;

    } catch (error: any) {
      console.error(error);
      showError(`Failed to load Weights: ${error.message || 'Unknown error'}`);
      return null;
    }
  }



  return { AllWeights, Count, getAllWeights }
})
