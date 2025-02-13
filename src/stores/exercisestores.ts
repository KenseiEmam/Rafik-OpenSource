import { ref } from "vue";
import { defineStore } from "pinia";
import { supabase } from "../lib/supabaseClient";
import Swal from "sweetalert2";
import router from "@/router";

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
  const PersonalExercises = ref<Exercise[] | null>(null);
  const AllExercises = ref<Exercise[] | null>(null);
  const PublicExercises = ref<Exercise[] | null>(null);
  const AlternateExercises = ref<Exercise[] | null>(null);
  const Exercise = ref<Exercise>();

  const getUserID = () => localStorage.getItem("UserID");

  // Success and Error Alerts
  function showSuccess(message: string) {
    Swal.fire({
      title: "Success!",
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
    if (!UserID) {
      showError("No user ID found in localStorage.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("exercises")
        .select()
        .or(`trainer_id.eq.${UserID},trainer_id.is.null`);

      if (error) throw error;

      AllExercises.value = data || [];
      PersonalExercises.value = data.filter((ex) => ex.trainer_id === UserID);
      PublicExercises.value = data.filter((ex) => ex.trainer_id === null);
    } catch (error: any) {
      showError("Failed to load exercises: " + error.message);
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
        PersonalExercises.value?.push(data[0]);
        AllExercises.value?.push(data[0]);

        showSuccess("Exercise created successfully!");

        // Delay opening the URL slightly for better UX
        setTimeout(() => {
          window.open(
            `http://localhost:5173/dashboard/exercises/personal/${data[0].id}`,
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
      PersonalExercises.value = data.filter((ex) => ex.trainer_id === UserID);
      PublicExercises.value = data.filter((ex) => ex.trainer_id === null);
    } catch (error) {
      showError("Error fetching relevant exercises.");
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
    fetchPersonalExercise,
    fetchPublicExercise,
    createExercise,
    fetchRelevantExercises,
  };
});
