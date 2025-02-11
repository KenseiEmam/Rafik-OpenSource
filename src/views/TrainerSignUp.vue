<script setup lang="ts">
import WebsiteHeader from '../components/WebsiteHeader.vue'
import TrainerForm from '../components/TrainerForm.vue'
</script>

<template>
  <main class="flex-1 mebsite-body flex-col flex">
    <WebsiteHeader />
    <Transition name="slide-fade" appear>

          <TrainerForm />

    </Transition>
  </main>
</template>
