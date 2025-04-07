<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useProgramStore } from '@/stores/programstores';
import DetailsTabProgram from '@/components/ProgramTabs/DetailsTabPRogram.vue';
import WorkoutPlanner from '@/components/ProgramTabs/WorkoutPlanner.vue';
import ClientTable from '@/components/ProgramTabs/ClientTable.vue';
import PricingModel from '@/components/ProgramTabs/PricingModel.vue';
// import DocumentsForms from '@/components/ProgramTabs/DocumentsForms.vue';
import ReviewsTab from '@/components/ProgramTabs/ReviewsTab.vue';
import Swal from 'sweetalert2';
import router from '@/router';
import { useI18n } from 'vue-i18n';

const activeTab = ref('Details');
const { t, locale } = useI18n();
// Access the route object and store
const route = useRoute();
const isOrg = !!localStorage.getItem('isOrg');
const programStore = useProgramStore();

// Function to refresh the current route (if needed)
function refreshComponent() {
  router.go(0);
}
// Clean up the store on component unmount
onBeforeUnmount(() => {
  programStore.wipeOut();
});

// Fetch the program details when the component mounts
onMounted(() => {
  const programId = route.params.id as string;
  if (programId) {
    programStore.fetchProgram(programId).catch(() => {
      Swal.fire({
        title: t('general.error'),
        text: 'Failed to load program details.',
        icon: 'error',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#d33',
        background: '#081411',
        color: '#E8F3ED'
      });
    });
  }
});

// Handler to change active tab
function setActiveTab(tab: string) {
  activeTab.value = tab;
}
</script>

