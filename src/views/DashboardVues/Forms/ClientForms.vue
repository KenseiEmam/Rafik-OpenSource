<template>
  <div class="flex h-screen overflow-auto">
    <div class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 2xl:space-y-6 space-y-3">
      <!-- Page Title -->
      <PageTitle
        :subheader="t('dashboard.auditForms.list.pageTitle.subheader')"
        :header="t('dashboard.auditForms.list.pageTitle.header')"
      />
      <!-- Search and Filter Controls -->
      <div class="flex justify-between items-end gap-4 mb-3 relative">
        <!-- Status Select Bar -->
        <div class="relative w-128">
          <select
            @change="loadUsers"
            class="rafik-text-input"
            name=""
            v-model="filters.status"
            id=""
          >
            <option value="">{{ t('dashboard.auditForms.list.statusPlaceholder') }}</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
          </select>
        </div>
        <!-- Program Select Bar -->
        <div class="relative w-128">
          <select
            @change="loadUsers"
            class="rafik-text-input"
            name=""
            v-model="filters.program"
            id=""
          >
            <option :value="null">{{ t('dashboard.auditForms.list.programPlaceholder') }}</option>
            <option v-for="program in ProgramStore.AllPrograms" :value="program.id">
              {{ program.program_name }}
            </option>
          </select>
        </div>
        <!-- Trainer Selection -->
        <div class="w-64">
          <label
            class="block text-sm font-medium text-rafik-sectext dark:text-rafik-darksectext mb-1"
          >
            {{ t('dashboard.auditForms.list.selectTrainer.label') }}
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
              :placeholder="t('dashboard.auditForms.list.selectTrainer.placeholder')"
            />
            <!-- Dropdown -->
            <div
              v-if="dropdownVisible && clientOptions.length"
              class="absolute z-10 mt-1 w-full bg-rafik-secbg dark:bg-rafik-darksecbg border border-rafik-sectext dark:border-rafik-darksectext rounded-xl max-h-60 overflow-auto"
            >
              <div
                v-for="client in clientOptions"
                :key="client.id"
                @click="selectOption(client)"
                class="p-3 hover:bg-rafik-secondary hover:text-rafik-pritext cursor-pointer"
              >
                {{ client.first_name }} {{ client.last_name }}
                <span class="text-xs opacity-50"> {{ client.email }}</span>
              </div>
            </div>
          </div>
        </div>
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
                      (program) => parseInt(program.id) == form.program_id
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
  </div>
</template>
<script lang="ts" setup>
import PageTitle from '@/components/Navigation/PageTitle.vue';
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import debounce from 'lodash/debounce';
import { useProgramStore } from '@/stores/programstores';
import { supabase } from '@/lib/supabaseClient';
import { useFormStore } from '@/stores/formstores';
import { useChatsStore } from '@/stores/chatsstores';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user';

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
