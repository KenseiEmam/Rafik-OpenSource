<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import { useProgramStore } from "@/stores/programstores";
import DetailsTabProgram from "@/components/ProgramTabs/DetailsTabPRogram.vue";
import WorkoutPlanner from "@/components/ProgramTabs/WorkoutPlanner.vue";
import ClientTable from "@/components/ProgramTabs/ClientTable.vue"
import PricingModel from "@/components/ProgramTabs/PricingModel.vue"
import DocumentsForms from "@/components/ProgramTabs/DocumentsForms.vue";
import ReviewsTab from "@/components/ProgramTabs/ReviewsTab.vue";
import Swal from 'sweetalert2'
import router from "@/router";
import { supabase } from "@/lib/supabaseClient";

const activeTab = ref("Details");

interface Question  {
  type:string;
  question?:string;
  answer?:any;
}
type PromoCode={
  code:string,
  value:number,
}

// Access the route object
const route = useRoute();
const programStore = useProgramStore();

// States for editing
const isEditingTitle = ref(false);
const isEditingDescription = ref(false);
const editableTitle = ref("");
const editableDescription = ref("");


// Edit handlers
function editTitle() {
  isEditingTitle.value = true;
  editableTitle.value = programStore.Program?.program_name || "";
}

// Change active tab handler
function setActiveTab(tab: string) {
  activeTab.value = tab;
}


function editDescription() {
  isEditingDescription.value = true;
  editableDescription.value = programStore.Program?.program_description || "";
}

// Save handlers
async function saveTitle() {
  isEditingTitle.value = false;
  if (editableTitle.value !== programStore.Program?.program_name && programStore.Program) {
    try {
      await programStore.updateProgram({
        id: programStore.Program.id,
        program_name: editableTitle.value,
      });
    } catch (error) {
      console.error("Error updating title:", error);
    }
  }
}

async function saveDescription() {
  isEditingDescription.value = false;
  if (editableDescription.value !== programStore.Program?.program_description && programStore.Program) {
    try {
      await programStore.updateProgram({
        id: programStore.Program.id,
        program_description: editableDescription.value,
      });
    } catch (error) {
      console.error("Error updating description:", error);
    }
  }
}

// Function to refresh the route/component
function refreshComponent() {
  router.go(0); // This reloads the current route
}
// Wipe outs
onBeforeUnmount(() => {
  programStore.wipeOut();
});
// Function to show success alerts
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

// ✅ Generic function to update any program field
async function updateProgramField(field: string, value: any) {
  if (!programStore.Program) return showError("Program not found!");

  try {
    await programStore.updateProgram({
      id: programStore.Program.id,
      [field]: value,
    });

    await programStore.fetchProgram(programStore.Program.id);
    showSuccess(`${field} updated successfully!`);
  } catch (error) {
    showError(`Failed to update ${field}. Please try again.`);
    console.error(`Error updating ${field}:`, error);
  }
}

// ✅ Function to update Prices with alert handling
async function updatePrices(updatedPrices: any) {
  if (!programStore.Program) return showError("Program not found!");

  try {
    await programStore.updateProgram({
      id: programStore.Program.id,
      price_one: updatedPrices.price_one,
      price_three: updatedPrices.price_three,
      price_six: updatedPrices.price_six,
      price_year: updatedPrices.price_year,
    });

    programStore.Program.price_one = updatedPrices.price_one;
    programStore.Program.price_three = updatedPrices.price_three;
    programStore.Program.price_six = updatedPrices.price_six;
    programStore.Program.price_year = updatedPrices.price_year;

    showSuccess("Prices updated successfully!");
  } catch (error) {
    showError("Failed to update prices. Please try again.");
    console.error("Error updating Prices:", error);
  }
}

// ✅ Function to delete the program with confirmation
function DeleteProgram() {
  Swal.fire({
    title: "Are you sure?",
    text: "This will create a delete request for this program...",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    confirmButtonColor: "#CB901C",
    cancelButtonColor: "#d33",
      background:"#081411",
      color:"#E8F3ED",
  }).then((result) => {
    if (result.isConfirmed) {
      updateProgramField("status", "Deleted").then(() => {
        showSuccess("The program has been deleted.")
        refreshComponent()


      });
    }
  });
}

