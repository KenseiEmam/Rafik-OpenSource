<template>
  <div v-if="user"
    class="grid grid-cols-3 grid w-full my-3 rows-3 items-center relative flex-1 gap-4 items-stretch"
  >
  <div class="card row-span-2 p-6">
    <h3 class="2xl:contentH-small ">Performance Target</h3>
    <div class="grid grid-cols-2 h-full gap-3 content-center">
          <div class="flex flex-col h-full">

             <img src="https://www.iconpacks.net/icons/1/free-pie-chart-icon-683-thumb.png" class="w-full">
          </div>

      <div class="flex flex-col gap-3 h-full justify-center pb-3">
        <div class="flex justify-between w-full gap-3">
          <h4 class="header-small text-lg">
            Assessments conducted
          </h4>
         <p class="text-body">
           12
        </p>
        </div>
        <div class="flex justify-between w-full gap-3">
          <h4 class="header-small text-lg">
           Program Adjustments:
          </h4>
         <p class="text-body">
           12
        </p>
        </div>
        <div class="flex justify-between w-full gap-3">
          <h4 class="header-small text-lg">
            Athlete Performance:
          </h4>
         <p class="text-body">
           +20%
        </p>
        </div>
        <div class="flex justify-between w-full gap-3">
          <h4 class="header-small text-lg">
           General Reviews:
          </h4>
         <p class="text-body">
           4.5⭐
        </p>
        </div>
      </div>
    </div>
  </div>
  <div class="card  p-6">
    <h3 class="2xl:contentH-small ">Best Trainee</h3>
            <div class="flex flex-col  h-full justify-center">
      <div class="flex flex-col  h-full justify-center">
      <div class=" gradient-bg p-6 card">
          <div  class="flex items-center border-rafik-pribg dark:border-rafik-darkpribg justify-between gap-4 mb-4">
            <div class="flex items-center gap-3 ">
              <img
                :src="
                  '/user-placeholder.jpg'
                "
                alt="Trainee Avatar"
                class="w-14 h-14 2xl:w-24 2xl:h-24 rounded-full border-2 border-rafik object-cover"
              />
              <div>
                <h3 class="header-small">
                  Jill Rafik
                </h3>
               <!-- Middle Section: Assessment Template Name and Date -->
          <div class="flex-1 mb-4">
            <h2 class="title-small text-sm mb-2">
             #1 Top Athlete
            </h2>
            <p class="label text-rafik-pritext dark:text-rafik-darkpritext">
              {{ formatDate(new Date().toString()) }}
            </p>
              </div>
            </div>

          </div>
            <!-- Status Badge -->
            <div class="mt-3">
              <span
                class="px-3 py-1 bg-green-200 text-green-700 rounded-full font-semibold uppercase"

              >
                Active
              </span>
            </div>
          </div>
      </div>
    </div>
    </div>
  </div>
  <div class="card row-span-3 p-6">
    <h3 class="2xl:contentH-small ">Trainees Forms</h3>
          <!-- Search and Filter Controls -->
      <div class="flex justify-between items-end gap-4 my-3 relative">

        <!-- Type Buttons -->
        <div class="me-auto flex gap-4">
          <button
            @click="updateFilter('All')"
            class="card border 2xl:text-base text-sm min-w-max uppercase"
            :class="filters.type.length === 0 ? 'border-rafik gradient-bg text-rafik' : 'border'"
          >
            {{ t('dashboard.auditForms.list.filters.allForms') }}
          </button>
          <button
            @click="updateFilter('induction')"
            class="card border 2xl:text-base text-sm min-w-max uppercase"
            :class="
              filters.type.includes('induction') ? 'border-rafik gradient-bg text-rafik' : 'border'
            "
          >
            {{ t('dashboard.auditForms.list.filters.Induction') }}
          </button>
          <button
            @click="updateFilter('follow-up')"
            class="card border 2xl:text-base text-sm min-w-max uppercase"
            :class="
              filters.type.includes('follow-up') ? 'border-rafik gradient-bg text-rafik' : 'border'
            "
          >
            {{ t('dashboard.auditForms.list.filters.followup') }}
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <div v-if="forms && forms.length > 0 && !loading">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">
                {{ t('dashboard.auditForms.list.tableHeaders.created') }}
              </th>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">
                {{ t('dashboard.auditForms.list.tableHeaders.clientId') }}
              </th>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">
                {{ t('dashboard.auditForms.list.tableHeaders.program') }}
              </th>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">
                {{ t('dashboard.auditForms.list.tableHeaders.status') }}
              </th>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">
                {{ t('dashboard.auditForms.list.tableHeaders.numberOfQuestions') }}
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody class="space-y-6">
            <tr v-for="(form, index) in forms" :key="index" class="p-4">
              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg p-4 capitalize">
                {{
                  new Date(form.created_at).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) || '-'
                }}
              </td>
              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg p-4">
                <router-link
                  :to="{ name: 'single-user', params: { id: form.client_id } }"
                  class="text-rafik-pritext hover:text-rafik-pribg dark:text-rafik-darkpritext dark:hover:text-rafik-darkpribg"
                >
                  {{ form.client_id }}
                </router-link>
              </td>
              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg p-4 capitalize">
                <router-link
                  :to="{ name: 'program-details', params: { id: form.program_id } }"
                  class="text-rafik-pritext hover:text-rafik-pribg dark:text-rafik-darkpritext dark:hover:text-rafik-darkpribg"
                >
                  {{
                    ProgramStore.AllPrograms?.find(
                      (program:any) => parseInt(program.id) == form.program_id
                    )?.program_name || 'No Name found'
                  }}
                </router-link>
              </td>
              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg p-4">
                {{ form.status }}
              </td>
              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg p-4">
                {{ form.questions.length }}
              </td>
              <td class="px-3 bg-rafik-secbg dark:bg-rafik-darksecbg relative text-right">
                <svg
                  @click="() => chatsStore.openById(form.client_id, form.message_id)"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  class="text-rafik-sectext dark:text-rafik-darksectext h-7 mx-7 hover:text-rafik-pritext dark:hover:text-rafik-darkpritext cursor-pointer ms-auto"
                  viewBox="0 0 128 512"
                >
                  <path
                    d="M64 360a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm0-160a56 56 0 1 0 0 112 56 56 0 1 0 0-112zM120 96A56 56 0 1 0 8 96a56 56 0 1 0 112 0z"
                  />
                </svg>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Loading State -->
      <div
        v-else-if="loading"
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
          {{ t('dashboard.auditForms.list.loading') }}
        </p>
      </div>
      <!-- No Results -->
      <div v-else class="space-y-6 flex flex-col items-center py-12">
        <p class="text-rafik-pritext dark:text-rafik-darkpritext">
          {{ t('dashboard.auditForms.list.noResults') }}
        </p>
      </div>
      <!-- Pagination Controls -->
      <div
        v-if="!loading && ProgramStore.AllCount"
        class="flex justify-between items-center gap-4 my-6"
      >
        <!-- Page Number Tabs -->
        <p class="header-small min-w-max">
          {{ t('dashboard.auditForms.list.pagination.page', { page: page }) }}
        </p>
        <hr class="border w-full border-rafik-sectext dark:border-rafik-darksectext" />
        <div class="flex text-rafik-sectext dark:text-rafik-darksectext gap-4 px-4">
          <button
            v-for="p in Math.ceil(ProgramStore.AllCount / pageSize)"
            :key="p"
            @click="updatePage(p)"
            class="hover:text-rafik-pritext dark:hover:text-rafik-darkpritext"
            :class="p === page ? 'text-rafik-pritext dark:text-rafik-darkpritext' : ''"
          >
            {{ p }}
          </button>
        </div>
        <hr class="border w-full border-rafik-sectext dark:border-rafik-darksectext" />
        <!-- Previous/Next Buttons -->
        <button
          v-if="page > 1"
          @click="updatePage(page - 1)"
          class="px-4 py-2 text-rafik-sectext dark:text-rafik-darksectext min-w-max hover:text-rafik-pritext dark:hover:text-rafik-darkpritext"
        >
          {{ t('dashboard.auditForms.list.pagination.previousPage') }}
        </button>
        <button
          v-if="page < Math.ceil(ProgramStore.AllCount / pageSize)"
          @click="updatePage(page + 1)"
          class="px-4 py-2 text-rafik-sectext dark:text-rafik-darksectext min-w-max hover:text-rafik-pritext dark:hover:text-rafik-darkpritext"
        >
          {{ t('dashboard.auditForms.list.pagination.nextPage') }}
        </button>
      </div>
  </div>
  <div class="card p-6">
    <h3 class="2xl:contentH-small ">Trainees at Risk</h3>
            <div class="flex flex-col  h-full justify-center">
      <div class="flex flex-col  h-full justify-center">
      <div class=" gradient-bg p-6 card">
          <div  class="flex items-center border-rafik-pribg dark:border-rafik-darkpribg justify-between gap-4 mb-4">
            <div class="flex items-center gap-3 ">
              <img
                :src="
                  '/user-placeholder.jpg'
                "
                alt="Trainee Avatar"
                class="w-14 h-14 2xl:w-24 2xl:h-24 rounded-full border-2 border-rafik object-cover"
              />
              <div>
                <h3 class="header-small">
                  Bill Rafik
                </h3>
               <!-- Middle Section: Assessment Template Name and Date -->
          <div class="flex-1 mb-4">
            <h2 class="title-small text-sm text-red-400 mb-2">
             No Workouts
            </h2>
            <p class="label text-rafik-pritext dark:text-rafik-darkpritext">
              {{ formatDate(new Date().toString()) }}
            </p>
              </div>
            </div>

          </div>
            <!-- Status Badge -->
            <div class="mt-3">
              <span
                class="px-3 py-1 bg-amber-200 text-amber-700 rounded-full font-semibold uppercase"

              >
                Risk
              </span>
            </div>
          </div>
      </div>
    </div>
    </div>
  </div>
  <div class="card col-span-2 p-6">
    <div class="flex justify-between items-center">

      <h3 class="2xl:contentH-small ">Today's Assessments <span v-if="!loadAssessments">({{ assessments.length }})</span></h3>
      <router-link class="btn-sm-outline" :to="{name:'assessments'}">View My Asessments</router-link>
    </div>
    <div class="h-full w-full flex overflow-x-auto gap 3 ">
      <p class="m-auto" v-if="loadAssessments && assessments.length <= 0">Loading Assessment Data...</p>
      <p class="m-auto" v-else-if="!loadAssessments && assessments.length <= 0">No assessments for today.</p>
      <div class="flex flex-1 overflow-x-auto gap-3 items-center  " v-else>
           <router-link
        :to="{
          name: 'assessment-details',
          params: { id: assessment.id }
        }"
        v-for="(assessment, index) in assessments"
        :key="assessment.id"
        class=" text-rafik-sectext dark:text-rafik-darksectext"
      >
        <div
          class="gradient-bg card p-6 w-full hover:border-rafik border border-transparent flex flex-col"
        >
          <!-- Top Section: Trainee Details -->
          <div v-if="assessment.trainees" class="flex items-center border-b-2 py-4 border-rafik-pribg dark:border-rafik-darkpribg justify-between gap-4 mb-4">
            <div class="flex items-center gap-3 ">
              <img
                :src="
                  assessmentStore.trainees[assessment.trainees?.[0]]?.avatar ||
                  '/user-placeholder.jpg'
                "
                alt="Trainee Avatar"
                class="w-14 h-14 2xl:w-24 2xl:h-24 rounded-full border-2 border-rafik object-cover"
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
            <p class="label text-rafik-pritext dark:text-rafik-darkpritext">
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

            <!-- Reschedule Button (only for scheduled assessments) -->
            <div v-if="assessment.status === 'scheduled' && canReschedule(assessment)" class="mt-3">
              <button
                @click.stop="handleRescheduleClick(assessment)"
                class="btn-sm bg-rafik-secondary hover:bg-rafik text-white px-3 py-1 rounded text-xs"
              >
                {{ t('dashboard.settings.rescheduleAssessmentButton') }}
              </button>
            </div>
          </div>
        </div>
      </router-link>
      </div>
    </div>
  </div>

  <!-- Reschedule Modal -->
  <RescheduleModal
    :visible="showRescheduleModal"
    :assessmentData="selectedAssessment"
    :slotData="selectedSlot"
    @close="showRescheduleModal = false"
    @rescheduled="handleRescheduleComplete"
  />
  </div>
