<template>
  <div class="flex h-screen overflow-auto">
    <div class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 2xl:space-y-6 space-y-3">
      <!-- Page Title -->
      <PageTitle
        :subheader="t('dashboard.users.list.pageTitleOrg.subheader')"
        :header="t('dashboard.users.list.pageTitleOrg.header')"
      />
      <!-- Search and Filter Controls -->
      <div class="flex justify-between items-center gap-4 mb-3">
        <!-- Search Bar -->
        <div class="relative w-128">
          <input
            type="search"
            @input="handleSearch"
            class="block w-full p-4 text-sm text-rafik-sectext dark:text-rafik-darksectext border rounded-lg bg-rafik-pribg dark:bg-rafik-darkpribg"
            :placeholder="t('dashboard.users.list.searchPlaceholder')"
            required
          />
        </div>
        <!-- Filter Buttons -->
        <div class="me-auto flex gap-4">
          <button
            @click="updateFilter('All')"
            class="card border 2xl:text-base text-sm min-w-max uppercase"
            :class="filters.roles.length === 0 ? 'border-rafik gradient-bg text-rafik' : 'border'"
          >
            {{ t('dashboard.users.list.filters.allUsers') }}
          </button>
          <button
            @click="updateFilter('Organization Trnr')"
            class="card border 2xl:text-base text-sm min-w-max uppercase"
            :class="
              filters.roles.includes('Trainer') ? 'border-rafik gradient-bg text-rafik' : 'border'
            "
          >
            {{ t('dashboard.users.list.filters.trainer') }}
          </button>
          <button
            @click="updateFilter('Trainee')"
            class="card border 2xl:text-base text-sm min-w-max uppercase"
            :class="
              filters.roles.includes('Trainee') ? 'border-rafik gradient-bg text-rafik' : 'border'
            "
          >
            {{ t('dashboard.users.list.filters.trainee') }}
          </button>
        </div>
        <div class="flex gap-2">
          <button @click="showAssignEntitlementModal = true" class="btn-md-outline rounded">
            {{ t('dashboard.users.list.assignBulk') }}
          </button>
          <button @click="showAddUserModal = true" class="btn-md rounded">
            {{ t('dashboard.users.list.addUser') }}
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <div v-if="users.length > 0 && !loading">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">
                {{ t('dashboard.users.list.tableHeaders.id') }}
              </th>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">
                {{ t('dashboard.users.list.tableHeaders.details') }}
              </th>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">
                {{ t('dashboard.users.list.tableHeaders.roles') }}
              </th>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">
                {{ t('dashboard.users.list.tableHeaders.gender') }}
              </th>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">
                {{ t('dashboard.users.list.tableHeaders.age') }}
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody class="space-y-6">
            <tr v-for="user in users" :key="user.id" class="p-4">
              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg p-4">
                {{ user.id }}
              </td>
              <td
                class="flex gap-6 text-left items-center py-4 pl-3 bg-rafik-secbg dark:bg-rafik-darksecbg"
              >
                <img
                  :src="
                    user.avatar ||
                    'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'
                  "
                  class="w-12 rounded-full border-2 border-rafik h-12"
                  alt="Avatar"
                />
                <div>
                  <p class="header-small">{{ user.first_name }} {{ user.last_name }}</p>
                  <p>{{ user.email }}</p>
                </div>
              </td>
              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg p-4 capitalize">
                <div class="flex flex-wrap text-sm items-center">
                  <p v-for="(role, index) in user.roles" :key="index">
                    {{ role }}
                    <span v-if="index !== user.roles.length - 1">-</span>
                  </p>
                </div>
              </td>
              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg p-4 capitalize">
                {{ user.sex }}
              </td>
              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg p-4">
                {{ calculateAge(user.dob) || 'N/A' }}
              </td>
              <td class="px-3 bg-rafik-secbg dark:bg-rafik-darksecbg relative text-right">
                <svg
                  @click="show_action = user.id"
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
                  v-if="show_action == user.id"
                  @mouseleave="handleLeave()"
                  class="absolute min-w-16 px-2 z-40 top-15 right-0 flex flex-col items-end text-sm rounded bg-rafik-secbg dark:bg-rafik-darksecbg shadow-lg divide-y divide-rafik-sectext"
                >
                  <Router-link
                    :to="{ name: 'single-user', params: { id: user.id } }"
                    class="px-3 py-5 hover:bg-rafik-pribg dark:bg-rafik-darkpribg hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darkpritext rounded"
                  >
                    {{ t('dashboard.users.list.actions.viewUser') }}
                  </Router-link>
                  <button
                    class="px-3 py-5 text-red-500 hover:bg-rafik-pribg dark:bg-rafik-darkpribg hover:text-red-300 rounded"
                  >
                    {{ t('dashboard.users.list.actions.deleteUser') }}
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
          {{ t('dashboard.users.list.loading') }}
        </p>
      </div>
      <!-- No Users Found -->
      <div v-else class="space-y-6 flex flex-col items-center py-12">
        <p class="text-rafik-pritext dark:text-rafik-darkpritext">
          {{ t('dashboard.users.list.noUsersFound') }}
        </p>
      </div>

      <!-- Pagination Controls -->
      <div
        v-if="!loading && userStore.All_Org_count"
        class="flex justify-between items-center gap-4 my-6"
      >
        <!-- Page Number Tabs -->
        <p class="header-small min-w-max">
          {{ t('dashboard.users.list.pagination.page', { page: page }) }}
        </p>
        <hr class="border w-full border-rafik-sectext dark:border-rafik-darksectext" />
        <div class="flex text-rafik-sectext dark:text-rafik-darksectext gap-4 px-4">
          <button
            v-for="p in Math.ceil(userStore.All_Org_count / pageSize)"
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
          {{ t('dashboard.users.list.pagination.previousPage') }}
        </button>
        <button
          v-if="page < Math.ceil(userStore.All_Org_count / pageSize)"
          @click="updatePage(page + 1)"
          class="px-4 py-2 text-rafik-sectext dark:text-rafik-darksectext min-w-max hover:text-rafik-pritext dark:hover:text-rafik-darkpritext"
        >
          {{ t('dashboard.users.list.pagination.nextPage') }}
        </button>
      </div>
    </div>
    <AddUserModal :visible="showAddUserModal" @close="showAddUserModal = false" @submit="addUser" />
    <OrgAssign
            :availableCount="entitlementStore.unusedEntitlementCount"
            :programs="programStore.All_Org_Programs || []"
            :visible="showAssignEntitlementModal"
            @submit="onAssignModalSubmit"
            @close="showAssignEntitlementModal = false"
          />
  </div>
