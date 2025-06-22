<template>
  <div>
    <div class="flex justify-between items-center gap-4 mb-3">
      <!-- Search bar -->
      <div class="relative w-128">
        <input
          type="search"
          @input="handleSearch"
          class="block w-full p-4 text-sm text-topsets-sectext dark:text-topsets-darksectext border rounded-lg bg-topsets-pribg dark:bg-topsets-darkpribg"
          :placeholder="t('dashboard.assessments.list.typeToSearchAssessments')"
          required
        />
      </div>
      <div class="mr-auto flex gap-4">
        <button
          @click="updateFilter('All')"
          class="card border 2xl:text-base text-sm min-w-max uppercase"
          :class="filter === 'All' ? 'border-topsets gradient-bg text-topsets' : 'border'"
        >
          {{ t('dashboard.assessments.list.allAssessments') }}
        </button>
        <button
          @click="updateFilter('scheduled')"
          class="card border 2xl:text-base text-sm min-w-max uppercase"
          :class="filter === 'scheduled' ? 'border-topsets gradient-bg text-topsets' : 'border'"
        >
          {{ t('dashboard.assessments.list.scheduled') }}
        </button>
        <button
          @click="updateFilter('active')"
          class="card border 2xl:text-base text-sm min-w-max uppercase"
          :class="filter === 'active' ? 'border-topsets gradient-bg text-topsets' : 'border'"
        >
          {{ t('dashboard.assessments.list.active') }}
        </button>
        <button
          @click="updateFilter('completed')"
          class="card border 2xl:text-base text-sm min-w-max uppercase"
          :class="filter === 'completed' ? 'border-topsets gradient-bg text-topsets' : 'border'"
        >
          {{ t('dashboard.assessments.list.completed') }}
        </button>
        <button
          @click="updateFilter('canceled')"
          class="card border 2xl:text-base text-sm min-w-max uppercase"
          :class="filter === 'canceled' ? 'border-topsets gradient-bg text-topsets' : 'border'"
        >
          {{ t('dashboard.assessments.list.canceled') }}
        </button>
      </div>
      <router-link :to="{name:'events-calendar'}" class="min-w-max btn-md-outline
      flex group">
        <svg class="w-5 h-5 me-2 group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <div>Open Calendar</div>
      </router-link>
    </div>

    <ul
      v-if="props.assessments?.length > 0"
      class="grid grid-cols-3 grid-rows-3 gap-6 items-center flex-1 h-full"
    >
      <router-link
        :to="{
          name: 'assessment-details',
          params: { id: assessment.id }
        }"
        v-for="(assessment, index) in props.assessments"
        :key="assessment.id"
        class="h-full text-topsets-sectext dark:text-topsets-darksectext"
      >
        <div
          class="card px-10 p-6 w-full hover:border-topsets border border-transparent flex flex-col h-full"
        >
          <!-- Top Section: Trainee Details -->
          <div v-if="assessment.trainees" class="flex items-center border-b-2 py-4 border-topsets-pribg dark:border-topsets-darkpribg justify-between gap-4 mb-4">
            <div class="flex items-center gap-3 ">
              <img
                :src="
                  assessmentStore.trainees[assessment.trainees?.[0]]?.avatar ||
                  '/user-placeholder.jpg'
                "
                alt="Trainee Avatar"
                class="w-14 h-14 2xl:w-24 2xl:h-24 rounded-full border-2 border-topsets object-cover"
              />
              <div>
                <p class="header-small">
                  {{
                    assessmentStore.trainees[assessment.trainees?.[0]]
                      ? `${assessmentStore.trainees[assessment.trainees?.[0]].first_name || ''} ${assessmentStore.trainees[assessment.trainees?.[0]].last_name || ''}`.trim() ||
                        'Unknown Trainee'
                      : 'Loading...'
                  }}
                </p>
               <!-- Middle Section: Assessment Template Name and Date -->
          <div class="flex-1 mb-4">
            <h2 class="title-small text-base 2xl:text-xl mb-2">
              {{
                assessment.template && assessmentStore.templateData[assessment.template]
                  ? assessmentStore.templateData[assessment.template].template_name ||
                    assessmentStore.templateData[assessment.template].name ||
                    'Untitled Assessment'
                  : 'Loading...'
              }}
            </h2>
            <p class="label text-topsets-pritext dark:text-topsets-darkpritext">
              {{ formatDate(assessment.created_at) }}
            </p>
              </div>
            </div>

          </div>
            <!-- Status Badge -->
            <div class="mt-3">
              <span
                class="px-3 py-1 rounded-full font-semibold uppercase"
                :class="getStatusClasses(assessment.status)"
              >
                {{ assessment.status }}
              </span>
            </div>
          </div>

          <!-- Bottom Section: Assessors -->
          <div class="mt-auto ">
            <p class="label text-topsets-pritext dark:text-topsets-darkpritext mb-2 py-2">
              {{ t('dashboard.assessments.list.assessors') }}
            </p>
            <div class="flex flex-wrap gap-1">
              <template v-if="assessment.assessors && assessment.assessors.length > 0">
                <router-link
                  v-for="(assessorId, index) in assessment.assessors"
                  :key="assessorId"
                  :to="{ name: 'single-user', params: { id: assessorId } }"
                  class="label text-topsets-secondary card bg-topsets-pribg dark:bg-topsets-darkpribg hover:text-topsets-pritext dark:hover:text-topsets-darkpritext transition-colors"
                  @click.stop
                >
                  {{
                    assessmentStore.assessors[assessorId]
                      ? `${assessmentStore.assessors[assessorId].first_name || ''} ${assessmentStore.assessors[assessorId].last_name || ''}`.trim() ||
                        'Unknown Assessor'
                      : 'Loading...'
                  }}
                </router-link>
              </template>
              <span v-else class="label text-topsets-sectext dark:text-topsets-darksectext">
                {{ t('dashboard.assessments.list.noAssessors') }}
              </span>
            </div>
          </div>
        </div>
      </router-link>
    </ul>

    <div v-else class="space-y-6 flex flex-col items-center py-12">
      <p class="text-topsets-pritext dark:text-topsets-darkpritext">
        {{ t('dashboard.assessments.list.noAssessmentsFound') }}
      </p>
    </div>

    <div v-if="props.assessments?.length > 0" class="flex justify-between items-center gap-4 my-6">
      <!-- Tabs Navigation -->
      <p class="header-small min-w-max">
        {{ t('dashboard.assessments.list.pageLabel') }} {{ page }}
      </p>
      <hr class="border w-full border-topsets-sectext dark:border-topsets-darksectext" />
      <div class="flex text-topsets-sectext dark:text-topsets-darksectext gap-4 px-4">
        <button
          v-for="p in Math.ceil(props.count / 9)"
          :key="p"
          @click="updatePage(p)"
          class="hover:text-topsets-pritext dark:hover:text-topsets-darkpritext dark:text-topsets-darkpritext"
          :class="{ 'text-topsets-pritext dark:text-topsets-darkpritext': p === page }"
        >
          {{ p }}
        </button>
      </div>
      <hr class="border w-full border-topsets-sectext dark:border-topsets-darksectext" />
      <button
        v-if="props.page > 1"
        @click="updatePage(pageEdit - 1)"
        class="px-4 py-2 text-topsets-sectext dark:text-topsets-darksectext min-w-max hover:text-topsets-pritext dark:hover:text-topsets-darkpritext dark:text-topsets-darkpritext"
      >
        {{ t('dashboard.assessments.list.previousPage') }}
      </button>

      <button
        v-if="props.page < Math.ceil(props.count / 9)"
        @click="updatePage(pageEdit + 1)"
        class="px-4 py-2 text-topsets-sectext dark:text-topsets-darksectext min-w-max hover:text-topsets-pritext dark:hover:text-topsets-darkpritext dark:text-topsets-darkpritext"
      >
        {{ t('dashboard.assessments.list.nextPage') }}
      </button>
    </div>

    <!-- Add Assessment Modal (placeholder for now) -->
    <div
      v-if="showAddAssessmentModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="card p-8 max-w-md w-full mx-4">
        <h3 class="title-small mb-4">{{ t('dashboard.assessments.list.createAssessment') }}</h3>
        <p class="text-body mb-6">{{ t('dashboard.assessments.list.modalComingSoon') }}</p>
        <button @click="showAddAssessmentModal = false" class="btn-md w-full">
          View Calendar
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import router from '@/router';
import { ref, watch } from 'vue';
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
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
  const query = target.value;
  holdQuery.value = query;
  if (query) {
    emits('updatePageSearch', pageEdit.value, query, filterEdit.value);
  } else {
    // Clear search when query is empty
    emits('updatePage', 1, filterEdit.value);
  }
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

</style>
