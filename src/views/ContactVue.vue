<script setup lang="ts">
import WebsiteHeader from '../components/Navigation/WebsiteHeader.vue'
import GetInTouchVue from '@/components/Forms/GetInTouchVue.vue'
</script>

<template>
  <main class="flex-1 mebsite-body flex-col flex">
    <WebsiteHeader />
    <Transition name="slide-fade" appear>
      <section id="contact" class="flex items-center my-auto gap-5">
        <GetInTouchVue />
        <img src="../assets/contact-arnold.png" alt="Contact Us" class="max-h-[600px]" />
      </section>
    </Transition>
  </main>
</template>
