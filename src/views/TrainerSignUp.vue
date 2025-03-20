<script setup lang="ts">
import WebsiteHeader from '../components/Navigation/WebsiteHeader.vue'
import TrainerForm from '../components/Forms/TrainerForm.vue'
</script>

<template>
  <main class="flex-1 dark mebsite-body flex-col flex">
    <WebsiteHeader />
    <Transition name="slide-fade" appear>

          <TrainerForm />

    </Transition>
  </main>
</template>
