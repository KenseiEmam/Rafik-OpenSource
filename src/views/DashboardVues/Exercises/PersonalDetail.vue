<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useExerciseStore } from '@/stores/exercisestores';
import Swal from 'sweetalert2';
import ExcerciseMovers from '@/components/ExerciseTabs/ExcerciseMovers.vue';
import TechTips from '@/components/ExerciseTabs/TechTips.vue';
import EquipReq from '@/components/ExerciseTabs/EquipReq.vue';
import ExerciseAlt from '@/components/ExerciseTabs/ExerciseAlt.vue';
import ImportOffcanvas from '@/components/Offcanvas/ImportOffcanvas.vue';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from 'vue-i18n';

const { t , locale } = useI18n();

const activeTab = ref('Muscles');
function setActiveTab(tab: string) {
  activeTab.value = tab;
}
const loadingMedia = ref(false);
const route = useRoute();
const exerciseStore = useExerciseStore();
const isEditingTitle = ref(false);
const isEditingDescription = ref(false);

// The list of exercise types. We keep the array as is, but use t(type) in the template.
const types = ref(['isolation', 'stretch', 'bodyweight', 'compound', 'cardio', 'plyometric','isometric','drill','hiit']);

const editableTitle = ref('');
const editableDescription = ref('');

const fileInput = ref<HTMLInputElement | null>(null);
const uploadedVideo = ref<string | null>(null);
const selectedFile = ref<File | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  loadingMedia.value = true;
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    selectedFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedVideo.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    submitForm().then(() => {
      loadingMedia.value = false;
    });
  }
};

const removeVideo = async () => {
  if (!exerciseStore.Exercise?.media) return;
  loadingMedia.value = true;
  const filePath = exerciseStore.Exercise.media.split('/storage/')[1];
  if (!filePath) return;

  try {
    const { error } = await supabase.storage.from('storage').remove([filePath]);
    if (error) {
      showError(t('dashboard.exercises.personal.failedDeleteVideo'));
      return;
    }
    await exerciseStore.updateExercise({
      id: exerciseStore.Exercise.id,
      media: ''
    });
    uploadedVideo.value = null;
    selectedFile.value = null;
    if (fileInput.value) fileInput.value.value = '';
    showSuccess(t('dashboard.exercises.personal.videoRemoved'));
    loadingMedia.value = false;
  } catch (err) {
    console.error('Error removing video:', err);
    showError(t('dashboard.exercises.personal.errorRemovingVideo'));
  }
};

const uploadFileToBucket = async (): Promise<string | null> => {
  if (!selectedFile.value) {
    alert(t('dashboard.exercises.personal.pleaseUploadVideo'));
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from('storage')
      .upload(`media/${Date.now()}_${selectedFile.value.name}`, selectedFile.value, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading file:', error.message);
      alert(t('dashboard.exercises.personal.uploadFailedAlert'));
      return null;
    }

    const { data: urlData } = supabase.storage.from('storage').getPublicUrl(data.path);
    if (!urlData?.publicUrl) {
      alert(t('dashboard.exercises.personal.failedRetrieveUrl'));
      return null;
    }

    return urlData.publicUrl;
  } catch (err) {
    console.error('Error during file upload:', err);
    alert(t('dashboard.exercises.personal.uploadErrorOccurred'));
    return null;
  }
};

const submitForm = async () => {
  const videoUrl = await uploadFileToBucket();
  if (!videoUrl) return;
  updateExerciseField('media', videoUrl);
};

function editTitle() {
  isEditingTitle.value = true;
  editableTitle.value = exerciseStore.Exercise?.exercise_name || '';
}

function editDescription() {
  isEditingDescription.value = true;
  editableDescription.value = exerciseStore.Exercise?.exercise_detail || '';
}

