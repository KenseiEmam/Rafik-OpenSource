<template>
  <div class="flex-1 2xl:space-y-16 space-y-6 pb-6 h-full">
    <div class="grid grid-cols-3 gap-6 divide-x divide-topsets-sectext dark:divide-topsets-darksectext">
      <div class="flex flex-col gap-3 pl-3 2xl:gap-5">
        <h3 class="contentH-small text-sm 2xl:text-xl mb-6 2xl:mb-8">
          {{ t('dashboard.tabs.clients.details.profile') }}
        </h3>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.clients.details.age') }}
          </p>
          <p class="text-topsets-secondary">{{ calculateAge(props.client.dob) || 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.clients.details.gender') }}
          </p>
          <p class="text-topsets-secondary">{{ props.client.gender || 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.clients.details.nationality') }}
          </p>
          <p class="text-topsets-secondary">{{ props.client.nationality || 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.clients.details.phone') }}
          </p>
          <p class="text-topsets-secondary">{{ props.client.phone || 'N/A' }}</p>
        </div>
      </div>

      <div class="flex flex-col gap-3 pl-3 2xl:gap-5">
        <h3 class="contentH-small text-sm 2xl:text-xl mb-6">
          {{ t('dashboard.tabs.clients.details.metrics') }}
        </h3>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.clients.details.height') }}
          </p>
          <p class="text-topsets-secondary">
            {{ props.client.profile.height || 'N/A' }} {{ t('dashboard.tabs.clients.details.cm') }}
          </p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.clients.details.weight') }}
          </p>
          <!-- Use the computed value for weight -->
          <p class="text-topsets-secondary">
            {{ weight || 'N/A' }} {{ t('dashboard.tabs.clients.details.kg') }}
          </p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.clients.details.goalWeight') }}
          </p>
          <p class="text-topsets-secondary">{{ props.client.profile.weight_goal || 'N/A' }} kg</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.clients.details.bodyFatPercent') }}
          </p>
          <p class="text-topsets-secondary">{{ props.client.profile.body_fat + '%' || 'N/A' }}</p>
        </div>
      </div>

      <div class="flex flex-col gap-3 pl-3 2xl:gap-5">
        <h3 class="contentH-small text-sm 2xl:text-xl mb-6">
          {{ t('dashboard.tabs.clients.details.fitness') }}
        </h3>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.clients.details.experience') }}
          </p>
          <p class="text-topsets-secondary">
            {{ props.client.profile.experience || t('dashboard.tabs.clients.details.NA') }}
          </p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.clients.details.fitnessGoal') }}
          </p>
          <p
            class="text-topsets-secondary"
            v-for="(goal, index) in props.client.profile.fitness_goal"
            :key="goal"
          >
            {{ t(`dashboard.tabs.clients.details.goals.${goals[goal - 1]}`) }}
            <span v-if="index + 1 !== props.client.profile.fitness_goal.length">,</span>
          </p>
          <p class="text-topsets-secondary" v-if="!props.client.profile.fitness_goal">N/A</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.clients.details.sportsPlayed') }}
          </p>
          <p
            class="text-topsets-secondary"
            v-for="(sport, index) in props.client.profile.sports_played"
            :key="sport"
          >
            {{ sport }}
            <span v-if="index + 1 !== props.client.profile.sports_played.length">,</span>
          </p>
          <p class="text-topsets-secondary" v-if="!props.client.profile.sports_played">N/A</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.clients.details.dietPreference') }}
          </p>
          <p
            class="text-topsets-secondary"
            v-for="(diet, index) in props.client.profile.diet_preference"
            :key="diet"
          >
            {{ diet
            }}<span v-if="index + 1 !== props.client.profile.diet_preference.length">, </span>
          </p>
          <p class="text-topsets-secondary" v-if="!props.client.profile.diet_preference">N/A</p>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-6">
       <div class="card p-8 flex flex-col gap-3  items-center 2xl:min-h-96" v-if="program">
      <div class="space-y-4">
        <h3 class="text-sm contentH-small 2xl:text-base">
          {{ t('dashboard.tabs.clients.details.program') }}
        </h3>
        <h2 class="header-medium font-black">{{ program.program_name || 'Loading...' }}</h2>
        <p class="text-body">{{ program.program_description || 'Loading...' }}</p>
      </div>
      <div class="flex flex-col w-full gap-3">
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.clients.details.joinedOn') }}
          </p>
          <p class="text-topsets-secondary">
            {{
              new Date(props.client.program_details.created_at).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) || 'N/A'
            }}
          </p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-topsets-pritext dark:text-topsets-darkpritext">
            {{ t('dashboard.tabs.clients.details.expiresOn') }}
          </p>
          <p class="text-topsets-secondary">
            {{
              new Date(props.client.program_details.expires_on).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) || 'N/A'
            }}
          </p>
        </div>
        <!-- <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.clients.details.pricePackage') }}
          </p>
          <p class="text-topsets-secondary">
            {{
              props.client.program_details.price_pavckage
                ? props.client.program_details.price_pavckage + ' AED'
                : 'None Paying'
            }}
          </p>
        </div> -->
        <div class="flex justify-center uppercase">
          <router-link
            :to="{ name: 'program-details', params: { id: program.id } }"
            class="font-semibold"
            >{{ t('dashboard.tabs.clients.details.visit') }}</router-link
          >
        </div>
      </div>
    </div>
    <div class="card  p-6">
      <h3 class="contentH-small">Weight Log</h3>
      <WeightLog :profile="client.profile" />
    </div>

    </div>

  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../../lib/supabaseClient';
import Swal from 'sweetalert2';
import { useI18n } from 'vue-i18n';
import WeightLog from './WeightLog.vue';
const { t , locale } = useI18n();
// Success and Error Alerts
function showSuccess(message: string) {
  Swal.fire({
    title: t('general.success'),
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 1500,
    text: message,
    toast: true,
    position: 'top-right',
    icon: 'success',
    background: '#132e3d',
    color: '#ececec'
  });
}

function showError(message: string) {
  Swal.fire({
    title: t('general.error'),
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#132e3d',
    color: '#ececec'
  });
}
// Props to receive the program object
const props = defineProps({
  client: {
    type: Object,
    required: true
  }
});

function calculateAge(dob: Date) {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // Adjust age if birthday hasn't happened yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
// Reactive reference to store the weight
const weight = ref<string | null>(null);
const program = ref<any>(null);
const goals = ['get_fitter', 'build_physique', 'increase_strength', 'recovery', 'sport_specific'];
// Computed property to fetch weight from Supabase
const fetchWeight = async (weightId: number) => {
  try {
    const { data, error } = await supabase
      .from('weights')
      .select('weight')
      .eq('id', weightId)
      .single();

    if (error) {
      showError('Error fetching weight:' + error.message);
      return null;
    }

    return data?.weight || null;
  } catch (err) {
    showError('Unexpected error fetching weight:' + err);
    return null;
  }
};

const fetchProgram = async (programId: number) => {
  try {
    const { data, error } = await supabase.from('programs').select().eq('id', programId).single();

    if (error) {
      showError('Error fetching program:' + error.message);
      return null;
    }

    return data || null;
  } catch (err) {
    showError('Unexpected error fetching program:' + err);
    return null;
  }
};

// Fetch the weight when the component mounts
onMounted(async () => {
  const weightId = props.client.profile.weight_id; // Get weight_id from client profile
  const programId = props.client.program_details.program_id; // Get Program id from details
  if (weightId) {
    const clientWeight = await fetchWeight(weightId);
    weight.value = clientWeight;
  }
  if (programId) {
    const parentProgram = await fetchProgram(programId);
    program.value = parentProgram;
  }
});
</script>

<style scoped>
/* Your styles */
</style>
