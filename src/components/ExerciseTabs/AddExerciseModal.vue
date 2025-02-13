<template>
  <div
    v-if="props.visible"
    class="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
  >
    <div class="card rounded-lg shadow p-6 w-128">
      <h2 class="contentH-small">Add Exercise</h2>
      <p class="text-body mb-4">
        New exercises will be added to your custom exercise library and can be used in your programs. You will be redirected to further edit your exercise.
      </p>
      <form @submit.prevent="submitForm">

        <!-- Exercise Name Field -->
        <div class="mb-4">
          <label for="exercise_name" class="block text-sm font-medium">Exercise Name</label>
          <input
            type="text"
            id="exercise_name"
            v-model="exercise.exercise_name"
            class="rafik-text-input"
            required
            :class="{'border-red-500': errors.exercise_name}"
          />
          <span v-if="errors.exercise_name" class="text-red-500 text-sm">{{ errors.exercise_name }}</span>
        </div>

        <!-- Exercise Description Field -->
        <div class="mb-4">
          <label for="exercise_detail" class="block text-sm font-medium">Exercise Description</label>
          <textarea
            id="exercise_detail"
            v-model="exercise.exercise_detail"
            class="rafik-text-input"
            rows="4"
            required
            :class="{'border-red-500': errors.exercise_detail}"
          ></textarea>
          <span v-if="errors.exercise_detail" class="text-red-500 text-sm">{{ errors.exercise_detail }}</span>
        </div>

        <!-- Exercise Type Field -->
        <div class="mb-4">
          <label for="type" class="block text-sm font-medium">Exercise Type</label>
          <select
            id="type"
            v-model="exercise.type"
            class="rafik-text-input"
            required
            :class="{'border-red-500': errors.type}"
          >
            <option value="" disabled>Select Exercise Type</option>
            <option value="compound">Compound</option>
            <option value="isolation">Isolation</option>
            <option value="bodyweight">Bodyweight</option>
            <option value="cardio">Cardiovascular</option>
            <option value="stretch">Stretch</option>
            <option value="plyometric">Plyometric</option>
          </select>
          <span v-if="errors.type" class="text-red-500 text-sm">{{ errors.type }}</span>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-md bg-red-500 border-red-500 hover:bg-red-400 rounded mr-2"
          >
            Cancel
          </button>
          <button type="submit" class="btn-md rounded">
            Add Exercise
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { supabase } from "@/lib/supabaseClient"; // Ensure Supabase is correctly set up

const props = defineProps({
  visible: Boolean,
});

const emits = defineEmits(["close", "submit"]);

const exercise = ref({
  exercise_name: "",
  exercise_detail: "",
  trainer_id: localStorage.getItem("UserID"),
  type: "",
  prime: [],
  antagonist: [],
  synergist: [],
  alternatives: [],
  equipment:[],
  cues:[],
  steps:[],
  safety:'',
});

const errors = ref<any>({});




const validateForm = () => {
  errors.value = {};

  if (!exercise.value.exercise_name) {
    errors.value.exercise_name = "Exercise name is required.";
  }

  if (!exercise.value.exercise_detail) {
    errors.value.exercise_detail = "Exercise description is required.";
  }

  if (!exercise.value.type) {
    errors.value.type = "Please select a type.";
  }


  return Object.keys(errors.value).length === 0;
};

const submitForm = async () => {
  if (!validateForm()) return;


  // Emit the form data with the photo URL
  emits("submit", {
    ...exercise.value,
  });

  // Reset the form
  exercise.value = {
    exercise_name: "",
    exercise_detail: "",
    trainer_id: localStorage.getItem("UserID"),
    type: "",
    prime: [],
    antagonist: [],
    synergist: [],
    alternatives: [],
    equipment:[],
    cues:[],
    steps:[],
    safety:'',
  };
};
</script>
