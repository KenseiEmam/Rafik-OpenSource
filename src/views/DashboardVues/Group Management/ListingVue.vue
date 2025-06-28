<template>
  <div :dir="locale === 'ar' ? 'rtl' : 'ltr'" class="flex h-screen overflow-auto">
    <div class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 2xl:space-y-6 space-y-3">
      <!-- Page Title -->
      <PageTitle
        :subheader="t('dashboard.groups.pageTitle.subheader')"
        :header="t('dashboard.groups.pageTitle.header')"
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
          {{ t('dashboard.groups.loading') }}
        </p>
      </div>

      <!-- Group List -->
      <div class="h-full" v-else>
        <GroupList
          :groups="paginatedGroups"
          :page="currentPage"
          :count="filteredGroups.length"
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
import { useGroupStore } from '@/stores/groupstores';
import { useUserStore } from '@/stores/user';
import PageTitle from '@/components/Navigation/PageTitle.vue';
import GroupList from '@/components/Groups/GroupList.vue';

const { t, locale } = useI18n();
const groupStore = useGroupStore();
const userStore = useUserStore();

// Local state
const loading = ref(true);
const currentPage = ref(1);
const currentFilter = ref('All');
const searchQuery = ref('');

// Computed properties
const allGroups = computed(() => groupStore.AllGroups);

// Filter groups based on current filter and search
const filteredGroups = computed(() => {
  let filtered = allGroups.value;

  // Apply status filter
  if (currentFilter.value !== 'All') {
    filtered = filtered.filter(group =>
      group.status.toLowerCase() === currentFilter.value.toLowerCase()
    );
  }

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.trim().toLowerCase();
    filtered = filtered.filter(group => {
      const name = group.group_name.toLowerCase();
      const desc = (group.group_description || '').toLowerCase();
      return name.includes(query) || desc.includes(query);
    });
  }

  return filtered;
});

// Paginate groups
const paginatedGroups = computed(() => {
  const start = (currentPage.value - 1) * 9;
  const end = start + 9;
  return filteredGroups.value.slice(start, end);
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

// Fetch groups
async function fetchGroups() {
  if (!userStore.userProfile) return;

  try {
    loading.value = true;
    await groupStore.getAllGroups(userStore.userProfile);
  } catch (error) {
    console.error('Error fetching groups:', error);
  } finally {
    loading.value = false;
  }
}

// Initial load
onMounted(async () => {
  if (userStore.userProfile) {
    await fetchGroups();
  } else {
    // Wait for user profile to be loaded
    await userStore.getUserProfile();
    await fetchGroups();
  }
});
</script>
