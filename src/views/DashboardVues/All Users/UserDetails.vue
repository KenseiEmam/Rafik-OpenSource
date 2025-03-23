<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import WorkoutPlanner from '@/components/ProgramTabs/WorkoutPlanner.vue'
import Swal from 'sweetalert2'
import router from '@/router'
import { formatDistanceToNow, parseISO } from 'date-fns';
function humanizeDate(date: any) {
  if(!date){
    return null
  }
  return formatDistanceToNow(parseISO(date), { addSuffix: true });
}
const activeTab = ref('General Details')

const compareDate = computed(() => {
  if (!userStore.Client?.last_active) return 'N/A'
  const lastActive = new Date(userStore.Client?.last_active)
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
interface UserInterface {
  id?: number
  trainer_profile?: string
  avatar?: string
  email?: string
  gender?: string // Mapped from users.sex
  nationality?: string
  dob?: Date
  phone?: string
  first_name?: string
  last_name?: string
  last_active?: Date | string
}
interface ClientInterface extends UserInterface{
  program_details?: any
  last_active?: Date
  profile?: any
}

// Access the route object
const route = useRoute()
const userStore = useUserStore()

// Change active tab handler
function setActiveTab(tab: string) {
  activeTab.value = tab
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


// Fetch the user when the component mounts
onMounted(() => {
  const userId = parseInt(route.params.id as string)
  if (userId) {
    userStore.fetchUser(userId).then(()=>{
      if(userStore.UserDetail.id)
    {

      if(userStore.UserDetail.profile_id){

        userStore.getClient(userStore.UserDetail.id)
      }

       if (userStore.UserDetail.trainer_profile)
       {
         userStore.getTrainer(userStore.UserDetail.id)
       }
    }

    }).catch(() => {
      showError('Failed to load user details.')
    })
  }
})

onBeforeUnmount(() => {
  userStore.wipeOut();
});
</script>

<template>
  <div class="flex h-screen overflow-auto">
    <div
      v-if="userStore.UserDetail"
      class="flex-1 px-8 py-12 w-full 2xl:px-12 2xl:py-24 space-y-8 2xl:space-y-6"
    >
      <div
        class="border group flex flex-col relative gradient-bg border-rafik-alternate rounded-lg overflow-hidden"
      >
        <div class="p-8 2xl:p-16 2xl:py-24 space-y-4 relative items-stretch grid grid-cols-4">
          <div class="pr-6 space-y-4 col-span-2">
            <div class="flex items-center gap-6">
              <img
                :src="userStore.UserDetail?.avatar || 'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'"
                alt=""
                class="w-32 h-32 object-cover rounded-full border-2 border-rafik"
              />
              <div class="space-y-2">
                <h1 class="title-small w-1/3">
                  {{
                    userStore.UserDetail?.first_name + ' ' + userStore.UserDetail?.last_name ||
                    'Loading...'
                  }}
                </h1>
                <p class="text-body text-justify 2xl:w-5/6">
                  {{ userStore.UserDetail?.email || 'Loading...' }}
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
              <p class="text-rafik-secondary">{{ userStore.UserDetail.audit_status }}</p>
            </div>
            <div class="uppercase flex justify-between gap-3 text-xs">
              <p class="text-rafik-pritext dark:text-rafik-darkpritext">Date Joined</p>
              <p v-if="userStore.UserDetail.created_at" class="text-rafik-secondary">{{ new Date (userStore.UserDetail.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) }}</p>
            </div>
            <div class="uppercase flex justify-between gap-3 text-xs">
              <p class="text-rafik-pritext dark:text-rafik-darkpritext">Last Active</p>
              <p class="text-rafik-secondary">
                {{ humanizeDate(userStore.UserDetail.last_active)|| 'No Logs' }}
              </p>
            </div>

          </div>
          <div class="pl-6 flex-1 min-w-max h-full">
            <div class="flex flex-col flex-1 gap-4 border-l pl-2 border-rafik-sectext dark:border-rafik-darksectext text-left">
              <button
                v-if="userStore.UserDetail.audit_status !== 'Suspended'"
                class="text-body uppercase text-left hover:text-rafik-secondary text-rafik"
              >
                Suspend User
              </button>
              <button
                v-if="userStore.UserDetail.audit_status !== 'Banned'"
                class="text-body uppercase text-left hover:text-red-300 text-red-500"
              >
                Ban User
              </button>
              <button
                v-if="userStore.UserDetail.audit_status !== 'Active'"
                class="text-body uppercase text-left hover:text-green-300 text-rafik-alternate"
              >
                Activate
              </button>
              <button

                class="text-body uppercase text-red-500 hover:text-red-400 text-left"

              >
                Delete User
              </button>

            </div>
          </div>
        </div>
      </div>
      <!-- Tabs -->
      <div class="flex gap-8 2xl:gap-16 items-center pb-2 border-b border-rafik-sectext dark:border-rafik-darksectext">
        <button
          :class="
            activeTab === 'General Details' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'
          "
          class="nav-btn"
          @click="setActiveTab('General Details')"
        >
          General Details
        </button>
        <button
          :class="
            activeTab === 'Trainer Details' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'
          "
          v-if="userStore.O_Trainer"
          class="nav-btn uppercase"
          @click="setActiveTab('Trainer Details')"
        >
          Trainer Details
        </button>
        <button
          :class="
            activeTab === 'Trainee Details' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'
          "
          v-if="userStore.Client"
          class="nav-btn uppercase"
          @click="setActiveTab('Trainee Details')"
        >
          Trainee Details
        </button>
        <button
          :class="
            activeTab === 'Certifications' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'
          "
          v-if="userStore.O_Trainer"
          class="nav-btn uppercase"
          @click="setActiveTab('Certifications')"
        >
          Certifications
        </button>
        <button
          :class="
            activeTab === 'Workout-Plan' ? 'text-rafik-pritext dark:text-rafik-darkpritext cursor-default' : ' hover:opacity-70'
          "
          v-if="userStore.Client?.program_details"
          class="nav-btn uppercase"
          @click="setActiveTab('Workout-Plan')"
        >
          Workout-Plan
        </button>
      </div>

      <!-- Render Box -->
      <div style="min-height: 50vh" class="over-flow-y-auto flex-1">
        <transition name="fade">
          <WorkoutPlanner
            :program="userStore.Client.program_details"
            admin
            :user="userStore.Client?.id"
            v-if="activeTab === 'Workout-Plan' && userStore.Client"
          />
        </transition>
      </div>
    </div>
  </div>
</template>
