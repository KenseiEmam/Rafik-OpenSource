<template>
  <div>
    <div class="flex justify-between items-center gap-4 mb-3">
      <!-- Search bar -->
      <div class="relative w-128">
        <input
          type="search"
          @input="handleSearch"
          class="block w-full p-4 text-sm text-rafik-sectext dark:text-rafik-darksectext border rounded-lg bg-rafik-pribg dark:bg-rafik-darkpribg"
          :placeholder="t('dashboard.tabs.exercise.list.typeToSearchExercises')"
          required
        />
      </div>
      <div class="mr-auto flex gap-4">
        <button
          @click="updateFilter('All')"
          class="card border 2xl:text-base text-sm min-w-max uppercase"
          :class="filter === 'All' ? 'border-rafik gradient-bg text-rafik' : 'border'"
        >
          {{ t('dashboard.tabs.exercise.list.allEx') }}
        </button>
        <button
          @click="updateFilter('private')"
          class="card border 2xl:text-base text-sm min-w-max uppercase"
          :class="filter === 'private' ? 'border-rafik gradient-bg text-rafik' : 'border'"
        >
          {{ t('dashboard.tabs.exercise.list.personalEx') }}
        </button>
        <button
          @click="updateFilter('public')"
          class="card border 2xl:text-base text-sm min-w-max uppercase"
          :class="filter === 'public' ? 'border-rafik gradient-bg text-rafik' : 'border'"
        >
          {{ t('dashboard.tabs.exercise.list.publicEx') }}
        </button>
      </div>
      <button @click="showAddExerciseModal = true" class="min-w-max btn-sm-outline">
        {{ t('dashboard.tabs.exercise.list.addCustomExercise') }}
      </button>
    </div>

    <ul v-if="props.exercises?.length > 0" class="grid grid-cols-3 grid-rows-3 gap-6 items-center">
      <router-link
        :to="{
          name: exercise.trainer_id ? 'personal-details' : 'public-details',
          params: { id: exercise.id }
        }"
        v-for="(exercise, index) in props.exercises"
        :key="exercise.id"
        class="h-full text-rafik-sectext dark:text-rafik-darksectext"
      >
        <div
          class="card p-6 w-full hover:border-rafik border border-transparent flex justify-between h-full items-center"
        >
          <div>
            <h2 class="title-small text-base 2xl:text-xl">
              {{ exercise.exercise_name }}
            </h2>
            <h2 class="header-small text-sm 2xl:text-lg uppercase">
              {{ exercise.type }}
            </h2>
            <p class="label 2xl:text-sm" v-if="exercise.trainer_id">
              {{ t('dashboard.tabs.exercise.list.customExercise') }}
            </p>
            <p class="text-body my-2 2xl:my-4 line-clamp-3">
              {{ exercise.exercise_detail }}
            </p>
            <!-- Prime Movers -->
            <p class="label text-rafik-pritext dark:text-rafik-darkpritext">
              {{ t('dashboard.tabs.exercise.list.primeMovers') }}
            </p>
            <div class="flex gap-2 flex-wrap mb-2">
              <p
                class="label text-rafik-secondary"
                v-for="(mover, i) in exercise.prime ?? []"
                :key="'prime-' + i"
              >
                {{ mover }}
              </p>
            </div>

            <!-- Synergists -->
            <p class="label text-rafik-pritext dark:text-rafik-darkpritext">
              {{ t('dashboard.tabs.exercise.list.synergists') }}
            </p>
            <div class="flex gap-2 flex-wrap mb-2">
              <p
                class="label text-rafik-secondary"
                v-for="(synergist, i) in exercise.synergist ?? []"
                :key="'synergist-' + i"
              >
                {{ synergist }}
              </p>
            </div>

            <!-- Antagonists -->
            <p class="label text-rafik-pritext dark:text-rafik-darkpritext">
              {{ t('dashboard.tabs.exercise.list.antagonists') }}
            </p>
            <div class="flex gap-2 flex-wrap">
              <p
                class="label text-rafik-secondary"
                v-for="(antagonist, i) in exercise.antagonist ?? []"
                :key="'antagonist-' + i"
              >
                {{ antagonist }}
              </p>
            </div>
          </div>
        </div>
      </router-link>
    </ul>
    <div v-else class="space-y-6 flex flex-col items-center py-12">
      <p class="text-rafik-pritext dark:text-rafik-darkpritext">
        {{ t('dashboard.tabs.exercise.list.noExercisesFound') }}
      </p>
    </div>

    <div v-if="props.exercises?.length > 0" class="flex justify-between items-center gap-4 my-6">
      <!-- Tabs Navigation -->
      <p class="header-small min-w-max">
        {{ t('dashboard.tabs.exercise.list.pageLabel') }} {{ page }}
      </p>
      <hr class="border w-full border-rafik-sectext dark:border-rafik-darksectext" />
      <div class="flex text-rafik-sectext dark:text-rafik-darksectext gap-4 px-4">
        <button
          v-for="p in Math.ceil(props.count / 9)"
          :key="p"
          @click="updatePage(p)"
          class="hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darkpritext"
          :class="{ 'text-rafik-pritext dark:text-rafik-darkpritext': p === page }"
        >
          {{ p }}
        </button>
      </div>
      <hr class="border w-full border-rafik-sectext dark:border-rafik-darksectext" />
      <button
        v-if="props.page > 1"
        @click="updatePage(pageEdit - 1)"
        class="px-4 py-2 text-rafik-sectext dark:text-rafik-darksectext min-w-max hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darkpritext"
      >
        {{ t('dashboard.tabs.exercise.list.previousPage') }}
      </button>

      <button
        v-if="props.page < Math.ceil(props.count / 9)"
        @click="updatePage(pageEdit + 1)"
        class="px-4 py-2 text-rafik-sectext dark:text-rafik-darksectext min-w-max hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darkpritext"
      >
        {{ t('dashboard.tabs.exercise.list.nextPage') }}
      </button>
    </div>

    <AddExerciseModal
      :visible="showAddExerciseModal"
      @close="showAddExerciseModal = false"
      @submit="addExercise"
    />
  </div>
