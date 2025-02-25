<template>
  <div class="flex h-screen overflow-auto">
    <div
      v-if="userStore.AllClients"
      class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 gap-6"
    >
      <!-- Page Title -->
      <PageTitle subheader="Active" header="Clients" />

      <!-- Loading State -->
      <div v-if="loading" class="text-center 2xl:my-auto subheader-small uppercase">
        Loading Client Data Please Hold...
      </div>

      <!-- Client Table -->
      <div v-if="!loading">
        <table class="w-full text-center">
          <thead class="contentH-small mb-24">
            <tr>
              <th>
                <div  v-if=" userStore.client_count " class="flex items-center gap-4 my-6">
                <!-- Tabs Navigation -->
                <p class="min-w-max text-rafik-sectext capitalize"> Page: </p>
                <div class="flex text-rafik-sectext gap-4 pr-4 " v-if="userStore.client_count" >
                  <button  @click="updatePage(p)"  v-for="p in Math.ceil(userStore.client_count / numbers) " :key="p" class="hover:text-rafik-pritext" :class="{'text-rafik-pritext':p===page}">
                    {{p}}
                  </button>
                </div>
                <button
                  @click="updatePage(page- 1)"
                  v-if="page > 1"
                  class="px-4 py-2 text-rafik-sectext min-w-max hover:text-rafik-pritext"
                >
                  Previous Page
                </button>

                <button
                  class="px-4 py-2 text-rafik-sectext min-w-max hover:text-rafik-pritext"
                  @click="updatePage(page + 1)"
                  v-if="page < Math.ceil(userStore.client_count / numbers)"
                >
                  Next Page
                </button>
              </div>
              </th>
              <th>Date Joined</th>
              <th>Expires On</th>
              <th>Plan (Months)</th>
              <th>Status</th>
              <th>
                <div class="flex justify-end px-3 items-center  gap-3 ">
                  <p class="text-body min-w-max text-xs 2xl:text-base">Showing {{ userStore.client_count }} of </p>
                  <select v-model="numbers" @change="updatePage(page)" name="records" class="rafik-text-input w-32 text-sm p-2">
                    <option value="5">5</option>
                    <option value="10" selected>10</option>
                    <option value="15">15</option>
                  </select>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="client in userStore.AllClients" :key="client.id" class=" rounded-xl p-4 w-full ">
              <td class="flex gap-6 rounded-l-xl text-left items-center py-4 pl-3 bg-rafik-secbg">
                <img
                  :src="client.avatar || '/default-avatar.png'"
                  class="w-12 2xl:w-24 rounded-full border-2 border-rafik h-12 2xl:h-24"
                  alt="Avatar"
                />
                <div>
                  <p class="header-small">{{ client.first_name }} {{ client.last_name }}</p>
                  <p>{{ client.email }}</p>
                </div>
              </td>

              <td class="bg-rafik-secbg">
                {{ client.program_details.length
                  ? new Date(client.program_details[0].created_at).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })
                  : '-' }}
              </td>
              <td class="bg-rafik-secbg">
                {{ client.program_details.length
                  ? new Date(client.program_details[0].expires_on).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })
                  : '-' }}
              </td>
              <td class="bg-rafik-secbg">
                {{ client.program_details.length
                  ? client.program_details[0].months_package + ' month'
                  : '-' }}
              </td>
              <td class="uppercase  bg-rafik-secbg text-rafik">
                {{ client.program_details.length ? client.program_details[0].status : '-' }}
              </td>
              <td class="px-3  bg-rafik-secbg relative text-right rounded-r-xl">
                <svg
                  @click="show_action = client.id"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  class="text-rafik-sectext h-7 mx-7 hover:text-rafik-pritext cursor-pointer ml-auto"
                  viewBox="0 0 128 512"
                >
                  <path d="M64 360a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm0-160a56 56 0 1 0 0 112 56 56 0 1 0 0-112zM120 96A56 56 0 1 0 8 96a56 56 0 1 0 112 0z"/>
                </svg>
                <div
                  v-if="show_action == client.id"
                  @mouseleave="handleLeave()"
                  class="absolute min-w-16 px-2 top-15 right-0 flex flex-col items-end text-sm rounded bg-rafik-secbg shadow-lg divide-y divide-y-rafik-sectext"
                >
                  <Router-link :to="{name: 'client-details', params: {id: client.id}}" class="px-3 py-5 hover:bg-rafik-pribg hover:text-rafik-pritext rounded">
                    View Program
                  </Router-link>
                  <button class="px-3 py-5 hover:bg-rafik-pribg hover:text-rafik-pritext rounded">Message Client</button>
                  <button class="px-3 py-5 text-red-500 hover:bg-rafik-pribg hover:text-red-300 rounded">Remove Client</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->



      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PageTitle from "@/components/PageTitle.vue";
import { computed, onMounted, ref } from "vue";
import { useUserStore } from "@/stores/user";
import { useExerciseStore } from "@/stores/exercisestores";
import router from "@/router";
import AddProgramModal from "@/components/ProgramTabs/AddProgramModal.vue";
import ExerciseList from "@/components/ExerciseList.vue";

const filter = ref('All');
const activeTab = ref("Active Program");
const userStore = useUserStore();
const page = ref(1);
const numbers = ref(10);
const showAddProgramModal = ref(false);
const loading = ref(false);
const show_action = ref();

function handleLeave() {
  setTimeout(() => {
    show_action.value = null;
  }, 500);
}

// Change active tab handler
function setActiveTab(tab: string) {
  activeTab.value = tab;
}

// Update Exercise page
function updatePage(value: number ) {
  page.value = value;
  loading.value = true;
  userStore.getActiveClientsForTrainer(page.value, numbers.value).then(() => {
    loading.value = false;
  });;
}

// Route to details
function detailsRoute(id: string) {
  router.push({ name: 'user-details', params: { id: id } });
}

// Fetch users on component mount
onMounted(() => {
  loading.value = true;
  userStore.getActiveClientsForTrainer(page.value, numbers.value).then(() => {
    loading.value = false;
  });
});
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
  background-image: linear-gradient(135deg, #081411 36%, #295f42);
}
</style>
