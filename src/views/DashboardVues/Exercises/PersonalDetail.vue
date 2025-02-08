<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useExerciseStore } from "@/stores/exercisestores";
import ViewExercise from "@/components/ViewExercise.vue";
import Swal from 'sweetalert2'
import router from "@/router";

const activeTab = ref("Muscles");
// Change active tab handler
function setActiveTab(tab: string) {
  activeTab.value = tab;
}


// Access the route object
const route = useRoute();
const exerciseStore = useExerciseStore();

// States for editing
const isEditing = ref(false);
// States for editing
const isEditingTitle = ref(false);
const isEditingDescription = ref(false);
const types = ref(['isolation','stretch', 'bodyweight', 'compound', 'cardio', 'plyometric'])
const editableTitle = ref("");
const editableDescription = ref("");


// Function to refresh the route/component
function refreshComponent() {
  router.go(0); // This reloads the current route
}
// Edit handlers
function editTitle() {
  isEditingTitle.value = true;
  editableTitle.value = exerciseStore.Exercise?.exercise_name || "";
}


function editDescription() {
  isEditingDescription.value = true;
  editableDescription.value = exerciseStore.Exercise?.exercise_detail || "";
}

// Save handlers
async function saveTitle() {
  isEditingTitle.value = false;
  if (editableTitle.value !== exerciseStore.Exercise?.exercise_name && exerciseStore.Exercise) {
    try {
      await exerciseStore.updateExercise({
        id: exerciseStore.Exercise.id,
        exercise_name: editableTitle.value,
      });
    } catch (error) {
      console.error("Error updating title:", error);
    }
  }
}

async function saveDescription() {
  isEditingDescription.value = false;
  if (editableDescription.value !== exerciseStore.Exercise?.exercise_detail && exerciseStore.Exercise) {
    try {
      await exerciseStore.updateExercise({
        id: exerciseStore.Exercise.id,
        exercise_detail: editableDescription.value,
      });
    } catch (error) {
      console.error("Error updating description:", error);
    }
  }
}
// Function to show success alerts
function showSuccess(message: string) {
  Swal.fire({
    title: "Success!",
    text: message,
    icon: "success",
    confirmButtonColor: "#CB901C",
      cancelButtonColor: "#d33",
      background:"#081411",
      color:"#E8F3ED",
  }) // Refresh after success
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

// Fetch the program when the component mounts
onMounted(() => {
  const exerciseId = route.params.id as string;
  if (exerciseId) {
    exerciseStore.fetchExercise(exerciseId).catch(() => {
      showError("Failed to load exercise details.");
    });
  }
});

</script>

<template>
  <div class="flex h-screen overflow-auto">
    <div v-if="exerciseStore.Exercise" class="flex-1 px-8 py-12 w-full 2xl:px-12 2xl:py-24 space-y-8 xl:space-y-10">
      <div class="flex gap-6 items-end wrap ">
        <div class="min-h-96 w-128 card content "></div>
        <div class="pr-6 space-y-4 w-1/2 flex flex-col items-start justify-end">
            <div class="flex items-center justify-between">
              <!-- Editable Title -->
              <input
                v-if="isEditingTitle"
                v-model="editableTitle"
                @blur="saveTitle"
                @keyup.enter="saveTitle"
                class="title-small bg-transparent border-b border-rafik-sectext focus:outline-none"
                type="text"
                :placeholder="exerciseStore.Exercise?.exercise_name || 'Loading...'"
              />
              <h1
                v-else
                class="title-small hover:opacity-70 cursor-text"
                @click="editTitle"
              >
                {{ exerciseStore.Exercise?.exercise_name || "Loading..." }}
              </h1>
            </div>

            <!-- Editable Description -->
            <textarea
              v-if="isEditingDescription"
              v-model="editableDescription"
              @blur="saveDescription"
              @keyup.enter="saveDescription"
              cols="3"
              class="text-body 2xl:w-5/6 bg-transparent border-b border-rafik-sectext focus:outline-none"
              :placeholder="exerciseStore.Exercise?.exercise_detail || 'Loading...'"
            ></textarea>
            <p
              v-else
              class="text-body text-justify hover:opacity-70 2xl:w-5/6 cursor-text"
              @click="editDescription"
            >
              {{ exerciseStore.Exercise?.exercise_detail || "Loading..." }}
            </p>
            <div class=" grid grid-cols-3 2xl:grid-cols-6 gap-4">
              <div v-for="type,index in types" :key="index">
                <button :class="exerciseStore.Exercise.type?.toLocaleLowerCase() === type ?'border-rafik-pritext text-rafik-pritext border-2':' border border-rafik-sectext opacity-80 hover:opacity-100'" class="w-32 h-32 text-xs rounded-xl font-bold flex items-center justify-center   bg-rafik-pribg uppercase">{{ type }}</button>
              </div>
            </div>
        </div>
        <div class="pl-6 flex-1 min-w-max border-l  border-rafik-sectext">
            <div class="flex flex-col flex-1 h-96 justify-center gap-4 border-rafik-sectext text-left">
              <button class="text-body uppercase text-left hover:text-rafik-pritext">View Language</button>
              <button

                class="text-body uppercase text-left hover:text-rafik-pritext"

              >
                Import Template
              </button>
              <button class="text-body uppercase text-red-500 hover:text-red-400 text-left">Delete Exercise</button>
            </div>
        </div>
      </div>
      <div class="flex  gap-8 2xl:gap-16 items-center pb-2 border-b border-rafik-sectext">
        <button
          :class="activeTab === 'Muscles' ? 'text-rafik-pritext cursor-default' : ' hover:opacity-70'"
          class="nav-btn "
          @click="setActiveTab('Muscles')"
        >
          Muscles Worked
        </button>
        <button
          :class="activeTab === 'Tips and Technique' ? 'text-rafik-pritext cursor-default' : ' hover:opacity-70'"
          class="nav-btn uppercase "
          @click="setActiveTab('Tips and Technique')"
        >
          Tips and Technique
        </button>
        <button
          :class="activeTab === 'Equipment' ? 'text-rafik-pritext cursor-default' : ' hover:opacity-70'"
          class="nav-btn uppercase "
          @click="setActiveTab('Equipment')"
        >
          Equipment Required
        </button>
        <button
          :class="activeTab === 'Alternatives' ? 'text-rafik-pritext cursor-default' : ' hover:opacity-70'"
          class="nav-btn uppercase "
          @click="setActiveTab('Alternatives')"
        >
          Alternatives
        </button>
        <button
          :class="activeTab === 'Programs Featured' ? 'text-rafik-pritext cursor-default' : ' hover:opacity-70'"
          class="nav-btn uppercase "
          @click="setActiveTab('Programs Featured')"
        >
          Programs Featured
        </button>
      </div>
    </div>
  </div>
</template>
