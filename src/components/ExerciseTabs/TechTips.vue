<template>
  <div class="grid grid-cols-3 gap-4 h-full items-stretch flex-1 min-h-128">
    <!-- Safety Guidelines -->
    <div class="card p-4 2xl:p-6 flex flex-col gap-4">
      <h3 class="contentH-small">Safety Guidelines</h3>
      <p class="text-body">Ensure proper form and technique to prevent injuries.</p>
      <div class="mt-4">
        <p v-if="!isEditingSafety" class="text-body text-justify cursor-text hover:opacity-70" @click="editSafety">
          {{ props.exercise.safety || 'Click to add safety guidelines' }}
        </p>
        <textarea
          v-if="isEditingSafety"
          v-model="editableSafety"
          class="rafik-text-input"
          @blur="saveSafety"
          @keyup.enter="saveSafety"
        ></textarea>
      </div>
    </div>

    <!-- Steps -->
    <div class="card p-4 2xl:p-6 flex flex-col gap-4">
      <h3 class="contentH-small">Steps</h3>
      <p class="text-body">Follow these steps to perform the exercise correctly.</p>
      <div class="flex flex-col gap-4 mt-6">
        <input v-if="personal"
          v-model="newStep"
          type="text"
          class="rafik-text-input"
          placeholder="Add a new step"
          @keyup.enter="addStep"
        />
        <div class="flex flex-col gap-2">
          <div
            v-for="(step, index) in props.exercise.steps"
            :key="index"
            class="bg-rafik-secbg text-rafik-sectext p-3  w-full rounded-md flex items-center justify-between gap-2"
          >
            <span>{{ index + 1  }}. {{ step }}</span>
            <button v-if="personal" @click="removeStep(step)" class="text-red-500 hover:text-red-700">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cues -->
    <div class="card p-4 2xl:p-6 flex flex-col gap-4">
      <h3 class="contentH-small">Coaching Cues</h3>
      <p class="text-body">Key points to focus on for optimal performance.</p>
      <div class="flex flex-col gap-4 mt-6">
        <input v-if="personal"
          v-model="newCue"
          type="text"
          class="rafik-text-input"
          placeholder="Add a new cue"
          @keyup.enter="addCue"
        />
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(cue, index) in props.exercise.cues"
            :key="index"
            class="bg-rafik-secbg text-rafik-sectext px-3 py-1 rounded-md flex items-center gap-2"
          >
            <span>{{ cue }}</span>
            <button v-if="personal" @click="removeCue(cue)" class="text-red-500 hover:text-red-700">✕</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const props = defineProps({
  exercise: {
    type: Object,
    required: true,
  },
  personal: {
    type: Boolean,
    required: true,
  },
});
const emit = defineEmits(["update-safety", "update-steps", "update-cues"]);

// Safety Guidelines
const isEditingSafety = ref(false);
const editableSafety = ref(props.exercise.safety || "");
const editSafety = () => {
  if(props.personal){

    isEditingSafety.value = true;
    editableSafety.value = props.exercise.safety || "";
  }
};
const saveSafety = () => {
  isEditingSafety.value = false;
  emit("update-safety", editableSafety.value);
};

// Steps
const newStep = ref("");
const addStep = () => {
  const step = newStep.value.trim();
  if (step && !props.exercise.steps.includes(step)) {
    emit("update-steps", [...props.exercise.steps, step]);
  }
  newStep.value = "";
};
const removeStep = (step: string) => {
  emit("update-steps", props.exercise.steps.filter((s: string) => s !== step));
};

// Coaching Cues
const newCue = ref("");
const addCue = () => {
  const cue = newCue.value.trim();
  if (cue && !props.exercise.cues.includes(cue)) {
    emit("update-cues", [...props.exercise.cues, cue]);
  }
  newCue.value = "";
};
const removeCue = (cue: string) => {
  emit("update-cues", props.exercise.cues.filter((c: string) => c !== cue));
};
</script>
