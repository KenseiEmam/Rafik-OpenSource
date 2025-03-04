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
            Entitlements are trainer-purchased subscriptions that can be assigned to trainees, allowing trainers to
            charge their own rates for their services. Each entitlement lasts for one month, after which a new one must
            be assigned for continued training access. To streamline the process, trainers can add clients to the
            auto-update queue below. This ensures that when a trainee’s subscription expires, a new entitlement is
            automatically assigned, preventing any interruptions in their training.
          </p>
          <div class="flex items-center my-6">
            <h2 class="header-small">You currently have:</h2>
            <p class="contentH-large 2xl:text-7xl ml-auto">
              {{ entitlementStore.entitlements.length }}
            </p>
            <h2 class="header-small text-rafik-secondary uppercase font-semibold">Avl. Entitlements</h2>
          </div>
          <div class="w-full flex">
            <!-- Purchase Entitlement Button -->
            <router-link :to="{ name: 'purchase-entitlements' }" class="w-full btn-lg-outline transition-all">
              Purchase More
            </router-link>
          </div>
        </div>
        <div>
          <AssignEntitlementsModal
            :availableCount="entitlementStore.unusedEntitlementCount"
            :programs="programStore.AllPrograms || []"
            @submit="onAssignModalSubmit"
          />
        </div>
      </div>
      <!-- User Programs -->
        <div class="flex-1 flex flex-col h-full" v-if="!loading && userStore.Entitled">
        <table v-if="userStore.Entitled.length>0" class="w-full text-center">
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
            <tr
              v-for="client in userStore.Entitled"
              :key="client.id"
              class="rounded-xl p-4 w-full"
            >
              <td
                class="flex gap-6 border-l border-y border-rafik-sectext rounded-l-xl text-left items-center py-4 pl-3 bg-rafik-secbg"
              >
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

              <td class="bg-rafik-secbg border-y border-rafik-sectext">
                {{
                  client.program_details.length
                    ? new Date(client.program_details[0].created_at).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '-'
                }}
              </td>
              <td class="bg-rafik-secbg border-y border-rafik-sectext">
                {{
                  client.program_details.length
                    ? new Date(client.program_details[0].expires_on).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '-'
                }}
              </td>
              <td class="bg-rafik-secbg border-y border-rafik-sectext">
                {{
                  client.program_details.length
                    ? client.program_details[0].months_package + ' month'
                    : '-'
                }}
              </td>
              <td class="uppercase bg-rafik-secbg text-rafik border-y border-rafik-sectext">
                {{ client.program_details.length ? client.program_details[0].status : '-' }}
              </td>

            </tr>
          </tbody>
        </table>
        <p class=" text-center my-auto">:/ <br> No Entitled Users Found. Assign some to see down here!</p>
    </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import PageTitle from "@/components/PageTitle.vue";
import { useEntitlementStore } from "@/stores/entitlementstores";
import { useProgramStore } from "@/stores/programstores";
import { useUserStore } from "@/stores/user";
import Swal from "sweetalert2";
import { supabase } from "@/lib/supabaseClient";
import AssignEntitlementsModal from "./AssignEntitlementsModal.vue"; // New modal component

// Store references
const entitlementStore = useEntitlementStore();
const programStore = useProgramStore();
const userStore  = useUserStore();
// Local reactive states
const loading = ref(false);
const showAssignEntitlementModal = ref(false); // Controls modal visibility

// Success and Error Alerts
function showSuccess(message: string) {
  Swal.fire({
    title: "Success!",
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 1500,
    text: message,
    toast: true,
    position: "top-right",
    icon: "success",
    background: "#081411",
    color: "#E8F3ED",
  });
}

function showError(message: string) {
  Swal.fire({
    title: "Error!",
    text: message,
    icon: "error",
    confirmButtonColor: "#d33",
    background: "#081411",
    color: "#E8F3ED",
  });
}

// Load entitlements and programs on mount
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

// "Coming Soon" alert for Purchase Entitlement button
function showComingSoonAlert() {
  showError("This feature is coming soon. Stay tuned!");
}

// Handler for the "Assign Entitlement" button
function handleAssignEntitlement() {
  if (entitlementStore.unusedEntitlementCount <= 0) {
    showError("You have no available entitlements. Please purchase more or unassign existing ones.");
    return;
  }

  if (!programStore.AllPrograms || programStore.AllPrograms.length === 0) {
    showError("You must have at least one active program before assigning entitlements.");
    return;
  }

  // Open the custom Vue modal
  showAssignEntitlementModal.value = true;
}

// Called when the AssignEntitlementsModal emits a "submit" event
async function onAssignModalSubmit(payload: { programId: string; emails: string[] }) {
  const { programId, emails } = payload;
  await assignEntitlementsToUsers(programId, emails);
  showAssignEntitlementModal.value = false;
}

// Function to assign entitlements
async function assignEntitlementsToUsers(programId: string, emails: string[]) {
  const availableEntitlements = entitlementStore.entitlements.filter((e) => e.client_id === null);
  if (emails.length > availableEntitlements.length) {
    showError(`You can only assign up to ${availableEntitlements.length} entitlements.`);
    return;
  }

  const assignedUserIds: string[] = [];

  // Validate each email against the "users" table
  for (const email of emails) {
    const { data: user, error } = await supabase.from("users").select("id").eq("email", email.trim()).single();

    if (error || !user) {
      showError(`User with email ${email} is not registered.`);
      return;
    }

    // Check if the user is already assigned to an entitlement
    const userAlreadyAssigned = entitlementStore.entitlements.find((entitlement) => entitlement.client_id === user.id);
    if (userAlreadyAssigned) {
      showError(`User with email ${email} is already assigned to a program.`);
      return;
    }

    assignedUserIds.push(user.id);
  }

  // Update entitlements for each email/user
  const updatePromises = emails.map((_, index) => {
    const entitlement = availableEntitlements[index];
    const updatedData = {
      client_id: assignedUserIds[index],
      program_id: programId,
      status: "active",
    };
    return entitlementStore.updateEntitlement(entitlement.id, updatedData);
  });

  await Promise.all(updatePromises);
  showSuccess("Entitlements assigned successfully.");

  // Refresh entitlements to reflect changes
  entitlementStore.getEntitlements();
  userStore.getEntitled();
}

// Unassign entitlement function
function unassignEntitlement(id: string) {
  Swal.fire({
    title: "Are you sure?",
    text: "The client will lose access to the program.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, unassign it!",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      entitlementStore.updateEntitlement(id, { client_id: null, program_id: null });
      showSuccess("Entitlement successfully unassigned.");
    }
  });
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