</template>
<script lang="ts" setup>
import PageTitle from '@/components/Navigation/PageTitle.vue';
import { ref, computed, onMounted, watch } from 'vue';
import debounce from 'lodash/debounce';
import { useUserStore } from '@/stores/user';
import { useI18n } from 'vue-i18n';
import AddUserModal from '@/components/UserTabs/AddUserModal.vue';
import { useProgramStore } from '@/stores/programstores';
import { useEntitlementStore } from '@/stores/entitlementstores';
import Swal from 'sweetalert2';
import OrgAssign from './OrgAssign.vue';
import { supabase } from '@/lib/supabaseClient';
const { t, locale } = useI18n();

interface User {
  id: string;
  email: string;
  avatar: string;
  first_name: string;
  last_name: string;
  sex: string;
  dob: Date;
  roles: string[];
}

type Filter = {
  roles: string[];
  name: string;
  active: boolean;
};
const loading = ref(true);
const userStore = useUserStore();
const users = ref<User[]>([]);
const totalCount = ref(0);
const page = ref(1);
const pageSize = ref(10);
const holdQuery = ref('');
const filters = ref<Filter>({ roles: [], name: '', active: true });

const show_action = ref();
// Store references
const entitlementStore = useEntitlementStore();
const programStore = useProgramStore();
// Local reactive states
const showAssignEntitlementModal = ref(false);
const processing = ref(false);
const showAddUserModal = ref(false);


// Success and Error Alerts
function showSuccess(messageKey: string) {
  Swal.fire({
    title: t('dashboard.entitlements.list.successTitle'),
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 1500,
    text: t(messageKey),
    toast: true,
    position: 'top-right',
    icon: 'success',
    background: '#081411',
    color: '#E8F3ED'
  });
}

