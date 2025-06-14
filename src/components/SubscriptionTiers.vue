<script setup lang="ts">
/* Props & emits */
const props = defineProps<{ selected: string | null }>();
const emit = defineEmits<{ (e: 'select-tier', tier: string): void }>();

/* Core plans */
const tiers = [
  {
    name: 'Starter',
    price: 'Free',
    desc: 'Perfect for small schools or clubs trying Rafik for the first time.',
    features: ['Up to 25 users', 'Core analytics', 'Community support']
  },
  {
    name: 'Pro',
    price: '$199 / mo',
    desc: 'Ideal for established programmes that need deeper insight.',
    features: ['Up to 250 users', 'Advanced analytics', 'Priority e-mail support']
  },
  {
    name: 'Elite',
    price: '$799 / mo',
    desc: 'For national squads & academies with high-performance demands.',
    features: ['Unlimited users', 'Full API access', 'Dedicated success manager']
  }
];

/* Custom plan copy */
const customCopy =
  'Need enterprise-scale features, unique integrations or white-labelling? ' +
  "Talk to us and we'll craft a bespoke package that fits your exact workflow.";
</script>

<template>
  <section class="w-full mb-24 mt-3">
    <h3 class="text-center mb-12 text-2xl md:text-4xl 2xl:text-5xl md:header-large">
      Choose <span class="text-rafik font-black">Your</span> Plan
    </h3>

    <!-- Three-tier grid -->
    <div class="grid md:grid-cols-3 gap-8 mb-8">
      <div
        v-for="tier in tiers"
        :key="tier.name"
        class="card p-8 flex flex-col border hover:border-rafik-secondary transition"
      >
        <h3 class="title-small font-black mb-2">{{ tier.name }}</h3>
        <p class="header-medium text-rafik mb-4">{{ tier.price }}</p>
        <p class="text-body mb-6 opacity-80">{{ tier.desc }}</p>

        <ul class="space-y-2 flex-1">
          <li v-for="f in tier.features" :key="f" class="flex items-center gap-2">
            <svg class="w-4 h-4 text-rafik-secondary" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414L8.414 15H5v-3.414l8.293-8.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            <span>{{ f }}</span>
          </li>
        </ul>

        <!-- Highlight if chosen -->
        <button
          :class="[props.selected === tier.name ? 'btn-lg' : 'btn-lg-outline', 'mt-8 w-full']"
          @click="emit('select-tier', tier.name)"
        >
          {{ props.selected === tier.name ? 'Selected' : 'Choose plan' }}
        </button>
      </div>
    </div>

    <!-- Full-width custom plan card -->
    <div
      class="card p-8 flex flex-col md:flex-row items-start md:items-center gap-6 border hover:border-rafik-secondary transition"
    >
      <div class="flex-1">
        <h3 class="title-small font-black mb-2">Custom Plan</h3>
        <p class="text-body opacity-80">{{ customCopy }}</p>
      </div>

      <button
        :class="[props.selected === 'Custom' ? 'btn-lg' : 'btn-lg-outline', 'w-full md:w-auto']"
        @click="emit('select-tier', 'Custom')"
      >
        {{ props.selected === 'Custom' ? 'Selected' : 'Contact us' }}
      </button>
    </div>
  </section>
</template>
