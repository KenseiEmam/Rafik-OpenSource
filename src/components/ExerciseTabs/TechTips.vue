<template>
  <div class="grid grid-cols-3 gap-4 h-full items-stretch flex-1 min-h-128">
    <!-- Safety Guidelines -->
    <div class="card p-4 2xl:p-6 flex flex-col gap-4">
      <h3 class="contentH-small">
        {{ t('dashboard.tabs.exercise.tips.safetyGuidelines') }}
      </h3>
      <p class="text-body">
        {{ t('dashboard.tabs.exercise.tips.safetyGuidelinesDescription') }}
      </p>
      <div class="mt-4">
        <p
          v-if="!isEditingSafety"
          class="text-body text-justify cursor-text hover:opacity-70"
          @click="editSafety"
        >
          {{
            props.exercise.safety || t('dashboard.tabs.exercise.tips.clickToAddSafetyGuidelines')
          }}
        </p>
        <textarea
          v-else
          v-model="editableSafety"
          class="rafik-text-input"
          @blur="saveSafety"
          @keyup.enter="saveSafety"
        ></textarea>
      </div>
    </div>

    <!-- Steps -->
    <div class="card p-4 2xl:p-6 flex flex-col gap-4">
      <h3 class="contentH-small">
        {{ t('dashboard.tabs.exercise.tips.stepsHeading') }}
      </h3>
      <p class="text-body">
        {{ t('dashboard.tabs.exercise.tips.stepsDescription') }}
      </p>
      <div class="flex flex-col gap-4 mt-6">
        <input
          v-if="personal"
          v-model="newStep"
          type="text"
          class="rafik-text-input"
          :placeholder="t('dashboard.tabs.exercise.tips.addNewStep')"
          @keyup.enter="addStep"
        />
        <div class="flex flex-col gap-2">
          <div
            v-for="(step, index) in props.exercise.steps"
            :key="index"
            class="bg-rafik-secbg dark:bg-rafik-darksecbg text-rafik-sectext dark:text-rafik-darksectext p-3 w-full rounded-md flex items-center justify-between gap-2"
          >
            <span>{{ index + 1 }}. {{ step }}</span>
            <button
              v-if="personal"
              @click="removeStep(step)"
              class="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cues -->
    <div class="card p-4 2xl:p-6 flex flex-col gap-4">
      <h3 class="contentH-small">
        {{ t('dashboard.tabs.exercise.tips.coachingCuesHeading') }}
      </h3>
      <p class="text-body">
        {{ t('dashboard.tabs.exercise.tips.coachingCuesDescription') }}
      </p>
      <div class="flex flex-col gap-4 mt-6">
        <input
          v-if="personal"
          v-model="newCue"
          type="text"
          class="rafik-text-input"
          :placeholder="t('dashboard.tabs.exercise.tips.addNewCue')"
          @keyup.enter="addCue"
        />
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(cue, index) in props.exercise.cues"
            :key="index"
            class="bg-rafik-secbg dark:bg-rafik-darksecbg text-rafik-sectext dark:text-rafik-darksectext px-3 py-1 rounded-md flex items-center gap-2"
          >
            <span>{{ cue }}</span>
            <button v-if="personal" @click="removeCue(cue)" class="text-red-500 hover:text-red-700">
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

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
const emit = defineEmits(['update-safety', 'update-steps', 'update-cues']);

// Safety Guidelines
const isEditingSafety = ref(false);
const editableSafety = ref(props.exercise.safety || '');
const editSafety = () => {
  if (props.personal) {
    isEditingSafety.value = true;
    editableSafety.value = props.exercise.safety || '';
  }
};
const saveSafety = () => {
  isEditingSafety.value = false;
  emit('update-safety', editableSafety.value);
};

// Steps
const newStep = ref('');
const addStep = () => {
  const step = newStep.value.trim();
  if (step && !props.exercise.steps.includes(step)) {
    emit('update-steps', [...props.exercise.steps, step]);
  }
  newStep.value = '';
};
const removeStep = (step: string) => {
  emit(
    'update-steps',
    props.exercise.steps.filter((s: string) => s !== step)
  );
};

// Coaching Cues
const newCue = ref('');
const addCue = () => {
  const cue = newCue.value.trim();
  if (cue && !props.exercise.cues.includes(cue)) {
    emit('update-cues', [...props.exercise.cues, cue]);
  }
  newCue.value = '';
};
const removeCue = (cue: string) => {
  emit(
    'update-cues',
    props.exercise.cues.filter((c: string) => c !== cue)
  );
};
</script>
