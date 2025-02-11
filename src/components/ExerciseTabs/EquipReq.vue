<template>
  <div class="grid grid-cols-3 gap-4 h-full items-stretch flex-1 min-h-128">
    <div class="card p-4 2xl:p-6 flex flex-col gap-4">
      <h3 class="contentH-small">Benches & Frames</h3>
      <div class="flex flex-wrap gap-2">
        <button v-for="item in benches" :key="item"
          @click="toggleEquipment(item)"
          :class="{'bg-rafik-secondary text-rafik-pritext': equipment.includes(item), 'bg-rafik-secbg border border-rafik-sectext text-rafik-sectext': !equipment.includes(item)}"
          class="px-3 py-1 rounded-full">{{ item }}</button>
      </div>
    </div>

    <div class="card p-4 2xl:p-6 flex flex-col gap-4">
      <h3 class="contentH-small">Free Weights</h3>
      <div class="flex flex-wrap gap-2">
        <button v-for="item in freeWeights" :key="item"
          @click="toggleEquipment(item)"
          :class="{'bg-rafik-secondary text-rafik-pritext': equipment.includes(item), 'bg-rafik-secbg border border-rafik-sectext text-rafik-sectext': !equipment.includes(item)}"
          class="px-3 py-1 rounded-full">{{ item }}</button>
      </div>
    </div>

    <div class="card p-4 2xl:p-6 flex flex-col gap-4">
      <h3 class="contentH-small">Grips & Accessories</h3>
      <div class="flex flex-wrap gap-2">
        <button v-for="item in accessories" :key="item"
          @click="toggleEquipment(item)"
          :class="{'bg-rafik-secondary text-rafik-pritext': equipment.includes(item), 'bg-rafik-secbg border border-rafik-sectext text-rafik-sectext': !equipment.includes(item)}"
          class="px-3 py-1 rounded-full">{{ item }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';

const props = defineProps({
  exercise: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(["update-equipment"]);

const equipment = ref([...props.exercise.equipment]);

const benches = [
  "Incline Bench", "Decline Bench", "Flat Bench", "Strength Chair", "Squat Rack",
  "Multipurpose Trainer", "Pull Up Bar", "Dip Bars", "Smith Machine",
  "Resistance Machine", "Cardio Machines"
];

const freeWeights = [
  "Barbell", "Olympic Barbell", "Hexbar", "Sled", "Plates",
  "Dumbbells", "Kettlebells", "Med Ball"
];

const accessories = [
  "Belt for Weights", "Straight Bar", "EZ Curl Bar", "Rope Attachment",
  "Single Handle", "D-Grip Handle", "V-Bar", "Triangle Grip",
  "Revolving D-Grip", "Revolving Straight Bar", "Revolving V-Bar",
  "Ankle Strap", "Tricep Strap", "Double D-Grip Handle",
  "Straps", "Resistance Bands", "Chains"
];


const toggleEquipment = (item) => {
  if (equipment.value.includes(item)) {
    equipment.value = equipment.value.filter(e => e !== item);
  } else {
    equipment.value.push(item);
  }
  emit("update-equipment", equipment.value );
};
</script>

<style scoped>
button {
  transition: all 0.2s ease-in-out;
}
button:hover {
  transform: scale(1.05);
}
</style>
