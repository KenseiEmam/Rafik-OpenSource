<template>
  <div>
    <div class="flex justify-between items-center gap-4 mb-3">
      <!-- Search bar -->
      <div class="relative w-128">
        <input
          type="search"
          @input="handleSearch"
          class="block w-full p-4 text-sm text-rafik-sectext dark:text-rafik-darksectext border rounded-lg bg-rafik-pribg dark:bg-rafik-darkpribg"
          :placeholder="t('dashboard.assessments.list.typeToSearchAssessments')"
          required
        />
      </div>
      <div class="mr-auto flex gap-4">
        <button
          @click="updateFilter('All')"
          class="card border 2xl:text-base text-sm min-w-max uppercase"
          :class="filter === 'All' ? 'border-rafik gradient-bg text-rafik' : 'border'"
        >
          {{ t('dashboard.assessments.list.allAssessments') }}
        </button>
        <button
          @click="updateFilter('scheduled')"
          class="card border 2xl:text-base text-sm min-w-max uppercase"
          :class="filter === 'scheduled' ? 'border-rafik gradient-bg text-rafik' : 'border'"
        >
          {{ t('dashboard.assessments.list.scheduled') }}
        </button>
        <button
          @click="updateFilter('active')"
          class="card border 2xl:text-base text-sm min-w-max uppercase"
          :class="filter === 'active' ? 'border-rafik gradient-bg text-rafik' : 'border'"
        >
          {{ t('dashboard.assessments.list.active') }}
        </button>
        <button
          @click="updateFilter('completed')"
          class="card border 2xl:text-base text-sm min-w-max uppercase"
          :class="filter === 'completed' ? 'border-rafik gradient-bg text-rafik' : 'border'"
        >
          {{ t('dashboard.assessments.list.completed') }}
        </button>
        <button
          @click="updateFilter('canceled')"
          class="card border 2xl:text-base text-sm min-w-max uppercase"
          :class="filter === 'canceled' ? 'border-rafik gradient-bg text-rafik' : 'border'"
        >
          {{ t('dashboard.assessments.list.canceled') }}
        </button>
      </div>
      <button @click="showAddAssessmentModal = true" class="min-w-max btn-sm-outline">
        {{ t('dashboard.assessments.list.createAssessment') }}
      </button>
    </div>

    <ul v-if="props.assessments?.length > 0" class="grid grid-cols-3 grid-rows-3 gap-6 items-center">
      <!--  
        When ready add the link to the router-link
        :to="{
          name: 'assessment-details',
          params: { id: assessment.id }
        }" 
        -->
        <router-link
       
        v-for="(assessment, index) in props.assessments"
        :key="assessment.id"
        class="h-full text-rafik-sectext dark:text-rafik-darksectext"
      >
        <div
          class="card p-6 w-full hover:border-rafik border border-transparent flex flex-col h-full"
        >
          <!-- Top Section: Trainee Details -->
          <div class="flex items-center justify-between gap-4 mb-4">
            <div class="flex items-center gap-3">
              <img
                :src="assessmentStore.trainees[assessment.trainees?.[0]]?.avatar || '/user-placeholder.jpg'"
                alt="Trainee Avatar"
                class="w-12 h-12 rounded-full border-2 border-rafik object-cover"
              />
              <div>
                <h3 class="title-small text-base 2xl:text-lg">
                  {{ assessmentStore.trainees[assessment.trainees?.[0]] ? 
                      `${assessmentStore.trainees[assessment.trainees?.[0]].first_name || ''} ${assessmentStore.trainees[assessment.trainees?.[0]].last_name || ''}`.trim() || 'Unknown Trainee' 
                      : 'Loading...' }}
                </h3>
              </div>
            </div>
            <p v-if="assessment.trainees && assessment.trainees.length > 1" class="label text-rafik-secondary text-xs">
              +{{ assessment.trainees.length - 1 }} more
            </p>
          </div>

          <!-- Middle Section: Assessment Template Name and Date -->
          <div class="flex-1 mb-4">
            <h2 class="title-small text-base 2xl:text-xl mb-2">
              {{ assessment.template_data ? 
                  (assessment.template_data.template_name || assessment.template_data.name || 'Untitled Assessment') 
                  : 'Loading...' }}
            </h2>
            <p class="label text-rafik-pritext dark:text-rafik-darkpritext">
              {{ formatDate(assessment.created_at) }}
            </p>
            
            <!-- Status Badge -->
            <div class="mt-3">
              <span 
                class="px-3 py-1 text-xs rounded-full font-semibold uppercase"
                :class="getStatusClasses(assessment.status)"
              >
                {{ assessment.status }}
              </span>
            </div>
          </div>

          <!-- Bottom Section: Assessors -->
          <div class="mt-auto">
            <p class="label text-rafik-pritext dark:text-rafik-darkpritext mb-2">
              {{ t('dashboard.assessments.list.assessors') }}
            </p>
            <div class="flex flex-wrap gap-1">
              <template v-if="assessment.assessors && assessment.assessors.length > 0">
                <router-link
                  v-for="(assessorId, index) in assessment.assessors"
                  :key="assessorId"
                  :to="{ name: 'single-user', params: { id: assessorId } }"
                  class="label text-rafik-secondary hover:text-rafik-pritext dark:hover:text-rafik-darkpritext transition-colors"
                  @click.stop
                >
                  {{ assessmentStore.assessors[assessorId] ? 
                      `${assessmentStore.assessors[assessorId].first_name || ''} ${assessmentStore.assessors[assessorId].last_name || ''}`.trim() || 'Unknown Assessor' 
                      : 'Loading...' }}{{ index < assessment.assessors.length - 1 ? ',' : '' }}
                </router-link>
              </template>
              <span v-else class="label text-rafik-sectext dark:text-rafik-darksectext">
                {{ t('dashboard.assessments.list.noAssessors') }}
              </span>
            </div>
          </div>
        </div>
      </router-link>
    </ul>
    
    <div v-else class="space-y-6 flex flex-col items-center py-12">
      <p class="text-rafik-pritext dark:text-rafik-darkpritext">
        {{ t('dashboard.assessments.list.noAssessmentsFound') }}
      </p>
    </div>

    <div v-if="props.assessments?.length > 0" class="flex justify-between items-center gap-4 my-6">
      <!-- Tabs Navigation -->
      <p class="header-small min-w-max">
        {{ t('dashboard.assessments.list.pageLabel') }} {{ page }}
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
        {{ t('dashboard.assessments.list.previousPage') }}
      </button>

      <button
        v-if="props.page < Math.ceil(props.count / 9)"
        @click="updatePage(pageEdit + 1)"
        class="px-4 py-2 text-rafik-sectext dark:text-rafik-darksectext min-w-max hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darkpritext"
      >
        {{ t('dashboard.assessments.list.nextPage') }}
      </button>
    </div>

    <!-- Add Assessment Modal (placeholder for now) -->
    <div v-if="showAddAssessmentModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="card p-8 max-w-md w-full mx-4">
        <h3 class="title-small mb-4">{{ t('dashboard.assessments.list.createAssessment') }}</h3>
        <p class="text-body mb-6">{{ t('dashboard.assessments.list.modalComingSoon') }}</p>
        <button @click="showAddAssessmentModal = false" class="btn-md w-full">
          {{ t('dashboard.assessments.list.close') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import router from '@/router';
import { ref, watch } from 'vue';
import debounce from 'lodash/debounce';
import { useAssessmentStore } from '@/stores/assessmentstores';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const assessmentStore = useAssessmentStore();

// Define the Assessment type
type Assessment = {
  id: number;
  created_at: string;
  slot: number;
  assessors?: string[];
  drills?: any[];
  trainees?: string[];
  started?: string | null;
  ended?: string | null;
  trainee_results?: any;
  overall_performance?: any;
  comments?: any[];
  summary?: string | null;
  status: string;
  organization?: number | null;
  template?: string | null;
  template_data?: any;
};

const props = defineProps<{
  assessments: Assessment[];
  page: number;
  count: number;
  filter: string;
}>();

const emits = defineEmits(['updatePage', 'updatePageSearch']);

// Helper functions
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function getStatusClasses(status: string): string {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'completed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    case 'canceled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

// Handle input change
function handleSearch(event: Event) {
  const target = event.target as HTMLInputElement;
  debouncedFetchAssessments(target.value);
}

const pageEdit = ref(props.page);
const filterEdit = ref(props.filter);
const showAddAssessmentModal = ref(false);
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

// Debounced function to fetch relevant assessments
const debouncedFetchAssessments = debounce((query: string) => {
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