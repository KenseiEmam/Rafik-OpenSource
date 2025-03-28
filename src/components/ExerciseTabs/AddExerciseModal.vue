<template>
  <div
    v-if="props.visible"
    class="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
  >
    <div class="card rounded-lg shadow p-6 w-128">
      <h2 class="contentH-small">{{ t('dashboard.tabs.exercise.add.title') }}</h2>
      <p class="text-body mb-4">
        {{ t('dashboard.tabs.exercise.add.description') }}
      </p>
      <form @submit.prevent="submitForm">
        <!-- Exercise Name Field -->
        <div class="mb-4">
          <label for="exercise_name" class="block text-sm font-medium">
            {{ t('dashboard.tabs.exercise.add.exerciseNameLabel') }}
          </label>
          <input
            type="text"
            id="exercise_name"
            v-model="exercise.exercise_name"
            class="rafik-text-input"
            required
            :class="{ 'border-red-500': errors.exercise_name }"
          />
          <span v-if="errors.exercise_name" class="text-red-500 text-sm">
            {{ errors.exercise_name }}
          </span>
        </div>

        <!-- Exercise Description Field -->
        <div class="mb-4">
          <label for="exercise_detail" class="block text-sm font-medium">
            {{ t('dashboard.tabs.exercise.add.exerciseDescriptionLabel') }}
          </label>
          <textarea
            id="exercise_detail"
            v-model="exercise.exercise_detail"
            class="rafik-text-input"
            rows="4"
            required
            :class="{ 'border-red-500': errors.exercise_detail }"
          ></textarea>
          <span v-if="errors.exercise_detail" class="text-red-500 text-sm">
            {{ errors.exercise_detail }}
          </span>
        </div>

        <!-- Exercise Type Field -->
        <div class="mb-4">
          <label for="type" class="block text-sm font-medium">
            {{ t('dashboard.tabs.exercise.add.exerciseTypeLabel') }}
          </label>
          <select
            id="type"
            v-model="exercise.type"
            class="rafik-text-input"
            required
            :class="{ 'border-red-500': errors.type }"
          >
            <option value="" disabled>
              {{ t('dashboard.tabs.exercise.add.selectExerciseTypePlaceholder') }}
            </option>
            <option value="compound">{{ t('dashboard.tabs.exercise.add.optionCompound') }}</option>
            <option value="isolation">
              {{ t('dashboard.tabs.exercise.add.optionIsolation') }}
            </option>
            <option value="bodyweight">
              {{ t('dashboard.tabs.exercise.add.optionBodyweight') }}
            </option>
            <option value="cardio">{{ t('dashboard.tabs.exercise.add.optionCardio') }}</option>
            <option value="stretch">{{ t('dashboard.tabs.exercise.add.optionStretch') }}</option>
            <option value="plyometric">
              {{ t('dashboard.tabs.exercise.add.optionPlyometric') }}
            </option>
          </select>
          <span v-if="errors.type" class="text-red-500 text-sm">
            {{ errors.type }}
          </span>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-md bg-red-500 border-red-500 hover:bg-red-400 rounded mr-2"
          >
            {{ t('dashboard.tabs.exercise.add.cancelButton') }}
          </button>
          <button type="submit" class="btn-md rounded">
            {{ t('dashboard.tabs.exercise.add.addExerciseButton') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
const { t , locale } = useI18n();

const props = defineProps({
  visible: Boolean
});

const emits = defineEmits(['close', 'submit']);

const exercise = ref({
  exercise_name: '',
  exercise_detail: '',
  trainer_id: localStorage.getItem('UserID'),
  type: '',
  prime: [],
  antagonist: [],
  synergist: [],
  alternatives: [],
  equipment: [],
  cues: [],
  steps: [],
  safety: ''
});

const errors = ref<any>({});

const validateForm = () => {
  errors.value = {};

  if (!exercise.value.exercise_name) {
    errors.value.exercise_name = t('dashboard.tabs.exercise.add.errors.nameRequired');
  }
  if (!exercise.value.exercise_detail) {
    errors.value.exercise_detail = t('dashboard.tabs.exercise.add.errors.descriptionRequired');
  }
  if (!exercise.value.type) {
    errors.value.type = t('dashboard.tabs.exercise.add.errors.typeRequired');
  }
  return Object.keys(errors.value).length === 0;
};

const submitForm = async () => {
  if (!validateForm()) return;

  // Emit the form data
  emits('submit', {
    ...exercise.value
  });

  // Reset the form
  exercise.value = {
    exercise_name: '',
    exercise_detail: '',
    trainer_id: localStorage.getItem('UserID'),
    type: '',
    prime: [],
    antagonist: [],
    synergist: [],
    alternatives: [],
    equipment: [],
    cues: [],
    steps: [],
    safety: ''
  };
};
</script>
