<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { useI18n } from 'vue-i18n';

const { t , locale } = useI18n();
const props = defineProps({
  program: {
    type: Object,
    required: true
  },
  admin: {
    type: Boolean,
    default: false
  }
});

// Emit events to the parent (only emitted when not in read‑only mode)
const emit = defineEmits(['update-tags', 'update-focus']);

// Reactive slider values
const strength = ref(25);
const cardio = ref(25);
const hypertrophy = ref(25);
const agility = ref(25);
const refresh = ref(false);

// Function to refresh slider values from the program prop
const refreshSliders = () => {
  refresh.value = true; // Optionally hide UI temporarily
  strength.value = props.program.program_focus[0] ?? 25;
  hypertrophy.value = props.program.program_focus[1] ?? 25;
  agility.value = props.program.program_focus[2] ?? 25;
  cardio.value = props.program.program_focus[3] ?? 25;
  setTimeout(() => (refresh.value = false), 0); // Allow UI to re-render
};

const userStore = useUserStore();

// If in admin mode and a trainer_id is provided, fetch the trainer details
onMounted(async () => {
  if (props.admin && props.program.trainer_id) {
    await userStore.getTrainer(props.program.trainer_id);
  }
});

// Watch for changes in the program prop and update slider values
watch(() => props.program, refreshSliders, { deep: true, immediate: true });

// Computed total percentage value
const total = ref(100);

// New tag input state
const newTag = ref('');

// Watch slider values and emit updated focus (only if not in read-only mode)
watch([strength, cardio, hypertrophy, agility], () => {
  total.value =
    Number(strength.value) +
    Number(hypertrophy.value) +
    Number(cardio.value) +
    Number(agility.value);

  if (total.value === 100 && !props.admin) {
    const updatedFocus = [
      Number(strength.value),
      Number(hypertrophy.value),
      Number(agility.value),
      Number(cardio.value)
    ];
    if (JSON.stringify(props.program.program_focus) !== JSON.stringify(updatedFocus)) {
      emit('update-focus', updatedFocus);
    }
  }
});

// Function to add a new tag (does nothing if admin is true)
const addTag = () => {
  if (props.admin) return; // Read‑only: do not add a tag
  const tag = newTag.value.trim();
  if (tag && !props.program.tags.includes(tag)) {
    emit('update-tags', [...props.program.tags, tag]);
  }
  newTag.value = ''; // Clear input field
};

// Function to remove a tag (does nothing if admin is true)
const removeTag = (tagToRemove: string) => {
  if (props.admin) return; // Read‑only: do not remove tags
  emit(
    'update-tags',
    props.program.tags.filter((tag: string) => tag !== tagToRemove)
  );
};
</script>

