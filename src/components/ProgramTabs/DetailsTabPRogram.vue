<script setup lang="ts">
import { onMounted, ref, watch} from "vue";

// Props to receive the program object
const props = defineProps({
  program: {
    type: Object,
    required: true,
  },
});

// Emit event to the parent
const emit = defineEmits(["update-tags", "update-focus"]);
// Reactive slider values
const strength = ref(25);
const cardio = ref(25);
const hypertrophy = ref(25);
const agility = ref(25);
const refresh = ref(false);

// Function to refresh slider values
const refreshSliders = () => {
  refresh.value = true; // Hide UI temporarily (optional)
  strength.value = props.program.program_focus[0] ?? 25;
  hypertrophy.value = props.program.program_focus[1] ?? 25;
  agility.value = props.program.program_focus[2] ?? 25;
  cardio.value = props.program.program_focus[3] ?? 25;
  setTimeout(() => (refresh.value = false), 0); // Allow UI to re-render
};

// Watch for changes in `program` and update slider values
watch(() => props.program, refreshSliders, { deep: true, immediate: true });

// Computed total value
const total = ref(100);

// New tag input
const newTag = ref("");

// Watchers to recalculate total whenever a slider changes
watch([strength, cardio, hypertrophy, agility], () => {
  total.value =
    Number(strength.value) +
    Number(hypertrophy.value) +
    Number(cardio.value) +
    Number(agility.value);

  if (total.value === 100) {
    const updatedFocus = [
      Number(strength.value),
      Number(hypertrophy.value),
      Number(agility.value),
      Number(cardio.value),
    ];
    if (JSON.stringify(props.program.program_focus) !== JSON.stringify(updatedFocus)) {
      emit('update-focus', updatedFocus);
    }
  }
});

// Function to handle adding a new tag
const addTag = () => {
  const tag = newTag.value.trim();
  if (tag && !props.program.tags.includes(tag)) {
    emit("update-tags", [...props.program.tags, tag]);
  }
  newTag.value = ""; // Clear input field
};

// Function to remove a tag
const removeTag = (tagToRemove: string) => {
  emit("update-tags", props.program.tags.filter((tag: string) => tag !== tagToRemove));
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
          <p class="xl:text-lg text-rafik-sectext">Coming Soon...</p>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <p class="xl:text-lg text-rafik-pritext font-semibold">Revenue this Month:</p>
          <p class="xl:text-lg text-rafik-sectext">Coming Soon...</p>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <p class="xl:text-lg text-rafik-pritext font-semibold">Total Revenue:</p>
          <p class="xl:text-lg text-rafik-sectext">Coming Soon...</p>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <p class="xl:text-lg text-rafik-pritext font-semibold">Best Month:</p>
          <p class="xl:text-lg text-rafik-sectext">Coming Soon...</p>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <p class="xl:text-lg text-rafik-pritext font-semibold">Client Retention:</p>
          <p class="xl:text-lg text-rafik-sectext">Coming Soon...</p>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <p class="xl:text-lg text-rafik-pritext font-semibold">Growth Rate:</p>
          <p class="xl:text-lg text-rafik-sectext">Coming Soon...</p>
        </div>
      </div>
    </div>

    <!-- Sliders -->
    <div class="card p-8 ">
      <h3 class="contentH-medium">Exercise Focus</h3>
      <p class="text-body">Use the sliders to modify the exercise focus percentages. They must add up to 100%.</p>

      <div v-if="!refresh" class="flex flex-col gap-6 mt-6">
        <!-- Strength Slider -->
        <div>
          <div class="flex justify-between">
            <label class="inline-block text-rafik-pritext">Strength</label>
            <span class="text-rafik-pritext">{{ strength }}%</span>
          </div>
          <input
            v-model="strength"
            type="range"
            class="h-[4px] w-full cursor-pointer appearance-none bg-rafik-alternate"
            min="0"
            max="100"
            step="5"
          />
        </div>

        <!-- Hypertrophy Slider -->
        <div>
          <div class="flex justify-between">
            <label class="inline-block text-rafik-pritext">Hypertrophy</label>
            <span class="text-rafik-pritext">{{ hypertrophy }}%</span>
          </div>
          <input
            v-model="hypertrophy"
            type="range"
            class="h-[4px] w-full cursor-pointer appearance-none bg-rafik-teritiary"
            min="0"
            max="100"
            step="5"
          />
        </div>
        <!-- Agility Slider -->
        <div>
          <div class="flex justify-between">
            <label class="inline-block text-rafik-pritext">Agility</label>
            <span class="text-rafik-pritext">{{ agility }}%</span>
          </div>
          <input
            v-model="agility"
            type="range"
            class="h-[4px] w-full cursor-pointer appearance-none bg-rafik-secondary"
            min="0"
            max="100"
            step="5"
          />
        </div>
        <!-- Cardio Slider -->
        <div>
          <div class="flex justify-between">
            <label class="inline-block text-rafik-pritext">Cardio</label>
            <span class="text-rafik-pritext">{{ cardio }}%</span>
          </div>
          <input
            v-model="cardio"
            type="range"
            class="h-[4px] w-full cursor-pointer appearance-none bg-rafik"
            min="0"
            max="100"
            step="5"
          />
        </div>




        <!-- Warning Message -->
        <p v-if="total !== 100" class="text-red-500 text-sm">
          The total percentage must equal 100%. Current total: {{ total }}%
        </p>
      </div>
    </div>

    <!-- Tags -->
    <div class="card p-8 col-span-2">
      <h3 class="contentH-medium">Tags</h3>
      <p class="text-body">
        Add tags by typing in the field below and pressing Enter. Click on a tag to remove it.
      </p>

      <div class="flex flex-col gap-4 mt-6">
        <!-- Input for new tag -->
        <input
          v-model="newTag"
          type="text"
          class="rafik-text-input"
          placeholder="Add a new tag"
          @keyup.enter="addTag"
        />

        <!-- Display tags -->
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(tag, index) in props.program.tags"
            :key="index"
            class="bg-rafik-secbg text-rafik-sectext px-3 py-1 rounded-full flex items-center gap-2"
          >
            <span>{{ tag }}</span>
            <button @click="removeTag(tag)" class="text-red-500 hover:text-red-700">
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