// ✅ Function to draft the program with confirmation
function DraftProgram() {
  Swal.fire({
    title: "Hold On?",
    text: "The program will be removed off the market...",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Set to draft",
    confirmButtonColor: "#CB901C",
    cancelButtonColor: "#d33",
      background:"#081411",
      color:"#E8F3ED",
  }).then((result) => {
    if (result.isConfirmed) {
      updateProgramField("status", "Draft").then(() => {
        showSuccess("The program has been set to draft.")
          refreshComponent()

      });
    }
  });
}

// ✅ Function to activate the program with confirmation
function ActiveProgram() {
  if(programStore.ActivePrograms?.length && programStore.ActivePrograms.length < 3)
  Swal.fire({
    title: "Activate?",
    text: "The program be set to review, once reviewed, people on the market will see it",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Activate",
    confirmButtonColor: "#CB901C",
    cancelButtonColor: "#d33",
      background:"#081411",
      color:"#E8F3ED",
  }).then((result) => {
    if (result.isConfirmed) {
      updateProgramField("status", "Active").then(() => {
        showSuccess("The program is being reviewed!")
          refreshComponent()

      });
    }
  });

  else
  showError("You cannot have more than 3 active programs! Set 1 to Draft to change this one to active!")
}

// Fetch the program when the component mounts
onMounted(() => {
  const programId = route.params.id as string;
  if (programId) {
    programStore.fetchProgram(programId).catch(() => {
      showError("Failed to load program details.");
    });
  }
});


// --- New Code for difficulty_level select dropdown ---

// Define the possible difficulty levels
const difficulties = ["Foundational", "Beginner", "Intermediate", "Advanced"];

// Initialize the selected difficulty value; fallback to the first option if not yet set
const selectedDifficulty = ref(
  programStore.Program?.difficulty_level || difficulties[0]
);

// Keep the local value in sync when the program is fetched/updated
watch(
  () => programStore.Program?.difficulty_level,
  (newVal) => {
    if (newVal) {
      selectedDifficulty.value = newVal;
    }
  }
);

// When the select changes, update the program field
function onDifficultyChange() {
  updateProgramField("difficulty_level", selectedDifficulty.value);
}

// changePhoto Function
const loading = ref(false)
const selectedFile = ref<File | null>(null)
  const uploadPhoto = async (event: Event) => {
  if (!programStore.Program) {
    showError("No program found in the store!")
    return
  }
  loading.value = true
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]

    // If there is an old photo, attempt to delete it
    if (programStore.Program.program_photo) {
      // Adjust the extraction logic below to match your storage URL structure
      try {
        const oldPhotoUrl = programStore.Program.program_photo
        // Assuming the public URL is in the format:
        // https://<supabase_url>/storage/v1/object/public/storage/media/filename
        const url = new URL(oldPhotoUrl)
        // Extract path starting with "media/"
        const pathStart = url.pathname.indexOf("media/")
        if (pathStart !== -1) {
          const oldPath = url.pathname.substring(pathStart)
          const { error: deleteError } = await supabase.storage
            .from('storage')
            .remove([oldPath])
          if (deleteError) {
            console.error("Failed to delete old photo:", deleteError)
            // Optionally, you can notify the user or decide whether to continue
          } else {
            console.log("Old photo deleted successfully")
          }
        }
      } catch (err) {
        console.error("Error deleting old photo:", err)
      }
    }

    const uploadedUrl = await uploadFileToBucket()
    if (uploadedUrl) {
      try {
        const { error } = await supabase
          .from('programs')
          .update({ program_photo: uploadedUrl })
          .eq('id', programStore.Program.id)
        if (error) throw error

        programStore.Program.program_photo = uploadedUrl
        showSuccess('Program photo updated successfully!')
      } catch (err: any) {
        console.error(err)
        showError(`Failed to update program picture: ${err.message}`)
      } finally {
        loading.value = false // Set loading to false once data is loaded
      }
    } else {
      loading.value = false
    }
  }
}

const uploadFileToBucket = async (): Promise<string | null> => {
  if (!selectedFile.value) {
    showError('Please select an image.')
    return null
  }
  try {
    const { data, error } = await supabase.storage
      .from('storage')
      .upload(`media/${Date.now()}_${selectedFile.value.name}`, selectedFile.value, {
        cacheControl: '3600',
        upsert: true,
      })
    if (error) throw error

    const { data: publicUrlData } = supabase.storage
      .from('storage')
      .getPublicUrl(data.path)
    return publicUrlData.publicUrl
  } catch (err: any) {
    console.error(err)
    showError(`Upload failed: ${err.message}`)
    return null
  }
}


