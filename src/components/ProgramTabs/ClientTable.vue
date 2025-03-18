<template>
  <div class="mt-12">
    <!-- Search Section -->
    <div class="flex items-center justify-between mb-4 gap-6">
      <div class="flex gap-3">
        <!-- Search Bar -->
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name or email..."
          class="rafik-text-input border rounded-lg w-64"
        />
      </div>
      <hr class="w-full border-rafik-sectext dark:border-rafik-darksectext border-b">
      <span class="text-sm">Showing {{ filteredClients.length }} row(s)</span>
    </div>

    <!-- Client Table -->
    <table  v-if="totalPages>=1" class="w-full text-center">
      <thead class="contentH-small">
        <tr>
          <th></th>
          <th>Date Joined</th>
          <th>Expires On</th>
          <th>Plan (Months)</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="client in filteredClients" :key="client.id" class="border-b border-rafik-sectext dark:border-rafik-darksectext">
          <td class="flex gap-2 text-left items-center py-4">
            <img :src="client.avatar || 'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'" class="w-12 rounded-full border border-rafik-sectext dark:border-rafik-darksectext h-12" alt="Avatar">
            <div>
              <p class="header-small">{{ client.first_name }} {{ client.last_name }}</p>
              <p>{{ client.email }}</p>
            </div>
          </td>

          <td>
            {{ client.program_details.length ? new Date(client.program_details[0].created_at).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) : '-' }}
          </td>
          <td>
            {{ client.program_details.length ? new Date(client.program_details[0].expires_on).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) : '-' }}
          </td>
          <td>
            {{ client.program_details.length ? client.program_details[0].months_package + ' month' : '-' }}
          </td>
          <td>
            {{ client.program_details.length ? client.program_details[0].status : '-' }}
          </td>
          <td class="px-3 relative" >
            <svg @click="show_action = client.id" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="text-rafik-sectext dark:text-rafik-darksectext h-7 mx-7 hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darkpritext cursor-pointer" viewBox="0 0 128 512">
              <path d="M64 360a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm0-160a56 56 0 1 0 0 112 56 56 0 1 0 0-112zM120 96A56 56 0 1 0 8 96a56 56 0 1 0 112 0z"/>
            </svg>
            <div v-if="show_action == client.id" @mouseleave="handleLeave()" class="absolute min-w-16 px-2 top-5 flex flex-col items-center text-sm rounded bg-rafik-secbg dark:bg-rafik-darksecbg  shadow-lg z-40  divide-y divide-y-rafik-sectext">
              <Router-link :to="{name:'client-details', params:{id:client.id}}" class="px-3 py-5 hover:bg-rafik-pribg dark:bg-rafik-darkpribg hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darkpritext rounded">View Program</Router-link>
              <!-- <button class="px-3 py-5 hover:bg-rafik-pribg dark:bg-rafik-darkpribg hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darkpritext rounded">Message Client</button> -->
              <button class="px-3 py-5 text-red-500 hover:bg-rafik-pribg dark:bg-rafik-darkpribg hover:text-red-300 rounded">Remove Client</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="my-16 w-full text-center text-sm text-body"> No clients just yet!</p>
    <!-- Pagination -->
    <div v-if="totalPages>1" class="flex justify-between items-center mt-4">
      <button @click="prevPage" :disabled="currentPage === 1" class="px-4 py-2 border rounded-lg">Prev</button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages" class="px-4 py-2 border rounded-lg">Next</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import { onMounted, ref, computed } from 'vue';

const userStore = useUserStore();
const props = defineProps(['program']);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;
const show_action = ref();

onMounted(() => {
  userStore.getClients(props.program.id);
});

function handleLeave(){
  setTimeout(() => {
  show_action.value=null
}, 500)
}
// Computed property for filtered clients based on search query
const filteredClients = computed(() => {
  const lowerSearchQuery = searchQuery.value.toLowerCase();
  const filtered = userStore.AllClients.filter(client =>
    client.first_name?.toLowerCase().includes(lowerSearchQuery) ||
    client.last_name?.toLowerCase().includes(lowerSearchQuery) ||
    client.email?.toLowerCase().includes(lowerSearchQuery)
  );

  // Pagination: slice the array based on current page
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return filtered.slice(startIndex, endIndex);
});

// Computed property for total pages
const totalPages = computed(() => {
  const filtered = userStore.AllClients.filter(client =>
    client.first_name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    client.last_name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
  return Math.ceil(filtered.length / itemsPerPage);
});

// Methods for pagination
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};
</script>

<style scoped>
/* Optional: Style for the search and filter section */
.input, .search-bar {
  width: 100%;
}
</style>
