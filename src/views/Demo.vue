<template>
  <main class="dark flex-1 mebsite-body flex-col flex">
    <WebsiteHeader />

    <Transition name="slide-fade" appear>
      <div class="relative flex flex-col">
        <!-- 0) Optional hero (recommended) -->
        <DemoHero />

        <!-- 1) Pricing (commented out for now) -->

        <SubscriptionTiers @select-tier="handleSelectTier" />

        <!-- 2) Contact -->
        <DemoContactForm id="demo-contact" :selected-tier="selectedTier" />
      </div>
    </Transition>

    <Footer />
  </main>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import WebsiteHeader from '@/components/Navigation/WebsiteHeader.vue';
import Footer from '@/components/Navigation/Footer.vue';

import DemoHero from '@/components/DemoHero.vue';
/*  ⬇️  Uncomment when the tier cards are finalised */
import SubscriptionTiers from '@/components/SubscriptionTiers.vue';

import DemoContactForm from '@/components/Forms/DemoContactForm.vue';

const selectedTier = ref<string | null>(null);

function handleSelectTier(tier: string) {
  selectedTier.value = tier;
  // Smooth-scroll the user to the contact form
  document.getElementById('demo-contact')?.scrollIntoView({ behavior: 'smooth' });
}
</script>