</template>
<script lang="ts" setup>
import router from '@/router';
import { ref, watch } from 'vue';
import debounce from 'lodash/debounce';
import { useExerciseStore } from '@/stores/exercisestores';
import AddExerciseModal from './ExerciseTabs/AddExerciseModal.vue';
import { useI18n } from 'vue-i18n';
const { t , locale } = useI18n();
const exerciseStore = useExerciseStore();
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
const props = defineProps<{
  exercises: Exercise[];
  page: number;
  count: number;
  filter: string;
}>();

// Add exercise
function addExercise(exercise: any) {
  exerciseStore.createExercise(exercise);
  showAddExerciseModal.value = false;
}

// Handle input change
function handleSearch(event: Event) {
  const target = event.target as HTMLInputElement;
  debouncedFetchExercises(target.value);
}

const pageEdit = ref(props.page);
const filterEdit = ref(props.filter);
const showAddExerciseModal = ref(false);
const holdQuery = ref('');

watch(
  () => props.page,
  (newPage) => {
    pageEdit.value = newPage;
  }
);

watch(
  () => props.filter,
  (newfilter) => {
    filterEdit.value = newfilter;
  }
);
const emits = defineEmits(['updatePage', 'updatePageSearch']);
// Debounced function to fetch relevant exercises
const debouncedFetchExercises = debounce((query: string) => {
  holdQuery.value = query;
  if (query) {
    emits('updatePageSearch', pageEdit.value, query, filterEdit.value);
  }
}, 500);
function updateFilter(value: string) {
  if (holdQuery.value) {
    emits('updatePageSearch', 1, holdQuery.value, value);
  } else {
    emits('updatePage', 1, value);
  }
}
function updatePage(page: number) {
  const maxPage = Math.ceil(props.count / 9);
  if (page < 1 || page > maxPage) {
    return;
  } else if (holdQuery.value) {
    emits('updatePageSearch', page, holdQuery.value, filterEdit.value);
  } else {
    emits('updatePage', page, filterEdit.value);
  }
}
</script>

<style scoped>
.dark .card:hover {
  background-image: linear-gradient(135deg, #081411 36%, #295f42);
}
.card:hover {
  background-image: linear-gradient(135deg, #f3eeeb 36%, #fff2cb);
}
</style>