</template>

<script setup lang="ts">

import { supabase } from '@/lib/supabaseClient'; // Ensure Supabase is correctly set up
import { useI18n } from 'vue-i18n';
import { useAssessmentStore } from '@/stores/assessmentstores';
import PageTitle from '@/components/Navigation/PageTitle.vue';
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import debounce from 'lodash/debounce';
import { useProgramStore } from '@/stores/programstores';

import { useFormStore } from '@/stores/formstores';
import { useChatsStore } from '@/stores/chatsstores';

import { useUserStore } from '@/stores/user';
import { useSlotStore } from '@/stores/slotstores';

// Interface for Form
interface Form {
  id: string;
  created_at: Date;
  questions: any[];
  message_id: number;
  status: string;
  trainer_id: number;
  program_id: number;
  client_id: number;
  type: string;
}
type Filter = {
  client: number | null;
  type: string[];
  program: number | null;
  status: string;
};
// Search query and dropdown visibility
const searchQuery = ref('');
const dropdownVisible = ref(false);
const { t, locale } = useI18n();
const formStores = useFormStore();
const chatsStore = useChatsStore();
const forms = ref<Form[] | null>(null);
// The selected client (if needed for your filters)
const selectedTrainer = ref(null);
const isOrg = !!localStorage.getItem('OrgID');
// Filter options based on search query
const filteredOptions = computed(() => {
  if (!searchQuery.value) return clientOptions.value;
  return clientOptions.value.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Set the selected client and hide dropdown
function selectOption(option: any) {
  selectedTrainer.value = option;
  searchQuery.value = `${option.first_name} ${option.last_name}`;
  dropdownVisible.value = false;

  filters.value.client = option.id;
  console.log(filters.value.client, option, option.id);
  loadUsers();
}

// Optional: Hide the dropdown if clicking outside
document.addEventListener('click', (e: any) => {
  const el = document.querySelector('.relative');
  if (el && !el.contains(e.target)) {
    dropdownVisible.value = false;
  }
});

async function fetchFilteredTrainers() {
  dropdownVisible.value = true;
  if (!searchQuery.value) {
    clientOptions.value = [];
    return;
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .contains('roles', ['Trainee'])
    .or(
      `first_name.ilike.%${searchQuery.value}%, last_name.ilike.%${searchQuery.value}%, email.ilike.%${searchQuery.value}%`
    );

  if (error) {
    console.error('Error fetching trainers:', error.message);
    return;
  }

  clientOptions.value = data;
}
// Reset filter when search input is cleared (native clear button)
watch(searchQuery, (newValue) => {
  if (!newValue) resetFilter();
});
function resetFilter() {
  filters.value.client = null;
  filters.value.program = null;
  clientOptions.value = [];
  dropdownVisible.value = false;
  loadUsers();
}
function handleBlur() {
  setTimeout(() => {
    dropdownVisible.value = false;
  }, 200);
}

const loading = ref(true);
const ProgramStore = useProgramStore();
const totalCount = ref(0);
const page = ref(1);
const pageSize = ref(10);
const holdQuery = ref('');
const filters = ref<Filter>({ status: '', type: [], client: null, program: null });

const show_action = ref();

function handleLeave() {
  setTimeout(() => {
    show_action.value = null;
  }, 500);
}

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));
// Function to load program
async function loadUsers() {
  try {
    const res = await formStores.fetchForms(filters.value, page.value, pageSize.value);
    loading.value = false;
  } catch (error) {
    console.error('Error fetching program:', error);
  }
}

// Fetch Trainers

const clientOptions = ref<any[]>([]);

// Debounced search function
const debouncedFetchUsers = debounce((query: string) => {
  holdQuery.value = query;
  filters.value.status = query;
  page.value = 1;
  loadUsers();
}, 500);

function handleSearch(event: Event) {
  loading.value = true;
  const target = event.target as HTMLInputElement;
  debouncedFetchUsers(target.value);
}

function updateFilter(filterType: string) {
  loading.value = true;
  if (filterType === 'All') {
    filters.value.type = [];
  } else {
    filters.value.type = [filterType];
  }
  page.value = 1;
  loadUsers();
}

function updatePage(newPage: number) {
  loading.value = true;
  if (newPage >= 1 && newPage <= Math.ceil(ProgramStore.AllCount / pageSize.value)) {
    page.value = newPage;
    loadUsers();
  }
}

// Real-time subscription
function subscribeToChatMessages() {
  const channel = supabase.channel('chat_messages');

  channel
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, async () => {
      console.log('New message received, refetching...');
      await chatsStore.fetchLatestMessages();
    })
    .subscribe();
}