async function saveTitle() {
  isEditingTitle.value = false;
  if (editableTitle.value !== exerciseStore.Exercise?.exercise_name && exerciseStore.Exercise) {
    try {
      await exerciseStore.updateExercise({
        id: exerciseStore.Exercise.id,
        exercise_name: editableTitle.value
      });
      showSuccess(t('dashboard.exercises.personal.titleUpdated'));
    } catch (error) {
      showError(t('dashboard.exercises.personal.titleUpdateError'));
    }
  }
}

async function saveDescription() {
  isEditingDescription.value = false;
  if (
    editableDescription.value !== exerciseStore.Exercise?.exercise_detail &&
    exerciseStore.Exercise
  ) {
    try {
      await exerciseStore.updateExercise({
        id: exerciseStore.Exercise.id,
        exercise_detail: editableDescription.value
      });
      showSuccess(t('dashboard.exercises.personal.descriptionUpdated'));
    } catch (error) {
      showError(t('dashboard.exercises.personal.descriptionUpdateError'));
    }
  }
}

// Function to update the exercise type
async function selectType(selectedType: string) {
  if (exerciseStore.Exercise && exerciseStore.Exercise.type !== selectedType) {
    try {
      await exerciseStore.updateExercise({
        id: exerciseStore.Exercise.id,
        type: selectedType
      });

      showSuccess(t('dashboard.exercises.personal.typeUpdated', { type: selectedType }));
    } catch (error) {
      showError(t('dashboard.exercises.personal.typeUpdateFail'));
    }
  }
}

// Success and Error Alerts
function showSuccess(message: string) {
  Swal.fire({
    title: t('dashboard.exercises.personal.successTitle'),
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 1500,
    text: message,
    toast: true,
    position: 'top-right',
    icon: 'success',
    confirmButtonColor: '#CB901C',
    background: '#081411',
    color: '#E8F3ED'
  });
}

