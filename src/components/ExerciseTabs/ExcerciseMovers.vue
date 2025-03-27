<template>
  <div class="grid grid-cols-3 gap-4 h-full items-stretch flex-1 min-h-128">
    <div class="card p-4 2xl:p-6 flex flex-col gap-4">
      <h3 class="contentH-small">{{ t('dashboard.tabs.exercise.movers.agonists') }}</h3>
      <p class="text-body">
        {{
          personal
            ? t('dashboard.tabs.exercise.movers.addMuscleDesc')
            : t('dashboard.tabs.exercise.movers.agonistsDesc')
        }}
      </p>
      <div class="flex flex-col gap-4 mt-6">
        <input
          v-if="personal"
          v-model="newPrime"
          type="text"
          class="rafik-text-input"
          :placeholder="t('dashboard.tabs.exercise.movers.addNewMuscle')"
          @keyup.enter="addPrime"
        />
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(mover, index) in props.exercise.prime"
            :key="index"
            class="bg-rafik-secbg dark:bg-rafik-darksecbg text-rafik-sectext dark:text-rafik-darksectext px-3 py-1 rounded-full flex items-center gap-2"
          >
            <span>{{ mover }}</span>
            <button
              v-if="personal"
              @click="removePrime(mover)"
              class="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card p-4 2xl:p-6 flex flex-col gap-4">
      <h3 class="contentH-small">{{ t('dashboard.tabs.exercise.movers.antagonists') }}</h3>
      <p class="text-body">
        {{
          personal
            ? t('dashboard.tabs.exercise.movers.addMuscleDesc')
            : t('dashboard.tabs.exercise.movers.antagonistsDesc')
        }}
      </p>
      <div class="flex flex-col gap-4 mt-6">
        <input
          v-if="personal"
          v-model="newAntagonist"
          type="text"
          class="rafik-text-input"
          :placeholder="t('dashboard.tabs.exercise.movers.addNewMuscle')"
          @keyup.enter="addAntagonist"
        />
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(mover, index) in props.exercise.antagonist"
            :key="index"
            class="bg-rafik-secbg dark:bg-rafik-darksecbg text-rafik-sectext dark:text-rafik-darksectext px-3 py-1 rounded-full flex items-center gap-2"
          >
            <span>{{ mover }}</span>
            <button
              v-if="personal"
              @click="removeAntagonist(mover)"
              class="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card p-4 2xl:p-6 flex flex-col gap-4">
      <h3 class="contentH-small">{{ t('dashboard.tabs.exercise.movers.synergists') }}</h3>
      <p class="text-body">
        {{
          personal
            ? t('dashboard.tabs.exercise.movers.addMuscleDesc')
            : t('dashboard.tabs.exercise.movers.synergistsDesc')
        }}
      </p>
      <div class="flex flex-col gap-4 mt-6">
        <input
          v-if="personal"
          v-model="newSynergist"
          type="text"
          class="rafik-text-input"
          :placeholder="t('dashboard.tabs.exercise.movers.addNewMuscle')"
          @keyup.enter="addSynergist"
        />
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(mover, index) in props.exercise.synergist"
            :key="index"
            class="bg-rafik-secbg dark:bg-rafik-darksecbg text-rafik-sectext dark:text-rafik-darksectext px-3 py-1 rounded-full flex items-center gap-2"
          >
            <span>{{ mover }}</span>
            <button
              v-if="personal"
              @click="removeSynergist(mover)"
              class="text-red-500 hover:text-red-700"
            >
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
const emit = defineEmits(['update-prime', 'update-antagonist', 'update-synergist']);

const newPrime = ref('');
const newAntagonist = ref('');
const newSynergist = ref('');

const addPrime = () => {
  const muscle = newPrime.value.trim();
  if (muscle && !props.exercise.prime.includes(muscle)) {
    emit('update-prime', [...props.exercise.prime, muscle]);
  }
  newPrime.value = '';
};

const removePrime = (muscle: string) => {
  emit(
    'update-prime',
    props.exercise.prime.filter((m: string) => m !== muscle)
  );
};

const addAntagonist = () => {
  const muscle = newAntagonist.value.trim();
  if (muscle && !props.exercise.antagonist.includes(muscle)) {
    emit('update-antagonist', [...props.exercise.antagonist, muscle]);
  }
  newAntagonist.value = '';
};

const removeAntagonist = (muscle: string) => {
  emit(
    'update-antagonist',
    props.exercise.antagonist.filter((m: string) => m !== muscle)
  );
};

const addSynergist = () => {
  const muscle = newSynergist.value.trim();
  if (muscle && !props.exercise.synergist.includes(muscle)) {
    emit('update-synergist', [...props.exercise.synergist, muscle]);
  }
  newSynergist.value = '';
};

const removeSynergist = (muscle: string) => {
  emit(
    'update-synergist',
    props.exercise.synergist.filter((m: string) => m !== muscle)
  );
};
</script>