const clientStore = useUserStore();

onMounted(async () => {
  await loadUsers();
  await ProgramStore.getAllPrograms();
  await clientStore.getChatClients();
  await chatsStore.fetchLatestMessages();
  subscribeToChatMessages();
});

onUnmounted(() => {
  supabase.channel('chat_messages').unsubscribe();
});

// Watch for changes in the store's AllPrograms and update the list
watch(
  () => formStores.forms,
  (newUsers) => {
    forms.value = newUsers;
  }
);
watch(
  () => formStores.formcount,
  (newUsers) => {
    totalCount.value = newUsers;
  }
);
type Assessment = {
  id: number;
  created_at: string;
  slot: number;
  assessors?: string[]; // Array of user IDs (users table)
  drills?: any[];
  trainees?: string[]; // Array of user IDs (users table)
  started?: string | null;
  ended?: string | null;
  trainee_results?: any;
  overall_performance?: any;
  comments?: any[];
  summary?: string | null;
  status: string;
  organization?: number | null;
  template?: string | null; // The assessment_template id from the assessment_templates table
  template_data?: any; // To be fetched from the assessment_templates table
};

const assessments = ref<Assessment[]>([])
const loadAssessments = ref(false)
const assessmentStore = useAssessmentStore()
const userStore = useUserStore()
const slotStore = useSlotStore()

