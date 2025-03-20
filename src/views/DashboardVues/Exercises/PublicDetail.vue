<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useExerciseStore } from "@/stores/exercisestores";
import Swal from 'sweetalert2';
import ExcerciseMovers from "@/components/ExerciseTabs/ExcerciseMovers.vue";
import TechTips from "@/components/ExerciseTabs/TechTips.vue";
import EquipReq from "@/components/ExerciseTabs/EquipReq.vue";
import ExerciseAlt from "@/components/ExerciseTabs/ExerciseAlt.vue";

const activeTab = ref("Muscles");
function setActiveTab(tab: string) {
  activeTab.value = tab;
}

const route = useRoute();
const exerciseStore = useExerciseStore();




// Success and Error Alerts
function showSuccess(message: string) {
  Swal.fire({
    title: "Success!",
showConfirmButton:false,
timerProgressBar:true,
timer:1500,
    text: message,
    toast:true,
    position:'top-right',
    icon: "success",
    confirmButtonColor: "#CB901C",
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
// ✅ Function to activate the program with confirmation
function DupeExercise() {
  Swal.fire({
    title: "Duplicate Exercise?",
    text: "A duplicate of this exercise will be created and added to your list of custom exercises.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Duplicate this Exercise",
    confirmButtonColor: "#CB901C",
    cancelButtonColor: "#d33",
      background:"#081411",
      color:"#E8F3ED",
  }).then((result) => {
    if (result.isConfirmed && exerciseStore.Exercise) {
      exerciseStore.createDupe(exerciseStore.Exercise)
    }
  });
}

onMounted(() => {
  const exerciseId = route.params.id as string;
  if (exerciseId) {
    exerciseStore.fetchPublicExercise(exerciseId).then(()=>{
      if(exerciseStore.Exercise?.alternatives){

        exerciseStore.fetchExercisesByIds(exerciseStore.Exercise?.alternatives)
      }
    }).catch(() => {
      showError("Failed to load exercise details.");
    });
  }
});
</script>

<template>
  <div class="flex h-screen overflow-auto">
    <div v-if="exerciseStore.Exercise && exerciseStore.AlternateExercises" class="flex-1 px-8 py-12 w-full 2xl:px-12 2xl:py-24 space-y-8 2xl:space-y-10">
      <div class="flex gap-6 items-end wrap ">
        <video v-if="exerciseStore.Exercise.media"
              :src="exerciseStore.Exercise.media"
              alt="Uploaded Preview"
              class="h-96 w-128 border-rafik-sectext dark:border-rafik-darksectext border-2 object-cover rounded-lg mx-auto"
              controls
            ></video>
        <div v-else class="h-96 w-128 card flex items-center flex-col gap-6 justify-center">
          <h3 class="header-large">:/</h3>
          <p>No Video Available</p>
        </div>

        <div class="pr-6 space-y-4 w-1/2 flex flex-col items-start justify-end">
            <div class="flex items-center justify-between">
              <h1
                class="title-small cursor-text"
              >
                {{ exerciseStore.Exercise?.exercise_name || "Loading..." }}
              </h1>
            </div>
            <h3 class="header-small">{{  exerciseStore.Exercise?.type || "Loading..." }}</h3>
            <p
              class="text-body text-justify 2xl:w-5/6 cursor-text"
            >
              {{ exerciseStore.Exercise?.exercise_detail || "Loading..." }}
            </p>
        </div>
        <div class="pl-6 flex-1 min-w-max border-l  border-rafik-sectext dark:border-rafik-darksectext">
            <div class="flex flex-col flex-1 h-96 justify-center gap-4 border-rafik-sectext dark:border-rafik-darksectext text-left">
              <!-- <button class="text-body uppercase text-left hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darkpritext">View Language</button> -->
              <button
                @click="DupeExercise"
                class="text-body uppercase text-left hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darkpritext"
              >
                Duplicate Exercise
              </button>
            </div>
        </div>
      </div>
      <div class="flex  gap-8 2xl:gap-16 items-center pb-2 border-b border-rafik-sectext dark:border-rafik-darksectext">
        <button
          :class="activeTab === 'Muscles' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'"
          class="nav-btn "
          @click="setActiveTab('Muscles')"
        >
          Muscles Worked
        </button>
        <button
          :class="activeTab === 'Tips and Technique' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'"
          class="nav-btn uppercase "
          @click="setActiveTab('Tips and Technique')"
        >
          Tips and Technique
        </button>
        <button
          :class="activeTab === 'Equipment' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'"
          class="nav-btn uppercase "
          @click="setActiveTab('Equipment')"
        >
          Equipment Required
        </button>
        <button
          :class="activeTab === 'Alternatives' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'"
          class="nav-btn uppercase "
          @click="setActiveTab('Alternatives')"
        >
          Alternatives
        </button>
      </div>
      <div style="min-height: 50vh;" class=" over-flow-y-auto flex-1">
        <transition name="fade">
          <ExcerciseMovers
            :personal="false"
            :exercise="exerciseStore.Exercise"
            v-if="activeTab === 'Muscles'"
          />
          <TechTips
            :personal="false"
            :exercise="exerciseStore.Exercise"
            v-else-if="activeTab === 'Tips and Technique'"
          />
          <EquipReq
          :personal="false"
            :exercise="exerciseStore.Exercise"
            v-else-if="activeTab === 'Equipment'"/>
          <ExerciseAlt
          :exercise="exerciseStore.Exercise"
          :alternatives="exerciseStore.AlternateExercises"
          :personal="false"
          v-else-if="activeTab === 'Alternatives'"/>
        </transition>

      </div>
    </div>
  </div>
</template>
