<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t , locale } = useI18n();
const htmldex = `
In today’s world, student-athletes face more pressure than ever—academics, athletics, and expectations all at once. Yet most still train without structure, accountability, or real performance tracking.<br><br>
<strong>Topsets</strong> was built to fix that. After transforming my own body—from 125 kg to stage-ready—I saw firsthand how intelligent training systems can change lives. Now, we’re giving varsity athletes the tools I never had: <strong>structured programming, real-time progress tracking, and verified coaching</strong>—all in one place.<br><br>
This isn’t just another fitness app. <strong>Topsets is a performance platform built for serious athletes and the coaches who guide them</strong>.<br><br>
<strong>Train smart. Track progress. Compete with purpose.</strong>
`;

</script>

<template>
  <div
    class="border-topsets-secondary w-full  items-center w-full my-3 flex-1 mb-16 relative items-stretch "
  >

    <div class=" card relative rounded p-0 overflow-hidden">
      <img src="https://plus.unsplash.com/premium_photo-1664304619594-1b2bffeff5f2?q=80&w=3948&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"  class="absolute w-full h-full object-cover" alt="">
      <div class="w-full h-full absolute opacity-90 bg-topsets-secbg"> </div>
       <div
      class="flex flex-col md:grid grid-cols-5 rounded  gap-16 relative  flex-1 items-stretch w-full min-h-128  px-3 py-6 md:py-12 md:px-24"
    >
      <div class="md:col-span-3 relative">
              <h3 class="text-2xl md:text-4xl 2xl:text-5xl md:header-large mb-16">
  From Guesswork to Game Plan
</h3>
        <!-- Using v-html to render the HTML tags in the translation string -->
        <p class="mb-8" v-html="htmldex"></p>
        <SocialIcons class="w-3/4" :in="'hi'" :fb="'hi'" :yt="'hi'" :tw="'hi'" />
      </div>
      <div
        class="flex relative gap-6 flex-col h-full justify-evenly  md:col-span-2 "
      >

        <div class="card bg-topsets-pribg">
          <h3 class="contentH-small mb-2">{{ t('about.visionTitle') }}</h3>
          <p class="text-sm">
  To empower student-athletes across the MENA region with the tools to train smart, track performance, and reach their full potential.
</p>
        </div>
        <div class="card bg-topsets-pribg">
          <h3 class="contentH-small mb-2">{{ t('about.missionTitle') }}</h3>
         <p class="text-sm">
  Topsets helps varsity athletes and coaches plan, monitor, and optimize training through an all-in-one platform—driven by data, backed by science, and built on discipline.
</p>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>
<style scoped>
li::marker {
  color: #3995c5;
}
</style>
