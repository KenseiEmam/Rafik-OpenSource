<template>
  <div class="flex h-screen overflow-auto">
    <div class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 2xl:space-y-6 space-y-3">
      <!-- Page Title -->
      <PageTitle
        :subheader="t('dashboard.assessments.details.pageTitle.subheader')"
        :header="t('dashboard.assessments.details.pageTitle.header')"
      />

      <!-- Coming Soon Content -->
      <div class="space-y-6 flex flex-col items-center py-12">
        <p class="text-rafik-pritext dark:text-rafik-darkpritext text-lg">
          {{ t('dashboard.assessments.details.comingSoon') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import PageTitle from '@/components/Navigation/PageTitle.vue';

const { t } = useI18n();
</script> 