</script>

<template>
  <div class="flex h-screen overflow-auto">
    <div v-if="programStore.Program" class="flex-1 px-8 py-12 w-full 2xl:px-12 2xl:py-24 space-y-3 2xl:space-y-6">
      <div class="border group flex flex-col relative border-rafik-alternate rounded-lg overflow-hidden">
        <img
        v-if="!loading"
          :src="programStore.Program.program_photo"
          class="w-full h-full object-cover absolute"
          alt=""
        />
        <div class="w-full opacity-70 h-full bg-rafik-pribg dark:bg-rafik-darkpribg absolute"></div>
        <div class="p-8 2xl:p-16 2xl:py-24 space-y-4 relative grid items-stretch  grid-cols-4 divide-x divide-rafik-sectext dark:divide-rafik-darksectext divide-x-solid">
          <div class="pr-6 space-y-4 col-span-3 ">
            <div class="flex items-center justify-between">
              <!-- Editable Title -->
              <input
                v-if="isEditingTitle"
                v-model="editableTitle"
                @blur="saveTitle"
                @keyup.enter="saveTitle"
                class="title-small w-1/3 bg-transparent border-b border-rafik-sectext dark:border-rafik-darksectext focus:outline-none"
                type="text"
                :placeholder="programStore.Program?.program_name || 'Loading...'"
              />
              <h1
                v-else
                class="title-small w-1/3 hover:opacity-70 cursor-text"
                @click="editTitle"
              >
                {{ programStore.Program?.program_name || "Loading..." }}
              </h1>
              <h2 class="header-medium">{{ programStore.Program?.status || "Loading..." }}</h2>
            </div>

            <!-- Editable Description -->
            <textarea
              v-if="isEditingDescription"
              v-model="editableDescription"
              @blur="saveDescription"
              @keyup.enter="saveDescription"
              cols="3"
              class="text-body 2xl:w-5/6 bg-transparent border-b border-rafik-sectext dark:border-rafik-darksectext focus:outline-none"
              :placeholder="programStore.Program?.program_description || 'Loading...'"
            ></textarea>
            <p
              v-else
              class="text-body text-justify hover:opacity-70 2xl:w-5/6 cursor-text"
              @click="editDescription"
            >
              {{ programStore.Program?.program_description || "Loading..." }}
            </p>
            <div class="flex gap-8 justify-between">
              <!-- Replace difficulty level text with a select dropdown -->
              <div class="uppercase flex gap-2 items-center">
                <svg xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  stroke="currentColor"
                  class="w-6 text-rafik-sectext dark:text-rafik-darksectext"
                  viewBox="0 0 448 512">
                  <path d="M160 80c0-26.5 21.5-48 48-48l32 0c26.5 0 48 21.5 48 48l0 352c0 26.5-21.5 48-48 48l-32 0c-26.5 0-48-21.5-48-48l0-352zM0 272c0-26.5 21.5-48 48-48l32 0c26.5 0 48 21.5 48 48l0 160c0 26.5-21.5 48-48 48l-32 0c-26.5 0-48-21.5-48-48L0 272zM368 96l32 0c26.5 0 48 21.5 48 48l0 288c0 26.5-21.5 48-48 48l-32 0c-26.5 0-48-21.5-48-48l0-288c0-26.5 21.5-48 48-48z"/></svg>
                <select
                  v-model="selectedDifficulty"
                  @change="onDifficultyChange"
                  class="bg-transparent border-0 text-body focus:outline-none "
                >
                  <option
                    v-for="difficulty in difficulties"
                    :key="difficulty"
                    :value="difficulty"
                    class="bg-rafik-secbg dark:bg-rafik-darksecbg"
                  >
                    {{ difficulty }}
                  </option>
                </select>
              </div>
              <h3 class=" uppercase flex gap-2 items-center ">
                <svg xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  stroke="currentColor"
                  class="w-6 text-rafik-sectext dark:text-rafik-darksectext"
                  viewBox="0 0 448 512">
                  <path d="M176 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l16 0 0 34.4C92.3 113.8 16 200 16 304c0 114.9 93.1 208 208 208s208-93.1 208-208c0-41.8-12.3-80.7-33.5-113.2l24.1-24.1c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L355.7 143c-28.1-23-62.2-38.8-99.7-44.6L256 64l16 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L224 0 176 0zm72 192l0 128c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-128c0-13.3 10.7-24 24-24s24 10.7 24 24z"/></svg>
                {{ programStore.Program.avg_session_time }} mins/session</h3>
              <h3 class=" uppercase flex gap-2 items-center ">
                <svg xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  stroke="currentColor"
                  class="w-6 text-rafik-sectext dark:text-rafik-darksectext"
                  viewBox="0 0 448 512">
                  <path d="M96 32l0 32L48 64C21.5 64 0 85.5 0 112l0 48 448 0 0-48c0-26.5-21.5-48-48-48l-48 0 0-32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 32L160 64l0-32c0-17.7-14.3-32-32-32S96 14.3 96 32zM448 192L0 192 0 464c0 26.5 21.5 48 48 48l352 0c26.5 0 48-21.5 48-48l0-272z"/></svg>
                {{ programStore.Program.avg_days_per_week}} days/week</h3>
            </div>
          </div>
          <div class="pl-6 flex-1 min-w-max">
            <div class="flex flex-col flex-1 gap-4 border-rafik-sectext dark:border-rafik-darksectext text-left">
              <!-- <button class="text-body uppercase text-left hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darkpritext">View Language</button> -->
              <button
              @click="DraftProgram"
                class="text-body uppercase text-left hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darksectext"
                v-if="programStore.Program.status == 'Active'"
              >
                Change to Draft
              </button>
              <button
              @click="ActiveProgram"
                class="text-body uppercase text-left hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darksectext"
                v-if="programStore.Program.status == 'Draft'"
              >
                Publish to Active
              </button>
              <input :disabled="loading" type="file" @change="uploadPhoto"  accept="image/*" class="hidden" id="upload-photo" />
              <label for="upload-photo" class="text-body cursor-pointer uppercase text-left hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darksectext">
                {{loading?'loading...':'Change Photo'}}
              </label>
              <p class="text-body uppercase opacity-50" v-if="programStore.Program.status == 'Review'">Under Review</p>
              <button @click="DeleteProgram" class=" uppercase text-red-500 hover:text-red-400 text-left">Delete Program</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex  gap-8 2xl:gap-16 items-center pb-2 border-b border-rafik-sectext dark:border-rafik-darksectext">
        <button
          :class="activeTab === 'Details' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'"
          class="nav-btn "
          @click="setActiveTab('Details')"
        >
          Details
        </button>
        <button
          :class="activeTab === 'Workouts' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'"
          class="nav-btn uppercase "
          @click="setActiveTab('Workouts')"
        >
          Workouts
        </button>
        <button
          :class="activeTab === 'Clients' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'"
          class="nav-btn uppercase "
          @click="setActiveTab('Clients')"
        >
          Clients
        </button>
        <button
          :class="activeTab === 'Pricing' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'"
          class="nav-btn uppercase "
          @click="setActiveTab('Pricing')"
        >
          Pricing
        </button>
        <!-- <button
          :class="activeTab === 'Documents' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'"
          class="nav-btn uppercase "
          @click="setActiveTab('Documents')"
        >
          Documents
        </button> -->
        <button
          :class="activeTab === 'Reviews' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'"
          class="nav-btn uppercase "
          @click="setActiveTab('Reviews')"
        >
          Reviews
        </button>
      </div>

      <!-- Render Box -->
      <div style="min-height: 50vh;" class=" over-flow-y-auto flex-1">
        <transition name="fade">
          <DetailsTabProgram
            @update-tags="updateProgramField('tags', $event)"
            @update-focus="updateProgramField('program_focus', $event)"
            :program="programStore.Program"
            v-if="activeTab === 'Details'"
          />
          <WorkoutPlanner
            :program="programStore.Program"
            v-else-if="activeTab === 'Workouts'"
          />
          <ClientTable
            :program="programStore.Program"
            v-else-if="activeTab === 'Clients'"
          />
          <PricingModel
            :program="programStore.Program"
            @update-promo="updateProgramField('promos', $event)"
            @update-prices="updatePrices"
            v-else-if="activeTab === 'Pricing'"
          />
          <DocumentsForms
            v-else-if="activeTab === 'Documents'"
            @updateProgramField="updateProgramField"
            :program="programStore.Program"
          />
          <ReviewsTab
            :program="programStore.Program"
            v-else-if="activeTab === 'Reviews'"
          />
        </transition>

      </div>
    </div>
  </div>
</template>
