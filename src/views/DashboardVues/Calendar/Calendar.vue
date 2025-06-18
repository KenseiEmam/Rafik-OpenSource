<template>
  <div class="flex h-screen overflow-auto">
    <div class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 2xl:space-y-6 space-y-3">
      <!-- Page Title -->
      <PageTitle
        :subheader="t('dashboard.calendar.header')"
        :header="t('dashboard.calendar.subheader')"
      />
      <div class=" relative flex flex-col  flex-1 h-full">
        <FullCalendar/>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import PageTitle from '@/components/Navigation/PageTitle.vue';
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import FullCalendar from '@/components/Calendar/FullCalendar.vue';

const { t, locale } = useI18n();
</script>
