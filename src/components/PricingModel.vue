<script setup lang="ts">
import { ref, watch } from "vue";

// Props to receive the program object
const props = defineProps({
  program: {
    type: Object,
    required: true,
  },
});

// Emits
const emit = defineEmits(["update-prices", "update-promo"]);

// Define reactive state for subscription switches
const isEnabled = ref({
  price_one: props.program.price_one !== null,
  price_three: props.program.price_three !== null,
  price_six: props.program.price_six !== null,
  price_year: props.program.price_year !== null,
});

// Reactive state for prices
const prices = ref({
  price_one: props.program.price_one ?? 0,
  price_three: props.program.price_three ?? 0,
  price_six: props.program.price_six ?? 0,
  price_year: props.program.price_year ?? 0,
});

// Watch for switch toggles and update only the corresponding price
watch(isEnabled, (newValues, oldValues) => {
  Object.keys(newValues).forEach((key) => {
    if (!newValues[key as keyof typeof isEnabled.value]) {
      prices.value[key as keyof typeof prices.value] = null; // Disable price
    } else if (!oldValues[key as keyof typeof isEnabled.value]) {
      prices.value[key as keyof typeof prices.value] = 0; // Reset ONLY this price to 0
    }
  });

  emit("update-prices", prices.value);
}, { deep: true });

// Watch for price changes and emit updates
watch(prices, (newPrices) => {
  emit("update-prices", newPrices);
}, { deep: true });

// Promo Codes
type PromoCode = {
  code: string;
  value: number;
};

const newPromo = ref("");

// Watch for changes in promo discount values
watch(
  () => props.program.promos,
  (newPromos) => {
    emit("update-promo", newPromos);
  },
  { deep: true }
);

// Function to add a new promo code
const addPromo = () => {
  const promo = newPromo.value.trim();
  if (promo && !props.program.promos.some((p: PromoCode) => p.code === promo)) {
    emit("update-promo", [...props.program.promos, { code: promo, value: 0 }]);
  }
  newPromo.value = ""; // Clear input field
};

// Function to remove a promo code
const removePromo = (promoToRemove: PromoCode) => {
  emit(
    "update-promo",
    props.program.promos.filter((promo: PromoCode) => promo.code !== promoToRemove.code)
  );
};
</script>

<template>
  <div class="grid md:grid-cols-2 items-center relative flex-1 gap-4">
    <!-- Subscription Pricing -->
    <div class="py-8 h-full">
      <h3 class="contentH-medium">Subscription Models</h3>
      <p class="text-body">
        Enable/disable subscription packages and manage their prices. Price changes will be reviewed.
      </p>
      <div class="space-y-3">
        <div v-for="(label, key) in {
          price_one: '1 Month',
          price_three: '3 Months',
          price_six: '6 Months',
          price_year: '1 Year'
        }" :key="key" class="flex card p-6 2xl:p-8 items-center justify-between">

          <span class="font-medium">{{ label }} Subscription</span>

          <label v-if="label !== '1 Month'" class="flex items-center ml-auto mr-4 space-x-2 cursor-pointer">
            <input type="checkbox" v-model="isEnabled[key]" class="hidden">
            <div
              class="w-16 h-8 flex items-center border-rafik-pritext border-2 bg-rafik-secbg rounded-full transition-all"
              :class="{ 'bg-amber-400': isEnabled[key] }">
              <div class="w-8 h-8 bg-rafik-pritext rounded-full shadow-md transform transition-transform"
                   :class="{ 'translate-x-8': isEnabled[key] }"></div>
            </div>
          </label>
          <div>
            <h2 class="subheader-small">PRICE (AED)</h2>
            <input
              type="number"
              v-model="prices[key]"
              :disabled="!isEnabled[key]"
              class="rafik-text-input w-12 2xl:w-32"
              :class="{'bg-rafik-sectext cursor-not-allowed': !isEnabled[key]}"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="h-full py-8 flex-col gap-3 ">
      <!-- Promo Codes -->
      <h3 class="contentH-medium">Promo Codes</h3>
      <p class="text-body">
        Type your promo code in the input below and press enter to add it. You can remove promo codes and adjust their values.
      </p>
      <div class="card px-8 h-full">
        <div class="flex flex-col gap-4 mt-6">
          <!-- Input for new promo code -->
          <input
            v-model="newPromo"
            type="text"
            class="rafik-text-input"
            placeholder="Add a new promo code"
            @keyup.enter="addPromo"
          />

          <!-- Display promo codes -->
          <div class="flex flex-col gap-6 divide-y divide-rafik-sectext">
            <div
              v-for="(promo, index) in props.program.promos"
              :key="index"
              class="flex w-full p-6 items-center 2xl:p-8 justify-between gap-4"
            >
              <p class="uppercase subheader-small">{{ promo.code }}</p>
              <div class="flex gap-3 2xl:gap-6 items-center">
                <div class="form-control max-w-min text-center">
                  <label class="text-body">% DISCOUNT</label>
                  <input v-model="promo.value" type="number" class="rafik-text-input w-12 2xl:w-32 text-sm">
                </div>
                <button @click="removePromo(promo)" class="text-red-500 hover:text-red-700 text-xl">
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
