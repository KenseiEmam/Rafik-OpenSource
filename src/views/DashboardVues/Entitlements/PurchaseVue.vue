<template>
  <!-- Purchase selection -->
  <div class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24">
    <PageTitle header="entitlements" subheader="client" />
    <h3 class="contentH-small mt-8 mb-3"> Entitlement Packages</h3>

    <div class="grid grid-cols-3 gap-6 2xl:gap-12">
      <!-- Lone Soldier -->
      <div class="card rounded-xl p-12 2xl:p-24 flex flex-col gap-12">
        <div>
          <h3 class="title-small 2xl:text-xl text-base mb-6">Lone Soldier</h3>
          <p class="text-body text-justify">
            Train your first soldier and bring them up to your high ranks of knighthood.
            This is perfect for those just starting out who want to try our squiring services.
          </p>
        </div>
        <div class="mt-auto">
          <h4 class="header-medium">$2.99<span class="text-lg"> Per Entitlement</span></h4>
          <div class="flex mt-3 justify-between items-center mt-6">
            <label class="text-rafik-secondary uppercase font-semibold text-sm">No of Units</label>
            <input
              type="number"
              class="rafik-text-input border-rafik-secondary w-32"
              v-model="packAmounts[0]"
              min="0"
            />
          </div>
        </div>
      </div>

      <!-- Pack Leader -->
      <div class="card rounded-xl p-12 2xl:p-24 flex flex-col gap-12">
        <div>
          <h3 class="title-small 2xl:text-xl text-base mb-6">Pack Leader</h3>
          <p class="text-body text-justify">
            A man with a solid following of brothers of iron. This bundle boasts 10 entitlements at an all-time low price.
            Perfect for those seeking to create a name for themselves in the world of fitness.
          </p>
        </div>
        <div class="mt-auto">
          <h4 class="header-medium">$2.50<span class="text-lg"> Per Entitlement</span></h4>
          <div class="flex mt-3 justify-between items-center mt-6">
            <label class="text-rafik-secondary uppercase font-semibold text-sm">No of Units</label>
            <input
              type="number"
              class="rafik-text-input border-rafik-secondary w-32"
              v-model="packAmounts[1]"
              min="0"
            />
          </div>
        </div>
      </div>

      <!-- We Have an Army -->
      <div class="card rounded-xl p-12 2xl:p-24 flex flex-col gap-12">
        <div>
          <h3 class="title-small 2xl:text-xl text-base mb-6">We Have an Army</h3>
          <p class="text-body text-justify">
            A large bundle of 30 entitlements, allowing you to transfer your legion of clients all at once
            at a highly discounted price you will not find anywhere else.
            A grand bundle for those who command an army of followers ready to walk their path.
          </p>
        </div>
        <div class="mt-auto">
          <h4 class="header-medium">$1.99<span class="text-lg"> Per Entitlement</span></h4>
          <div class="flex mt-3 justify-between items-center mt-6">
            <label class="text-rafik-secondary uppercase font-semibold text-sm">No of Units</label>
            <input
              type="number"
              class="rafik-text-input border-rafik-secondary w-32"
              v-model="packAmounts[2]"
              min="0"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Total Entitlements & Price -->
    <div class="flex w-full items-center my-6 gap-6">
      <h3 class="header-small">No. of Entitlements</h3>
      <hr class="w-full border border-rafik-sectext">
      <h3 class="header-small">{{ totalEntitlement }}</h3>
    </div>

    <div class="flex w-full items-center my-6 gap-6">
      <h3 class="header-small">Total Price</h3>
      <hr class="w-full border border-rafik-sectext">
      <h3 class="header-small">${{ totalPrice.toFixed(2) }}</h3>
    </div>


    <!-- Billing & Card Information -->
    <div class="grid grid-cols-2 gap-6 mt-12 ">
      <!-- Billing Information -->
      <div class="card p-8 rounded-xl ">
  <h3 class="header-medium mb-4">Billing Information</h3>

  <div class="grid grid-cols-2 gap-4">
    <!-- Full Name -->
    <div class="col-span-2">
      <label class="text-sm font-medium text-rafic-sectext">Full Name (as on Card)</label>
      <input type="text" class="rafik-text-input w-full my-2" v-model="billingName" />
    </div>

    <!-- Email -->
    <div>
      <label class="text-sm font-medium text-rafic-sectext">Email Address</label>
      <input type="email" class="rafik-text-input w-full my-2" v-model="email" />
    </div>

    <!-- Phone Number -->
    <div>
      <label class="text-sm font-medium text-rafic-sectext">Phone Number</label>
      <input type="tel" class="rafik-text-input w-full my-2" v-model="phone" />
    </div>

    <!-- Country -->
    <div>
      <label class="text-sm font-medium text-rafic-sectext">Country</label>
      <input type="text" class="rafik-text-input w-full my-2" v-model="country" />
    </div>

    <!-- State -->
    <div>
      <label class="text-sm font-medium text-rafic-sectext">State</label>
      <input type="text" class="rafik-text-input w-full my-2" v-model="state" />
    </div>

    <!-- City -->
    <div>
      <label class="text-sm font-medium text-rafic-sectext">City</label>
      <input type="text" class="rafik-text-input w-full my-2" v-model="city" />
    </div>
    <!-- Zip Code -->
    <div>
      <label class="text-sm font-medium text-rafic-sectext">Zip Code</label>
      <input type="text" class="rafik-text-input w-full my-2" v-model="zip" />
    </div>
    <!-- Address Line -->
    <div class="col-span-2">
      <label class="text-sm font-medium text-rafic-sectext">Address Line</label>
      <input type="text" class="rafik-text-input w-full my-2" v-model="address" />
    </div>
  </div>
