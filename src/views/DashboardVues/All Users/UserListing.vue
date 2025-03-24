<template>
  <div  class="flex h-screen overflow-auto">
    <div class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 2xl:space-y-6 space-y-3">

      <!-- Page Title -->
      <PageTitle subheader="all" header="users" />
      <!-- Search and Filter Controls -->
      <div class="flex justify-between items-center gap-4 mb-3">
        <!-- Search Bar -->
        <div class="relative w-128">
          <input
            type="search"
            @input="handleSearch"
            class="block w-full p-4 text-sm text-rafik-sectext dark:text-rafik-darksectext border rounded-lg bg-rafik-pribg dark:bg-rafik-darkpribg"
            placeholder="Type to Search Users..."
            required
          />
        </div>
        <!-- Filter Buttons -->
        <div class="mr-auto flex gap-4">
          <button
            @click="updateFilter('All')"
            class="card border 2xl:text-base text-sm min-w-max uppercase"
            :class="filters.roles.length === 0 ? 'border-rafik gradient-bg text-rafik' : 'border'"
          >
            All Users
          </button>
          <button
            @click="updateFilter('Trainer')"
            class="card border 2xl:text-base text-sm min-w-max uppercase"
            :class="filters.roles.includes('Trainer') ? 'border-rafik gradient-bg text-rafik' : 'border'"
          >
            Trainer
          </button>
          <button
            @click="updateFilter('Trainee')"
            class="card border 2xl:text-base text-sm min-w-max uppercase"
            :class="filters.roles.includes('Trainee') ? 'border-rafik gradient-bg text-rafik' : 'border'"
          >
            Trainee
          </button>
          <button
            @click="updateFilter('CustomerCare')"
            class="card border 2xl:text-base text-sm min-w-max uppercase"
            :class="filters.roles.includes('customer_care') ? 'border-rafik gradient-bg text-rafik' : 'border'"
          >
            Customer Care
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <div v-if="users.length > 0 && !loading ">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">ID</th>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">Details</th>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">Roles</th>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">Gender</th>
              <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider">Age</th>
              <th></th>
            </tr>
          </thead>
          <tbody class="space-y-6">
            <tr v-for="user in users" :key="user.id" class="p-4">
              <td class="rounded-l-xl bg-rafik-secbg dark:bg-rafik-darksecbg p-4 ">{{ user.id }}</td>
              <td
                class="flex gap-6 text-left items-center py-4 pl-3 bg-rafik-secbg dark:bg-rafik-darksecbg"
              >
                <img
                  :src="user.avatar || 'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'"
                  class="w-12 rounded-full border-2 border-rafik h-12"
                  alt="Avatar"
                />
                <div>
                  <p class="header-small">{{ user.first_name }} {{ user.last_name }}</p>
                  <p>{{ user.email }}</p>
                </div>
              </td>
              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg p-4 capitalize ">
                <div class="flex flex-wrap text-sm items-center">
                  <p v-for="role,index in user.roles">
                  {{ role }}
                  <span v-if="index !== user.roles.length-1">-</span>
                  </p>
                </div>

              </td>
              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg p-4 capitalize">{{ user.sex }}</td>
              <td class=" bg-rafik-secbg dark:bg-rafik-darksecbg p-4 ">{{ calculateAge(user.dob) || 'N/A' }} </td>
              <td
                class="px-3 bg-rafik-secbg dark:bg-rafik-darksecbg relative text-right rounded-r-xl"
              >
                <svg
                  @click="(show_action = user.id)"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  class="text-rafik-sectext dark:text-rafik-darksectext h-7 mx-7 hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darkpritext cursor-pointer ml-auto"
                  viewBox="0 0 128 512"
                >
                  <path
                    d="M64 360a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm0-160a56 56 0 1 0 0 112 56 56 0 1 0 0-112zM120 96A56 56 0 1 0 8 96a56 56 0 1 0 112 0z"
                  />
                </svg>
                <div
                  v-if="show_action == user.id"
                  @mouseleave="handleLeave()"
                  class="absolute min-w-16 px-2 z-40 top-15 right-0 flex flex-col items-end text-sm rounded bg-rafik-secbg dark:bg-rafik-darksecbg shadow-lg divide-y divide-y-rafik-sectext"
                >
                  <Router-link
                    :to="{ name: 'single-user', params: { id: user.id } }"
                    class="px-3 py-5 hover:bg-rafik-pribg dark:bg-rafik-darkpribg hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darkpritext rounded"
                  >
                    View User
                  </Router-link>
                  <!-- <button class="px-3 py-5 hover:bg-rafik-pribg dark:bg-rafik-darkpribg hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darkpritext rounded">
                    Message Client
                  </button> -->
                  <button
                    class="px-3 py-5 text-red-500 hover:bg-rafik-pribg dark:bg-rafik-darkpribg hover:text-red-300 rounded"
                  >
                    Delete User
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
       <!-- Loading State -->
       <div v-else-if="loading" class=" h-full flex flex-col gap-2 items-center justify-center text-center w-full text-body">
          <img src="@/assets/Large Icon.png"  class="w-24 h-24 animate-bounce hidden dark:inline-block" alt="">
