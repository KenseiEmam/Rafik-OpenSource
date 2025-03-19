<script setup lang="ts">
import TheWelcome from '../components/TheWelcome.vue'
import WebsiteHeader from '../components/Navigation/WebsiteHeader.vue'
import ProgramCreation from '../components/ProgramCreation.vue'
import ClientManagemet from '../components/ClientManagemet.vue'
import ContactVue from '../components/Forms/ContactVue.vue'
</script>

<template>
  <main class="dark flex-1 mebsite-body flex-col flex ">
    <WebsiteHeader />
    <Transition name="slide-fade" appear>
      <div class="relative flex flex-col">
        <TheWelcome />
        <ProgramCreation />
        <ClientManagemet />
        <ContactVue />
      </div>
    </Transition>
  </main>
</template>
<!-- Sami sucks -->