function showError(messageKey: string) {
  Swal.fire({
    title: t('dashboard.entitlements.list.errorTitle'),
    text: t(messageKey),
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}


// Add new program
function addUser(email: string, type: 'trainer' | 'trainee') {
  loading.value = true;
  page.value = 1;
  filters.value.name = '';
  filters.value.roles = [];
  filters.value.active = true;
  holdQuery.value = '';
  loadUsers()
    .catch((e) => {
      console.error('Error fetching users:', e);
    })
    .finally(() => {
      userStore.addOrgUser(email, type);
      showAddUserModal.value = false;
    });
}

function handleLeave() {
  setTimeout(() => {
    show_action.value = null;
  }, 500);
}


// Called when the AssignEntitlementsModal emits a "submit" event
async function onAssignModalSubmit(payload: { programId: string; emails: string[] }) {
  const { programId, emails } = payload;
  await assignEntitlementsToUsers(programId, emails);
  showAssignEntitlementModal.value = false;
}

async function assignEntitlementsToUsers(programId: string, emails: string[]) {
  processing.value = true;
  const orgID = localStorage.getItem('OrgID');
  const availableEntitlements = entitlementStore.entitlements.filter(
    (e) => e.client_email === null
  );

  if (emails.length > availableEntitlements.length) {
    showError('dashboard.entitlements.list.tooManyEntitlements');
    processing.value = false;
    return;
  }

  const program = programStore.All_Org_Programs?.find((p) => p.id === programId);
  if (!program) {
    showError('dashboard.entitlements.list.programNotFound');
    processing.value = false;
    return;
  }

  const invalidEmails = [];
  const validUsers = [];

  for (const email of emails) {
    const { data: user, error } = await supabase
      .from('users')
      .select()
      .eq('email', email)
      .eq('organization', orgID)
      .maybeSingle();

    if (error) {
      invalidEmails.push(`Error checking user ${email}: ${error.message}`);
      continue;
    }

    if (!user) {
      invalidEmails.push(`User with email ${email} does not exist or is not part of the organization.`);
      continue;
    }

    const userAlreadyAssigned = entitlementStore.entitlements.find(
      (entitlement) => entitlement.client_email === email
    );

    if (userAlreadyAssigned) {
      invalidEmails.push(`User with email ${email} is already assigned an entitlement.`);
      continue;
    }

    validUsers.push({ email, user });
  }

  if (invalidEmails.length > 0) {
    showError(invalidEmails.join('\n'));
  }

  for (const { email, user } of validUsers) {
    const entitlement = availableEntitlements[emails.indexOf(email)];
    if (entitlement) {
      await entitlementStore.assignEntitlement(entitlement.id, email, program);
      const data = {
        weekly_cycle: program.weekly_cycle,
        client_id: user.profile_id,
        price_package: 0,
        workouts: program.workouts,
        months_package: 1,
        status: 'active',
        program_id: program.id,
        auto_reroll: true,
        entitlement_id: entitlement.id,
      };
      const { data: userProgramData, error: userProgramError } = await supabase
        .from('user_programs')
        .insert([data])
        .select('id')
        .single();

      if (userProgramError) {
        showError('Error creating user program: ' + userProgramError.message);
        return;
      }

      // Update the entitlement with the new user_program_id and set status to 'active'
      const { error: entitlementUpdateError } = await supabase
        .from('entitlements')
        .update({
          user_program_id: userProgramData.id,
          status: 'active'
        })
        .eq('id', entitlement.id);

      if (entitlementUpdateError) {
        showError('Error updating entitlement: ' + entitlementUpdateError.message);
        return;
      }
    }
  }

  if (invalidEmails.length === 0) {
    showSuccess('dashboard.entitlements.list.emailsSentSuccessfully');
  }
  else {
    showSuccess('Assignment completed with Errors')
  }

  await Promise.all([entitlementStore.getEntitlements(), userStore.getEntitled()]);
  processing.value = false;
}



const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));
// Function to load users
async function loadUsers() {
  try {
    const res = await userStore.fetchOrgUsers(filters.value, page.value, pageSize.value);
    loading.value = false;
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

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
    filters.value.roles = [];
  } else {
    filters.value.roles = [filterType];
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
  if (newPage >= 1 && newPage <= Math.ceil(userStore.All_Org_count / pageSize.value)) {
    page.value = newPage;
    loadUsers();
  }
}
// On mount, load entitlements, programs, and user data
onMounted(() => {
  loading.value = true;
  loadUsers()
  entitlementStore
    .getEntitlements()
    .then(programStore.getOrgPrograms)
    .then(userStore.getEntitled)
    .then(() => {
      loading.value = false;
    });
});


// Watch for changes in the store's All_Org_Users and update the list
watch(
  () => userStore.All_Org_Users,
  (newUsers) => {
    users.value = newUsers;
  }
);
watch(
  () => userStore.All_Org_count,
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

.card:hover {
  background-image: linear-gradient(135deg, #f3eeeb 36%, #fff2cb);
}
.dark .card:hover {
  background-image: linear-gradient(135deg, #081411 36%, #295f42);
}
</style>
