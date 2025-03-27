<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import isEqual from 'lodash/isEqual';
import debounce from 'lodash/debounce';
import Swal from 'sweetalert2';
import { useI18n } from 'vue-i18n';
const { t, locale } = useI18n();
// Success and Error Alerts

// Function to show error alerts
function showError(message: string) {
  Swal.fire({
    title: 'Error!',
    timer: 1500,
    text: message,
    toast: true,
    position: 'top-right',
    icon: 'error',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}
// Props to receive the program object
const props = defineProps({
  program: {
    type: Object,
    required: true
  },
  admin: {
    type: Boolean,
    default: false
  }
});

const { program, admin } = props;

// Emits
const emit = defineEmits(['update-prices', 'update-promo']);

// Define reactive state for subscription switches
const isEnabled = ref({
  price_one: program.price_one !== null,
  price_three: program.price_three !== null,
  price_six: program.price_six !== null,
  price_year: program.price_year !== null
});

// Reactive state for prices
const prices = ref({
  price_one: program.price_one ?? null,
  price_three: program.price_three ?? null,
  price_six: program.price_six ?? null,
  price_year: program.price_year ?? null
});

// Watch for switch toggles and update only the corresponding price
watch(
  isEnabled,
  (newValues, oldValues) => {
    Object.keys(newValues).forEach((key) => {
      if (!newValues[key as keyof typeof isEnabled.value]) {
        prices.value[key as keyof typeof prices.value] = null; // Disable price
      } else if (!oldValues[key as keyof typeof isEnabled.value]) {
        prices.value[key as keyof typeof prices.value] = 0; // Reset ONLY this price to 0
      }
    });

    emit('update-prices', prices.value);
  },
  { deep: true }
);

// Watch for price changes and emit updates
watch(
  prices,
  (newPrices) => {
    emit('update-prices', newPrices);
  },
  { deep: true }
);

// Promo Codes
type PromoCode = {
  code: string;
  value: number;
};

const newPromo = ref('');

// Watch for changes in the promos array
watch(
  () => program.promos,
  (newPromos, oldPromos) => {
    if (!isEqual(newPromos, oldPromos)) {
      nextTick(() => {
        emit('update-promo', newPromos);
      });
    }
  },
  { deep: true }
);

// Function to add a new promo code
const addPromo = () => {
  if (admin) return; // Prevent adding promo codes in read-only mode
  const promo = newPromo.value.trim();

  if (!promo) return; // Prevent adding empty promo codes

  const existingPromos = program?.promos ?? []; // Ensure it's an array

  if (!existingPromos.some((p: PromoCode) => p.code === promo)) {
    emit('update-promo', [...existingPromos, { code: promo, value: 0 }]);
  }

  newPromo.value = ''; // Clear input field
};

// Function to remove a promo code
const removePromo = (promoToRemove: PromoCode) => {
  if (admin) return; // Prevent removing promo codes in read-only mode
  emit(
    'update-promo',
    program.promos.filter((promo: PromoCode) => promo.code !== promoToRemove.code)
  );
};

// Function to update promo value when changed
const updatePromoValue = debounce((promo: PromoCode, newValue: number) => {
  if (newValue < 100) {
    const updatedPromos = program.promos.map((existingPromo: PromoCode) =>
      existingPromo.code === promo.code ? { ...existingPromo, value: newValue } : existingPromo
    );

    emit('update-promo', updatedPromos); // Emit updated promo array with new values
  } else {
    showError('Please enter a value under 100');
    promo.value = 0;
  }
}, 500);
</script>

<template>
  <div class="grid md:grid-cols-2 items-start relative flex-1 gap-4">
    <!-- Subscription Pricing -->
    <div class="py-8 h-full">
      <h3 class="contentH-medium">{{ t('dashboard.tabs.program.pricing.subscriptionModels') }}</h3>
      <p v-if="!admin" class="text-body">
        {{ t('dashboard.tabs.program.pricing.subscriptionModelsDescriptionUser') }}
      </p>
      <p v-else class="text-body">
        {{ t('dashboard.tabs.program.pricing.subscriptionModelsDescriptionAdmin') }}
      </p>
      <div class="space-y-3">
        <div
          v-for="key in ['price_one', 'price_three', 'price_six', 'price_year'] as const"
          :key="key"
          class="flex card p-6 2xl:p-8 items-center justify-between"
        >
        <span class="font-medium">
          {{ t('dashboard.tabs.program.pricing.subscription', { duration: t(`dashboard.tabs.program.pricing.${key}`) }) }}
        </span>

          <label
            v-if="key !== 'price_one'"
            class="flex items-center ml-auto mr-4 space-x-2 cursor-pointer"
          >
            <input type="checkbox" v-model="isEnabled[key]" class="hidden" />
            <div
              v-if="!admin"
              class="w-16 h-8 flex items-center border-rafik-pritext dark:border-rafik-darkpritext border-2 rounded-full transition-all"
              :class="{ 'bg-rafik': isEnabled[key] }"
            >
              <div
                class="w-8 h-8 bg-rafik-pritext dark:bg-rafik-darkpritext rounded-full shadow-md transform transition-transform"
                :class="isEnabled[key] ? (locale === 'ar' ? '-translate-x-8' : 'translate-x-8') : ''"
              ></div>
            </div>
          </label>
          <div>
            <h2 class="subheader-small">
              {{ t('dashboard.tabs.program.pricing.monthlyPriceLabel') }}
            </h2>
            <input
              v-if="!admin"
              type="number"
              v-model="prices[key]"
              :disabled="!isEnabled[key]"
              class="rafik-text-input text-right w-24 2xl:w-32"
              :class="{ 'bg-red-500 cursor-not-allowed': !isEnabled[key] && !admin }"
            />
            <p v-else class="text-rafik-sectext dark:text-rafik-darksectext">
              {{ prices[key] || t('dashboard.tabs.program.pricing.na') }}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!admin" style="height: 50vh" class="py-8 flex-col gap-3">
      <!-- Promo Codes -->
      <h3 class="contentH-medium">{{ t('dashboard.tabs.program.pricing.promoCodes') }}</h3>
      <p class="text-body">
        {{ t('dashboard.tabs.program.pricing.promoCodesDescription') }}
      </p>
      <div class="card px-8 h-full overflow-y-auto">
        <div class="flex flex-col gap-4 mt-6">
          <!-- Input for new promo code -->
          <input
            v-model="newPromo"
            type="text"
            class="rafik-text-input"
            :placeholder="t('dashboard.tabs.program.pricing.addPromoPlaceholder')"
            @keyup.enter="addPromo"
          />

          <!-- Display promo codes -->
          <div class="flex flex-col divide-y divide-rafik-sectext dark:divide-rafik-darksectext">
            <div
              v-for="(promo, index) in program.promos"
              :key="index"
              class="flex w-full items-center p-4 2xl:p-8 gap-4"
            >
              <p class="uppercase subheader-small">{{ promo.code }}</p>
              <div class="flex items-center ml-auto">
                <div class="form-control max-w-min text-center">
                  <label class="text-body">
                    {{ t('dashboard.tabs.program.pricing.discountLabel') }}
                  </label>
                  <input
                    v-model="promo.value"
                    @input="updatePromoValue(promo, promo.value)"
                    type="number"
                    :placeholder="
                      t('dashboard.tabs.program.pricing.valueForPromo', { code: promo.code })
                    "
                    class="rafik-text-input w-24 2xl:w-32 text-sm"
                  />
                </div>
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
</template>
