<template>
  <div
    :dir="locale === 'ar' ? 'rtl' : 'ltr'"
    class="grid grid-cols-3 gap-4 h-full items-stretch flex-1 min-h-128"
  >
    <!-- Filters -->
    <div class="flex flex-col gap-6">
      <div @click="active ='prime'" :class="active == 'prime'?'gradient-bg text-topsets-pritext dark:text-topsets-darkpritext':''" class="card cursor-pointer hover:opacity-80 p-4 2xl:p-6 flex flex-col gap-3 flex-1">
        <h3 class="text-xl">{{ t('dashboard.tabs.exercise.movers.agonists') }}</h3>
        <p >
          {{
            personal
              ? t('dashboard.tabs.exercise.movers.addMuscleDesc')
              : t('dashboard.tabs.exercise.movers.agonistsDesc')
          }}
        </p>
      </div>
      <div @click="active ='antagonist'" :class="active == 'antagonist'?'gradient-bg text-topsets-pritext dark:text-topsets-darkpritext':''" class="card cursor-pointer hover:opacity-80 p-4 2xl:p-6 flex flex-col gap-3 flex-1">
        <h3 class="text-xl">{{ t('dashboard.tabs.exercise.movers.antagonists') }}</h3>
        <p >
          {{
            personal
              ? t('dashboard.tabs.exercise.movers.addMuscleDesc')
              : t('dashboard.tabs.exercise.movers.antagonistsDesc')
          }}
        </p>
      </div>
      <div @click="active ='synergists'" :class="active == 'synergists'?'gradient-bg text-topsets-pritext dark:text-topsets-darkpritext':''" class="card cursor-pointer hover:opacity-80 p-4 2xl:p-6 flex flex-col gap-3 flex-1">
        <h3 class="text-xl">{{ t('dashboard.tabs.exercise.movers.synergists') }}</h3>
        <p >
          {{
            personal
              ? t('dashboard.tabs.exercise.movers.addMuscleDesc')
              : t('dashboard.tabs.exercise.movers.synergistsDesc')
          }}
        </p>
      </div>



    </div>

    <!-- Muscles -->
    <div class="card p-4 2xl:p-6 col-span-2 flex flex-col gap-4">
      <transition name="fade">
      <div v-if="active == 'prime'" class="flex flex-wrap gap-2 mt-6">
        <button
          v-for="(muscle, index) in muscles"
          :key="index"
          @click="personal && togglePrime(muscle)"
          :disabled="!personal"
          :class="{
            'bg-topsets-secondary text-topsets-pritext dark:text-topsets-darkpritext':
              exercise.prime.includes(capitalize(muscle)),
            'bg-topsets-secbg dark:bg-topsets-darksecbg border border-topsets-sectext dark:border-topsets-darksectext text-topsets-sectext dark:text-topsets-darksectext':
              !exercise.prime.includes(capitalize(muscle)),
            'opacity-50 cursor-not-allowed': !personal
          }"
          class="px-3 py-1 rounded-full"
        >
          {{ muscle }}
        </button>
      </div>
      <div v-else-if="active == 'antagonist'" class="flex flex-wrap gap-2 mt-6">
        <button
          v-for="(muscle, index) in muscles"
          :key="index"
          @click="personal && toggleAntagonist(muscle)"
          :disabled="!personal"
          :class="{
            'bg-topsets-secondary text-topsets-pritext dark:text-topsets-darkpritext':
              exercise.antagonist.includes(capitalize(muscle)),
            'bg-topsets-secbg dark:bg-topsets-darksecbg border border-topsets-sectext dark:border-topsets-darksectext text-topsets-sectext dark:text-topsets-darksectext':
              !exercise.antagonist.includes(capitalize(muscle)),
            'opacity-50 cursor-not-allowed': !personal
          }"
          class="px-3 py-1 rounded-full"
        >
          {{ muscle }}
        </button>
      </div>
      <div v-else class="flex flex-wrap gap-2 mt-6">
        <button
          v-for="(muscle, index) in muscles"
          :key="index"
          @click="personal && toggleSynergist(muscle)"
          :disabled="!personal"
          :class="{
            'bg-topsets-secondary text-topsets-pritext dark:text-topsets-darkpritext':
              exercise.synergist.includes(capitalize(muscle)),
            'bg-topsets-secbg dark:bg-topsets-darksecbg border border-topsets-sectext dark:border-topsets-darksectext text-topsets-sectext dark:text-topsets-darksectext':
              !exercise.synergist.includes(capitalize(muscle)),
            'opacity-50 cursor-not-allowed': !personal
          }"
          class="px-3 py-1 rounded-full"
        >
          {{ muscle }}
        </button>
      </div>
      </transition>

    </div>


  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
const { t, locale } = useI18n();
 const active= ref('prime')
const props = defineProps({
  exercise: { type: Object, required: true },
  personal: { type: Boolean, required: true }
});
const emit = defineEmits([
  'update-prime',
  'update-antagonist',
  'update-synergist'
]);

// Capitalize helper
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Shared muscle options for all mover types
const muscles = [
  'Upper Traps',
  'Mid Traps',
  'Lower Traps',
  'Rotator Cuffs',
  'Rear Deltoid',
  'Lateral Deltoid',
  'Posterior Deltoid',
  'Upper Chest (Pectoralis Major)',
  'Mid/Lower Chest (Pectoralis Major)',
  'Pectoralis Major',
  'Shoulders',
  'Pectoralis Minor',
  'Intercostals',
  'Obliques',
  'Abdominals',
  'Core',
  'Quadratus Lumborum',
  'Hip Flexors',
  'Spinal Erectors',
  'Latissimus Dorsi',
  'Rhomboids',
  'Teres Major',
  'Biceps Brachii',
  'Brachiallis',
  'Wrist Flexors',
  'Wrist Extensors',
  'Triceps Brachii (Long Head)',
  'Triceps Brachii (Medial Head)',
  'Triceps Brachii',
  'Anchoneus',
  'Gluteus Maximus',
  'Gluteus Medius',
  'Gluteus Minimus',
  'Sartorius',
  'Adductors',
  'Quadriceps',
  'Hamstrings',
  'Soleus',
  'Gastrocnemius'
];

function togglePrime(muscle: string) {
  const m = capitalize(muscle);
  const list = props.exercise.prime.includes(m)
    ? props.exercise.prime.filter((m: string) => m !== muscle)
    : [...props.exercise.prime, muscle];
  emit('update-prime', list);
}

function toggleAntagonist(muscle: string) {
  const m = capitalize(muscle);
  const list = props.exercise.antagonist.includes(m)
    ? props.exercise.antagonist.filter((m: string) => m !== muscle)
    : [...props.exercise.antagonist, muscle];
  emit('update-antagonist', list);
}

function toggleSynergist(muscle: string) {
  const m = capitalize(muscle);
  const list = props.exercise.synergist.includes(m)
    ? props.exercise.synergist.filter((m: string) => m !== muscle)
    : [...props.exercise.synergist, muscle];
  emit('update-synergist', list);
}
</script>
