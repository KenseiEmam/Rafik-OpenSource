<template>
  <div class="flex flex-col gap-8">
    <!-- Seats Available -->
    <div class="card p-8 flex justify-between items-center">
      <div>
        <h3 class="header-small">Seats Available</h3>
        <p class="text-body">Adjust the number of seats available for training sessions.</p>
      </div>
      <div class="w-32 2xl:w-64">
        <input
          type="number"
          v-model.number="localTrainerSettings.seats_available"
          class="rafik-text-input"
          min="0"
        />
      </div>
    </div>

    <!-- Follow Up Interval -->
    <div class="card p-8 flex justify-between items-center">
      <div>
        <h3 class="header-small">Follow Up Interval</h3>
        <p class="text-body">Set the number of days between client follow-up forms.</p>
      </div>
      <div class="w-32 2xl:w-64">
        <input
          type="number"
          v-model.number="localTrainerSettings.follow_up"
          class="rafik-text-input"
          min="1"
        />
      </div>
    </div>

    <!-- Working Hours -->
    <div class="card p-8 flex justify-between items-center">
      <div>
        <h3 class="header-small">Working Hours</h3>
        <p class="text-body">Select your available working hours for training sessions.</p>
      </div>
      <div class="w-32 2xl:w-64">
        <select v-model="localTrainerSettings.available_hours" class="rafik-text-input">
          <option v-for="option in workingHoursOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch, nextTick, computed } from 'vue';
import { useSettingsStore } from '@/stores/settingstores';
import { debounce } from 'lodash';

interface TrainerSettings {
  seats_available: number;
  follow_up: number; // Represents days between follow-up forms
  available_hours: string;
}

const workingHoursOptions = [
  "8:00 AM - 4:00 PM",
  "9:00 AM - 5:00 PM",
  "10:00 AM - 6:00 PM",
  "11:00 AM - 7:00 PM",
  "All Day"
];

const defaultTrainerSettings: TrainerSettings = {
  seats_available: 0,
  follow_up: 1,
  available_hours: workingHoursOptions[0],
};

const localTrainerSettings = ref<TrainerSettings>({ ...defaultTrainerSettings });
const trainerSettingsStore = useSettingsStore();

// Use a computed JSON string for deep watching
const localTrainerSettingsStr = computed(() => JSON.stringify(localTrainerSettings.value));

// Flag to skip initial update
const skipInitialUpdate = ref(true);

onMounted(async () => {
  let storeSettings: Partial<TrainerSettings> = {};
  if (trainerSettingsStore.trainer_settings) {
    storeSettings = trainerSettingsStore.trainer_settings as Partial<TrainerSettings>;
  } else {
    await trainerSettingsStore.fetchTrainerSettings();
    if (trainerSettingsStore.trainer_settings) {
      storeSettings = trainerSettingsStore.trainer_settings as Partial<TrainerSettings>;
    }
  }
  localTrainerSettings.value = { ...defaultTrainerSettings, ...storeSettings };
  await nextTick();
  // Enable updates after initial load
  skipInitialUpdate.value = false;
});

// Debounced update function (500ms delay)
const debouncedUpdate = debounce(async (newSettings: TrainerSettings) => {
  await trainerSettingsStore.updateTrainerSettings(newSettings);
}, 500);

watch(
  localTrainerSettingsStr,
  (newStr, oldStr) => {
    if (skipInitialUpdate.value) return;
    if (newStr !== oldStr) {
      const newSettings = JSON.parse(newStr);
      debouncedUpdate(newSettings);
    }
  },
  { deep: true }
);
</script>

<style scoped>
/* Add any additional styling if needed */
</style>
