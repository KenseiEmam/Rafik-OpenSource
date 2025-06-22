<template>
  <!-- Purchase selection -->
  <div class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24">
    <PageTitle
      :header="t('dashboard.entitlements.purchase.entitlements')"
      :subheader="t('dashboard.entitlements.purchase.client')"
    />
    <h3 class="contentH-small mt-8 mb-3">
      {{ t('dashboard.entitlements.purchase.entitlementPackages') }}
    </h3>

    <div class="grid grid-cols-3 gap-6 2xl:gap-12">
      <!-- Lone Soldier -->
      <div class="card rounded-xl p-12 2xl:p-24 flex flex-col gap-12">
        <div>
          <h3 class="title-small 2xl:text-xl text-base mb-6">
            {{ t('dashboard.entitlements.purchase.loneSoldierTitle') }}
          </h3>
          <p class="text-body text-justify">
            {{ t('dashboard.entitlements.purchase.loneSoldierDescription') }}
          </p>
        </div>
        <div class="mt-auto">
          <h4 class="header-medium">
            {{ t('dashboard.entitlements.purchase.loneSoldierPrice') }}
            <span class="text-lg">
              {{ t('dashboard.entitlements.purchase.perEntitlement') }}
            </span>
          </h4>
          <div class="flex mt-3 justify-between items-center mt-6">
            <label class="text-topsets-secondary uppercase font-semibold text-sm">
              {{ t('dashboard.entitlements.purchase.noOfUnits') }}
            </label>
            <input
              type="number"
              class="topsets-text-input border-topsets-secondary w-32"
              v-model="packAmounts[0]"
              min="0"
            />
          </div>
        </div>
      </div>

      <!-- Pack Leader -->
      <div class="card rounded-xl p-12 2xl:p-24 flex flex-col gap-12">
        <div>
          <h3 class="title-small 2xl:text-xl text-base mb-6">
            {{ t('dashboard.entitlements.purchase.packLeaderTitle') }}
          </h3>
          <p class="text-body text-justify">
            {{ t('dashboard.entitlements.purchase.packLeaderDescription') }}
          </p>
        </div>
        <div class="mt-auto">
          <h4 class="header-medium">
            {{ t('dashboard.entitlements.purchase.packLeaderPrice') }}
            <span class="text-lg">
              {{ t('dashboard.entitlements.purchase.perEntitlement') }}
            </span>
          </h4>
          <div class="flex mt-3 justify-between items-center mt-6">
            <label class="text-topsets-secondary uppercase font-semibold text-sm">
              {{ t('dashboard.entitlements.purchase.noOfUnits') }}
            </label>
            <input
              type="number"
              class="topsets-text-input border-topsets-secondary w-32"
              v-model="packAmounts[1]"
              min="0"
            />
          </div>
        </div>
      </div>

      <!-- We Have an Army -->
      <div class="card rounded-xl p-12 2xl:p-24 flex flex-col gap-12">
        <div>
          <h3 class="title-small 2xl:text-xl text-base mb-6">
            {{ t('dashboard.entitlements.purchase.weHaveAnArmyTitle') }}
          </h3>
          <p class="text-body text-justify">
            {{ t('dashboard.entitlements.purchase.weHaveAnArmyDescription') }}
          </p>
        </div>
        <div class="mt-auto">
          <h4 class="header-medium">
            {{ t('dashboard.entitlements.purchase.weHaveAnArmyPrice') }}
            <span class="text-lg">
              {{ t('dashboard.entitlements.purchase.perEntitlement') }}
            </span>
          </h4>
          <div class="flex mt-3 justify-between items-center mt-6">
            <label class="text-topsets-secondary uppercase font-semibold text-sm">
              {{ t('dashboard.entitlements.purchase.noOfUnits') }}
            </label>
            <input
              type="number"
              class="topsets-text-input border-topsets-secondary w-32"
              v-model="packAmounts[2]"
              min="0"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Total Entitlements & Price -->
    <div class="flex w-full items-center my-6 gap-6">
      <h3 class="header-small">
        {{ t('dashboard.entitlements.purchase.numOfEntitlements') }}
      </h3>
      <hr class="w-full border border-topsets-sectext dark:border-topsets-darksectext" />
      <h3 class="header-small">
        {{ totalEntitlement }}
      </h3>
    </div>

    <div class="flex w-full items-center my-6 gap-6">
      <h3 class="header-small">
        {{ t('dashboard.entitlements.purchase.totalPrice') }}
      </h3>
      <hr class="w-full border border-topsets-sectext dark:border-topsets-darksectext" />
      <h3 class="header-small">${{ totalPrice.toFixed(2) }}</h3>
    </div>

    <!-- Billing & Card Information -->
    <div class="grid grid-cols-2 gap-6 mt-12">
      <!-- Billing Information -->
      <div class="card p-8 rounded-xl">
        <h3 class="header-medium mb-4">
          {{ t('dashboard.entitlements.purchase.billingInformation') }}
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <!-- Full Name -->
          <div class="col-span-2">
            <label class="text-sm font-medium text-rafic-sectext">
              {{ t('dashboard.entitlements.purchase.fullNameOnCard') }}
            </label>
            <input type="text" class="topsets-text-input w-full my-2" v-model="billingName" />
          </div>
          <!-- Email -->
          <div>
            <label class="text-sm font-medium text-rafic-sectext">
              {{ t('dashboard.entitlements.purchase.emailAddress') }}
            </label>
            <input type="email" class="topsets-text-input w-full my-2" v-model="email" />
          </div>
          <!-- Phone Number -->
          <div>
            <label class="text-sm font-medium text-rafic-sectext">
              {{ t('dashboard.entitlements.purchase.phoneNumber') }}
            </label>
            <input type="tel" class="topsets-text-input w-full my-2" v-model="phone" />
          </div>
          <!-- Country -->
          <div>
            <label class="text-sm font-medium text-rafic-sectext">
              {{ t('dashboard.entitlements.purchase.country') }}
            </label>
            <select v-model="country" class="topsets-text-input w-full my-2">
              <option :value="''" disabled>
                {{ t('dashboard.entitlements.purchase.countryPlaceholder') }}
              </option>
              <option v-for="c in countries" :key="c.code" :value="c.code">
                {{ c.name }}
              </option>
            </select>
          </div>
          <!-- State -->
          <div>
            <label class="text-sm font-medium text-rafic-sectext">
              {{ t('dashboard.entitlements.purchase.state') }}
            </label>
            <input type="text" class="topsets-text-input w-full my-2" v-model="state" />
          </div>
          <!-- City -->
          <div>
            <label class="text-sm font-medium text-rafic-sectext">
              {{ t('dashboard.entitlements.purchase.city') }}
            </label>
            <input type="text" class="topsets-text-input w-full my-2" v-model="city" />
          </div>
          <!-- Zip Code -->
          <div>
            <label class="text-sm font-medium text-rafic-sectext">
              {{ t('dashboard.entitlements.purchase.zipCode') }}
            </label>
            <input type="text" class="topsets-text-input w-full my-2" v-model="zip" />
          </div>
          <!-- Address Line -->
          <div class="col-span-2">
            <label class="text-sm font-medium text-rafic-sectext">
              {{ t('dashboard.entitlements.purchase.addressLine') }}
            </label>
            <input type="text" class="topsets-text-input w-full my-2" v-model="address" />
          </div>
        </div>
      </div>

      <!-- Card Information -->
      <div class="card p-8 rounded-xl flex flex-col">
        <h3 class="header-medium mb-4">
          {{ t('dashboard.entitlements.purchase.cardInformation') }}
        </h3>
        <label class="text-sm font-medium text-rafic-sectext">
          {{ t('dashboard.entitlements.purchase.cardNumber') }}
        </label>
        <input type="text" class="topsets-text-input w-full my-2" v-model="cardNumber" />

        <div class="grid grid-cols-2 gap-4 mt-4 mb-6">
          <div>
            <label class="text-sm font-medium text-rafic-sectext">
              {{ t('dashboard.entitlements.purchase.expirationDate') }}
            </label>
            <input type="text" class="topsets-text-input w-full my-2" v-model="expiryDate" />
          </div>
          <div>
            <label class="text-sm font-medium text-rafic-sectext">
              {{ t('dashboard.entitlements.purchase.cvv') }}
            </label>
            <input type="text" class="topsets-text-input w-full my-2" v-model="cvv" />
          </div>
        </div>
        <p class="text-body mt-6">
          {{ t('dashboard.entitlements.purchase.unavailableMessage') }}
          <a href="/#contact">
            {{ t('dashboard.entitlements.purchase.contactFormLink') }}
          </a>
        </p>
        <button class="btn-lg w-full mt-auto" disabled>
          {{ t('dashboard.entitlements.purchase.featureComingSoon') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import PageTitle from '@/components/Navigation/PageTitle.vue';
import { countries } from '@/lib/countries';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

// Store package amounts
const packAmounts = ref<number[]>([0, 0, 0]);

// Store totals
const totalPrice = ref(0);
const totalEntitlement = ref(0);

// Card info
const billingName = ref('');
const email = ref('');
const phone = ref('');
const country = ref('');
const state = ref('');
const city = ref('');
const zip = ref('');
const address = ref('');

const cardNumber = ref('');
const expiryDate = ref('');
const cvv = ref('');

// Watch for changes and update totals
watch(
  () => [...packAmounts.value],
  (newValue) => {
    totalEntitlement.value = newValue[0] + newValue[1] * 10 + newValue[2] * 30;

    totalPrice.value =
      newValue[0] * 2.99 + // Lone Soldier
      newValue[1] * 10 * 2.5 + // Pack Leader (10 entitlements per package)
      newValue[2] * 30 * 1.99; // We Have an Army (30 entitlements per package)
  }
);
</script>
