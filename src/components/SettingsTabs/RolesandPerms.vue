<template>
  <div>
    <div class="flex items-center mb-6">
      <h2 class="header-small" v-if="selectedUser">
        {{
          t('dashboard.tabs.settings.rolesAndPerms.showingRolesFor', {
            firstName: selectedUser.first_name,
            lastName: selectedUser.last_name
          })
        }}
      </h2>
      <h2 class="header-small" v-else>
        {{ t('dashboard.tabs.settings.rolesAndPerms.noUserSelected') }}
      </h2>
      <div :class="locale === 'ar' ? 'me-auto' : 'ms-auto'" class="w-64">
        <label
          class="block text-sm font-medium text-rafik-sectext dark:text-rafik-darksectext mb-1"
        >
          {{ t('dashboard.tabs.settings.rolesAndPerms.selectUser') }}
        </label>
        <div class="relative">
          <!-- Search Input -->
          <input
            type="search"
            v-model="searchQuery"
            @focus="dropdownVisible = true"
            @input="fetchFilteredUsers"
            @blur="handleBlur"
            class="w-full p-3 border rounded-xl bg-rafik-secbg dark:bg-rafik-darksecbg text-rafik-sectext dark:text-rafik-darksectext focus:outline-none"
            :placeholder="t('dashboard.tabs.settings.rolesAndPerms.searchPlaceholder')"
          />
          <!-- Dropdown -->
          <div
            v-if="dropdownVisible && userOptions.length"
            class="absolute z-10 mt-1 w-full bg-rafik-secbg dark:bg-rafik-darksecbg border border-rafik-sectext dark:border-rafik-darksectext rounded-xl max-h-60 overflow-auto"
          >
            <div
              v-for="user in userOptions"
              :key="user.id"
              @click="selectOption(user)"
              class="p-3 hover:bg-rafik-secondary hover:text-rafik-pritext cursor-pointer"
            >
              {{ user.first_name }} {{ user.last_name }}
              <span class="text-xs opacity-50"> {{ user.email }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-8">
      <div v-for="role in roles" :key="role.id" class="card p-8 flex justify-between items-center">
        <div>
          <h3 class="header-small">{{ role.role_name }}</h3>
          <p class="text-body">{{ role.role_description }}</p>
        </div>
        <div v-if="selectedUser && selectedUser.roles" class="w-32 2xl:w-64">
          <div class="flex items-center gap-4">
            <label
              class="flex items-center space-x-2 cursor-pointer"
              @click="toggleRole(role)"
              :class="{ 'opacity-50': isRoleToggleDisabled(role) }"
            >
              <input
                type="checkbox"
                class="hidden"
                :checked="selectedUser.roles.includes(role.role_name)"
                :disabled="isRoleToggleDisabled(role)"
                readonly
              />
              <div
                class="w-16 h-8 flex items-center border-rafik-sectext dark:border-rafik-darksectext border-2 rounded-full transition-all"
                :class="
                  selectedUser.roles.includes(role.role_name)
                    ? 'bg-rafik'
                    : 'bg-rafik-secbg dark:bg-rafik-darsecbg'
                "
              >
                <div
                  class="w-8 h-8 bg-rafik-sectext dark:bg-rafik-darksectext flex items-center justify-center rounded-full shadow-md transform transition-transform duration-300"
                  :class="{
                    'translate-x-0': !selectedUser.roles.includes(role.role_name),
                    [locale === 'ar' ? '-translate-x-8' : 'translate-x-8']:
                      selectedUser.roles.includes(role.role_name)
                  }"
                ></div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useSettingsStore } from '@/stores/settingstores';
import { supabase } from '@/lib/supabaseClient';
import Swal from 'sweetalert2';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user';
const { t, locale } = useI18n();
// Search query and dropdown visibility
const searchQuery = ref('');
const dropdownVisible = ref(false);
const userOptions = ref<any[]>([]);
const selectedUser = ref<any>(null);
const settingsStore = useSettingsStore();
const userStore = useUserStore();

const roles = computed(() => {
  if (userStore.userProfile?.roles?.includes('Administrator')) {
    return settingsStore.roles;
  }
  if (userStore.userProfile?.roles?.includes('Organization Admin')) {
    return settingsStore.roles?.filter((role: any) => role.role_name.startsWith('Organization'));
  }
  return [];
});

// Check if a role toggle should be disabled for the current user
const isRoleToggleDisabled = computed(() => (role: any) => {
  if (!selectedUser.value || !userStore.userProfile) return false;

  // Check if the selected user is the current user
  const isCurrentUser = selectedUser.value.id === userStore.userProfile.id;

  if (!isCurrentUser) return false;

  // Administrator cannot remove their own Administrator role
  if (
    role.role_name === 'Administrator' &&
    userStore.userProfile.roles?.includes('Administrator')
  ) {
    return true;
  }

  // Organization Admin cannot remove their own Organization Admin role
  if (
    role.role_name === 'Organization Admin' &&
    userStore.userProfile.roles?.includes('Organization Admin')
  ) {
    return true;
  }

  return false;
});

