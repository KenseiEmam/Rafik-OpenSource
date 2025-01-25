<script setup lang="ts">
import WebsiteHeader from '../components/WebsiteHeader.vue'
import TrainerForm from '../components/TrainerForm.vue'
</script>

<template>
  <main class="flex-1 website-body flex-col flex">
    <WebsiteHeader />
    <Transition name="fade" appear>

          <TrainerForm />

    </Transition>
  </main>
</template>