<template>
  <div class="flex h-screen overflow-auto">
    <div
      v-if="programStore.Program"
      class="flex-1 px-8 py-12 w-full 2xl:px-12 2xl:py-24 space-y-3 2xl:space-y-6"
    >
      <div
        class="border group flex flex-col relative border-rafik-alternate rounded-lg overflow-hidden"
      >
        <img
          :src="programStore.Program.program_photo"
          class="w-full h-full object-cover absolute"
          :alt="t('dashboard.auditPrograms.single.alt.programPhoto')"
        />
        <div class="w-full opacity-70 h-full bg-rafik-pribg dark:bg-rafik-darkpribg absolute"></div>
        <div
          class="p-8 2xl:p-16 2xl:py-24 space-y-4 relative grid items-stretch grid-cols-4 divide-x divide-rafik-sectext dark:divide-rafik-darksectext divide-x-solid"
        >
          <div class="pr-6 space-y-4 col-span-3">
            <div class="flex items-center justify-between">
              <!-- Non-editable Title -->
              <h1 class="title-small w-1/3">
                {{
                  programStore.Program?.program_name || t('dashboard.auditPrograms.single.loading')
                }}
              </h1>
              <h2 class="header-medium">
                {{ programStore.Program?.status || t('dashboard.auditPrograms.single.loading') }}
              </h2>
            </div>

            <!-- Non-editable Description -->
            <p class="text-body text-justify 2xl:w-5/6">
              {{
                programStore.Program?.program_description ||
                t('dashboard.auditPrograms.single.loading')
              }}
            </p>

            <!-- Additional Program Details -->
            <div class="flex gap-8 justify-between">
              <h3 class="uppercase flex gap-2 items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  stroke="currentColor"
                  class="w-6 text-rafik-sectext dark:text-rafik-darksectext"
                  viewBox="0 0 448 512"
                >
                  <path
                    d="M160 80c0-26.5 21.5-48 48-48l32 0c26.5 0 48 21.5 48 48l0 352c0 26.5-21.5 48-48 48l-32 0c-26.5 0-48-21.5-48-48l0-352zM0 272c0-26.5 21.5-48 48-48l32 0c26.5 0 48 21.5 48 48l0 160c0 26.5-21.5 48-48 48l-32 0c-26.5 0-48-21.5-48-48L0 272zM368 96l32 0c26.5 0 48 21.5 48 48l0 288c0 26.5-21.5 48-48 48l-32 0c-26.5 0-48-21.5-48-48l0-288c0-26.5 21.5-48 48-48z"
                  />
                </svg>
                {{ programStore.Program.difficulty_level }}
              </h3>
              <h3 class="uppercase flex gap-2 items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  stroke="currentColor"
                  class="w-6 text-rafik-sectext dark:text-rafik-darksectext"
                  viewBox="0 0 448 512"
                >
                  <path
                    d="M176 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l16 0 0 34.4C92.3 113.8 16 200 16 304c0 114.9 93.1 208 208 208s208-93.1 208-208c0-41.8-12.3-80.7-33.5-113.2l24.1-24.1c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L355.7 143c-28.1-23-62.2-38.8-99.7-44.6L256 64l16 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L224 0 176 0zm72 192l0 128c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-128c0-13.3 10.7-24 24-24s24 10.7 24 24z"
                  />
                </svg>
                {{ programStore.Program.avg_session_time }}
                {{ t('dashboard.auditPrograms.single.avgSessionTime') }}
              </h3>
              <h3 class="uppercase flex gap-2 items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  stroke="currentColor"
                  class="w-6 text-rafik-sectext dark:text-rafik-darksectext"
                  viewBox="0 0 448 512"
                >
                  <path
                    d="M96 32l0 32L48 64C21.5 64 0 85.5 0 112l0 48 448 0 0-48c0-26.5-21.5-48-48-48l-48 0 0-32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 32L160 64l0-32c0-17.7-14.3-32-32-32S96 14.3 96 32zM448 192L0 192 0 464c0 26.5 21.5 48 48 48l352 0c26.5 0 48-21.5 48-48l0-272z"
                  />
                </svg>
                {{ programStore.Program.avg_days_per_week }}
                {{ t('dashboard.auditPrograms.single.daysPerWeek') }}
              </h3>
            </div>
          </div>
          <div class="pl-6 flex-1 min-w-max">
            <div
              class="flex flex-col flex-1 gap-4 border-rafik-sectext dark:border-rafik-darksectext text-left justify-center"
            >
              <button
                class="uppercase text-left hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darkpritext"
                v-if="programStore.Program.status == 'Review'"
              >
                {{ t('dashboard.auditPrograms.single.actions.acceptPublish') }}
              </button>
              <button
                class="uppercase text-left text-red-500 hover:text-red-400"
                v-if="programStore.Program.status == 'Review'"
              >
                {{ t('dashboard.auditPrograms.single.actions.denyRequest') }}
              </button>
              <button
                class="uppercase text-left text-rafik-secondary hover:text-rafik"
                v-if="programStore.Program.status == 'Active' && !isOrg"
              >
                {{ t('dashboard.auditPrograms.single.actions.resetToDraft') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
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
          {{ t('dashboard.auditPrograms.single.tabs.details') }}
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
          {{ t('dashboard.auditPrograms.single.tabs.workouts') }}
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
          {{ t('dashboard.auditPrograms.single.tabs.clients') }}
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
          {{ t('dashboard.auditPrograms.single.tabs.pricing') }}
        </button>
        <button
          :class="
            activeTab === 'Reviews'
              ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default'
              : 'hover:opacity-70'
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Reviews')"
        >
          Reviews
        </button>
      </div>

      <!-- Tab Content -->
      <div style="min-height: 50vh" class="over-flow-y-auto flex-1">
        <transition name="fade">
          <DetailsTabProgram admin v-if="activeTab === 'Details'" :program="programStore.Program" />
          <WorkoutPlanner
            admin
            v-else-if="activeTab === 'Workouts'"
            :program="programStore.Program"
          />
          <ClientTable admin v-else-if="activeTab === 'Clients'" :program="programStore.Program" />
          <PricingModel admin v-else-if="activeTab === 'Pricing'" :program="programStore.Program" />
          <!-- <DocumentsForms v-else-if="activeTab === 'Documents'" :program="programStore.Program" /> -->
          <ReviewsTab admin v-else-if="activeTab === 'Reviews'" :program="programStore.Program" />
        </transition>
      </div>
    </div>
  </div>
</template>
