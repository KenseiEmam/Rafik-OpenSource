<template>
  <div class="flex h-screen overflow-auto">
    <div
      v-if="entitlementStore.entitlements"
      class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 gap-6"
    >
      <!-- Page Title -->
      <PageTitle subheader="Active" header="Entitlements" />

      <!-- Buttons for Assign and Purchase -->
      <div class="flex gap-6 mb-8">
        <!-- Assign Entitlement Button -->
        <button
          @click="showComingSoonAlert"
          class="uppercase w-1/2 border-2 border-rafik text-rafik py-3 rounded-lg hover:bg-rafik-secondary hover:text-white transition-all"
        >
          Assign Entitlement
        </button>

        <!-- Purchase Entitlement Button -->
        <button
          @click="showComingSoonAlert"
          class="uppercase w-1/2 bg-rafik text-white py-3 rounded-lg hover:bg-rafik hover:text-white transition-all"
        >
          Purchase Entitlement
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center 2xl:my-auto subheader-small uppercase">
        Loading Entitlement Data Please Hold...
      </div>

      <!-- Entitlement Table -->
      <div v-if="!loading">
        <table class="w-full text-center">
          <thead class="contentH-small mb-24">
            <tr>
              <th>
                <div
                  v-if="entitlementStore.entitlements.length"
                  class="flex items-center gap-4 my-6 text-xs 2xl:text-sm"
                >
                  <!-- Pagination Navigation -->
                  <button
                    @click="updatePage(page - 1)"
                    v-if="page > 1"
                    class="px-4 py-2 text-rafik-sectext min-w-max hover:text-rafik-pritext"
                  >
                    <<
                  </button>
                  <p class="min-w-max text-rafik-sectext capitalize">Page:</p>
                  <div class="flex text-rafik-sectext gap-4 pr-4">
                    <button
                      @click="updatePage(p)"
                      v-for="p in Math.ceil(entitlementStore.entitlements.length / numbers)"
                      :key="p"
                      class="hover:text-rafik-pritext"
                      :class="{ 'text-rafik-pritext': p === page }"
                    >
                      {{ p }}
                    </button>
                  </div>

                  <button
                    class="px-4 py-2 text-rafik-sectext min-w-max hover:text-rafik-pritext"
                    @click="updatePage(page + 1)"
                    v-if="page < Math.ceil(entitlementStore.entitlements.length / numbers)"
                  >
                    >>
                  </button>
                </div>
              </th>
              <th>Client</th>
              <th>Joined On</th>
              <th>Expires On</th>
              <th>Status</th>
              <th>
                <div class="flex justify-end px-3 items-center gap-3">
                  <p class="text-body min-w-max text-xs 2xl:text-base">Page size</p>
                  <select
                    v-model="numbers"
                    @change="updatePage(page)"
                    name="records"
                    class="rafik-text-input w-32 text-sm p-2"
                  >
                    <option value="5">5</option>
                    <option value="10" selected>10</option>
                    <option value="15">15</option>
                  </select>
                </div>
                <p class="text-xs mt-3 text-body min-w-max text-xs text-right">
                  {{ entitlementStore.entitlements.length }} total entitlements
                </p>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entitlement in tableData"
              :key="entitlement.id"
              class="rounded-xl p-4 w-full"
            >
              <td class="border-y border-rafik-sectext">
                {{ entitlement.id || 'Unassigned' }}
              </td>
              <td class="border-y border-rafik-sectext">
                {{ entitlement.client_id || 'Unassigned' }}
              </td>
              <td class="border-y border-rafik-sectext">
                {{ entitlement.start_date }}
              </td>
              <td class="border-y border-rafik-sectext">
                {{ entitlement.end_date }}
              </td>
              <td class="border-y border-rafik-sectext">
                {{ entitlement.status }}
              </td>
              <td class="border-y border-rafik-sectext relative py-5">
                <svg
                  @click="(show_action = entitlement.id)"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  class="text-rafik-sectext h-7 mx-7 hover:text-rafik-pritext cursor-pointer ml-auto"
                  viewBox="0 0 128 512"
                >
                  <path
                    d="M64 360a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm0-160a56 56 0 1 0 0 112 56 56 0 1 0 0-112zM120 96A56 56 0 1 0 8 96a56 56 0 1 0 112 0z"
                  />
                </svg>
                <div
                  v-if="show_action == entitlement.id"
                  @mouseleave="handleLeave()"
                  class="absolute min-w-16 px-2 z-40 top-15 right-0 flex flex-col items-end text-sm rounded bg-rafik-secbg shadow-lg divide-y divide-y-rafik-sectext"
                >
                  <button class="px-3 py-5 hover:bg-rafik-pribg hover:text-rafik-pritext rounded">
                    View Details
                  </button>
                  <button
                    class="px-3 py-5 text-red-500 hover:bg-rafik-pribg hover:text-red-300 rounded"
                  >
                    Remove Entitlement
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PageTitle from '@/components/PageTitle.vue'
import { computed, onMounted, ref } from 'vue'
import { useEntitlementStore } from '@/stores/entitlementstores' // Import entitlement store
import { useUserStore } from '@/stores/user'
import router from '@/router'
import Swal from 'sweetalert2'

const entitlementStore = useEntitlementStore() // Use entitlement store
const loading = ref(false)
const page = ref(1)
const numbers = ref(10)
const show_action = ref()

// Handle mouse leave to close actions menu
function handleLeave() {
  setTimeout(() => {
    show_action.value = null
  }, 500)
}

// Update the page number
function updatePage(value: number) {
  page.value = value
  loading.value = true
  entitlementStore.getEntitlements().then(() => {
    loading.value = false
  })
}

// Fetch entitlements on component mount
onMounted(() => {
  loading.value = true
  console.log('Fetching entitlements...')
  entitlementStore.getEntitlements().then(() => {
    loading.value = false
  })
})

// Convert entitlement data into a format suitable for display
const tableData = computed(() => {
  return entitlementStore.entitlements
})

// Show Coming Soon alert for both buttons
function showComingSoonAlert() {
  Swal.fire({
    title: 'Coming Soon',
    text: 'This feature is coming soon. Stay tuned!',
    icon: 'info',
    confirmButtonText: 'Got it!',
  })
}
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 1rem;
}

tbody > tr {
  border-radius: 0.375rem;
  outline: 1px solid rgba(0, 0, 0, 0.175);
}

button {
  font-size: 1.2rem;
  font-weight: bold;
}

button:hover {
  background-color: #f1c40f;
}
</style>
