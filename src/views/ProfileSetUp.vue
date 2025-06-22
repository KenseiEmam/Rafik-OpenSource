<script setup lang="ts">
import WebsiteHeader from '../components/Navigation/WebsiteHeader.vue'
import SetUpForm from '../components/Forms/SetUpForm.vue'
import Footer from '@/components/Navigation/Footer.vue';
</script>

<template>
  <main class="flex-1 mebsite-body flex-col flex">
    <WebsiteHeader />
    <Transition name="slide-fade" appear>

          <SetUpForm />

    </Transition>
    <Footer/>
  </main>
</template>
