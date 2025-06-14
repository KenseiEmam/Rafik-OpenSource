<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();
</script>

<template>
  <div
    class="grid md:grid-cols-5 border-rafik-secondary card items-center w-full min-h-128 flex-1 mb-16 px-3 py-6 md:py-12 md:px-12 relative items-stretch overflow-hidden"
  >
    <img
      src="https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?q=80&w=3456&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      class="w-full h-full object-cover absolute grayscale"
      alt=""
    />
    <div class="w-full h-full bg-gradient-to-r from-40% from-rafik-darksecbg absolute"></div>
    <div class="col-span-3 relative space-y-4">
      <h3 class="font-black text-rafik text-xl md:text-3xl md:title-small">
        Centralised&nbsp;Program&nbsp;Oversight
      </h3>
      <p class="text-body">
        Design, deploy and monitor training programs across every team from a single dashboard. Set
        global standards while giving coaches the flexibility they need. <br />
      </p>
      <h3 class="font-bold text-rafik-secondary uppercase md:contentH-small">Key capabilities</h3>
      <ul class="list-disc ml-6 text-body space-y-4 text-rafik-pritext dark:text-rafik-darkpritext">
        <li>Create organisation-wide program templates</li>
        <li>Assign coaches and staff by sport, age group or location</li>
        <li>Instantly roll out updates and track adoption in real-time</li>
      </ul>
    </div>
    <div class="col-span-2 relative hidden md:flex flex-col">
      <img
        class="h-72 card p-0 border absolute z-30 my-0 right-0 top-10"
        src="/src/assets/metrics.webp"
        alt=""
      />
      <!-- <img
        class="w-32 card p-0 border absolute z-30 top-32 left-10"
        src="/src/assets/Select Exercise Off-Canvas.png"
        alt=""
      />
      <img
        class="h-36 card p-0 border absolute z-30 my-0 right-5"
        style="top: 45%; bottom: 50%"
        src="/src/assets/W&P- Active Programs.png"
        alt=""
      />
      <img
        class="h-52 card p-0 border absolute z-30 my-0 left-16 -bottom-5"
        src="/src/assets/W&P- Exercise Details.png"
        alt=""
      /> -->
    </div>
  </div>
</template>
<style scoped>
li::marker {
  color: #d7bd21;
}
</style>
