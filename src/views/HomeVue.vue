<script setup lang="ts">
import TheWelcome from '../components/HeroSections/TheWelcome.vue';
import WebsiteHeader from '../components/Navigation/WebsiteHeader.vue';
import ContactVue from '../components/Forms/ContactVue.vue';
import Footer from '@/components/Navigation/Footer.vue';
import ForWho from '@/components/BodySections/ForWho.vue';
import WhyweDo from '@/components/BodySections/WhyweDo.vue';
</script>

<template>
  <main class="dark flex-1 mebsite-body flex-col flex">
    <WebsiteHeader />
    <Transition name="slide-fade" appear>
      <div class="relative flex flex-col">
        <TheWelcome />
        <ForWho/>
        <WhyweDo/>

        <ContactVue />
      </div>
    </Transition>
    <Footer/>
  </main>
</template>
<!-- Sami sucks -->
<!-- Emam sucks too :) -->