</div>


      <!-- Card Information -->
      <div class="card p-8 rounded-xl flex flex-col ">
        <h3 class="header-medium mb-4">Card Information</h3>

        <label class="text-sm font-medium text-rafic-sectext">Card Number</label>
        <input type="text" class="rafik-text-input w-full my-2" v-model="cardNumber" />

        <div class="grid grid-cols-2 gap-4 mt-4 mb-6">
          <div>
            <label class="text-sm font-medium text-rafic-sectext">Expiration Date</label>
            <input type="text" class="rafik-text-input w-full my-2" v-model="expiryDate" />
          </div>
          <div>
            <label class="text-sm font-medium text-rafic-sectext">CVV</label>
            <input type="text" class="rafik-text-input w-full my-2" v-model="cvv" />
          </div>
        </div>
        <p class="text-body mt-6">As this feature is currently unavailable yet, we encourage all trainers to get verified in order to get our free 30 entitlements starter pack. Enjoy your current experience and if you require even more entitlements please <a href="/#contact">get in touch with us through our contact form here.</a></p>
        <button class="btn-lg w-full mt-auto" disabled>Feature Coming Soon </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import PageTitle from "@/components/Navigation/PageTitle.vue";
import { ref, watch } from "vue";

// Store package amounts
const packAmounts = ref<number[]>([0, 0, 0]);

// Store totals
const totalPrice = ref(0);
const totalEntitlement = ref(0);

// Card info
const billingName = ref("");
const email = ref("");
const phone = ref("");
const country = ref("");
const state = ref("");
const city = ref("");
const zip = ref("");
const address = ref("");

const cardNumber = ref("");
const expiryDate = ref("");
const cvv = ref("");

// Watch for changes and update totals
watch(
  () => [...packAmounts.value], // Spread to force Vue to track changes
  (newValue) => {
    totalEntitlement.value = newValue[0] + newValue[1] * 10 + newValue[2] * 30;

    totalPrice.value =
      newValue[0] * 2.99 + // Lone Soldier
      newValue[1] * 10 * 2.50 + // Pack Leader (10 entitlements per package)
      newValue[2] * 30 * 1.99; // We Have an Army (30 entitlements per package)
  }
);
</script>
