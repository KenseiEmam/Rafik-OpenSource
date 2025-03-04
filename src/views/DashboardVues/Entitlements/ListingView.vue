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
          @click="handleAssignEntitlement"
          class="uppercase w-1/2 border-2 border-rafik text-rafik py-3 rounded-lg hover:bg-rafik-secondary hover:text-white transition-all"
        >
          Assign Entitlement
        </button>

        <!-- Purchase Entitlement Button -->
        <router-link
          :to="{ name: 'purchase-entitlements' }"
          class="uppercase w-1/2 btn-lg transition-all"
        >
          Purchase Entitlement
        </router-link>
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
                    v-if="!entitlement.client_id"
                    @click="handleAssignEntitlement()"
                    class="px-3 py-5 hover:bg-rafik-pribg hover:text-rafik-pritext rounded"
                  >
                    Assign Entitlement
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <AssignEntitlementsModal
    :visible="showAssignEntitlementModal"
    :availableCount="entitlementStore.unusedEntitlementCount"
    :programs="programStore.ActivePrograms || []"
    @close="(showAssignEntitlementModal = false)"
    @submit="onAssignModalSubmit"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageTitle from '@/components/PageTitle.vue'
import { useEntitlementStore } from '@/stores/entitlementstores'
import { useProgramStore } from '@/stores/programstores'
import Swal from 'sweetalert2'
import { supabase } from '@/lib/supabaseClient'
import AssignEntitlementsModal from './AssignEntitlementsModal.vue' // New modal component

// Store references
const entitlementStore = useEntitlementStore()
const programStore = useProgramStore()

// Local reactive states
const loading = ref(false)
const page = ref(1)
const numbers = ref(10)
const show_action = ref()
const showAssignEntitlementModal = ref(false) // Controls the modal visibility

// Load entitlements and programs on mount
onMounted(() => {
  loading.value = true
  entitlementStore
    .getEntitlements()
    .then(programStore.getAllPrograms)
    .then(() => {
      loading.value = false
    })
})

// Computed property for table data
const tableData = computed(() => {
  return entitlementStore.entitlements
})

// Close actions menu after a short delay
function handleLeave() {
  setTimeout(() => {
    show_action.value = null
  }, 500)
}

// Pagination update
function updatePage(value: number) {
  page.value = value
  loading.value = true
  entitlementStore
    .getEntitlements()
    .then(programStore.getAllPrograms)
    .then(() => {
      loading.value = false
    })
}

// "Coming Soon" alert for Purchase Entitlement button
function showComingSoonAlert() {
  Swal.fire({
    title: 'Coming Soon',
    text: 'This feature is coming soon. Stay tuned!',
    icon: 'info',
    confirmButtonText: 'Got it!',
  })
}

// Handler for the "Assign Entitlement" button
function handleAssignEntitlement() {
  if (entitlementStore.unusedEntitlementCount <= 0) {
    Swal.fire({
      title: 'No Available Entitlements',
      text: 'You have no available entitlements. Please purchase more or unassign existing ones.',
      icon: 'warning',
      confirmButtonText: 'OK',
    })
    return
  }

  if (!programStore.ActivePrograms || programStore.ActivePrograms.length === 0) {
    Swal.fire({
      title: 'No Active Programs Found',
      text: 'You must have at least one active program before assigning entitlements.',
      icon: 'warning',
      confirmButtonText: 'OK',
    })
    return
  }

  // Open the custom Vue modal
  showAssignEntitlementModal.value = true
}

// Called when the AssignEntitlementsModal emits a "submit" event
async function onAssignModalSubmit(payload: { programId: string; emails: string[] }) {
  const { programId, emails } = payload
  await assignEntitlementsToUsers(programId, emails)
  showAssignEntitlementModal.value = false
}

// Function to assign entitlements (same logic as before)
async function assignEntitlementsToUsers(programId: string, emails: string[]) {
  const availableEntitlements = entitlementStore.entitlements.filter((e) => e.client_id === null)
  if (emails.length > availableEntitlements.length) {
    Swal.fire({
      title: 'Error',
      text: `You can only assign up to ${availableEntitlements.length} entitlements.`,
      icon: 'error',
    })
    return
  }

  const assignedUserIds: string[] = []
  // Validate each email against the "users" table
  for (const email of emails) {
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.trim())
      .single()

    if (error || !user) {
      Swal.fire({
        title: 'Error',
        text: `User with email ${email} is not registered.`,
        icon: 'error',
      })
      return
    }
    // NEW: Check if the user is already assigned to an entitlement
    const userAlreadyAssigned = entitlementStore.entitlements.find(
      (entitlement) => entitlement.client_id === user.id,
    )
    if (userAlreadyAssigned) {
      Swal.fire({
        title: 'Error',
        text: `User with email ${email} is already assigned to a program.`,
        icon: 'error',
      })
      return
    }

    assignedUserIds.push(user.id)
  }

  // Update entitlements for each email/user
  const updatePromises = emails.map((_, index) => {
    const entitlement = availableEntitlements[index]
    const program = programStore.ActivePrograms?.find((p) => p.id === programId)
    if (!program) {
      Swal.fire({
        title: 'Error!',
        text: 'Program not found.',
        icon: 'error',
        confirmButtonColor: '#d33',
        background: '#081411',
        color: '#E8F3ED',
      })
      return
    }
    return entitlementStore.assignEntitlement(entitlement.id, assignedUserIds[index], program)
  })

  await Promise.all(updatePromises)
  Swal.fire({
    title: 'Success',
    text: 'Entitlements assigned successfully.',
    icon: 'success',
  })
  // Refresh entitlements to reflect changes
  entitlementStore.getEntitlements()
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
</style>
