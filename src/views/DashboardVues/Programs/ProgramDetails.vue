<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useProgramStore } from '@/stores/programstores';
import DetailsTabProgram from '@/components/ProgramTabs/DetailsTabPRogram.vue';
import WorkoutPlanner from '@/components/ProgramTabs/WorkoutPlanner.vue';
import ClientTable from '@/components/ProgramTabs/ClientTable.vue';
import PricingModel from '@/components/ProgramTabs/PricingModel.vue';
import DocumentsForms from '@/components/ProgramTabs/DocumentsForms.vue';
import ReviewsTab from '@/components/ProgramTabs/ReviewsTab.vue';
import Swal from 'sweetalert2';
import router from '@/router';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const activeTab = ref('Details');

interface Question {
  type: string;
  question?: string;
  answer?: any;
}
type PromoCode = {
  code: string;
  value: number;
};

const route = useRoute();
const programStore = useProgramStore();

// States for editing
const isEditingTitle = ref(false);
const isEditingDescription = ref(false);
const editableTitle = ref('');
const editableDescription = ref('');

// Edit handlers
function editTitle() {
  isEditingTitle.value = true;
  editableTitle.value = programStore.Program?.program_name || '';
}
function editDescription() {
  isEditingDescription.value = true;
  editableDescription.value = programStore.Program?.program_description || '';
}

// Save handlers
async function saveTitle() {
  isEditingTitle.value = false;
  if (editableTitle.value !== programStore.Program?.program_name && programStore.Program) {
    try {
      await programStore.updateProgram({
        id: programStore.Program.id,
        program_name: editableTitle.value
      });
    } catch (error) {
      console.error('Error updating title:', error);
    }
  }
}

async function saveDescription() {
  isEditingDescription.value = false;
  if (
    editableDescription.value !== programStore.Program?.program_description &&
    programStore.Program
  ) {
    try {
      await programStore.updateProgram({
        id: programStore.Program.id,
        program_description: editableDescription.value
      });
    } catch (error) {
      console.error('Error updating description:', error);
    }
  }
}

// Switch active tab
function setActiveTab(tab: string) {
  activeTab.value = tab;
}

// Refresh route
function refreshComponent() {
  router.go(0);
}

// Clean up
onBeforeUnmount(() => {
  programStore.wipeOut();
});

