<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import DetailsTab from '@/components/ClientTabs/DetailsTab.vue'
import WorkoutPlanner from '@/components/ProgramTabs/WorkoutPlanner.vue'
import WorkoutLogTab from '@/components/ClientTabs/WorkoutLogTab.vue'
import Swal from 'sweetalert2'
import router from '@/router'
import DietLogTab from '@/components/ClientTabs/DietLogTab.vue'
import ChangeProgramModal from '@/components/ClientTabs/ChangeProgramModal.vue'
import CancelProgramModal from '@/components/ClientTabs/CancelProgramModal.vue'
import { supabase } from '@/lib/supabaseClient'
const activeTab = ref('Details')

const compareDate = computed(() => {
  if (!clientStore.Client?.last_active) return 'N/A'
  const lastActive = new Date(clientStore.Client?.last_active)
  const now = new Date()

  // Consider the user online if their last activity was within the last 5 minutes
  const isOnline = now.getTime() - lastActive.getTime() <= 5 * 60 * 1000

  if (isOnline) {
    console.log('Client is online')
  } else {
    console.log('Client is offline')
  }

  return isOnline
})
interface ClientInterface {
  id?: string
  avatar?: string
  email?: string
  first_name?: string
  last_name?: string
  program_details?: any
}

// Access the route object
const route = useRoute()
const clientStore = useUserStore()

// Change active tab handler
function setActiveTab(tab: string) {
  activeTab.value = tab
}

// ✅ Function to overwrite program fields
async function importProgram(value: any) {
  if (!clientStore.Client) return showError('Client not found!')
  try {
    await clientStore
      .updateClientProgram({ id: clientStore.Client.program_details.id, ...value })
      .then(() => {
        const clientId = route.params.id as string
        if (clientId) {
          clientStore.getClient(clientId).catch(() => {
            showError('Failed to load client details.')
          })
        }
      })
    showSuccess(`Change successful!`)
  } catch (error) {
    showError(`Failed to Change. Please try again.`)
  }
  showAddProgramModal.value = false
}

// Non async function for confirmation
function confirmCancel(value: string) {
  Swal.fire({
    title: 'Hold!',
    text: 'Please be sure that once cancelled, the program subscription cannot be uncancelled and the client will be lost.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Proceed!',
    confirmButtonColor: '#CB901C',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED',
  }).then((result) => {
    if (result.isConfirmed) {
      cancelProgram(value)
    }
  })
}
// ✅ Function to cancel subscription
async function cancelProgram(value: string) {
  if (!clientStore.Client) return showError('Client not found!')
  try {
    const UserID = localStorage.getItem('UserID')
    if (!UserID) return showError('No UserID found')
    if (!clientStore.Client.program_details.id) return showError('No userprogram found in sotre')
    const newRequest = {
      reasoning: value,
      raised_by: UserID,
      user_program_id: clientStore.Client.program_details.id,
      status: 'raised',
    }

    const { data, error } = await supabase.from('cancel_request').insert(newRequest).select()

    if (error) {
      throw new Error(`Error creating cancelatiion : ${error.message}`)
    }

    await clientStore
      .updateClientProgram({ id: clientStore.Client.program_details.id, status: 'review' })
      .then(() => {
        const clientId = route.params.id as string
        if (clientId) {
          clientStore.getClient(clientId).catch(() => {
            showError('Failed to load client details.')
          })
        }
      })

    showSuccess(`Cancellation is now in review!`)
  } catch (error) {
    showError('Error cancelling program:' + error)
  }
  showCancelModal.value = false
  router.push({ name: 'clients-list' })
}

// Function to refresh the route/component
function refreshComponent() {
  router.go(0) // This reloads the current route
}
const showAddProgramModal = ref(false)
const showCancelModal = ref(false)
// Function to show success alerts
function showSuccess(message: string) {
  Swal.fire({
    title: 'Success!',
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 1500,
    text: message,
    toast: true,
    position: 'top-right',
    icon: 'success',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED',
  }) // Refresh after success
}

// Function to show error alerts
function showError(message: string) {
  Swal.fire({
    title: 'Error!',
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED',
  })
}
// Function to update client workout plan
async function updateClientProgram(field: string, value: any) {
  if (!clientStore.Client?.id) return showError('Client not found!')

  try {
    await clientStore.updateClientProgram({
      id: clientStore.Client.program_details.id,
      workouts: value.workouts,
    })

    await clientStore.getClient(clientStore.Client?.id)
    showSuccess(`${field} updated successfully!`)
  } catch (error) {
    showError(`Failed to update ${field}. Please try again.`)
    console.error(`Error updating ${field}:`, error)
  }
}

// Fetch the client when the component mounts
onMounted(() => {
  const clientId = route.params.id as string
  if (clientId) {
    clientStore.getClient(clientId).catch(() => {
      showError('Failed to load client details.')
    })
  }
})
</script>

