<template>
  <div class="flex-1 2xl:space-y-16 space-y-6 pb-6 h-full">
    <div class="grid grid-cols-2 gap-6 flex-1 h-full">
      <div class="flex flex-col card gap-3 2xl:gap-5 p-6">
        <h3 class="contentH-small text-sm 2xl:text-xl mb-6 2xl:mb-8">
          {{ t('dashboard.tabs.user.general.userProfile') }}:
        </h3>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.user.general.age') }}
          </p>
          <p class="text-topsets-secondary">
            {{ calculateAge(props.client.dob) || t('dashboard.tabs.user.general.na') }}
          </p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.user.general.gender') }}
          </p>
          <p class="text-topsets-secondary">
            {{ props.client.sex || t('dashboard.tabs.user.general.na') }}
          </p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.user.general.nationality') }}
          </p>
          <p class="text-topsets-secondary">
            {{ props.client.nationality || t('dashboard.tabs.user.general.na') }}
          </p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.user.general.phone') }}
          </p>
          <p class="text-topsets-secondary">
            {{ props.client.phone || t('dashboard.tabs.user.general.na') }}
          </p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.user.general.roles') }}
          </p>
          <div class="flex flex-wrap gap-3">
            <p
              class="text-topsets-secondary"
              v-for="(role, index) in props.client.roles"
              :key="index"
            >
              {{ role }}
            </p>
          </div>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.user.general.moneyGenerated') }}
          </p>
          <p class="text-topsets-secondary">{{ t('dashboard.tabs.user.general.comingSoon') }}</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.user.general.moneySpent') }}
          </p>
          <p class="text-topsets-secondary">{{ t('dashboard.tabs.user.general.comingSoon') }}</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.user.general.moneyOwed') }}
          </p>
          <p class="text-topsets-secondary">{{ t('dashboard.tabs.user.general.comingSoon') }}</p>
        </div>
      </div>
      <div class="flex flex-col card gap-3 2xl:gap-5 p-6">
        <h3 class="contentH-small text-sm 2xl:text-xl mb-6 2xl:mb-8">
          {{ t('dashboard.tabs.user.general.auditLogs') }}:
        </h3>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.user.general.logsUpdateComingSoon') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../../lib/supabaseClient';
import Swal from 'sweetalert2';
import { useI18n } from 'vue-i18n';
const { t , locale } = useI18n();
// Success and Error Alerts
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
// Props to receive the program object
const props = defineProps({
  client: {
    type: Object,
    required: true
  }
});

function calculateAge(dob: Date) {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // Adjust age if birthday hasn't happened yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
</script>

<style scoped>
/* Your styles */
</style>
