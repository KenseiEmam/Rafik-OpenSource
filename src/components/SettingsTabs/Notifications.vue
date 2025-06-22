<template>
  <div :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <div class="flex flex-col gap-8">
      <div
        v-for="(notif, index) in notifOptions"
        :key="index"
        class="card p-8 flex justify-between items-center"
      >
        <div>
          <h3 class="header-small">{{ notif.name }}</h3>
          <p class="text-body">{{notif.description}}</p>
        </div>
        <div v-if="settingsStore.settings!.notifications" class="w-32 2xl:w-64">
          <div class="flex items-center gap-4">
            <label
              class="flex items-center space-x-2 cursor-pointer"
              @click="togglenotif(notif.code)"
            >
              <input
                type="checkbox"
                class="hidden"
                :checked="settingsStore.settings!.notifications?.includes(notif.code)"
                readonly
              />
              <div
                class="w-16 h-8 flex items-center border-topsets-sectext dark:border-topsets-darksectext border-2 rounded-full transition-all"
                :class="settingsStore.settings!.notifications?.includes(notif.code)
                  ? 'bg-topsets'
                  : 'bg-topsets-secbg dark:bg-topsets-darsecbg'"
              >
                <div
                  class="w-8 h-8 bg-topsets-sectext dark:bg-topsets-darksectext flex items-center justify-center rounded-full shadow-md transform transition-transform duration-300"
                  :class="{
                    'translate-x-0': !settingsStore.settings!.notifications?.includes(notif.code),
                    [locale === 'ar' ? '-translate-x-8' : 'translate-x-8']: settingsStore.settings!.notifications?.includes(notif.code)
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
import { ref, watch, onMounted } from 'vue';
import { useSettingsStore } from '@/stores/settingstores';
import { supabase } from '@/lib/supabaseClient';
import Swal from 'sweetalert2';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();
const settingsStore = useSettingsStore();

const selectedUser = ref<any>(null);
const searchQuery = ref('');
const dropdownVisible = ref(false);
const userOptions = ref<any[]>([]);

// Notification options with descriptions and unique codes
const notifOptions = [
  {
    name: 'Message Notification',
    description: 'Get notified when a client sends you a direct message.',
    code: 'messages'
  },
  {
    name: 'Check In Notification',
    description: 'Be notified whenever a client check in is due.',
    code: 'check_in'
  },
  {
    name: 'Client at Risk Notification',
    description: 'Alerts when a client may be falling behind or at risk of dropping out.',
    code: 'at_risk'
  },
  {
    name: 'Reports and Emails',
    description: 'Receive summary reports and email updates regularly.',
    code: 'reports'
  }
];

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
    background: '#132e3d',
    color: '#ececec'
  });
}

function showError(message: string) {
  Swal.fire({
    title: t('general.error'),
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#132e3d',
    color: '#ececec'
  });
}

async function fetchFilteredUsers() {
  dropdownVisible.value = true;
  if (!searchQuery.value) {
    userOptions.value = [];
    return;
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, notifs')
    .or(
      `first_name.ilike.%${searchQuery.value}%,last_name.ilike.%${searchQuery.value}%,email.ilike.%${searchQuery.value}%`
    )
    .limit(10);

  if (error) {
    console.error('Error fetching users:', error.message);
    return;
  }

  userOptions.value = data;
}

function selectOption(option: any) {
  selectedUser.value = option;
  searchQuery.value = `${option.first_name} ${option.last_name}`;
  dropdownVisible.value = false;
}

watch(searchQuery, (newValue) => {
  if (!newValue) resetFilter();
});

function resetFilter() {
  userOptions.value = [];
  dropdownVisible.value = false;
}

function handleBlur() {
  setTimeout(() => {
    dropdownVisible.value = false;
  }, 200);
}

async function togglenotif(code: string) {

  let updatedNotifs = Array.isArray(settingsStore.settings!.notifications)
    ? [...settingsStore.settings!.notifications]
    : [];

  if (updatedNotifs.includes(code)) {
    updatedNotifs = updatedNotifs.filter((r: string) => r !== code);
  } else {
    updatedNotifs.push(code);
  }


  const spent =  localStorage.getItem('UserID')
  if(!spent) return


  const { error } = await supabase
    .from('user_settings')
    .update({ notifications: updatedNotifs })
    .eq('user_id', spent);

  if (error) {
    showError('Error updating notification settings ' + error.message);
    return;
  }

  settingsStore.settings!.notifications = updatedNotifs;
  showSuccess('Settings updated successfully!');
}

onMounted(() => {
  const spent =  localStorage.getItem('UserID')
  settingsStore.fetchSettings(spent || '');
});
</script>
