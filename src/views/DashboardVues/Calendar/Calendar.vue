<template>
  <div class="flex h-screen overflow-auto">
    <div class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 2xl:space-y-6 space-y-3">
      <!-- Page Title -->
      <PageTitle
        :subheader="t('dashboard.calendar.header')"
        :header="t('dashboard.calendar.subheader')"
      />
      <p class=" text-body "> Click a date block to create a slot.</p>
      <div class=" relative flex flex-col  flex-1 h-full 2xl:w-4/5">
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
