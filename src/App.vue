<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { initFlowbite } from 'flowbite'
import { useI18n } from 'vue-i18n'

// Initialize components based on data attribute selectors
onMounted(() => {
    initFlowbite();
})

const { locale } = useI18n();
</script>

<template>
  <div :dir="locale === 'ar' ? 'rtl' : 'ltr'" class="w-full min-h-screen min-w-screen">
    <RouterView />
  </div>
</template>
