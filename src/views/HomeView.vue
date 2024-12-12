<script setup lang="ts">
import TheWelcome from '../components/TheWelcome.vue'
import WebsiteHeader from '../components/WebsiteHeader.vue'
</script>

<template>
  <main class="flex-1 website-body flex-col flex">
    <WebsiteHeader />
    <Transition name="slide-fade" appear>
      <TheWelcome />
    </Transition>
  </main>
</template>