<template>
  <div class="grid md:grid-cols-2 items-center relative flex-1 gap-4 items-stretch">
    <!-- Quick Stats / Trainer Details Section -->
    <div v-if="!admin" class="card p-8 h-full">
      <h3 class="contentH-medium">{{ t('dashboard.tabs.program.details.quickStats') }}</h3>
      <p class="text-body">
        {{ t('dashboard.tabs.program.details.quickStatsDescription') }}
      </p>
      <div
        class="flex flex-col divide-y divide-rafik-sectext dark:divide-rafik-darksectext gap-3 mt-4"
      >
        <div class="flex justify-between gap-4 py-2">
          <p class="xl:text-lg text-rafik-pritext dark:text-rafik-darkpritext font-semibold">
            {{ t('dashboard.tabs.program.details.totalClients') }}
          </p>
          <p class="xl:text-lg text-rafik-sectext dark:text-rafik-darksectext">
            {{ t('dashboard.tabs.program.details.comingSoon') }}
          </p>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <p class="xl:text-lg text-rafik-pritext dark:text-rafik-darkpritext font-semibold">
            {{ t('dashboard.tabs.program.details.revenueThisMonth') }}
          </p>
          <p class="xl:text-lg text-rafik-sectext dark:text-rafik-darksectext">
            {{ t('dashboard.tabs.program.details.comingSoon') }}
          </p>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <p class="xl:text-lg text-rafik-pritext dark:text-rafik-darkpritext font-semibold">
            {{ t('dashboard.tabs.program.details.totalRevenue') }}
          </p>
          <p class="xl:text-lg text-rafik-sectext dark:text-rafik-darksectext">
            {{ t('dashboard.tabs.program.details.comingSoon') }}
          </p>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <p class="xl:text-lg text-rafik-pritext dark:text-rafik-darkpritext font-semibold">
            {{ t('dashboard.tabs.program.details.bestMonth') }}
          </p>
          <p class="xl:text-lg text-rafik-sectext dark:text-rafik-darksectext">
            {{ t('dashboard.tabs.program.details.comingSoon') }}
          </p>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <p class="xl:text-lg text-rafik-pritext dark:text-rafik-darkpritext font-semibold">
            {{ t('dashboard.tabs.program.details.clientRetention') }}
          </p>
          <p class="xl:text-lg text-rafik-sectext dark:text-rafik-darksectext">
            {{ t('dashboard.tabs.program.details.comingSoon') }}
          </p>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <p class="xl:text-lg text-rafik-pritext dark:text-rafik-darkpritext font-semibold">
            {{ t('dashboard.tabs.program.details.growthRate') }}
          </p>
          <p class="xl:text-lg text-rafik-sectext dark:text-rafik-darksectext">
            {{ t('dashboard.tabs.program.details.comingSoon') }}
          </p>
        </div>
      </div>
    </div>
    <!-- Trainer Details (Admin Mode) -->
    <div v-else class="card p-8 h-full">
      <h3 class="contentH-medium">{{ t('dashboard.tabs.program.details.trainerDetails') }}</h3>
      <div class="flex flex-col justify-between h-full" v-if="userStore.O_Trainer">
        <!-- Display trainer title (using 'name') and bio -->
        <div class="mt-4">
          <p class="subheader-small font-bold">
            {{
              `${userStore.O_Trainer.title} ${userStore.O_Trainer.first_name} ${userStore.O_Trainer.last_name}`
            }}
          </p>
          <p class="text-body">{{ userStore.O_Trainer.bio }}</p>
        </div>

        <!-- Button to navigate to the trainer's user page -->
        <div class="mb-4">
          <Router-link
            :to="{ name: 'single-user', params: { id: userStore.O_Trainer.user_id } }"
            class="mt-auto inline-block px-4 py-2 bg-rafik-pribg hover:bg-rafik dark:hover:bg-rafik dark:bg-rafik-darkpribg text-rafik-pritext dark:text-rafik-darkpritext hover:text-white rounded"
          >
            {{ t('dashboard.tabs.program.details.viewTrainerProfile') }}
          </Router-link>
        </div>
      </div>
      <div v-else>
        <p class="text-body">{{ t('dashboard.tabs.program.details.loadingTrainerDetails') }}</p>
      </div>
    </div>

    <!-- Sliders Section -->
    <div class="card p-8">
      <h3 class="contentH-medium">{{ t('dashboard.tabs.program.details.exerciseFocus') }}</h3>
      <p v-if="!admin" class="text-body">
        {{ t('dashboard.tabs.program.details.exerciseFocusDescriptionUser') }}
      </p>
      <p v-else class="text-body">
        {{ t('dashboard.tabs.program.details.exerciseFocusDescriptionAdmin') }}
      </p>

      <div v-if="!refresh" class="flex flex-col gap-6 mt-6">
        <!-- Strength Slider -->
        <div>
          <div class="flex justify-between">
            <label class="inline-block text-rafik-pritext dark:text-rafik-darkpritext">
              {{ t('dashboard.tabs.program.details.strength') }}
            </label>
            <span class="text-rafik-pritext dark:text-rafik-darkpritext">{{ strength }}%</span>
          </div>
          <input
            v-model="strength"
            type="range"
            class="h-[4px] w-full cursor-pointer appearance-none bg-rafik-alternate"
            min="0"
            max="100"
            step="5"
            :class="{ 'read-only-slider': admin }"
          />
        </div>

        <!-- Hypertrophy Slider -->
        <div>
          <div class="flex justify-between">
            <label class="inline-block text-rafik-pritext dark:text-rafik-darkpritext">
              {{ t('dashboard.tabs.program.details.hypertrophy') }}
            </label>
            <span class="text-rafik-pritext dark:text-rafik-darkpritext">{{ hypertrophy }}%</span>
          </div>
          <input
            v-model="hypertrophy"
            type="range"
            class="h-[4px] w-full cursor-pointer appearance-none bg-rafik-teritiary"
            min="0"
            max="100"
            step="5"
            :class="{ 'read-only-slider': admin }"
          />
        </div>

        <!-- Agility Slider -->
        <div>
          <div class="flex justify-between">
            <label class="inline-block text-rafik-pritext dark:text-rafik-darkpritext">
              {{ t('dashboard.tabs.program.details.agility') }}
            </label>
            <span class="text-rafik-pritext dark:text-rafik-darkpritext">{{ agility }}%</span>
          </div>
          <input
            v-model="agility"
            type="range"
            class="h-[4px] w-full cursor-pointer appearance-none bg-rafik-secondary"
            min="0"
            max="100"
            step="5"
            :class="{ 'read-only-slider': admin }"
          />
        </div>

        <!-- Cardio Slider -->
        <div>
          <div class="flex justify-between">
            <label class="inline-block text-rafik-pritext dark:text-rafik-darkpritext">
              {{ t('dashboard.tabs.program.details.cardio') }}
            </label>
            <span class="text-rafik-pritext dark:text-rafik-darkpritext">{{ cardio }}%</span>
          </div>
          <input
            v-model="cardio"
            type="range"
            class="h-[4px] w-full cursor-pointer appearance-none bg-rafik"
            min="0"
            max="100"
            step="5"
            :class="{ 'read-only-slider': admin }"
          />
        </div>

        <!-- Warning Message for Incorrect Total -->
        <p v-if="!admin && total !== 100" class="text-red-500 text-sm">
          {{ t('dashboard.tabs.program.details.totalPercentageWarning', { total }) }}
        </p>
      </div>
    </div>

    <!-- Tags Section -->
    <div class="card p-8 col-span-2">
      <h3 class="contentH-medium">{{ t('dashboard.tabs.program.details.tags') }}</h3>
      <p v-if="!admin" class="text-body">
        {{ t('dashboard.tabs.program.details.tagsInstruction') }}
      </p>
      <p v-else class="text-body">
        {{ t('dashboard.tabs.program.details.tagsReadOnlyInstruction') }}
      </p>

      <div class="flex flex-col gap-4 mt-6">
        <!-- Input for new tag (shown only if not in admin mode) -->
        <input
          v-model="newTag"
          type="text"
          class="rafik-text-input"
          :placeholder="t('dashboard.tabs.program.details.addNewTag')"
          @keyup.enter="addTag"
          v-if="!admin"
        />

        <!-- Display Tags -->
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(tag, index) in props.program.tags"
            :key="index"
            class="bg-rafik-secbg dark:bg-rafik-darksecbg text-rafik-sectext dark:text-rafik-darksectext px-3 py-1 rounded-full flex items-center gap-2"
          >
            <span>{{ tag }}</span>
            <button @click="removeTag(tag)" class="text-red-500 hover:text-red-700" v-if="!admin">
              {{ t('dashboard.tabs.program.details.removeTagButton') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Slider thumb styles */
input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background-color: white;
  border-radius: 9999px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

input[type='range']::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background-color: white;
  border-radius: 9999px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.read-only-slider {
  pointer-events: none; /* Disables interaction */
}
</style>
