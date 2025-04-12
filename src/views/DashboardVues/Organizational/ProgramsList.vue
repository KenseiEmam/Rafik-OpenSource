<template>
  <div class="flex h-screen overflow-auto">
    <div class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 2xl:space-y-6 space-y-3">
      <!-- Page Title -->
      <PageTitle
        :subheader="t('dashboard.auditPrograms.list.pageOrgTitle.subheader')"
        :header="t('dashboard.auditPrograms.list.pageOrgTitle.header')"
      />
      <!-- Search and Filter Controls -->
      <div class="flex justify-between items-end gap-4 mb-3 relative">
        <!-- Search Bar -->
        <div class="relative w-128">
          <input
            type="search"
            @input="handleSearch"
            class="block w-full p-4 text-sm text-rafik-sectext dark:text-rafik-darksectext border rounded-lg bg-rafik-pribg dark:bg-rafik-darkpribg"
            :placeholder="t('dashboard.auditPrograms.list.searchPlaceholder')"
            required
          />
        </div>
        <!-- Trainer Selection -->
        <div class="w-64">
          <label
            class="block text-sm font-medium text-rafik-sectext dark:text-rafik-darksectext mb-1"
          >
            {{ t('dashboard.auditPrograms.list.selectTrainer.label') }}
          </label>
          <div class="relative">
            <!-- Search Input -->
            <input
              type="search"
              v-model="searchQuery"
              @focus="dropdownVisible = true"
              @input="fetchFilteredTrainers"
              @blur="handleBlur"
              class="w-full p-3 border rounded-xl bg-rafik-secbg dark:bg-rafik-darksecbg text-rafik-sectext dark:text-rafik-darksectext focus:outline-none"
              :placeholder="t('dashboard.auditPrograms.list.selectTrainer.placeholder')"
            />
            <!-- Dropdown -->
            <div
              v-if="dropdownVisible && trainerOptions.length"
              class="absolute z-10 mt-1 w-full bg-rafik-secbg dark:bg-rafik-darksecbg border border-rafik-sectext dark:border-rafik-darksectext rounded-xl max-h-60 overflow-auto"
            >
              <div
                v-for="trainer in trainerOptions"
                :key="trainer.id"
                @click="selectOption(trainer)"
                class="p-3 hover:bg-rafik-secondary hover:text-rafik-pritext cursor-pointer"
              >
                {{ trainer.first_name }} {{ trainer.last_name }}
                <span class="text-xs opacity-50"> {{ trainer.email }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- Filter Buttons -->
        <div class="me-auto flex gap-4">
          <button
            @click="updateFilter('All')"
            class="card border 2xl:text-base text-sm min-w-max uppercase"
            :class="filters.status.length === 0 ? 'border-rafik gradient-bg text-rafik' : 'border'"
          >
            {{ t('dashboard.auditPrograms.list.filters.allPrograms') }}
          </button>
          <button
            @click="updateFilter('Active')"
            class="card border 2xl:text-base text-sm min-w-max uppercase"
            :class="
              filters.status.includes('Active') ? 'border-rafik gradient-bg text-rafik' : 'border'
            "
          >
            {{ t('dashboard.auditPrograms.list.filters.active') }}
          </button>
          <button
            @click="updateFilter('Draft')"
            class="card border 2xl:text-base text-sm min-w-max uppercase"
            :class="
              filters.status.includes('Draft') ? 'border-rafik gradient-bg text-rafik' : 'border'
            "
          >
            {{ t('dashboard.auditPrograms.list.filters.draft') }}
          </button>
          <button
            @click="updateFilter('Review')"
            class="card border 2xl:text-base text-sm min-w-max uppercase"
            :class="
              filters.status.includes('Review') ? 'border-rafik gradient-bg text-rafik' : 'border'
            "
          >
            {{ t('dashboard.auditPrograms.list.filters.review') }}
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <div v-if="programs && programs.length > 0 && !loading">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">
                {{ t('dashboard.auditPrograms.list.tableHeaders.programName') }}
              </th>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">
                {{ t('dashboard.auditPrograms.list.tableHeaders.difficulty') }}
              </th>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">
                {{ t('dashboard.auditPrograms.list.tableHeaders.status') }}
              </th>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">
                {{ t('dashboard.auditPrograms.list.tableHeaders.trainer') }}
              </th>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">
                {{ t('dashboard.auditPrograms.list.tableHeaders.price') }}
              </th>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">
                {{ t('dashboard.auditPrograms.list.tableHeaders.workoutsPerWeek') }}
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody class="space-y-6">
            <tr v-for="program in programs" :key="program.id" class="p-4">
              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg p-4">
                {{ program.program_name }}
              </td>
              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg p-4 capitalize">
                {{ program.difficulty_level }}
              </td>
              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg p-4 capitalize">
                {{ program.status }}
              </td>
              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg p-4">
                <router-link
                  :to="{ name: 'single-user', params: { id: program.trainer_id } }"
                  class="text-rafik-pritext hover:text-rafik-pribg dark:text-rafik-darkpritext dark:hover:text-rafik-darkpribg"
                >
                  {{ program.trainer_id }}
                </router-link>
              </td>
              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg p-4">
                {{ program.price_one }}
              </td>
              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg p-4">
                {{ program.avg_days_per_week }}
              </td>
              <td
                class="px-3 bg-rafik-secbg dark:bg-rafik-darksecbg relative text-right "
              >
                <svg
                  @click="show_action = program.id"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  class="text-rafik-sectext dark:text-rafik-darksectext h-7 mx-7 hover:text-rafik-pritext dark:hover:text-rafik-darkpritext cursor-pointer ms-auto"
                  viewBox="0 0 128 512"
                >
                  <path
                    d="M64 360a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm0-160a56 56 0 1 0 0 112 56 56 0 1 0 0-112zM120 96A56 56 0 1 0 8 96a56 56 0 1 0 112 0z"
                  />
                </svg>
                <div
                  v-if="show_action == program.id"
                  @mouseleave="handleLeave()"
                  class="absolute min-w-16  z-40 top-15 right-0 flex flex-col items-end text-sm rounded bg-rafik-secbg dark:bg-rafik-darksecbg shadow-lg divide-y divide-rafik-sectext dark:divide-rafik-darksectext"
                >
                  <Router-link
                    :to="{ name: 'audit-program', params: { id: program.id } }"
                    class="px-3 py-5 hover:bg-rafik-pribg w-full text-center dark:bg-rafik-darkpribg hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darksectext rounded"
                  >
                    {{ t('dashboard.auditPrograms.list.actions.viewProgram') }}
                  </Router-link>
                  <button
                    class="px-3 py-5 text-red-500 hover:bg-rafik-pribg dark:bg-rafik-darkpribg hover:text-red-300 rounded"
                  >
                    {{ t('dashboard.auditPrograms.list.actions.deleteProgram') }}
                  </button>
                </div>
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
          {{ t('dashboard.auditPrograms.list.loading') }}
        </p>
      </div>
      <!-- No Results -->
      <div v-else class="space-y-6 flex flex-col items-center py-12">
        <p class="text-rafik-pritext dark:text-rafik-darkpritext">
          {{ t('dashboard.auditPrograms.list.noResults') }}
        </p>
      </div>
      <!-- Pagination Controls -->
      <div
        v-if="!loading && ProgramStore.All_Org_Count"
        class="flex justify-between items-center gap-4 my-6"
      >
        <!-- Page Number Tabs -->
        <p class="header-small min-w-max">
          {{ t('dashboard.auditPrograms.list.pagination.page', { page: page }) }}
        </p>
        <hr class="border w-full border-rafik-sectext dark:border-rafik-darksectext" />
        <div class="flex text-rafik-sectext dark:text-rafik-darksectext gap-4 px-4">
          <button
            v-for="p in Math.ceil(ProgramStore.All_Org_Count / pageSize)"
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
          {{ t('dashboard.auditPrograms.list.pagination.previousPage') }}
        </button>
        <button
          v-if="page < Math.ceil(ProgramStore.All_Org_Count / pageSize)"
          @click="updatePage(page + 1)"
          class="px-4 py-2 text-rafik-sectext dark:text-rafik-darksectext min-w-max hover:text-rafik-pritext dark:hover:text-rafik-darkpritext"
        >
          {{ t('dashboard.auditPrograms.list.pagination.nextPage') }}
        </button>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import PageTitle from '@/components/Navigation/PageTitle.vue';
import { ref, computed, onMounted, watch } from 'vue';
import debounce from 'lodash/debounce';
import { useProgramStore } from '@/stores/programstores';
import { supabase } from '@/lib/supabaseClient';
import { ModelSelect } from 'vue-search-select';
import vSelect from 'vue-select-next';
import { useI18n } from 'vue-i18n';
// Search query and dropdown visibility
const searchQuery = ref('');
const dropdownVisible = ref(false);
const { t , locale } = useI18n();

// The selected trainer (if needed for your filters)
const selectedTrainer = ref(null);

// Filter options based on search query
const filteredOptions = computed(() => {
  if (!searchQuery.value) return trainerOptions.value;
  return trainerOptions.value.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Set the selected trainer and hide dropdown
function selectOption(option: any) {
  selectedTrainer.value = option;
  searchQuery.value = `${option.first_name} ${option.last_name}`;
  dropdownVisible.value = false;

  filters.value.trainer = option.id;
  console.log(filters.value.trainer, option, option.id);
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
    trainerOptions.value = [];
    return;
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .contains('roles', ['Trainer'])
    .or(
      `first_name.ilike.%${searchQuery.value}%, last_name.ilike.%${searchQuery.value}%, email.ilike.%${searchQuery.value}%`
    );

  if (error) {
    console.error('Error fetching trainers:', error.message);
    return;
  }

  trainerOptions.value = data;
}
// Reset filter when search input is cleared (native clear button)
watch(searchQuery, (newValue) => {
  if (!newValue) resetFilter();
});
function resetFilter() {
  filters.value.trainer = null;
  trainerOptions.value = [];
  dropdownVisible.value = false;
  loadUsers();
}
function handleBlur() {
  setTimeout(() => {
    dropdownVisible.value = false;
  }, 200);
}
type Program = {
  id: string;
  created_at?: Date;
  program_name?: string;
  program_description?: string;
  program_focus?: string[]; // Add program_focus here (assumed to be an array of strings)
  status?: string;
  trainer_id?: number;
  difficulty_level?: string;
  avg_session_time?: number;
  avg_days_per_week?: number;
  overall_rating?: number;
  price_one?: number;
  price_three?: number;
  price_six?: number;
  price_year?: number;
  tags?: string[];
  workouts?: Workout[];
  program_photo?: string;
  weekly_cycle?: number;
  promos?: PromoCode[];
  induction?: Question[];
  follow?: Question[];
  referral?: string;
  // Add any other properties your program might have
};
interface Question {
  type: string;
  question?: string;
  answer?: any;
}
// Promo Codes
type PromoCode = {
  code: string;
  value: number;
};
type Workout = {
  workout_name: string;
  workout_summary?: string;
  time_to_complete?: string;
  sets_per_session?: number;
  rest_day?: boolean;
  exercises: Exercise[];
};
type Exercise = {
  id: string;
  exercise_name?: string;
  type?: string;
  intensity?: string;
  sets?: number;
  reps?: number;
};

type Filter = {
  trainer: number | null;
  name: string;
  status: string[];
};
const loading = ref(true);
const ProgramStore = useProgramStore();
const programs = ref<Program[] | null>(null);
const totalCount = ref(0);
const page = ref(1);
const pageSize = ref(10);
const holdQuery = ref('');
const filters = ref<Filter>({ status: [], name: '', trainer: null });

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
    const res = await ProgramStore.fetchOrgAuditPrograms(filters.value, page.value, pageSize.value);
    loading.value = false;
  } catch (error) {
    console.error('Error fetching program:', error);
  }
}

// Fetch Trainers

const trainerOptions = ref<any[]>([]);

// Debounced search function
const debouncedFetchUsers = debounce((query: string) => {
  holdQuery.value = query;
  filters.value.name = query;
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
    filters.value.status = [];
  } else {
    filters.value.status = [filterType];
  }
  page.value = 1;
  loadUsers();
}
function calculateAge(dob: Date) {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // Adjust age if birthday hasn't happened yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
function updatePage(newPage: number) {
  loading.value = true;
  if (newPage >= 1 && newPage <= Math.ceil(ProgramStore.All_Org_Count / pageSize.value)) {
    page.value = newPage;
    loadUsers();
  }
}

// Load program on component mount
onMounted(() => {
  loadUsers();
});

// Watch for changes in the store's AllPrograms and update the list
watch(
  () => ProgramStore.All_Org_Programs,
  (newUsers) => {
    programs.value = newUsers;
  }
);
watch(
  () => ProgramStore.All_Org_Count,
  (newUsers) => {
    totalCount.value = newUsers;
  }
);
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: separate; /* Keep this for row spacing */
  border-spacing: 0 1rem; /* Add vertical spacing between rows */
}

tbody > tr {
  border-radius: 0.375rem;
  outline: 1px solid rgba(0, 0, 0, 0.175);
}
/* Light Mode Styles */
.custom-v-select .vs__dropdown-toggle,
.custom-v-select .vs__selected,
.custom-v-select input,
.custom-v-select .vs__search {
  background-color: #f3eeeb !important; /* rafik.pribg */
  border: 1px solid #8c644c !important; /* rafik.sectext */
  color: #8c644c !important; /* rafik.sectext */
}

.card:hover {
  background-image: linear-gradient(135deg, #f3eeeb 36%, #fff2cb);
}
.dark .card:hover {
  background-image: linear-gradient(135deg, #081411 36%, #295f42);
}
</style>
