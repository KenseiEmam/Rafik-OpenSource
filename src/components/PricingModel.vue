<script setup lang="ts">
import { ref, watch} from "vue";

// Props to receive the program object
const props = defineProps({
  program: {
    type: Object,
    required: true,
  },
});

type PromoCode={
  code:string,
  value:number,
}
// Emit event to the parent
const emit = defineEmits(["update-prices", "update-promo"]);

// Slider states initialized with program_focus values
const one_month = ref(props.program.price_one || 0 );
const three_month = ref(props.program.price_three || 0 );
const six_month = ref(props.program.price_six || 0 );
const year = ref(props.program.price_year || 0 );

// Computed total value
const total = ref(100);

const newPromo= ref("")

// // Watchers to recalculate total whenever a slider changes
// watch([strength, cardio, hypertrophy, agility], () => {

//     if (JSON.stringify(props.program.program_focus) !== JSON.stringify(updatedFocus)) {
//       emit('update-prices', updatedFocus);
//     }
//   }
// });

// Function to handle adding a new tag
const addPromo = () => {
  const promo = newPromo.value.trim();
  if (promo && !props.program.promos.includes(p => p.code == promo)) {
    emit("update-promo", [...props.program.promos, {code:promo, value:0}]);
  }
  newPromo.value = ""; // Clear input field
};

// Function to remove a promo code
const removePromo = (promoToRemove: PromoCode) => {
  emit("update-promo", props.program.promos.filter((promo: PromoCode) => promo !== promoToRemove));
};
</script>

<template>
  <div class="grid md:grid-cols-2 items-center relative flex-1 gap-4 items-stretch">
    <!-- Quick Stats -->
    <div class="card p-8 h-full">
      <h3 class="contentH-medium">Quick Stats</h3>
      <p class="text-body">
        Below you can find a quick rundown of the program's current statistics. We are working on a much better dashboard.
      </p>
      <div class="flex flex-col divide-y divide-rafik-sectext gap-3 mt-4">
        <div class="flex justify-between gap-4 py-2">
          <p class="xl:text-lg text-rafik-pritext font-semibold">Total Clients:</p>
          <p class="xl:text-lg text-rafik-sectext">N/A</p>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <p class="xl:text-lg text-rafik-pritext font-semibold">Revenue this Month:</p>
          <p class="xl:text-lg text-rafik-sectext">N/A</p>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <p class="xl:text-lg text-rafik-pritext font-semibold">Total Revenue:</p>
          <p class="xl:text-lg text-rafik-sectext">N/A</p>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <p class="xl:text-lg text-rafik-pritext font-semibold">Best Month:</p>
          <p class="xl:text-lg text-rafik-sectext">N/A</p>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <p class="xl:text-lg text-rafik-pritext font-semibold">Client Retention:</p>
          <p class="xl:text-lg text-rafik-sectext">N/A</p>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <p class="xl:text-lg text-rafik-pritext font-semibold">Growth Rate:</p>
          <p class="xl:text-lg text-rafik-sectext">N/A</p>
        </div>
      </div>
    </div>


    <!-- Tags -->
    <div class="card p-8 ">
      <h3 class="contentH-medium">Promo Codes</h3>
      <p class="text-body">
        Type your promo code in the input below and press enter to add it. You can remove promocodes and adjust their values from their respectful elements.
      </p>

      <div class="flex flex-col gap-4 mt-6">
        <!-- Input for new tag -->
        <input
          v-model="newPromo"
          type="text"
          class="rafik-text-input"
          placeholder="Add a new tag"
          @keyup.enter="addPromo"
        />

        <!-- Display tags -->
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(promo, index) in props.program.promos"
            :key="index"
            class="bg-rafik-secbg text-rafik-sectext px-3 py-1 rounded-full flex items-center gap-2"
          >
            <span>{{ promo.code }}</span>
            <button @click="removeTag(promo)" class="text-red-500 hover:text-red-700">
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Slider thumb styles */
input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background-color: white;
  border-radius: 9999px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background-color: white;
  border-radius: 9999px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}
</style>
