import { ref} from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'
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


export const useNationalStore = defineStore('Nationality', () => {

  const Nationalities = ref<any[]>([]); // Ensure Diet can be null



  async function getNationalities() {
    try {
      // Fetch the user profile based on the provided user ID (id)
      const { data:country, error } = await supabase
        .from('nationalities')
        .select('*')
      if (error) throw error



      Nationalities.value = country

      return Nationalities.value;

    } catch (error: any) {
      console.error(error);
      showError(`Failed to load nationalities: ${error.message || 'Unknown error'}`);
      return null;
    }
  }



  return { getNationalities, Nationalities }
})
