<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import DetailsTab from '@/components/ClientTabs/DetailsTab.vue';
import WorkoutPlanner from '@/components/ProgramTabs/WorkoutPlanner.vue';
import WorkoutLogTab from '@/components/ClientTabs/WorkoutLogTab.vue';
import Swal from 'sweetalert2';
import router from '@/router';
import DietLogTab from '@/components/ClientTabs/DietLogTab.vue';
import ChangeProgramModal from '@/components/ClientTabs/ChangeProgramModal.vue';
import CancelProgramModal from '@/components/ClientTabs/CancelProgramModal.vue';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from 'vue-i18n';
import WeightLog from '@/components/ClientTabs/WeightLog.vue';
import TrophyRoom from '@/components/ClientTabs/TrophyRoom.vue';

const { t , locale } = useI18n();

const activeTab = ref('Details');

// Store references
const route = useRoute();
const clientStore = useUserStore();

/**
 * We check if the client has been active within the last 5 minutes (online).
 * This computed returns a boolean.
 */
const compareDate = computed(() => {
  if (!clientStore.Client?.last_active) return 'N/A';
  const lastActive = new Date(clientStore.Client?.last_active);
  const now = new Date();

  const isOnline = now.getTime() - lastActive.getTime() <= 5 * 60 * 1000;
  if (isOnline) {
    console.log(t('dashboard.clients.details.clientIsOnline'));
  } else {
    console.log(t('dashboard.clients.details.clientIsOffline'));
  }
  return isOnline;
});

interface ClientInterface {
  id?: number;
  avatar?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  program_details?: any;
}

// Change active tab handler
function setActiveTab(tab: string) {
  activeTab.value = tab;
}

/** Show success alerts */
function showSuccess(messageKey: string) {
  Swal.fire({
    title: t('dashboard.clients.details.successTitle'),
    text: t(messageKey),
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 1500,
    toast: true,
    position: 'top-right',
    icon: 'success',
    cancelButtonColor: '#d33',
    background: '#132e3d',
    color: '#ececec'
  });
}

/** Show error alerts */
function showError(messageKey: string) {
  Swal.fire({
    title: t('dashboard.clients.details.errorTitle'),
    text: t(messageKey),
    icon: 'error',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#d33',
    background: '#132e3d',
    color: '#ececec'
  });
}

// ==================
// PROGRAM IMPORT LOGIC
// ==================
const showAddProgramModal = ref(false);

/** Overwrite the current client's program with a new program. */
async function importProgram(value: any) {
  if (!clientStore.Client) {
    showError('dashboard.clients.details.clientNotFound');
    return;
  }
  try {
    await clientStore.updateClientProgram({
      id: clientStore.Client.program_details.id,
      ...value
    });
    const clientId = parseInt(route.params.id as string);
    if (clientId) {
      clientStore.getClient(clientId).catch(() => {
        showError('dashboard.clients.details.failedToLoadClient');
      });
    }
    showSuccess('dashboard.clients.details.changeSuccessful');
  } catch (error) {
    showError('dashboard.clients.details.failedToChange');
  }
  showAddProgramModal.value = false;
}

// ==================
// CANCEL SUBSCRIPTION LOGIC
// ==================
const showCancelModal = ref(false);

