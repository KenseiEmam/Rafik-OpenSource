<template>
  <div class="flex h-screen overflow-auto">
    <div class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 2xl:space-y-6 space-y-3">
      <!-- Page Title -->
      <PageTitle
        :subheader="t('dashboard.assessments.pageTitle.subheader')"
        :header="t('dashboard.assessments.pageTitle.header')"
      />

      <!-- Loading State -->
      <div
        v-if="loading"
        class="h-full flex flex-col gap-2 items-center justify-center text-center w-full text-body"
      >
        <img
          src="@/assets/Large Icon.png"
          class="w-24 h-24 animate-bounce hidden dark:inline-block"
          alt=""
        />
        <img
          src="@/assets/Large Icon Light.png"
          class="w-24 h-24 animate-bounce dark:hidden"
          alt=""
        />
        <p class="text-lg animate-pulse">
          {{ t('dashboard.assessments.loading') }}
        </p>
      </div>

      <!-- Assessment List -->
      <div v-else>
        <AssessmentList
          :assessments="paginatedAssessments"
          :page="currentPage"
          :count="filteredAssessments.length"
          :filter="currentFilter"
          @updatePage="handlePageUpdate"
          @updatePageSearch="handleSearchUpdate"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAssessmentStore } from '@/stores/assessmentstores';
import { useUserStore } from '@/stores/user';
import PageTitle from '@/components/Navigation/PageTitle.vue';
import AssessmentList from '@/components/AssessmentList.vue';

const { t } = useI18n();
const assessmentStore = useAssessmentStore();
const userStore = useUserStore();

// Local state
const loading = ref(true);
const currentPage = ref(1);
const currentFilter = ref('All');
const searchQuery = ref('');

// Computed properties
const allAssessments = computed(() => assessmentStore.AllAssessments);

// Filter assessments based on current filter and search
const filteredAssessments = computed(() => {
  let filtered = allAssessments.value;

  // Apply status filter
  if (currentFilter.value !== 'All') {
    filtered = filtered.filter(assessment => 
      assessment.status.toLowerCase() === currentFilter.value.toLowerCase()
    );
  }

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(assessment => {
      // Search by template name
      const templateName = assessment.template_data?.template_name?.toLowerCase() || '';
      if (templateName.includes(query)) return true;

      // Search by trainee names
      if (assessment.trainees) {
        for (const traineeId of assessment.trainees) {
          const trainee = assessmentStore.trainees.value[traineeId];
          if (trainee) {
            const traineeName = `${trainee.first_name || ''} ${trainee.last_name || ''}`.toLowerCase();
            if (traineeName.includes(query)) return true;
          }
        }
      }

      return false;
    });
  }

  return filtered;
});

// Paginate assessments
const paginatedAssessments = computed(() => {
  const start = (currentPage.value - 1) * 9;
  const end = start + 9;
  return filteredAssessments.value.slice(start, end);
});

// Handle page updates
function handlePageUpdate(page: number, filter: string) {
  currentPage.value = page;
  currentFilter.value = filter;
  searchQuery.value = ''; // Clear search when changing filter
}

// Handle search updates
function handleSearchUpdate(page: number, query: string, filter: string) {
  currentPage.value = page;
  searchQuery.value = query;
  currentFilter.value = filter;
}

// Fetch assessments
async function fetchAssessments() {
  if (!userStore.userProfile) return;
  
  try {
    loading.value = true;
    await assessmentStore.getAllAssessments(userStore.userProfile);
  } catch (error) {
    console.error('Error fetching assessments:', error);
  } finally {
    loading.value = false;
  }
}

// Initial load
onMounted(async () => {
  if (userStore.userProfile) {
    await fetchAssessments();
  } else {
    // Wait for user profile to be loaded
    await userStore.getUserProfile();
    await fetchAssessments();
  }
});
</script> 