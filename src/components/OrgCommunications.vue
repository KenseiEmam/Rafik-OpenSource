<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();
</script>

<template>
  <div class="md:flex gap-6 items-end">
    <img src="/src/assets/Communication.png" class="md:block hidden h-96 w-auto card rounded-xl shadow-lg" alt="" />
    <div
      class="border-topsets-secondary card items-center gap-6 w-full min-h-128 flex-1 px-3 py-6 md:py-12 md:px-12 relative items-stretch overflow-hidden"
    >
      <h1 class="header-medium mb-6">Organisation-Wide Communication</h1>
      <p class="text-body mb-6">
        Seamless messaging keeps directors, coaches and athletes aligned from academy to first-team.
      </p>
      <ul class="list-disc ml-6 text-body space-y-4 text-topsets-pritext dark:text-topsets-darkpritext">
        <li>Broadcast announcements to specific squads or the entire organisation in seconds.</li>
        <li>
          Automate onboarding, wellness check-ins and attendance reminders to boost engagement.
        </li>
        <li>
          Shared calendars ensure facilities, matches and travel plans remain transparent and
          up-to-date for everyone.
        </li>
      </ul>
    </div>
    <img src="/src/assets/Communication.png" class="md:hidden w-auto card rounded-xl shadow-lg" alt="" />

  </div>
</template>
<style scoped>
li::marker {
  color: #3995c5;
}
</style>