<template>
  <div class="flex h-screen overflow-auto">
    <div
      v-if="clientStore.Client"
      class="flex-1 px-8 py-12 w-full 2xl:px-12 2xl:py-24 space-y-8 2xl:space-y-6"
    >
      <div
        class="border group flex flex-col relative gradient-bg border-rafik-alternate rounded-lg overflow-hidden"
      >
        <div class="p-8 2xl:p-16 2xl:py-24 space-y-4 relative items-stretch grid grid-cols-4">
          <div class="pr-6 space-y-4 col-span-2">
            <div class="flex items-center gap-6">
              <img
                :src="clientStore.Client?.avatar || 'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'"
                alt=""
                class="w-32 h-32 object-cover rounded-full border-2 border-rafik"
              />
              <div class="space-y-2">
                <h1 class="title-small w-1/3">
                  {{
                    clientStore.Client?.first_name + ' ' + clientStore.Client?.last_name ||
                    'Loading...'
                  }}
                </h1>
                <p class="text-body text-justify 2xl:w-5/6">
                  {{ clientStore.Client?.email || 'Loading...' }}
                </p>
                <div
                  class="py-1 px-4 3xl:px-5 2xl:py-2 2xl:text-sm text-xs rounded-3xl max-w-max text-rafik-pritext dark:text-rafik-darkpritext uppercase font-semibold"
                  :class="compareDate ? 'bg-rafik-alternate' : 'bg-rafik-secondary'"
                >
                  {{ compareDate ? 'Online' : 'Away' }}
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-4 justify-between">
            <div class="uppercase flex justify-between gap-3 text-xs">
              <p class="text-rafik-pritext dark:text-rafik-darkpritext">Status:</p>
              <p class="text-rafik-secondary">{{ clientStore.Client.program_details?.status }}</p>
            </div>
            <div class="uppercase flex justify-between gap-3 text-xs">
              <p class="text-rafik-pritext dark:text-rafik-darkpritext">Workout-Iteration</p>
              <p class="text-rafik-secondary">{{ clientStore.Client.profile.workout_iteration }}</p>
            </div>
            <div class="uppercase flex justify-between gap-3 text-xs">
              <p class="text-rafik-pritext dark:text-rafik-darkpritext">Diet Last Logged:</p>
              <p class="text-rafik-secondary">
                {{ clientStore.Client.program_details?.diet_last_logged || 'No Logs' }}
              </p>
            </div>
            <div class="uppercase flex justify-between gap-3 text-xs">
              <p class="text-rafik-pritext dark:text-rafik-darkpritext">Progress:</p>
              <p class="text-rafik-secondary">
                {{
                  Math.ceil(
                    (clientStore.Client.program_details?.volume_progress +
                      clientStore.Client.program_details?.intensity_progress) /
                      2,
                  )
                }}
                %
              </p>
            </div>
          </div>
          <div class="pl-6 flex-1 min-w-max h-full">
            <div class="flex flex-col flex-1 gap-4 border-l pl-2 border-rafik-sectext dark:border-rafik-darksectext text-left">
              <!-- <button class="text-body uppercase text-left hover:text-rafik-pritext dark:text-rafik-darkpritext">
                Message Client
              </button> -->
              <button
                v-if="clientStore.Client.program_details.status === 'active'"
                @click="(showAddProgramModal = true)"
                class="text-body uppercase text-left hover:text-rafik-pritext dark:text-rafik-darkpritext"
              >
                Change Program
              </button>
              <button
                @click="(showCancelModal = true)"
                class="text-body uppercase text-red-500 hover:text-red-400 text-left"
                v-if="clientStore.Client.program_details.status === 'active'"
              >
                Cancel Subcription
              </button>
              <button
                class="text-body uppercase text-rafik-secondary text-left cursor-default"
                v-else-if="clientStore.Client.program_details.status === 'review'"
              >
                Cancellation Pending
              </button>
              <button
                class="text-body uppercase text-red-500 text-left cursor-default"
                v-else-if="clientStore.Client.program_details.status === 'cancelled'"
              >
                X Subscription Cancelled
              </button>
            </div>
          </div>
        </div>
      </div>
      <ChangeProgramModal
        :visible="showAddProgramModal"
        @close="(showAddProgramModal = false)"
        @submit="importProgram"
      />
      <CancelProgramModal
        :visible="showCancelModal"
        @close="(showCancelModal = false)"
        @submit="confirmCancel"
      />
      <!-- Tabs -->
      <div class="flex gap-8 2xl:gap-16 items-center pb-2 border-b border-rafik-sectext dark:border-rafik-darksectext">
        <button
          :class="
            activeTab === 'Details' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'
          "
          class="nav-btn"
          @click="setActiveTab('Details')"
        >
          Details
        </button>
        <button
          :class="
            activeTab === 'Workout-Plan' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Workout-Plan')"
        >
          Workout-Plan
        </button>
        <button
          :class="
            activeTab === 'Workout-Log' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Workout-Log')"
        >
          Workout-Log
        </button>
        <button
          :class="
            activeTab === 'Diet-Log' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Diet-Log')"
        >
          Diet-Log
        </button>
        <!-- <button
          :class="activeTab === 'Statistics' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'"
          class="nav-btn uppercase "
          @click="setActiveTab('Statistics')"
        >
          Statistics
        </button> -->
      </div>

      <!-- Render Box -->
      <div style="min-height: 50vh" class="over-flow-y-auto flex-1">
        <transition name="fade">
          <DetailsTab :client="clientStore.Client" v-if="activeTab == 'Details'"> </DetailsTab>
          <WorkoutPlanner
            :program="clientStore.Client.program_details"
            :user="clientStore.Client?.id"
            v-else-if="activeTab === 'Workout-Plan'"
          />
          <WorkoutLogTab
            :program="clientStore.Client.program_details"
            v-else-if="activeTab === 'Workout-Log'"
          />
          <DietLogTab :profile="clientStore.Client.profile" v-else-if="activeTab === 'Diet-Log'" />
        </transition>
      </div>
    </div>
  </div>
</template>