<img src="@/assets/Large Icon Light.png"  class="w-24 h-24 animate-bounce dark:hidden" alt="">
          <p class="text-lg animate-pulse">
          Loading...
        </p>
      </div>
      <!-- No Users Found -->
      <div v-else class="space-y-6 flex flex-col items-center py-12">
        <p class="text-rafik-pritext dark:text-rafik-darkpritext">
          No Users found for your query.
        </p>
      </div>

      <!-- Pagination Controls -->
      <div v-if=" !loading && userStore.All_count" class="flex justify-between items-center gap-4 my-6">
        <!-- Page Number Tabs -->
        <p class="header-small min-w-max">Page {{ page }}</p>
        <hr class="border w-full border-rafik-sectext dark:border-rafik-darksectext" />
        <div class="flex text-rafik-sectext dark:text-rafik-darksectext gap-4 px-4">
          <button
            v-for="p in  Math.ceil(userStore.All_count/ pageSize)"
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
          Previous Page
        </button>
        <button
          v-if="page < Math.ceil(userStore.All_count/ pageSize)"
          @click="updatePage(page + 1)"
          class="px-4 py-2 text-rafik-sectext dark:text-rafik-darksectext min-w-max hover:text-rafik-pritext dark:hover:text-rafik-darkpritext"
        >
          Next Page
        </button>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import PageTitle from '@/components/Navigation/PageTitle.vue';
import { ref, computed, onMounted, watch } from 'vue';
import debounce from 'lodash/debounce';
import { useUserStore } from '@/stores/user';

interface User {
  id: string;
  email: string;
  avatar:string;
  first_name: string;
  last_name: string;
  sex: string;
  dob:Date,
  roles:string[];
}

type Filter = {
  roles: string[];
  name: string;
  active: boolean;
};
const loading = ref(true)
const userStore = useUserStore();
const users = ref<User[]>([]);
const totalCount = ref(0);
const page = ref(1);
const pageSize = ref(10);
const holdQuery = ref('');
const filters = ref<Filter>({ roles: [], name: '', active: true });

const show_action = ref()

function handleLeave() {
  setTimeout(() => {
    show_action.value = null
  }, 500)
}

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));
// Function to load users
async function loadUsers() {
  try {
    const res = await userStore.fetchUsers(filters.value, page.value, pageSize.value);
    loading.value= false
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
  loading.value= true
  const target = event.target as HTMLInputElement;
  debouncedFetchUsers(target.value);
}

function updateFilter(filterType: string) {
  loading.value= true
  if (filterType === 'All') {
    filters.value.roles = [];
  } else {
    filters.value.roles = [filterType];
  }
  page.value = 1;
  loadUsers();
}
function calculateAge(dob:Date) {
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
  loading.value= true
  if (newPage >= 1 && newPage <= Math.ceil(userStore.All_count / pageSize.value)) {
    page.value = newPage;
    loadUsers();
  }
}

// Load users on component mount
onMounted(loadUsers);

// Watch for changes in the store's All_Users and update the list
watch(
  () => userStore.All_Users,
  (newUsers) => {
    users.value = newUsers;

  }
);
watch(
  () => userStore.All_count,
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
  background-image:linear-gradient(135deg, #f3eeeb 36%, #fff2cb)
}
.dark .card:hover {
  background-image: linear-gradient(135deg, #081411 36%, #295f42);
}
</style>

