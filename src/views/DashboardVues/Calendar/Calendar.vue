<template>
  <div class="flex h-screen overflow-auto">
    <div class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 2xl:space-y-6 space-y-3">
      <!-- Page Title -->
      <PageTitle
        :subheader="t('dashboard.calendar.header')"
        :header="t('dashboard.calendar.subheader')"
      />


      <div class=" relative flex flex-col  flex-1 h-full 2xl:w-4/5">
        <div class="flex items-center px-6 gap-3 card w-full">
        <ul class="list-disc ms-3 ">
           <li class=" text-body ">Click a date block to create a slot.</li>
           <li class=" text-body ">Click an event slot to view/edit it.</li>
        </ul>
        <div class="flex items-center ms-auto gap-1">
          <span class="w-3 h-3 rounded-full bg-topsets-secondary"></span>
          <p class="text-sm "> Meeting</p>
        </div>
        <div class="flex items-center gap-1">
          <span class="w-3 h-3 rounded-full bg-topsets-alternate"></span>
          <p class="text-sm "> Assessment</p>
        </div>
        <div class="flex items-center gap-1">
          <span class="w-3 h-3 rounded-full bg-topsets-teritiary"></span>
          <p class="text-sm "> Team Game</p>
        </div>
        <div class="flex items-center gap-1">
          <span class="w-3 h-3 rounded-full bg-topsets-error"></span>
          <p class="text-sm "> Away</p>
        </div>
        <div class="flex items-center gap-1">
          <span class="w-3 h-3 rounded-full bg-black"></span>
          <p class="text-sm "> Other</p>
        </div>
      </div>
        <FullCalendar  v-if="showCalendar"/>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import PageTitle from '@/components/Navigation/PageTitle.vue';
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import FullCalendar from '@/components/Calendar/FullCalendar.vue';
// v-if flag for rendering calendar
const showCalendar = ref(false);

onMounted(() => {
  // Delay before rendering FullCalendar (e.g., 100ms)
  setTimeout(() => {
    showCalendar.value = true;
  }, 100);
});
const { t, locale } = useI18n();
</script>
