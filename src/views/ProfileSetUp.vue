<script setup lang="ts">
import WebsiteHeader from '../components/Navigation/WebsiteHeader.vue'
import SetUpForm from '../components/Forms/SetUpForm.vue'
</script>

<template>
  <main class="dark flex-1 mebsite-body flex-col flex">
    <WebsiteHeader />
    <Transition name="slide-fade" appear>

          <SetUpForm />

    </Transition>
  </main>
</template>
