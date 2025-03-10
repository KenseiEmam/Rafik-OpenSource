<template>
  <div class="flex h-screen overflow-auto">
    <div
      v-if="entitlementStore.entitlements"
      class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 gap-6"
    >
      <!-- Page Title -->
      <PageTitle subheader="Client" header="Entitlements" />
      <!-- Loading State -->
      <div v-if="loading" class="text-center 2xl:my-auto subheader-small uppercase animate-pulse">
        Loading Entitlement Data Please Hold...
      </div>

      <!-- Entitlement Table -->
      <div class="grid grid-cols-2 gap-6 2xl:gap-12 card p-12 items-center" v-if="!loading">
        <div>
          <h2 class="header-medium mb-6">What Are Entitlements?</h2>
          <p class="text-body">
            Entitlements are trainer-purchased subscriptions that can be assigned to trainees,
            allowing trainers to charge their own rates for their services. Each entitlement lasts
            for one month, after which a new one must be assigned for continued training access. To
            streamline the process, trainers can add clients to the auto-update queue below. This
            ensures that when a trainee’s subscription expires, a new entitlement is automatically
            assigned, preventing any interruptions in their training.
          </p>
          <div class="flex items-center my-6">
            <h2 class="header-small">You currently have:</h2>
            <p class="contentH-large 2xl:text-7xl ml-auto">
              {{ entitlementStore.entitlements.filter((e) => !e.client_id).length }}
            </p>
            <h2 class="header-small text-rafik-secondary uppercase font-semibold">
              Avl. Entitlements
            </h2>
          </div>
          <div class="w-full flex">
            <!-- Purchase Entitlement Button -->
            <router-link
              :to="{ name: 'purchase-entitlements' }"
              class="w-full btn-lg-outline transition-all"
            >
              Purchase More
            </router-link>
          </div>
        </div>
        <div>
          <AssignEntitlementsModal
            :availableCount="entitlementStore.unusedEntitlementCount"
            :programs="programStore.ActivePrograms || []"
            @submit="onAssignModalSubmit"
          />
        </div>
      </div>
      <!-- User Programs -->
      <div class="flex-1 flex flex-col h-full" v-if="!loading && userStore.Entitled">
        <table v-if="userStore.Entitled.length > 0" class="w-full text-center">
          <thead class="contentH-small mb-24">
            <tr>
              <th></th>
              <th>Date Joined</th>
              <th>Expires On</th>
              <th>Plan (Months)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="client in userStore.Entitled" :key="client.id" class="rounded-xl p-4 ">
              <td
                class="flex gap-6 border-l border-y border-rafik-sectext rounded-l-xl text-left items-center py-4 pl-3 bg-rafik-secbg"
              >
                <img
                  :src="client.avatar || 'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'"
                  class="w-12 2xl:w-24 rounded-full border-2 border-rafik h-12 2xl:h-24"
                  alt="Avatar"
                />
                <div>
                  <p class="header-small">{{ client.first_name }} {{ client.last_name }}</p>
                  <p>{{ client.email }}</p>
                </div>
              </td>

              <td class="bg-rafik-secbg border-y border-rafik-sectext">
                {{ new Date(client.program_details.created_at).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    || '-'
                }}
              </td>
              <td class="bg-rafik-secbg border-y border-rafik-sectext">
                {{ new Date(client.program_details.expires_on).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    || '-'
                }}
              </td>
              <td class="bg-rafik-secbg border-y border-rafik-sectext">
                {{ client.program_details.months_package
                    || '-'
                }} months
              </td>
              <td class="uppercase bg-rafik-secbg text-rafik border-y border-r rounded-r-xl border-rafik-sectext b">
                {{ client.program_details.status || client}}
              </td>

            </tr>
          </tbody>
        </table>
        <p v-if="userStore.Entitled.length===0" class="text-center my-auto">
          :/ <br />
          No Entitled Users Found. Assign some to see down here!
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageTitle from '@/components/Navigation/PageTitle.vue'
import { useEntitlementStore } from '@/stores/entitlementstores'
import { useProgramStore } from '@/stores/programstores'
import { useUserStore } from '@/stores/user'
import Swal from 'sweetalert2'
import { supabase } from '@/lib/supabaseClient'
import AssignEntitlementsModal from './AssignEntitlementsModal.vue' // New modal component
import router from '@/router'

// Store references
const entitlementStore = useEntitlementStore()
const programStore = useProgramStore()
const userStore = useUserStore()
// Local reactive states
const loading = ref(false)
const showAssignEntitlementModal = ref(false) // Controls modal visibility
function refreshComponent() {
  router.go(0); // This reloads the current route
}
// Success and Error Alerts
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
    background: '#081411',
    color: '#E8F3ED',
  })
}

function showError(message: string) {
  Swal.fire({
    title: 'Error!',
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED',
  })
}

// Load entitlements and programs on mount
onMounted(() => {
  loading.value = true
  entitlementStore
    .getEntitlements()
    .then(programStore.getAllPrograms)
    .then(userStore.getEntitled)
    .then(() => {
      loading.value = false
    })
})

// Called when the AssignEntitlementsModal emits a "submit" event
async function onAssignModalSubmit(payload: { programId: string; emails: string[] }) {
  const { programId, emails } = payload
  await assignEntitlementsToUsers(programId, emails)
  showAssignEntitlementModal.value = false
}

// Function to assign entitlements
async function assignEntitlementsToUsers(programId: string, emails: string[]) {
  const availableEntitlements = entitlementStore.entitlements.filter((e) => e.client_id === null);

  if (emails.length > availableEntitlements.length) {
    showError(`You can only assign up to ${availableEntitlements.length} entitlements.`);
    return;
  }

  // Fetch user IDs and profiles in a batch request
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email')
    .in('email', emails.map(email => email.trim()));

  if (usersError || !users || users.length !== emails.length) {
    showError('Some users are not registered. Please check the emails and try again.');
    return;
  }

  const userIds = users.map(user => user.id);

  // Fetch profiles for these users in one request
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, user_id')
    .in('user_id', userIds);

  if (profilesError || !profiles || profiles.length !== emails.length) {
    showError('Some users do not have profiles. Please ask them to create one.');
    return;
  }

  // Map user IDs to profile IDs
  const profileMap = new Map(profiles.map(profile => [profile.user_id, profile.id]));

  // Check if any users are already assigned an entitlement
  for (const email of emails) {
    const user = users.find(u => u.email === email.trim());
    const profileId = profileMap.get(user?.id);

    if (!profileId) {
      showError(`User with email ${email} does not have a profile.`);
      return;
    }

    const userAlreadyAssigned = entitlementStore.entitlements.find(
      entitlement => entitlement.client_id === profileId
    );

    if (userAlreadyAssigned) {
      showError(`User with email ${email} is already assigned to a program.`);
      return;
    }
  }

  // Get the active program
  const program = programStore.ActivePrograms?.find(p => p.id === programId);
  if (!program) {
    showError("Program not found!")
    return;
  }

  // Assign entitlements
  await Promise.all(
    emails.map(async (_, index) => {
      const entitlement = availableEntitlements[index];
      const profileId = profileMap.get(users[index].id);
      if (entitlement && profileId) {
        await entitlementStore.assignEntitlement(entitlement.id, profileId, program);
      }
    })
  );

  // Refresh entitlements and user data
  await Promise.all([
    entitlementStore.getEntitlements(),
    userStore.getEntitled()
  ]);

  showSuccess("Assigned entitlement successfully!")
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
