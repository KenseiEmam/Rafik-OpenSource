<template>
  <div class="grid grid-cols-3 gap-4 h-full items-stretch flex-1 min-h-128">
    <!-- Benches & Frames -->
    <div class="card p-4 2xl:p-6 flex flex-col gap-4">
      <h3 class="contentH-small">
        {{ t('dashboard.tabs.exercise.equipReq.benchesAndFrames') }}
      </h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(item, index) in tm('dashboard.tabs.exercise.equipReq.benches')"
          :key="index"
          @click="props.personal && toggleEquipment(rt(item))"
          :disabled="!props.personal"
          :class="{
            'bg-topsets-secondary text-topsets-pritext dark:text-topsets-darkpritext': equipment.includes(
              rt(item)
            ),
            'bg-topsets-secbg dark:bg-topsets-darksecbg border border-topsets-sectext dark:border-topsets-darksectext text-topsets-sectext dark:text-topsets-darksectext':
              !equipment.includes(rt(item)),
            'opacity-50 cursor-not-allowed': !props.personal
          }"
          class="px-3 py-1 rounded-full"
        >
          {{ rt(item) }}
        </button>
      </div>
    </div>

    <!-- Free Weights -->
    <div class="card p-4 2xl:p-6 flex flex-col gap-4">
      <h3 class="contentH-small">
        {{ t('dashboard.tabs.exercise.equipReq.freeWeightsHeading') }}
      </h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(item, index) in tm('dashboard.tabs.exercise.equipReq.freeWeights')"
          :key="index"
          @click="props.personal && toggleEquipment(rt(item))"
          :disabled="!props.personal"
          :class="{
            'bg-topsets-secondary text-topsets-pritext dark:text-topsets-darkpritext': equipment.includes(
              rt(item)
            ),
            'bg-topsets-secbg dark:bg-topsets-darksecbg border border-topsets-sectext dark:border-topsets-darksectext text-topsets-sectext dark:text-topsets-darksectext':
              !equipment.includes(rt(item)),
            'opacity-50 cursor-not-allowed': !props.personal
          }"
          class="px-3 py-1 rounded-full"
        >
          {{ rt(item) }}
        </button>
      </div>
    </div>

    <!-- Grips & Accessories -->
    <div class="card p-4 2xl:p-6 flex flex-col gap-4">
      <h3 class="contentH-small">
        {{ t('dashboard.tabs.exercise.equipReq.gripsAndAccessories') }}
      </h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(item, index) in tm('dashboard.tabs.exercise.equipReq.accessories')"
          :key="index"
          @click="props.personal && toggleEquipment(rt(item))"
          :disabled="!props.personal"
          :class="{
            'bg-topsets-secondary text-topsets-pritext dark:text-topsets-darkpritext': equipment.includes(
              rt(item)
            ),
            'bg-topsets-secbg dark:bg-topsets-darksecbg border border-topsets-sectext dark:border-topsets-darksectext text-topsets-sectext dark:text-topsets-darksectext':
              !equipment.includes(rt(item)),
            'opacity-50 cursor-not-allowed': !props.personal
          }"
          class="px-3 py-1 rounded-full"
        >
          {{ rt(item) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';
import { useI18n } from 'vue-i18n';
const { t, rt, tm } = useI18n();
const props = defineProps({
  exercise: {
    type: Object,
    required: true
  },
  personal: {
    type: Boolean,
    required: true
  }
});
const emit = defineEmits(['update-equipment']);

// Initialize the user's selected equipment from the exercise object
const equipment = ref([...props.exercise.equipment]);

/**
 * Toggle an item in the equipment array, then emit it upwards.
 * This stores or removes the "raw text" from the array,
 * using the translated string to match.
 */
const toggleEquipment = (item: string) => {
  if (!props.personal) return;

  if (equipment.value.includes(item)) {
    equipment.value = equipment.value.filter((e) => e !== item);
  } else {
    equipment.value.push(item);
  }
  emit('update-equipment', equipment.value);
};
</script>

<style scoped>
button {
  transition: all 0.2s ease-in-out;
}
button:hover {
  transform: scale(1.05);
}
button:disabled {
  transform: none;
}
</style>