function showError(message: string) {
  Swal.fire({
    title: t('dashboard.exercises.personal.errorTitle'),
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}

// ✅ Function to delete the exercise with confirmation
function DeleteExercise(id: string) {
  Swal.fire({
    title: t('dashboard.exercises.personal.deleteConfirmTitle'),
    text: t('dashboard.exercises.personal.deleteConfirmText'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('dashboard.exercises.personal.deleteConfirmButton'),
    confirmButtonColor: '#CB901C',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  }).then((result) => {
    if (result.isConfirmed) {
      exerciseStore.deleteExercise(id);
    }
  });
}

// ✅ Function to overwrite exercise fields
async function importExercise(value: any) {
  if (!exerciseStore.Exercise) {
    return showError(t('dashboard.exercises.personal.exerciseNotFound'));
  }
  const { id, exercise_name, exercise_detail, trainer_id, ...exerciseWithoutId } = value;
  try {
    await exerciseStore.updateExercise({ id: exerciseStore.Exercise.id, ...exerciseWithoutId });
    if (exerciseStore.Exercise?.alternatives) {
      exerciseStore.fetchExercisesByIds(exerciseStore.Exercise?.alternatives);
    }
    showSuccess(t('dashboard.exercises.personal.importSuccess'));
  } catch (error) {
    showError(t('dashboard.exercises.personal.importFailed'));
  }
}

// ✅ Generic function to update any exercise field
async function updateExerciseField(field: string, value: any) {
  if (!exerciseStore.Exercise) return showError(t('dashboard.exercises.personal.exerciseNotFound'));

  try {
    await exerciseStore.updateExercise({ id: exerciseStore.Exercise.id, [field]: value });

    if (field === 'alternatives') {
      await exerciseStore.fetchExercisesByIds(value); // Refetch updated alternatives
    } else {
      await exerciseStore.fetchPersonalExercise(exerciseStore.Exercise.id);
    }
    showSuccess(t('dashboard.exercises.personal.fieldUpdated', { field }));
  } catch (error) {
    showError(t('dashboard.exercises.personal.fieldUpdateFail', { field }));
  }
}

onMounted(() => {
  const exerciseId = route.params.id as string;
  if (exerciseId) {
    exerciseStore
      .fetchPersonalExercise(exerciseId)
      .then(() => {
        if (exerciseStore.Exercise?.alternatives) {
          exerciseStore.fetchExercisesByIds(exerciseStore.Exercise?.alternatives);
        }
      })
      .catch(() => {
        showError(t('dashboard.exercises.personal.failedToLoadDetails'));
      });
  }
});
</script>

<template>
  <div class="flex h-screen overflow-auto">
    <div
      v-if="exerciseStore.Exercise && exerciseStore.AlternateExercises"
      class="flex-1 px-8 py-12 w-full 2xl:px-12 2xl:py-24 space-y-8 2xl:space-y-10"
    >
      <div class="flex gap-6 items-end wrap">
        <!-- Video Preview or Upload Section -->
        <div v-if="!loadingMedia">
          <div v-if="exerciseStore.Exercise.media" class="h-96 w-128 group relative mx-auto">
            <video
              :src="exerciseStore.Exercise.media"
              class="h-96 w-128 border-rafik-sectext dark:border-rafik-darksectext border-2 object-cover rounded-lg mx-auto"
              controls
            ></video>
            <button
              @click.prevent="removeVideo"
              class="absolute min-w-max top-5 right-5 opacity-0 group-hover:opacity-100 p-2 text-sm text-white rounded-xl bg-red-500 hover:cursor-pointer flex items-center justify-center focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {{ t('dashboard.exercises.personal.removeVideo') }}
            </button>
          </div>
          <div
            v-else
            class="h-96 w-128 border-2 border-dashed border-gray-400 mx-auto rounded-lg flex items-center justify-center cursor-pointer hover:bg-rafik-secbg dark:bg-rafik-darksecbg focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="triggerFileInput"
          >
            <span class="text-center text-gray-500">
              {{ t('dashboard.exercises.personal.dragDropVideo') }}
            </span>
          </div>
          <input
            type="file"
            accept="video/*"
            class="hidden"
            ref="fileInput"
            @change="handleFileChange"
            required
          />
        </div>
        <div v-else class="h-96 w-128 card flex items-center flex-col gap-6 justify-center">
          <h3 class="header-large">
            {{ t('dashboard.exercises.personal.processingTitle') }}
          </h3>
          <p>
            {{ t('dashboard.exercises.personal.processingRequest') }}
          </p>
        </div>

        <!-- Exercise Title / Description / Types -->
        <div class="pr-6 space-y-4 w-1/2 flex flex-col items-start justify-end">
          <div class="flex items-center justify-between">
            <!-- Editable Title -->
            <input
              v-if="isEditingTitle"
              v-model="editableTitle"
              @blur="saveTitle"
              @keyup.enter="saveTitle"
              class="title-small bg-transparent border-b border-rafik-sectext dark:border-rafik-darksectext focus:outline-none"
              type="text"
              :placeholder="
                exerciseStore.Exercise?.exercise_name ||
                t('dashboard.exercises.personal.loadingPlaceholder')
              "
            />
            <h1 v-else class="title-small hover:opacity-70 cursor-text" @click="editTitle">
              {{
                exerciseStore.Exercise?.exercise_name ||
                t('dashboard.exercises.personal.loadingPlaceholder')
              }}
            </h1>
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
              exerciseStore.Exercise?.exercise_detail ||
              t('dashboard.exercises.personal.loadingPlaceholder')
            "
          ></textarea>
          <p
            v-else
            class="text-body text-justify hover:opacity-70 2xl:w-5/6 cursor-text"
            @click="editDescription"
          >
            {{
              exerciseStore.Exercise?.exercise_detail ||
              t('dashboard.exercises.personal.loadingPlaceholder')
            }}
          </p>

          <!-- Types List -->
          <div class="flex flex-wrap gap-2 2xl:gap-4">
            <div v-for="(type, index) in types" :key="index">
              <button
                @click="selectType(type)"
                :class="
                  exerciseStore.Exercise.type?.toLowerCase() === type
                    ? 'border-rafik-pritext dark:border-rafik-darkpritext text-rafik-pritext dark:text-rafik-darkpritext border-2'
                    : 'border border-rafik-sectext dark:border-rafik-darksectext opacity-80 hover:opacity-100'
                "
                class="truncate h-24 w-24 2xl:w-32 2xl:h-32 text-xs 2xl:text-sm text-wrap rounded-xl font-bold flex items-center justify-center bg-rafik-pribg dark:bg-rafik-darkpribg uppercase"
              >
                {{ t(type) }}
              </button>
            </div>
          </div>
        </div>

        <!-- Right-Side Tools (Import / Delete) -->
        <div
        :class="locale === 'ar'?'border-r':'border-l'"
          class="pl-6 flex-1 min-w-max  border-rafik-sectext dark:border-rafik-darksectext"
        >
          <div
            class="flex flex-col flex-1 h-96 justify-center gap-4 border-rafik-sectext dark:border-rafik-darksectext text-left"
          >
            <ImportOffcanvas @import-exercise="importExercise" />
            <button
              @click="DeleteExercise(exerciseStore.Exercise.id)"
              class="text-body uppercase text-red-500 hover:text-red-400 text-left"
            >
              {{ t('dashboard.exercises.personal.deleteExercise') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div
        class="flex gap-8 2xl:gap-16 items-center pb-2 border-b border-rafik-sectext dark:border-rafik-darksectext"
      >
        <button
          :class="
            activeTab === 'Muscles'
              ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default'
              : 'hover:opacity-70'
          "
          class="nav-btn"
          @click="setActiveTab('Muscles')"
        >
          {{ t('dashboard.exercises.personal.musclesWorked') }}
        </button>
        <button
          :class="
            activeTab === 'Tips and Technique'
              ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default'
              : 'hover:opacity-70'
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Tips and Technique')"
        >
          {{ t('dashboard.exercises.personal.tipsTechnique') }}
        </button>
        <button
          :class="
            activeTab === 'Equipment'
              ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default'
              : 'hover:opacity-70'
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Equipment')"
        >
          {{ t('dashboard.exercises.personal.equipmentRequired') }}
        </button>
        <button
          :class="
            activeTab === 'Alternatives'
              ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default'
              : 'hover:opacity-70'
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Alternatives')"
        >
          {{ t('dashboard.exercises.personal.alternatives') }}
        </button>
      </div>

      <!-- Tabs Content -->
      <div style="min-height: 50vh" class="over-flow-y-auto flex-1">
        <transition name="fade">
          <ExcerciseMovers
            v-if="activeTab === 'Muscles'"
            :personal="true"
            :exercise="exerciseStore.Exercise"
            @update-prime="updateExerciseField('prime', $event)"
            @update-synergist="updateExerciseField('synergist', $event)"
            @update-antagonist="updateExerciseField('antagonist', $event)"
          />
          <TechTips
            v-else-if="activeTab === 'Tips and Technique'"
            :personal="true"
            :exercise="exerciseStore.Exercise"
            @update-safety="updateExerciseField('safety', $event)"
            @update-steps="updateExerciseField('steps', $event)"
            @update-cues="updateExerciseField('cues', $event)"
          />
          <EquipReq
            v-else-if="activeTab === 'Equipment'"
            :personal="true"
            :exercise="exerciseStore.Exercise"
            @update-equipment="updateExerciseField('equipment', $event)"
          />
          <ExerciseAlt
            v-else-if="activeTab === 'Alternatives'"
            :exercise="exerciseStore.Exercise"
            :alternatives="exerciseStore.AlternateExercises"
            :personal="true"
            @update-alternatives="updateExerciseField('alternatives', $event)"
          />
        </transition>
      </div>
    </div>
  </div>
</template>
