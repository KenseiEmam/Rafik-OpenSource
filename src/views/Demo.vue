<template>
  <main class="dark flex-1 mebsite-body flex-col flex">
    <WebsiteHeader />

    <Transition name="slide-fade" appear>
      <div class="relative flex flex-col">
        <!-- Hero -->
        <DemoHero />

        <!-- Subscription tiers -->
        <SubscriptionTiers :selected="selectedTier" @select-tier="handleSelectTier" />

        <!-- Contact form – only visible AFTER a plan is picked -->
        <DemoContactForm v-if="selectedTier" id="demo-contact" :selected-tier="selectedTier" />
      </div>
    </Transition>

    <Footer />
  </main>
</template>
<script setup lang="ts">
import { ref, nextTick } from 'vue';
import WebsiteHeader from '@/components/Navigation/WebsiteHeader.vue';
import Footer from '@/components/Navigation/Footer.vue';

import DemoHero from '@/components/DemoHero.vue';
/* ⬇️  Uncomment when tiers go live */
import SubscriptionTiers from '@/components/SubscriptionTiers.vue';

import DemoContactForm from '@/components/Forms/DemoContactForm.vue';

const selectedTier = ref<string | null>(null);

async function handleSelectTier(tier: string) {
  selectedTier.value = tier;

  // Wait until the form is in the DOM, then scroll into view
  await nextTick();
  document.getElementById('demo-contact')?.scrollIntoView({ behavior: 'smooth' });
}
</script>
