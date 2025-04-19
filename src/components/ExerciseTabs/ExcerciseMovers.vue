<template>
  <div
    :dir="locale === 'ar' ? 'rtl' : 'ltr'"
    class="grid grid-cols-3 gap-4 h-full items-stretch flex-1 min-h-128"
  >
    <!-- Filters -->
    <div class="flex flex-col gap-6">
      <div @click="active ='prime'" :class="active == 'prime'?'gradient-bg text-rafik-pritext dark:text-rafik-darkpritext':''" class="card cursor-pointer hover:opacity-80 p-4 2xl:p-6 flex flex-col gap-3 flex-1">
        <h3 class="text-xl">{{ t('dashboard.tabs.exercise.movers.agonists') }}</h3>
        <p >
          {{
            personal
              ? t('dashboard.tabs.exercise.movers.addMuscleDesc')
              : t('dashboard.tabs.exercise.movers.agonistsDesc')
          }}
        </p>
      </div>
      <div @click="active ='antagonist'" :class="active == 'antagonist'?'gradient-bg text-rafik-pritext dark:text-rafik-darkpritext':''" class="card cursor-pointer hover:opacity-80 p-4 2xl:p-6 flex flex-col gap-3 flex-1">
        <h3 class="text-xl">{{ t('dashboard.tabs.exercise.movers.antagonists') }}</h3>
        <p >
          {{
            personal
              ? t('dashboard.tabs.exercise.movers.addMuscleDesc')
              : t('dashboard.tabs.exercise.movers.antagonistsDesc')
          }}
        </p>
      </div>
      <div @click="active ='synergists'" :class="active == 'synergists'?'gradient-bg text-rafik-pritext dark:text-rafik-darkpritext':''" class="card cursor-pointer hover:opacity-80 p-4 2xl:p-6 flex flex-col gap-3 flex-1">
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
            'bg-rafik-secondary text-rafik-pritext dark:text-rafik-darkpritext':
              exercise.prime.includes(muscle),
            'bg-rafik-secbg dark:bg-rafik-darksecbg border border-rafik-sectext dark:border-rafik-darksectext text-rafik-sectext dark:text-rafik-darksectext':
              !exercise.prime.includes(muscle),
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
            'bg-rafik-secondary text-rafik-pritext dark:text-rafik-darkpritext':
              exercise.antagonist.includes(muscle),
            'bg-rafik-secbg dark:bg-rafik-darksecbg border border-rafik-sectext dark:border-rafik-darksectext text-rafik-sectext dark:text-rafik-darksectext':
              !exercise.antagonist.includes(muscle),
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
            'bg-rafik-secondary text-rafik-pritext dark:text-rafik-darkpritext':
              exercise.synergist.includes(muscle),
            'bg-rafik-secbg dark:bg-rafik-darksecbg border border-rafik-sectext dark:border-rafik-darksectext text-rafik-sectext dark:text-rafik-darksectext':
              !exercise.synergist.includes(muscle),
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

// Shared muscle options for all mover types
const muscles = [
  'Upper Traps',
  'Mid Traps',
  'Lower Traps',
  'Rotator Cuffs',
  'Rear Delts',
  'Lateral Delts',
  'Posterior Delts',
  'Upper Chest (Pectoralis Major)',
  'Mid/Lower Chest (Pectoralis Major)',
  'Pectoralis Minor',
  'Intercostals',
  'Obliques',
  'Abdominals',
  '(Core) Inner Abdominals',
  '(Core) Quadratus Lumborum',
  'Hip Flexors',
  'Spinal Erectors',
  'Latissimus Dorsi',
  'Rhomboids',
  'Teres Major',
  'Biceps',
  'Brachiallis',
  'Wrist Flexors',
  'Wrist Extensors',
  'Triceps (Long Head)',
  'Triceps (Medial Head)',
  'Gluteus Maximus',
  'Gluteus Medius',
  'Gluteus Minimus',
  'Sartorius',
  'Adductors',
  'Quadriceps',
  'Hamstrings',
  'Calves'
];

function togglePrime(muscle: string) {
  const list = props.exercise.prime.includes(muscle)
    ? props.exercise.prime.filter((m: string) => m !== muscle)
    : [...props.exercise.prime, muscle];
  emit('update-prime', list);
}

function toggleAntagonist(muscle: string) {
  const list = props.exercise.antagonist.includes(muscle)
    ? props.exercise.antagonist.filter((m: string) => m !== muscle)
    : [...props.exercise.antagonist, muscle];
  emit('update-antagonist', list);
}

function toggleSynergist(muscle: string) {
  const list = props.exercise.synergist.includes(muscle)
    ? props.exercise.synergist.filter((m: string) => m !== muscle)
    : [...props.exercise.synergist, muscle];
  emit('update-synergist', list);
}
</script>