// Reschedule modal state
const showRescheduleModal = ref(false);
const selectedAssessment = ref<Assessment | null>(null);
const selectedSlot = ref<any>(null);

const props = defineProps({
  user: Object
});
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
    case 'complete':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    case 'canceled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

// Check if user can reschedule this assessment
function canReschedule(assessment: Assessment): boolean {
  const userRoles = userStore.userProfile?.roles || [];
  const userId = localStorage.getItem('UserID');

  // Organization Admin can reschedule any assessment
  if (userRoles.includes('Organization Admin')) {
    return true;
  }

  // Organization Trnr can only reschedule assessments they're assigned to
  if (userRoles.includes('Organization Trnr') && userId) {
    return assessment.assessors?.includes(userId) || false;
  }

  return false;
}

// Handle reschedule button click
async function handleRescheduleClick(assessment: Assessment) {
  try {
    // Find the associated slot
    const slot = slotStore.AllSlots.find((s:any) => s.assessment === assessment.id);
    if (!slot) {
      console.error('No slot found for assessment:', assessment.id);
      return;
    }

    selectedAssessment.value = assessment;
    selectedSlot.value = slot;
    showRescheduleModal.value = true;
  } catch (error) {
    console.error('Error preparing reschedule:', error);
  }
}

// Handle reschedule completion
async function handleRescheduleComplete() {
  showRescheduleModal.value = false;
  selectedAssessment.value = null;
  selectedSlot.value = null;

  // Refresh the assessments by refetching today's assessments
  if (props.user) {
    const result = await assessmentStore.getTodaysAssessments(props.user);
    assessments.value = result || [];
  }
}

onMounted(async () => {
  loadAssessments.value = true;

  try {
    const result = await assessmentStore.getTodaysAssessments(props.user);
    assessments.value = result || []; // fallback to empty array
  } catch (error) {
    console.error("Failed to load today's assessments:", error);
    assessments.value = [];
  } finally {
    loadAssessments.value = false;
  }
});


</script>
