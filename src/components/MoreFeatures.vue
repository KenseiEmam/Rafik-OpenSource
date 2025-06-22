<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t , locale } = useI18n();
</script>

<template>
  <div
    class="grid md:grid-cols-5 border-topsets-secondary card items-center w-full min-h-128 flex-1 mb-16 px-3 py-6 md:py-12 md:px-12 relative items-stretch overflow-hidden"
  >
    <img
      src="https://plus.unsplash.com/premium_photo-1721755964191-c88e3c24f5cc?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      class="w-full h-full object-cover absolute "
      alt=""
    />
    <div class="w-full h-full opacity-80 bg-topsets-darksecbg absolute"></div>
    <div class="col-span-3 relative space-y-4">
      <h3 class="font-black text-topsets text-xl md:text-3xl md:title-small">
        Limitless Experience
      </h3>
      <p class="text-body">Topsets's butter smooth UI allows us to fit so much in this simple application that we could not possibly make enough sections to discuss what we offer so here's a list of some:<br /></p>

      <ul class="list-disc ml-6 text-body space-y-4 text-topsets-pritext dark:text-topsets-darkpritext">
        <li>Get consistent follow up forms to check in with your coach every week.</li>
        <li>Communicate with your coach and team members through seemless chat interfaces.</li>
        <li>Leverage an AI assistant for quick support when staff are not around.</li>
        <li>Peek in to see your estimated best set performances and share them with your friends.</li>
        <li>Review your workouts and stay honext with your coaches to improve your training experience.</li>
        <li>Choose to train in Arabic or English to maximize your connection.</li>
      </ul>
    </div>
    <div class="col-span-2 relative hidden md:flex flex-col">

      <img
        class="w-44 card  p-0 border absolute z-30 top-0 left-10"
        src="/src/assets/chatscr.jpeg"
        alt=""
      />
            <img
        class="w-64 card p-0 border absolute z-30 my-0 right-0 top-10"
        src="/src/assets/homescr.jpeg"
        alt=""
      />
      <img
        class="w-40 card top-0 p-0 border absolute z-30  right-5"
        src="/src/assets/exrscr.jpeg"
        alt=""
      />

      <img
        class="w-44 card p-0 border absolute z-30 my-0 left-16 -bottom-5"
        src="/src/assets/settingscr.png"
        alt=""
      />
    </div>
  </div>
</template>
<style scoped>
li::marker {
  color: #3995c5;
}
</style>
