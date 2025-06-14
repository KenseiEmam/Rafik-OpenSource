<script setup lang="ts">

import WebsiteHeader from '../components/Navigation/WebsiteHeader.vue';
import ProgramCreation from '../components/ProgramCreation.vue';
import ClientManagemet from '../components/ClientManagemet.vue';

import Footer from '@/components/Navigation/Footer.vue';
import Communications from '@/components/Communications.vue';
import AthleteHero from '@/components/AthleteHero.vue';
import SimpleAnalytics from '@/components/SimpleAnalytics.vue';
import Customize from '@/components/Customize.vue';
import MoreFeatures from '@/components/MoreFeatures.vue';


</script>

<template>
  <main class="dark flex-1 mebsite-body flex-col flex">
    <WebsiteHeader />
    <Transition name="slide-fade" appear>
      <div class="relative flex flex-col">
        <AthleteHero/>
        <Customize/>
        <SimpleAnalytics/>
        <MoreFeatures/>
        <div
            class="grid md:grid-cols-5 border-rafik-secondary card items-end w-full  flex-1 mb-16 px-3 py-6 md:py-12 md:px-12 relative overflow-hidden my-16"
          >
            <img
              src="https://images.unsplash.com/photo-1529165980561-f19d4acc4f3f?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              class="w-full transform scale-x-[-1] h-full object-cover absolute grayscale"
              alt=""
            />
            <div class="w-full h-full bg-gradient-to-r from-40% from-rafik-darksecbg absolute"></div>
            <div class="col-span-3 relative space-y-4">
              <h3 class="font-black text-rafik title-large">
                READY TO GAIN TRUE POWER?
              </h3>
            </div>

            <div class="col-span-2 relative hidden md:flex flex-col">
             <router-link :to="{name:'demo'}" class="btn-lg " >Request a Demo</router-link>

            </div>
        </div>
      </div>
    </Transition>
    <Footer/>
  </main>
</template>
<!-- Sami sucks -->
<!-- Emam sucks too :) -->