/** Confirm-cancel logic (non-async). */
function confirmCancel(value: string) {
  Swal.fire({
    title: t('dashboard.clients.details.cancelConfirmTitle'),
    text: t('dashboard.clients.details.cancelConfirmText'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('dashboard.clients.details.cancelConfirmButton'),
    confirmButtonColor: '#1578ac',
    cancelButtonColor: '#d33',
    background: '#132e3d',
    color: '#ececec'
  }).then((result) => {
    if (result.isConfirmed) {
      cancelProgram(value);
    }
  });
}
const workout_it = ref(0)

/** Actually send the cancel request & update user program. */
async function cancelProgram(value: string) {
  if (!clientStore.Client) {
    showError('dashboard.clients.details.clientNotFound');
    return;
  }
  try {
    const UserID = localStorage.getItem('UserID');
    if (!UserID) {
      showError('dashboard.clients.details.noUserIdFound');
      return;
    }
    if (!clientStore.Client.program_details.id) {
      showError('dashboard.clients.details.noUserProgramFound');
      return;
    }
    const newRequest = {
      reasoning: value,
      raised_by: UserID,
      user_program_id: clientStore.Client.program_details.id,
      status: 'raised'
    };

    const { data, error } = await supabase.from('cancel_request').insert(newRequest).select();
    if (error) {
      throw new Error(
        `${t('dashboard.clients.details.errorCreatingCancellation')} : ${error.message}`
      );
    }

    await clientStore.updateClientProgram({
      id: clientStore.Client.program_details.id,
      status: 'review'
    });
    const clientId = parseInt(route.params.id as string);
    if (clientId) {
      clientStore.getClient(clientId).catch(() => {
        showError('dashboard.clients.details.failedToLoadClient');
      });
    }

    showSuccess('dashboard.clients.details.cancellationInReview');
  } catch (error) {
    console.error(error);
    showError('dashboard.clients.details.errorCancellingProgram');
  }
  showCancelModal.value = false;
  router.push({ name: 'clients-list' });
}

/** Re-load the page (not strictly needed here). */
function refreshComponent() {
  router.go(0);
}

/** Update the program's workout plan. */
async function updateClientProgram(field: string, value: any) {
  if (!clientStore.Client?.id) {
    showError('dashboard.clients.details.clientNotFound');
    return;
  }

  try {
    await clientStore.updateClientProgram({
      id: clientStore.Client.program_details.id,
      workouts: value.workouts
    });
    await clientStore.getClient(clientStore.Client?.id);
    showSuccess('dashboard.clients.details.updatedSuccessfully');
  } catch (error) {
    showError('dashboard.clients.details.failedToUpdateField');
    console.error(`Error updating ${field}:`, error);
  }
}


/** Update the profile's iteration then update workouts. */
async function updateIteration() {
  if (!clientStore.Client?.id) {
    showError('dashboard.clients.details.clientNotFound');
    return;
  }

  // Assuming the profile ID is the same as client ID
  const profileId = clientStore.Client.profile.id;

  const { error: error1 } = await supabase
    .from('profiles')
    .update({ workout_iteration: workout_it.value })
    .eq('id', profileId);

  if (error1) {
    showError('dashboard.clients.details.failedToUpdateField');
    return;
  }

  try {
    await clientStore.updateClientProgram({
      id: clientStore.Client.program_details.id,
      workouts: clientStore.Client.program_details.workouts,
    });
    await clientStore.getClient(clientStore.Client.id);
    showSuccess('dashboard.clients.details.updatedSuccessfully');
  } catch (error) {
    showError('dashboard.clients.details.failedToUpdateField');
    console.error('Error updating workouts', error);
  }
}


// On mount, fetch the client details
onMounted(() => {
  const clientId = parseInt(route.params.id as string);
  if (clientId) {
    clientStore.getClient(clientId).then(()=>{
      workout_it.value=clientStore.Client?.profile.workout_iteration
    }).catch(() => {
      showError('dashboard.clients.details.failedToLoadClient');
    });
  }
});

// Clean up store on unmount
onBeforeUnmount(() => {
  clientStore.wipeOut();
});
</script>

<template>
  <div class="flex h-screen overflow-auto">
    <div
      v-if="clientStore.Client"
      class="flex-1 px-8 py-12 w-full 2xl:px-12 2xl:py-24 space-y-8 2xl:space-y-6"
    >
      <!-- Header Card -->
      <div
        class="border group flex flex-col relative gradient-bg border-topsets-alternate rounded-lg overflow-hidden"
      >
        <div class="p-8 2xl:p-16 2xl:py-24 space-y-4 relative items-stretch grid grid-cols-4">
          <div class="pr-6 space-y-4 col-span-2">
            <div class="flex items-center gap-6">
              <img
                :src="
                  clientStore.Client?.avatar ||
                  'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'
                "
                alt=""
                class="w-32 h-32 object-cover rounded-full border-2 border-topsets"
              />
              <div class="space-y-2">
                <h1 class="title-small w-1/3">
                  {{
                    clientStore.Client?.first_name + ' ' + clientStore.Client?.last_name ||
                    t('dashboard.clients.details.loading')
                  }}
                </h1>
                <p class="text-body text-justify 2xl:w-5/6">
                  {{ clientStore.Client?.email || t('dashboard.clients.details.loading') }}
                </p>
                <div
                  class="py-1 px-4 3xl:px-5 2xl:py-2 2xl:text-sm text-sm rounded-3xl max-w-max text-topsets-pritext dark:text-topsets-darkpritext uppercase font-semibold"
                  :class="compareDate ? 'bg-topsets-alternate' : 'bg-topsets-secondary'"
                >
                  {{
                    compareDate
                      ? t('dashboard.clients.details.online')
                      : t('dashboard.clients.details.away')
                  }}
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-4 justify-between">
            <div class="uppercase flex justify-between gap-3 text-sm">
              <p class="text-topsets-pritext dark:text-topsets-darkpritext">
                {{ t('dashboard.clients.details.statusLabel') }}
              </p>
              <p class="text-topsets-secondary">
                {{ clientStore.Client.program_details?.status }}
              </p>
            </div>

            <div class="uppercase flex justify-between gap-3 text-sm">
              <p class="text-topsets-pritext dark:text-topsets-darkpritext">
                {{ t('dashboard.clients.details.dietLastLogged') }}
              </p>
              <p class="text-topsets-secondary">
                {{
                  clientStore.Client.program_details?.diet_last_logged ||
                  t('dashboard.clients.details.noLogs')
                }}
              </p>
            </div>
            <div class="uppercase flex justify-between gap-3 text-sm">
              <p class="text-topsets-pritext dark:text-topsets-darkpritext">
                {{ t('dashboard.clients.details.progress') }}
              </p>
              <p class="text-topsets-secondary">
                {{
                  Math.ceil(
                    (clientStore.Client.program_details?.volume_progress +
                      clientStore.Client.program_details?.intensity_progress) /
                      2
                  )
                }}
                %
              </p>
            </div>
          </div>
          <div :class="locale === 'ar'?'pr-6':'pl-6'" class=" flex-1 min-w-max h-full">
            <div :class="locale === 'ar'?'border-r pr-2':'border-l pl-2'"
              class="flex flex-col flex-1 gap-4 h-full border-topsets-sectext dark:border-topsets-darksectext text-left"
            >

            <div class="uppercase text-sm">
              <p class="text-topsets-pritext dark:text-topsets-darkpritext">
                {{ t('dashboard.clients.details.workoutIteration') }}
              </p>
              <select v-model="workout_it" @change="updateIteration" class="topsets-text-input p-2 text-sm" name="" id="">
                <option v-for="workout,index in clientStore.Client.program_details.workouts" :value="index">
                  {{ workout.workout_name || 'Rest Day' }}
                </option>
              </select>
            </div>
              <!-- If subscription is active -->
              <button
                v-if="clientStore.Client.program_details.status === 'active'"
                @click="showAddProgramModal = true"
                class="text-body uppercase text-left hover:text-topsets-pritext dark:hover:text-topsets-darkpritext dark:text-topsets-darkpritext"
              >
                {{ t('dashboard.clients.details.changeProgram') }}
              </button>
              <button
                v-if="clientStore.Client.program_details.status === 'active'"
                @click="showCancelModal = true"
                class="text-body uppercase text-red-500 hover:text-red-400 text-left"
              >
                {{ t('dashboard.clients.details.cancelSubscription') }}
              </button>
              <!-- If subscription is in review -->
              <button
                v-else-if="clientStore.Client.program_details.status === 'review'"
                class="text-body uppercase text-topsets-secondary text-left cursor-default"
              >
                {{ t('dashboard.clients.details.cancellationPending') }}
              </button>
              <!-- If subscription is cancelled -->
              <button
                v-else-if="clientStore.Client.program_details.status === 'cancelled'"
                class="text-body uppercase text-red-500 text-left cursor-default"
              >
                {{ t('dashboard.clients.details.subscriptionCancelled') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Change Program Modal -->
      <ChangeProgramModal
        :visible="showAddProgramModal"
        @close="showAddProgramModal = false"
        @submit="importProgram"
      />
      <!-- Cancel Program Modal -->
      <CancelProgramModal
        :visible="showCancelModal"
        @close="showCancelModal = false"
        @submit="confirmCancel"
      />

      <!-- Tabs -->
      <div
        class="flex gap-8 2xl:gap-16 items-center pb-2 border-b border-topsets-sectext dark:border-topsets-darksectext"
      >
        <button
          class="nav-btn"
          :class="
            activeTab === 'Details'
              ? 'text-topsets-pritext dark:text-topsets-darkpritext cursor-default'
              : ' hover:opacity-70'
          "
          @click="setActiveTab('Details')"
        >
          {{ t('dashboard.clients.details.detailsTab') }}
        </button>
        <button
          class="nav-btn uppercase"
          :class="
            activeTab === 'Workout-Plan'
              ? 'text-topsets-pritext dark:text-topsets-darkpritext cursor-default'
              : ' hover:opacity-70'
          "
          @click="setActiveTab('Workout-Plan')"
        >
          {{ t('dashboard.clients.details.workoutPlanTab') }}
        </button>
        <button
          class="nav-btn uppercase"
          :class="
            activeTab === 'Workout-Log'
              ? 'text-topsets-pritext dark:text-topsets-darkpritext cursor-default'
              : ' hover:opacity-70'
          "
          @click="setActiveTab('Workout-Log')"
        >
          {{ t('dashboard.clients.details.workoutLogTab') }}
        </button>
        <button
          class="nav-btn uppercase"
          :class="
            activeTab === 'Diet-Log'
              ? 'text-topsets-pritext dark:text-topsets-darkpritext cursor-default'
              : ' hover:opacity-70'
          "
          @click="setActiveTab('Diet-Log')"
        >
          {{ t('dashboard.clients.details.dietLogTab') }}
        </button>
        <button
          class="nav-btn uppercase"
          :class="
            activeTab === 'Diet-Log'
              ? 'text-topsets-pritext dark:text-topsets-darkpritext cursor-default'
              : ' hover:opacity-70'
          "
          @click="setActiveTab('Weight-Log')"
        >
          {{ t('dashboard.clients.details.weightLogTab') }}
        </button>
        <button
          class="nav-btn uppercase"
          :class="activeTab === 'Trophy-Room' ? 'text-topsets-pritext dark:text-topsets-darkpritext cursor-default' : ' hover:opacity-70'"
          @click="setActiveTab('Trophy-Room')"
        >
          {{ t('dashboard.clients.details.trophyRoom') }}
        </button>

        <!-- Placeholder if you want additional tabs:
        <button
          class="nav-btn uppercase"
          :class="activeTab === 'Statistics' ? 'text-topsets-pritext dark:text-topsets-darkpritext cursor-default' : ' hover:opacity-70'"
          @click="setActiveTab('Statistics')"
        >
          {{ t('dashboard.clients.details.statisticsTab') }}
        </button>
        -->
      </div>

      <!-- Render Box -->
      <div style="min-height: 50vh" class="over-flow-y-auto flex-1">
        <transition name="fade">
          <!-- Details Tab -->
          <DetailsTab v-if="activeTab === 'Details'" :client="clientStore.Client" />
          <!-- Workout Plan Tab -->
          <WorkoutPlanner
            v-else-if="activeTab === 'Workout-Plan'"
            :program="clientStore.Client.program_details"
            :user="clientStore.Client?.id"
          />
          <!-- Workout Log Tab -->
          <WorkoutLogTab
            v-else-if="activeTab === 'Workout-Log'"
            :program="clientStore.Client.program_details"
          />
          <!-- Diet Log Tab -->
          <DietLogTab v-else-if="activeTab === 'Diet-Log'" :profile="clientStore.Client.profile" />
          <!-- Weight Log Tab -->
          <WeightLog v-else-if="activeTab === 'Weight-Log'" :profile="clientStore.Client.profile" />
          <!-- Trophy Room Tab -->
           <TrophyRoom v-else-if="activeTab === 'Trophy-Room'" :client="clientStore.Client.profile" />
        </transition>
      </div>
    </div>
  </div>
</template>
