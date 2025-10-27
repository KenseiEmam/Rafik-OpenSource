<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t , locale } = useI18n();
</script>

<template>
  <div class="md:flex gap-6 items-end">
      <img
          src="/src/assets/Communication.png"
          class="hidden md:block h-96 w-auto card rounded-xl shadow-lg"
          alt=""
        />
    <div class="border-rafik-secondary card items-center gap-6 w-full min-h-128 flex-1 px-3 py-6 md:py-12 md:px-12 relative items-stretch overflow-hidden" >
      <h1 class="header-medium mb-6 ">
       Crystal-Clear Communication
      </h1>
      <p class="text-body mb-6">At Rafik we understand that in team sports, communication is king. This is why we have provided you with a belt of communication tools that insures the utmost transparency and effciency between you and your athletes.</p>
        <ul class="list-disc ml-6 text-body space-y-4 text-rafik-pritext dark:text-rafik-darkpritext">
        <li>An easy access chat service that allows you to chat directly with your athletes whether directly or in team groups through the dashboard interface.</li>
        <li>Use automation tools to engage your athletes consistently. Whether it's sign up forms or weekly check-in forms, we ensure your athletes know you are present and invested.</li>
        <li>Use the in-app calender to stay informed on athlete attendance, leaves and external sessions. Be sure to log your leaves and sessions too, to keep that two way trust going!</li>

      </ul>
    </div>
     <img
          src="/src/assets/Communication.png"
          class="md:hidden w-auto card rounded-xl shadow-lg"
          alt=""
        />
  </div>
</template>
<style scoped>
li::marker {
  color: #d7bd21;
}
</style>