function showSuccess(message: string) {
  Swal.fire({
    title: t('general.success'),
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 1500,
    text: message,
    toast: true,
    position: 'top-right',
    icon: 'success',
    background: '#081411',
    color: '#E8F3ED'
  });
}

// Function to show error alerts
function showError(message: string) {
  Swal.fire({
    title: t('general.error'),
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}
// Fetch filtered users based on searchQuery
async function fetchFilteredUsers() {
  dropdownVisible.value = true;
  if (!searchQuery.value) {
    userOptions.value = [];
    return;
  }

  const isOrgAdmin = userStore.userProfile?.roles?.includes('Organization Admin');
  const isFullAdmin = userStore.userProfile?.roles?.includes('Administrator');

  if (!isFullAdmin && !isOrgAdmin) {
    showError(t('dashboard.tabs.settings.rolesAndPerms.errorFetchingUsers'));
    console.log('You are not authorized to view this page');
    userOptions.value = [];
    return;
  }

  const orgError = isOrgAdmin ? !userStore.userProfile?.organization : false;
  if (orgError) {
    showError(t('dashboard.tabs.settings.rolesAndPerms.errorFetchingUsers'));
    console.log('No organization id found');
    userOptions.value = [];
    return;
  }

  const query = isFullAdmin
    ? supabase
        .from('users')
        .select('id, first_name, last_name, email, roles')
        .or(
          `first_name.ilike.%${searchQuery.value}%,last_name.ilike.%${searchQuery.value}%,email.ilike.%${searchQuery.value}%`
        )
        .limit(10)
    : supabase
        .from('users')
        .select('id, first_name, last_name, email, roles')
        .eq('organization', userStore.userProfile!.organization!)
        .or(
          `first_name.ilike.%${searchQuery.value}%,last_name.ilike.%${searchQuery.value}%,email.ilike.%${searchQuery.value}%`
        )
        .limit(10);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching users:', error.message);
    userOptions.value = [];
    return;
  }
  userOptions.value = data;
}

// When a user is selected, update the selectedUser and immediately load their roles.
function selectOption(option: any) {
  selectedUser.value = option;
  searchQuery.value = `${option.first_name} ${option.last_name}`;
  dropdownVisible.value = false;
}

// Reset filter when search input is cleared (native clear button)
watch(searchQuery, (newValue) => {
  if (!newValue) resetFilter();
});
function resetFilter() {
  userOptions.value = [];
  dropdownVisible.value = false;
}

// Handle blur event on the search input
function handleBlur() {
  setTimeout(() => {
    dropdownVisible.value = false;
  }, 200);
}

// Toggle a role for the selected user and update the database accordingly
async function toggleRole(role: any) {
  if (isRoleToggleDisabled.value(role)) {
    if (
      role.role_name === 'Administrator' &&
      userStore.userProfile?.roles?.includes('Administrator')
    ) {
      showError(t('dashboard.tabs.settings.rolesAndPerms.cannotRemoveOwnAdminRole'));
    }

    if (
      role.role_name === 'Organization Admin' &&
      userStore.userProfile?.roles?.includes('Organization Admin')
    ) {
      showError(t('dashboard.tabs.settings.rolesAndPerms.cannotRemoveOwnOrgAdminRole'));
    }
    showError(t('dashboard.tabs.settings.rolesAndPerms.cannotRemoveOwnAdminRole'));
    return;
  }
  if (!selectedUser.value) return;

  // Copy current roles (or initialize if null)
  let updatedRoles = Array.isArray(selectedUser.value.roles) ? [...selectedUser.value.roles] : [];

  // Check if the role already exists; add it if not, otherwise remove it.
  if (updatedRoles.includes(role.role_name)) {
    updatedRoles = updatedRoles.filter((r: string) => r !== role.role_name);
  } else {
    updatedRoles.push(role.role_name);
  }

  // Update the user's roles in the database
  const { error } = await supabase
    .from('users')
    .update({ roles: updatedRoles })
    .eq('id', selectedUser.value.id);

  if (error) {
    showError(t('dashboard.tabs.settings.rolesAndPerms.errorUpdatingRoles') + error.message);
    return;
  }

  // Immediately update the UI with the new roles array.
  selectedUser.value.roles = updatedRoles;
  showSuccess(t('dashboard.tabs.settings.rolesAndPerms.rolesUpdated'));
}

onMounted(() => {
  settingsStore.fetchRoles();
});
</script>
