<script setup lang="ts">
import WebsiteHeader from '@/components/Navigation/WebsiteHeader.vue';
import Footer from '@/components/Navigation/Footer.vue';

import OrgHero from '@/components/OrgHero.vue';
import OrgProgramOversight from '@/components/OrgProgramOversight.vue';
import OrgTeamManagement from '@/components/OrgTeamManagement.vue';
import OrgCommunications from '@/components/OrgCommunications.vue';
</script>

<template>
  <main class="flex-1 mebsite-body flex-col flex">
    <WebsiteHeader />

    <Transition name="slide-fade" appear>
      <div class="relative flex flex-col">
        <OrgHero />
        <OrgProgramOversight />
        <OrgTeamManagement />
        <OrgCommunications />

        <!-- CTA -->
        <div
          class="md:grid md:grid-cols-5 border-topsets-secondary card items-end w-full flex-1 mb-16 px-3 py-6 md:py-12 md:px-12 relative overflow-hidden my-16"
        >
          <img
            src="https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?q=80&w=3456&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            class="w-full h-full object-cover absolute grayscale"
            alt=""
          />
          <div class="w-full h-full bg-gradient-to-r from-40% from-topsets-secbg absolute"></div>
          <div class="col-span-3 relative space-y-4">
            <h3 class="font-black text-topsets title-medium">READY TO EMPOWER YOUR ORGANIZATION</h3>
          </div>
          <div class="col-span-2 relative flex flex-col">
            <router-link :to="{ name: 'demo' }" class="btn-lg">Request a Demo</router-link>
          </div>
        </div>
      </div>
    </Transition>

    <Footer />
  </main>
</template>
