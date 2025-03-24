import { ref } from "vue";
import { defineStore } from "pinia";
import { supabase } from "../lib/supabaseClient";
import Swal from "sweetalert2";
import router from "@/router";
import { useUserStore } from "./user";
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

export const useExerciseStore = defineStore("Exercise", () => {
  const AllExercises = ref<Exercise[] | null>(null);
  const AlternateExercises = ref<Exercise[] | null>(null);
  const Exercise = ref<Exercise>();
  const Count = ref<number | null>()
  const userStore = useUserStore()
  const getUserID = () => localStorage.getItem("UserID");

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

  function showError(message: string) {
    Swal.fire({
      title: "Error!",
      text: message,
      icon: "error",
      confirmButtonColor: "#d33",
      background: "#081411",
      color: "#E8F3ED",
    });
  }

  // Fetch all exercises and separate them into Personal and Public
  async function getAllExercises() {
    const UserID = getUserID();
    if (!UserID ) {
      showError("No user ID found in localStorage.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("exercises")
        .select()
        .limit(9)
        .or(`trainer_id.eq.${UserID},trainer_id.is.null`);

      if (error) throw error;

      AllExercises.value = data || [];
    } catch (error: any) {
      showError("Failed to load exercises: " + error.message);
    }
  }
  // Fetch exercises by page and separate them into Personal and Public
async function getPageExercises(page: number, filter:string) {
  const UserID = getUserID();
  if (!UserID) {
    showError("No user ID found in localStorage.");
    return;
  }

  const start = (page - 1) * 9;
  const end = (page * 9) - 1;
  switch (filter){
    case 'public':
      try {
        const { data, count, error } = await supabase
          .from("exercises")
          .select("*", { count: "exact" }) // Include exact row count
          .range(start, end)
          .is('trainer_id', null)

        if (error) throw error;


      AllExercises.value = data || [];

      Count.value = count || 0; // Ensure count is assigned properly
      } catch (error) {
        showError("Error fetching relevant public exercises.");
      }
      break;
    case 'private':
      try {
        const { data, count, error } = await supabase
          .from("exercises")
          .select("*", { count: "exact" }) // Include exact row count
          .range(start, end)
          .eq('trainer_id', UserID)

        if (error) throw error;


      AllExercises.value = data || [];

      Count.value = count || 0; // Ensure count is assigned properly
      } catch (error) {
        showError("Error fetching relevant private exercises.");
      }
      break;
    default:
      try {
        const { data, count, error } = await supabase
          .from("exercises")
          .select("*", { count: "exact" }) // Include exact row count
          .range(start, end)
          .or(`trainer_id.eq.${UserID},trainer_id.is.null`)

        if (error) throw error;


      AllExercises.value = data || [];

      Count.value = count || 0; // Ensure count is assigned properly
      } catch (error) {
        showError("Error fetching all relevant exercises.");
      }
      break;
  }
}

  // Fetch a single personal exercise by ID
  async function fetchPersonalExercise(id: string) {
    const UserID = getUserID();
    if (!UserID) {
      showError("No user ID found in localStorage.");
      return;
    }
    try {

      const { data, error } = await supabase
        .from("exercises")
        .select()
        .eq("id", id)
        .eq("trainer_id",UserID)
        .single();

      if (error) throw error;

      Exercise.value = data;
    } catch (error:any) {
      Swal.fire({
        title: "Whoops",
        text: "No exercise found",
        icon: "error",
        confirmButtonColor: "#d33",
        background: "#081411",
        color: "#E8F3ED",
      }).then(()=>{
        router.push({name:'programs-list'})
      });
    }
  }

// Fetch a single public exercise by ID
async function fetchPublicExercise(id: string) {
  try {

    const { data, error } = await supabase
      .from("exercises")
      .select()
      .eq("id", id)
      .is("trainer_id",null)
      .single();

    if (error) throw error;

    Exercise.value = data;
  } catch (error) {
    showError("Error fetching exercise.");
  }
}
  // Update an exercise (only if it's personal)
  async function updateExercise(updateData: Exercise) {
    const UserID = getUserID();
    if (!UserID || (updateData.trainer_id !== UserID && updateData.trainer_id)) {
      showError("Unauthorized update attempt.");
      return;
    }

    try {
      const { error } = await supabase
        .from("exercises")
        .update(updateData)
        .eq("id", updateData.id);

      if (error) throw error;

      // Update local state if necessary
      if (Exercise.value?.id === updateData.id) {
        Object.assign(Exercise.value, updateData);
      }

      showSuccess("Exercise updated successfully!");
    } catch (error) {
      showError("Error updating exercise.");
    }
  }

  // Create a new Personal Exercise
  async function createExercise(newExercise: Exercise) {
    const UserID = getUserID();
    if (!UserID) {
      showError("No user ID found. Cannot create exercise.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("exercises")
        .insert({ ...newExercise, trainer_id: UserID })
        .select();

      if (error) throw error;
      console.log(data)
      if (data !== null) {
        AllExercises.value?.push(data[0]);

        showSuccess("Exercise created successfully!");

        // Delay opening the URL slightly for better UX
        setTimeout(() => {
          window.open(
            `http://rafikapp.ae/dashboard/exercises/personal/${data[0].id}`,
            "_blank"
          );
        }, 500);
      }
      else{
        showError("No data recieved!");
      }
    } catch (error) {
      showError("Error creating exercise.");
    }
  }
  async function createDupe(newExercise: Exercise) {
    const UserID = getUserID();

    if (!UserID || !userStore.userProfile?.first_name) {
      showError("User information missing.");
      return;
    }

    try {
      // Remove the `id` field if it exists
      const { id, ...exerciseWithoutId } = newExercise;

      const { data, error } = await supabase
        .from("exercises")
        .insert({
          ...exerciseWithoutId,
          exercise_name: `${userStore.userProfile.first_name}'s Copy of ${newExercise.exercise_name}`,
          trainer_id: UserID,
        })
        .select();

      if (error) throw error;

      console.log(data);

      if (data && data.length > 0) {
        AllExercises.value?.push(data[0]);

        showSuccess("Exercise duplicated successfully!");

        // Delay opening the URL slightly for better UX
        setTimeout(() => {
          window.open(
            `http://rafikapp.ae/dashboard/exercises/personal/${data[0].id}`,
            "_blank"
          );
        }, 500);
      } else {
        showError("No data received!");
      }
    } catch (error) {
      showError("Error duplicating exercise.");
    }
  }


  // Delete a Personal Exercise
  async function deleteExercise(id: String) {
    const UserID = getUserID();
    if (!UserID) {
      showError("No user ID found. Cannot create exercise.");
      return;
    }

    try {
      const {error } = await supabase
        .from("exercises")
        .delete()
        .eq('id',id)
        .eq('trainer_id', UserID);

      if (error) throw error;
        showSuccess("Exercise deleted successfully!");
          // Delay opening the URL slightly for better UX
          setTimeout(() => {
            router.push({name:'programs-list'})
          }, 500);
    } catch (error) {
      showError("Error deleting exercise.");
    }
  }

  // Fetch exercises by IDs
  async function fetchExercisesByIds(ids: string[]) {
    if (!ids || ids.length === 0) {
      AlternateExercises.value = [];
      return;
    }

    try {
      const { data, error } = await supabase
        .from("exercises")
        .select()
        .in("id", ids);

      if (error) throw error;

      AlternateExercises.value = data;
    } catch (error) {
      showError("Error fetching exercises by IDs.");
    }
  }

  // Search exercises across both Personal and Public
  async function fetchRelevantExercises(searchQuery: string) {
    const UserID = getUserID();
    if (!UserID) {
      showError("No user ID found in localStorage.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("exercises")
        .select()
        .or(`trainer_id.eq.${UserID},trainer_id.is.null`)
        .ilike("exercise_name", `%${searchQuery}%`);

      if (error) throw error;

      AllExercises.value = data || [];
    } catch (error) {
      showError("Error fetching relevant exercises.");
    }
  }

  // Search exercises across both Personal and Public with Pagination
  async function fetchRelevantExercisesPage(searchQuery: string, page: number, filter:string) {
    const UserID = getUserID();
    if (!UserID) {
      showError("No user ID found in localStorage.");
      return;
    }
    const start = (page - 1) * 9;
    const end = (page * 9) - 1;
    switch (filter){
      case 'public':
        try {
          const { data, count, error } = await supabase
            .from("exercises")
            .select("*", { count: "exact" }) // Include exact row count
            .range(start, end)
            .is('trainer_id', null)
            .ilike("exercise_name", `%${searchQuery}%`);

          if (error) throw error;


        AllExercises.value = data || [];

        Count.value = count || 0; // Ensure count is assigned properly
        } catch (error) {
          showError("Error fetching relevant public exercises.");
        }
        break;
      case 'private':
        try {
          const { data, count, error } = await supabase
            .from("exercises")
            .select("*", { count: "exact" }) // Include exact row count
            .range(start, end)
            .eq('trainer_id', UserID)
            .ilike("exercise_name", `%${searchQuery}%`);

          if (error) throw error;


        AllExercises.value = data || [];

        Count.value = count || 0; // Ensure count is assigned properly
        } catch (error) {
          showError("Error fetching relevant private exercises.");
        }
        break;
      default:
        try {
          const { data, count, error } = await supabase
            .from("exercises")
            .select("*", { count: "exact" }) // Include exact row count
            .range(start, end)
            .or(`trainer_id.eq.${UserID},trainer_id.is.null`)
            .ilike("exercise_name", `%${searchQuery}%`);

          if (error) throw error;


        AllExercises.value = data || [];

        Count.value = count || 0; // Ensure count is assigned properly
        } catch (error) {
          showError("Error fetching all relevant exercises.");
        }
        break;
    }
  }
  return {
    AllExercises,
    AlternateExercises,
    Exercise,
    Count,
    fetchExercisesByIds,
    deleteExercise,
    getAllExercises,
    getPageExercises,
    updateExercise,
    fetchPersonalExercise,
    fetchPublicExercise,
    createExercise,
    createDupe,
    fetchRelevantExercises,
    fetchRelevantExercisesPage
  };
});
