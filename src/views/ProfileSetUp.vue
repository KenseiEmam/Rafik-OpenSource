<script setup lang="ts">
import WebsiteHeader from '../components/WebsiteHeader.vue'
import SetUpForm from '../components/SetUpForm.vue'
</script>

<template>
  <main class="flex-1 website-body flex-col flex">
    <WebsiteHeader />
    <Transition name="fade" appear>

          <SetUpForm />

    </Transition>
  </main>
</template>
