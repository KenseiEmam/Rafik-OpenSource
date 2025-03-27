<template>
  <div class="flex h-screen overflow-auto">
    <div
      v-if="entitlementStore.entitlements"
      class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 gap-6"
    >
      <!-- Page Title -->
      <PageTitle
        :subheader="t('dashboard.entitlements.list.client')"
        :header="t('dashboard.entitlements.list.entitlements')"
      />

      <!-- Loading State -->
      <div
        v-if="loading"
        class="h-full flex flex-col gap-2 items-center justify-center text-center w-full text-body"
      >
        <!-- Dark Mode Icon -->
        <img
          src="@/assets/Large Icon.png"
          class="w-24 h-24 animate-bounce hidden dark:inline-block"
          alt=""
        />
        <!-- Light Mode Icon -->
        <img
          src="@/assets/Large Icon Light.png"
          class="w-24 h-24 animate-bounce dark:hidden"
          alt=""
        />
        <p class="text-lg animate-pulse">
          {{ t('dashboard.entitlements.list.loading') }}
        </p>
      </div>

      <!-- Entitlement Table -->
      <div class="grid grid-cols-2 gap-6 2xl:gap-12 card p-12 items-center" v-if="!loading">
        <div>
          <h2 class="header-medium mb-6">
            {{ t('dashboard.entitlements.list.whatAreEntitlements') }}
          </h2>
          <p class="text-body">
            {{ t('dashboard.entitlements.list.entitlementsDescription') }}
          </p>
          <div class="flex items-center my-6">
            <h2 class="header-small">
              {{ t('dashboard.entitlements.list.youCurrentlyHave') }}
            </h2>
            <p class="contentH-large 2xl:text-7xl ml-auto">
              {{ entitlementStore.entitlements.filter((e) => !e.client_email).length }}
            </p>
            <h2 class="header-small text-rafik-secondary uppercase font-semibold">
              {{ t('dashboard.entitlements.list.avlEntitlements') }}
            </h2>
          </div>
          <div class="w-full flex">
            <!-- Purchase Entitlement Button -->
            <router-link
              :to="{ name: 'purchase-entitlements' }"
              class="w-full btn-lg-outline transition-all"
            >
              {{ t('dashboard.entitlements.list.purchaseMore') }}
            </router-link>
          </div>
        </div>

        <div v-if="!processing">
          <AssignEntitlementsModal
            :availableCount="entitlementStore.unusedEntitlementCount"
            :programs="programStore.AllPrograms || []"
            @submit="onAssignModalSubmit"
          />
        </div>
        <div v-else>
          <p
            class="animate-pulse text-body w-full h-full flex items-center text-center justify-center"
          >
            {{ t('dashboard.entitlements.list.processingRequest') }}
          </p>
        </div>
      </div>

      <!-- User Programs -->
      <div class="flex-1 flex flex-col h-full" v-if="!loading && userStore.Entitled">
        <!-- Table with existing entitlements -->
        <table v-if="userStore.Entitled.length > 0" class="w-full text-center">
          <thead class="font-bold">
            <tr>
              <th></th>
              <th>{{ t('dashboard.entitlements.list.dateJoined') }}</th>
              <th>{{ t('dashboard.entitlements.list.expiresOn') }}</th>
              <th>{{ t('dashboard.entitlements.list.planMonths') }}</th>
              <th>{{ t('dashboard.entitlements.list.status') }}</th>
              <th>{{ t('dashboard.entitlements.list.autoReroll') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="client in userStore.Entitled" :key="client.id" class="rounded-xl p-4">
              <td
                class="flex gap-6 rounded-l-xl text-left items-center py-4 pl-3 bg-rafik-secbg dark:bg-rafik-darksecbg"
              >
                <img
                  :src="client.avatar || defaultAvatar"
                  class="w-12 h-12 rounded-full border-2 border-rafik"
                  alt="Avatar"
                />
                <div>
                  <p class="header-small">{{ client.first_name }} {{ client.last_name }}</p>
                  <p>{{ client.email }}</p>
                </div>
              </td>

              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg">
                {{
                  new Date(client.program_details.created_at).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) || '-'
                }}
              </td>
              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg">
                {{
                  new Date(client.program_details.expires_on).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) || '-'
                }}
              </td>
              <td class="bg-rafik-secbg dark:bg-rafik-darksecbg">
                {{ client.program_details.months_package || '-' }}
                {{ t('dashboard.entitlements.list.monthsSuffix') }}
              </td>
              <td class="uppercase bg-rafik-secbg dark:bg-rafik-darksecbg text-rafik">
                {{ client.program_details.status || client }}
              </td>
              <td class="uppercase bg-rafik-secbg dark:bg-rafik-darksecbg text-rafik rounded-r-xl">
                <div class="flex justify-center">
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      @change="changeReroll(client.program_details)"
                      v-model="client.program_details.auto_reroll"
                      class="hidden"
                    />
                    <div
                      class="w-16 h-8 flex items-center border-rafik-pritext dark:border-rafik-darkpritext border-2 rounded-full transition-all"
                      :class="{ 'bg-rafik': client.program_details.auto_reroll }"
                    >
                      <div
                        class="w-8 h-8 bg-rafik-pritext dark:bg-rafik-darkpritext rounded-full shadow-md transform transition-transform"
                        :class="{ 'translate-x-8': client.program_details.auto_reroll }"
                      ></div>
                    </div>
                  </label>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- If no users found -->
        <p v-if="userStore.Entitled.length === 0" class="text-center my-auto">
          {{ t('dashboard.entitlements.list.noEntitledUsers') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import PageTitle from '@/components/Navigation/PageTitle.vue';
import { useEntitlementStore } from '@/stores/entitlementstores';
import { useProgramStore } from '@/stores/programstores';
import { useUserStore } from '@/stores/user';
import Swal from 'sweetalert2';
import { supabase } from '@/lib/supabaseClient';
import AssignEntitlementsModal from './AssignEntitlementsModal.vue';
import router from '@/router';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Store references
const entitlementStore = useEntitlementStore();
const programStore = useProgramStore();
const userStore = useUserStore();

// Local reactive states
const loading = ref(false);
const showAssignEntitlementModal = ref(false);
const processing = ref(false);

// Default avatar fallback
const defaultAvatar =
  'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png';

// Refresh component
function refreshComponent() {
  router.go(0);
}

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

// On mount, load entitlements, programs, and user data
onMounted(() => {
  loading.value = true;
  entitlementStore
    .getEntitlements()
    .then(programStore.getAllPrograms)
    .then(userStore.getEntitled)
    .then(() => {
      loading.value = false;
    });
});

// Toggle re-roll for a user's program subscription
async function changeReroll(program: any) {
  await userStore
    .updateClientProgram(program)
    .then(() => {
      if (program.auto_reroll) {
        showSuccess('dashboard.entitlements.list.autoRerollEnabled');
      } else {
        showSuccess('dashboard.entitlements.list.autoRerollDisabled');
      }
    })
    .finally(() => {
      entitlementStore.getEntitlements();
      userStore.getEntitled();
    });
}

// Called when the AssignEntitlementsModal emits a "submit" event
async function onAssignModalSubmit(payload: { programId: string; emails: string[] }) {
  const { programId, emails } = payload;
  await assignEntitlementsToUsers(programId, emails);
  showAssignEntitlementModal.value = false;
}

// Function to assign entitlements
async function assignEntitlementsToUsers(programId: string, emails: string[]) {
  processing.value = true;

  const availableEntitlements = entitlementStore.entitlements.filter(
    (e) => e.client_email === null
  );

  // Simple check to ensure no more entitlements than we have
  if (emails.length > availableEntitlements.length) {
    showError('dashboard.entitlements.list.tooManyEntitlements');
    processing.value = false;
    return;
  }

  // If any user is already assigned an entitlement
  for (const email of emails) {
    const userAlreadyAssigned = entitlementStore.entitlements.find(
      (entitlement) => entitlement.client_email === email
    );
    if (userAlreadyAssigned) {
      showError('dashboard.entitlements.list.alreadyAssigned');
      processing.value = false;
      return;
    }
  }

  // Validate that the program exists
  const program = programStore.AllPrograms?.find((p) => p.id === programId);
  if (!program) {
    showError('dashboard.entitlements.list.programNotFound');
    processing.value = false;
    return;
  }

  // Assign entitlements
  await Promise.all(
    emails.map(async (email, index) => {
      const entitlement = availableEntitlements[index];
      if (entitlement) {
        await entitlementStore.assignEntitlement(entitlement.id, email, program);
      }
    })
  ).then(() => {
    showSuccess('dashboard.entitlements.list.emailsSentSuccessfully');
  });

  // Refresh entitlements and user data
  await Promise.all([entitlementStore.getEntitlements(), userStore.getEntitled()]);
  processing.value = false;
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