// Alerts
function showSuccess(message: string) {
  Swal.fire({
    title: t('dashboard.programs.details.successTitle'),
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 1500,
    text: message,
    toast: true,
    position: 'top-right',
    icon: 'success',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}

function showError(message: string) {
  Swal.fire({
    title: t('dashboard.programs.details.errorTitle'),
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}

// Update any program field
async function updateProgramField(field: string, value: any) {
  if (!programStore.Program) return showError(t('dashboard.programs.details.programNotFound'));

  try {
    await programStore.updateProgram({
      id: programStore.Program.id,
      [field]: value
    });
    await programStore.fetchProgram(programStore.Program.id);
    showSuccess(t('dashboard.programs.details.fieldUpdated', { field }));
  } catch (error) {
    showError(t('dashboard.programs.details.fieldUpdateFailed', { field }));
    console.error(`Error updating ${field}:`, error);
  }
}

// Update Pricing
async function updatePrices(updatedPrices: any) {
  if (!programStore.Program) return showError(t('dashboard.programs.details.programNotFound'));
  try {
    await programStore.updateProgram({
      id: programStore.Program.id,
      price_one: updatedPrices.price_one,
      price_three: updatedPrices.price_three,
      price_six: updatedPrices.price_six,
      price_year: updatedPrices.price_year
    });

    programStore.Program.price_one = updatedPrices.price_one;
    programStore.Program.price_three = updatedPrices.price_three;
    programStore.Program.price_six = updatedPrices.price_six;
    programStore.Program.price_year = updatedPrices.price_year;

    showSuccess(t('dashboard.programs.details.pricesUpdated'));
  } catch (error) {
    showError(t('dashboard.programs.details.updatePricesFail'));
    console.error('Error updating Prices:', error);
  }
}

// Delete Program
function DeleteProgram() {
  Swal.fire({
    title: t('dashboard.programs.details.deleteConfirmTitle'),
    text: t('dashboard.programs.details.deleteConfirmText'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('dashboard.programs.details.deleteConfirmButton'),
    confirmButtonColor: '#CB901C',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  }).then((result) => {
    if (result.isConfirmed) {
      updateProgramField('status', 'Deleted').then(() => {
        showSuccess(t('dashboard.programs.details.programDeleted'));
        refreshComponent();
      });
    }
  });
}

// Draft Program
function DraftProgram() {
  Swal.fire({
    title: t('dashboard.programs.details.draftConfirmTitle'),
    text: t('dashboard.programs.details.draftConfirmText'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('dashboard.programs.details.draftConfirmButton'),
    confirmButtonColor: '#CB901C',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  }).then((result) => {
    if (result.isConfirmed) {
      updateProgramField('status', 'Draft').then(() => {
        showSuccess(t('dashboard.programs.details.programDrafted'));
        refreshComponent();
      });
    }
  });
}

// Activate Program
function ActiveProgram() {
  if (programStore.ActivePrograms?.length && programStore.ActivePrograms.length < 3) {
    Swal.fire({
      title: t('dashboard.programs.details.activateConfirmTitle'),
      text: t('dashboard.programs.details.activateConfirmText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('dashboard.programs.details.activateConfirmButton'),
      confirmButtonColor: '#CB901C',
      cancelButtonColor: '#d33',
      background: '#081411',
      color: '#E8F3ED'
    }).then((result) => {
      if (result.isConfirmed) {
        updateProgramField('status', 'Active').then(() => {
          showSuccess(t('dashboard.programs.details.programUnderReview'));
          refreshComponent();
        });
      }
    });
  } else {
    showError(t('dashboard.programs.details.cannotHaveMoreActive'));
  }
}

// On mount, fetch the program
onMounted(() => {
  const programId = route.params.id as string;
  if (programId) {
    programStore.fetchProgram(programId).catch(() => {
      showError(t('dashboard.programs.details.loadProgramFail'));
    });
  }
});

// Difficulty levels
const difficulties = ['Foundational', 'Beginner', 'Intermediate', 'Advanced'];
const selectedDifficulty = ref(programStore.Program?.difficulty_level || difficulties[0]);

// Keep local difficulty in sync with store
watch(
  () => programStore.Program?.difficulty_level,
  (newVal) => {
    if (newVal) {
      selectedDifficulty.value = newVal;
    }
  }
);

// When the select changes, update the difficulty
function onDifficultyChange() {
  updateProgramField('difficulty_level', selectedDifficulty.value);
}

// Photo upload
const loading = ref(false);
const selectedFile = ref<File | null>(null);

async function uploadPhoto(event: Event) {
  if (!programStore.Program) {
    showError(t('dashboard.programs.details.noProgramInStore'));
    return;
  }
  loading.value = true;
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];

    // Attempt to delete old photo if present
    if (programStore.Program.program_photo) {
      try {
        const oldPhotoUrl = programStore.Program.program_photo;
        const url = new URL(oldPhotoUrl);
        const pathStart = url.pathname.indexOf('media/');
        if (pathStart !== -1) {
          const oldPath = url.pathname.substring(pathStart);
          const { error: deleteError } = await supabase.storage.from('storage').remove([oldPath]);
          if (deleteError) {
            console.error('Failed to delete old photo:', deleteError);
          } else {
            console.log('Old photo deleted successfully');
          }
        }
      } catch (err) {
        console.error('Error deleting old photo:', err);
      }
    }

    const uploadedUrl = await uploadFileToBucket();
    if (uploadedUrl) {
      try {
        const { error } = await supabase
          .from('programs')
          .update({ program_photo: uploadedUrl })
          .eq('id', programStore.Program.id);
        if (error) throw error;

        programStore.Program.program_photo = uploadedUrl;
        showSuccess(t('dashboard.programs.details.programPhotoUpdated'));
      } catch (err: any) {
        console.error(err);
        showError(t('dashboard.programs.details.updateProgramPhotoFail', { error: err.message }));
      } finally {
        loading.value = false;
      }
    } else {
      loading.value = false;
    }
  }
}

async function uploadFileToBucket(): Promise<string | null> {
  if (!selectedFile.value) {
    showError(t('dashboard.programs.details.noImageSelected'));
    return null;
  }
  try {
    const { data, error } = await supabase.storage
      .from('storage')
      .upload(`media/${Date.now()}_${selectedFile.value.name}`, selectedFile.value, {
        cacheControl: '3600',
        upsert: true
      });
    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from('storage').getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.error(err);
    showError(t('dashboard.programs.details.uploadFailed', { error: err.message }));
    return null;
  }
}
</script>

<template>
  <div class="flex h-screen overflow-auto">
    <div
      v-if="programStore.Program"
      class="flex-1 px-8 py-12 w-full 2xl:px-12 2xl:py-24 space-y-3 2xl:space-y-6"
    >
      <!-- Page Title + Banner -->
      <div
        class="border group flex flex-col relative border-rafik-alternate rounded-lg overflow-hidden"
      >
        <img
          v-if="!loading"
          :src="programStore.Program.program_photo"
          class="w-full h-full object-cover absolute"
          alt=""
        />
        <div class="w-full opacity-70 h-full bg-rafik-pribg dark:bg-rafik-darkpribg absolute"></div>
        <div
          class="p-8 2xl:p-16 2xl:py-24 space-y-4 relative grid items-stretch grid-cols-4 divide-x divide-rafik-sectext dark:divide-rafik-darksectext divide-x-solid"
        >
          <div class="pr-6 space-y-4 col-span-3">
            <div class="flex items-center justify-between">
              <!-- Editable Title -->
              <input
                v-if="isEditingTitle"
                v-model="editableTitle"
                @blur="saveTitle"
                @keyup.enter="saveTitle"
                class="title-small w-1/3 bg-transparent border-b border-rafik-sectext dark:border-rafik-darksectext focus:outline-none"
                type="text"
                :placeholder="
                  programStore.Program?.program_name ||
                  t('dashboard.programs.details.loadingPlaceholder')
                "
              />
              <h1 v-else class="title-small w-1/3 hover:opacity-70 cursor-text" @click="editTitle">
                {{
                  programStore.Program?.program_name ||
                  t('dashboard.programs.details.loadingPlaceholder')
                }}
              </h1>
              <h2 class="header-medium">
                {{
                  programStore.Program?.status || t('dashboard.programs.details.loadingPlaceholder')
                }}
              </h2>
            </div>

            <!-- Editable Description -->
            <textarea
              v-if="isEditingDescription"
              v-model="editableDescription"
              @blur="saveDescription"
              @keyup.enter="saveDescription"
              cols="3"
              class="text-body 2xl:w-5/6 bg-transparent border-b border-rafik-sectext dark:border-rafik-darksectext focus:outline-none"
              :placeholder="
                programStore.Program?.program_description ||
                t('dashboard.programs.details.loadingPlaceholder')
              "
            ></textarea>
            <p
              v-else
              class="text-body text-justify hover:opacity-70 2xl:w-5/6 cursor-text"
              @click="editDescription"
            >
              {{
                programStore.Program?.program_description ||
                t('dashboard.programs.details.loadingPlaceholder')
              }}
            </p>

            <div class="flex gap-8 justify-between">
              <!-- Difficulty Level -->
              <div class="uppercase flex gap-2 items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  stroke="currentColor"
                  class="w-6 text-rafik-sectext dark:text-rafik-darksectext"
                  viewBox="0 0 448 512"
                >
                  <path
                    d="M160 80c0-26.5 21.5-48 48-48l32 0c26.5
                       0 48 21.5 48 48l0 352c0 26.5-21.5 48-48
                       48l-32 0c-26.5 0-48-21.5-48-48l0-352zM0
                       272c0-26.5 21.5-48 48-48l32 0c26.5 0 48
                       21.5 48 48l0 160c0 26.5-21.5 48-48 48l-32
                       0c-26.5 0-48-21.5-48-48L0 272zM368 96l32 0c26.5
                       0 48 21.5 48 48l0 288c0 26.5-21.5 48-48 48l-32
                       0c-26.5 0-48-21.5-48-48l0-288c0-26.5 21.5
                       -48 48-48z"
                  />
                </svg>
                <select
                  v-model="selectedDifficulty"
                  @change="onDifficultyChange"
                  class="bg-transparent border-0 text-body focus:outline-none"
                >
                  <option
                    v-for="difficulty in difficulties"
                    :key="difficulty"
                    :value="difficulty"
                    class="bg-rafik-secbg dark:bg-rafik-darksecbg"
                  >
                    {{ t(difficulty) }}
                  </option>
                </select>
              </div>

              <!-- Average Session Time -->
              <h3 class="uppercase flex gap-2 items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  stroke="currentColor"
                  class="w-6 text-rafik-sectext dark:text-rafik-darksectext"
                  viewBox="0 0 448 512"
                >
                  <path
                    d="M176 0c-17.7 0-32
                       14.3-32 32s14.3 32 32 32l16 0
                       0 34.4C92.3 113.8 16 200 16
                       304c0 114.9 93.1 208 208
                       208s208-93.1 208-208c0
                       -41.8-12.3-80.7-33.5-113.2l24.1
                       -24.1c12.5-12.5 12.5-32.8
                       0-45.3s-32.8-12.5-45.3
                       0L355.7 143c-28.1-23
                       -62.2-38.8-99.7-44.6L256
                       64l16 0c17.7 0 32-14.3
                       32-32s-14.3-32-32-32L224
                       0 176 0zm72 192l0
                       128c0 13.3-10.7 24-24
                       24s-24-10.7-24-24l0
                       -128c0-13.3 10.7-24
                       24-24s24 10.7 24 24z"
                  />
                </svg>
                {{ programStore.Program.avg_session_time }}
                {{ t('dashboard.programs.details.minsSession') }}
              </h3>

              <!-- Average Days per Week -->
              <h3 class="uppercase flex gap-2 items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  stroke="currentColor"
                  class="w-6 text-rafik-sectext dark:text-rafik-darksectext"
                  viewBox="0 0 448 512"
                >
                  <path
                    d="M96 32l0 32L48
                       64C21.5 64 0 85.5
                       0 112l0 48 448
                       0 0-48c0-26.5-21.5
                       -48-48-48l-48
                       0 0-32c0
                       -17.7-14.3-32
                       -32-32s-32
                       14.3-32
                       32l0
                       32L160
                       64l0
                       -32c0
                       -17.7-14.3
                       -32-32-32S96
                       14.3 96
                       32zM448
                       192L0
                       192 0
                       464c0
                       26.5 21.5
                       48 48
                       48l352
                       0c26.5
                       0 48
                       -21.5
                       48
                       -48l0
                       -272z"
                  />
                </svg>
                {{ programStore.Program.avg_days_per_week }}
                {{ t('dashboard.programs.details.daysWeek') }}
              </h3>
            </div>
          </div>
          <div class="pl-6 flex-1 min-w-max">
            <div
              class="flex flex-col flex-1 gap-4 border-rafik-sectext dark:border-rafik-darksectext text-left"
            >
              <button
                @click="DraftProgram"
                class="text-body uppercase text-left hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darksectext"
                v-if="programStore.Program.status == 'Active'"
              >
                {{ t('dashboard.programs.details.changeToDraftButton') }}
              </button>
              <button
                @click="ActiveProgram"
                class="text-body uppercase text-left hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darksectext"
                v-if="programStore.Program.status == 'Draft'"
              >
                {{ t('dashboard.programs.details.publishToActiveButton') }}
              </button>

              <input
                :disabled="loading"
                type="file"
                @change="uploadPhoto"
                accept="image/*"
                class="hidden"
                id="upload-photo"
              />
              <label
                for="upload-photo"
                class="text-body cursor-pointer uppercase text-left hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darksectext"
              >
                {{
                  loading
                    ? t('dashboard.programs.details.loadingPhoto')
                    : t('dashboard.programs.details.changePhotoButton')
                }}
              </label>

              <p
                class="text-body uppercase opacity-50"
                v-if="programStore.Program.status == 'Review'"
              >
                {{ t('dashboard.programs.details.underReview') }}
              </p>
              <button
                @click="DeleteProgram"
                class="uppercase text-red-500 hover:text-red-400 text-left"
              >
                {{ t('dashboard.programs.details.deleteProgramButton') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div
        class="flex gap-8 2xl:gap-16 items-center pb-2 border-b border-rafik-sectext dark:border-rafik-darksectext"
      >
        <button
          :class="
            activeTab === 'Details'
              ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default'
              : 'hover:opacity-70'
          "
          class="nav-btn"
          @click="setActiveTab('Details')"
        >
          {{ t('dashboard.programs.details.tabDetails') }}
        </button>
        <button
          :class="
            activeTab === 'Workouts'
              ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default'
              : 'hover:opacity-70'
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Workouts')"
        >
          {{ t('dashboard.programs.details.tabWorkouts') }}
        </button>
        <button
          :class="
            activeTab === 'Clients'
              ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default'
              : 'hover:opacity-70'
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Clients')"
        >
          {{ t('dashboard.programs.details.tabClients') }}
        </button>
        <button
          :class="
            activeTab === 'Pricing'
              ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default'
              : 'hover:opacity-70'
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Pricing')"
        >
          {{ t('dashboard.programs.details.tabPricing') }}
        </button>
        <!--
        <button
          :class="activeTab === 'Documents'
            ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default'
            : 'hover:opacity-70'"
          class="nav-btn uppercase"
          @click="setActiveTab('Documents')"
        >
          {{ t('dashboard.programs.details.tabDocuments') }}
        </button>
        -->
        <button
          :class="
            activeTab === 'Reviews'
              ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default'
              : 'hover:opacity-70'
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Reviews')"
        >
          {{ t('dashboard.programs.details.tabReviews') }}
        </button>
      </div>

      <!-- Render Box -->
      <div style="min-height: 50vh" class="over-flow-y-auto flex-1">
        <transition name="fade">
          <DetailsTabProgram
            v-if="activeTab === 'Details'"
            :program="programStore.Program"
            @update-tags="updateProgramField('tags', $event)"
            @update-focus="updateProgramField('program_focus', $event)"
          />
          <WorkoutPlanner v-else-if="activeTab === 'Workouts'" :program="programStore.Program" />
          <ClientTable v-else-if="activeTab === 'Clients'" :program="programStore.Program" />
          <PricingModel
            v-else-if="activeTab === 'Pricing'"
            :program="programStore.Program"
            @update-promo="updateProgramField('promos', $event)"
            @update-prices="updatePrices"
          />
          <DocumentsForms
            v-else-if="activeTab === 'Documents'"
            @updateProgramField="updateProgramField"
            :program="programStore.Program"
          />
          <ReviewsTab v-else-if="activeTab === 'Reviews'" :program="programStore.Program" />
        </transition>
      </div>
    </div>
  </div>
</template>
