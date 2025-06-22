<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t , locale } = useI18n();
</script>

<template>
  <div class="md:grid grid-cols-2 gap-6 items-end">
    <div class="relative md:block hidden h-full">

      <img
          src="/src/assets/macrogoal.jpeg"
          class="h-96 absolute card top-0 left-10 rounded-xl m-auto shadow-lg"
          alt=""
        />
      <img
          src="/src/assets/fitgoal.jpeg"
          class="h-96 absolute card top-0 bottom-0 right-10 left-10 rounded-xl m-auto shadow-lg"
          alt=""
        />
      <img
          src="/src/assets/proggoal.jpeg"
          class="h-96 absolute right-10 bottom-0 card rounded-xl m-auto shadow-lg"
          alt=""
        />
    </div>
    <div class="border-topsets-secondary card items-center gap-6 w-full min-h-128 flex-1 px-3 py-6 md:py-12 md:px-12 relative items-stretch overflow-hidden" >
      <h1 class="header-medium mb-6 ">
       Customize your Athletic Journey
      </h1>
      <p class="text-body mb-6">While we primarily prioritize an analytical approach, Topsets does not come show of personalization options that make you feel more at ease .</p>
        <ul class="list-disc ml-6 text-body space-y-4 text-topsets-pritext dark:text-topsets-darkpritext">
        <li>Define your personal goals and preferences, providing your coaches with transparency. </li>
        <li>Set your own macro targets that align well with your dieting preferences.</li>
        <li>Join your favorite strength or performance program from a library curated by us and your coaches.</li>

      </ul>
    </div>
  </div>
</template>
<style scoped>
li::marker {
  color: #3995c5;
}
</style>
