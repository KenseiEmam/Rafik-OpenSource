<template>
  <!-- Drawer toggle button -->
  <button
    @click="openModal"
    class="text-body uppercase text-left hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darkpritext"
  >
    {{ t('dashboard.offCanvas.import.importTemplate') }}
  </button>

  <!-- Drawer component -->
  <div
    v-if="ModalOn"
    class="fixed top-0 right-0 z-40 w-full h-screen flex justify-end"
    style="background-color: #000000aa"
  >
    <div class="flex-1 w-full h-full content" @click="ModalOn = false"></div>
    <div
      class="p-8 py-12 border-l border-rafik-sectext dark:border-rafik-darksectext bg-rafik-pribg dark:bg-rafik-darkpribg w-128 h-full space-y-8 relative"
    >
      <div>
        <h2 class="subheader-medium uppercase">
          {{ t('dashboard.offCanvas.import.exercise') }}
        </h2>
        <h2 class="header-large font-black">
          {{ t('dashboard.offCanvas.import.library') }}
        </h2>
      </div>
      <p class="e">
        {{ t('dashboard.offCanvas.import.selectAnExercise') }}
      </p>
      <!-- Close button -->
      <button @click="ModalOn = false" type="button" class="absolute w-16 h-16 top-2.5 end-2.5">
        <svg
          class="w-4"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 14 14"
        >
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
          />
        </svg>
      </button>

      <!-- Search bar -->
      <form class="max-w-md mx-auto">
        <div class="relative">
          <input
            type="search"
            @input="handleSearch"
            class="block w-full p-4 text-sm text-rafik-sectext dark:text-rafik-darksectext border rounded-lg bg-rafik-pribg dark:bg-rafik-darkpribg"
            :placeholder="t('dashboard.offCanvas.import.searchPlaceholder')"
            required
          />
        </div>
      </form>

      <!-- Exercise list -->
      <div
        class="pb-64 h-full overflow-y-auto"
        v-if="exerciseStore.AllExercises && exerciseStore.AllExercises.length"
      >
        <ul class="overflow-auto space-y-4">
          <li v-for="exercise in exerciseStore.AllExercises" :key="exercise.id">
            <div
              class="card p-6 border-rafik gradient-bg flex justify-between items-center text-left border"
            >
              <div>
                <h2 class="header-small">{{ exercise.exercise_name }}</h2>
                <h2 class="subheader-small uppercase mb-6">
                  {{ exercise.type }}
                </h2>
                <p class="label text-rafik-secondary">
                  {{ t('dashboard.offCanvas.import.primeMovers') }}
                </p>
                <div class="flex gap-2 flex-wrap">
                  <p
                    class="label text-rafik-secondary"
                    v-for="(mover, index) in exercise.prime"
                    :key="index"
                  >
                    {{ mover }}
                  </p>
                </div>
              </div>

              <!-- Select Button -->
              <button
                @click="importExercise(exercise)"
                class="px-4 bg-rafik hover:bg-rafik-secondary py-2 text-white rounded-lg"
              >
                {{ t('dashboard.offCanvas.import.importButton') }}
              </button>
            </div>
          </li>
        </ul>
      </div>
      <p v-else>{{ t('dashboard.offCanvas.import.noExercisesFound') }}</p>
    </div>
  </div>

  <!-- Add Exercise Modal -->
  <AddExerciseModal
    :visible="showAddExerciseModal"
    @close="showAddExerciseModal = false"
    @submit="addExercise"
  />
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import debounce from 'lodash/debounce';
import { useExerciseStore } from '@/stores/exercisestores';
import AddExerciseModal from '@/components/ExerciseTabs/AddExerciseModal.vue';
import Swal from 'sweetalert2';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const ModalOn = ref<boolean>(false);
const exerciseStore = useExerciseStore();
const selectedExercises = ref<any[]>([]);
const showAddExerciseModal = ref(false);

function addExercise(exercise: any) {
  exerciseStore.createExercise(exercise);
  showAddExerciseModal.value = false;
}

const props = defineProps({
  maxSelectable: {
    type: Number,
    default: null // Allows infinite selection if not provided
  }
});

const emits = defineEmits(['importExercise']);

const debouncedFetchExercises = debounce((query: string) => {
  if (query) {
    exerciseStore.fetchRelevantExercises(query);
  }
}, 500);

watch(ModalOn, (newVal) => {
  if (!newVal) selectedExercises.value = [];
});

function openModal() {
  ModalOn.value = true;
  exerciseStore.getAllExercises();
}

function importExercise(exercise: Record<string, any>) {
  Swal.fire({
    title: t('dashboard.offCanvas.import.importConfirmTitle'),
    text: t('dashboard.offCanvas.import.importConfirmText'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('dashboard.offCanvas.import.yesOverwrite'),
    cancelButtonText: t('dashboard.offCanvas.import.cancelButtonText'),
    confirmButtonColor: '#CB901C',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  }).then((result) => {
    if (result.isConfirmed) {
      emits('importExercise', exercise);
      ModalOn.value = false;
    }
  });
}

function handleSearch(event: Event) {
  const target = event.target as HTMLInputElement;
  debouncedFetchExercises(target.value);
}
</script>
