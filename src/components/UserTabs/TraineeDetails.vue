<template>
  <div class="flex-1 2xl:space-y-16 space-y-6 pb-6 h-full">
    <div class="grid grid-cols-2 gap-6">
      <div class="flex flex-col card p-6 gap-3 2xl:gap-5">
        <h3 class="contentH-small text-sm 2xl:text-xl mb-6">
          {{ t('dashboard.tabs.user.trainee.clientMetrics') }}
        </h3>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.user.trainee.height') }}
          </p>
          <p class="text-rafik-secondary">
            {{ props.client.profile.height || t('dashboard.tabs.user.trainee.na') }} cm
          </p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.user.trainee.weight') }}
          </p>
          <p class="text-rafik-secondary">{{ weight || t('dashboard.tabs.user.trainee.na') }} kg</p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.user.trainee.goalWeight') }}
          </p>
          <p class="text-rafik-secondary">
            {{ props.client.profile.weight_goal || t('dashboard.tabs.user.trainee.na') }} kg
          </p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.user.trainee.bodyFatPercent') }}
          </p>
          <p class="text-rafik-secondary">
            {{ props.client.profile.body_fat + '%' || t('dashboard.tabs.user.trainee.na') }}
          </p>
        </div>
      </div>

      <div class="flex flex-col card p-6 gap-3 2xl:gap-5">
        <h3 class="contentH-small text-sm 2xl:text-xl mb-6">
          {{ t('dashboard.tabs.user.trainee.clientFitness') }}
        </h3>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.user.trainee.experience') }}
          </p>
          <p class="text-rafik-secondary">
            {{ props.client.profile.experience || t('dashboard.tabs.user.trainee.na') }}
          </p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.user.trainee.fitnessGoal') }}
          </p>
          <p
            class="text-rafik-secondary"
            v-for="(goal, index) in props.client.profile.fitness_goal"
            :key="goal"
          >
            {{ goals[goal - 1] }}
            <span v-if="index + 1 !== props.client.profile.fitness_goal.length">,</span>
          </p>
          <p class="text-rafik-secondary" v-if="!props.client.profile.fitness_goal">
            {{ t('dashboard.tabs.user.trainee.na') }}
          </p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.user.trainee.sportsPlayed') }}
          </p>
          <p
            class="text-rafik-secondary"
            v-for="(sport, index) in props.client.profile.sports_played"
            :key="sport"
          >
            {{ sport }}
            <span v-if="index + 1 !== props.client.profile.sports_played.length">,</span>
          </p>
          <p class="text-rafik-secondary" v-if="!props.client.profile.sports_played">
            {{ t('dashboard.tabs.user.trainee.na') }}
          </p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.user.trainee.dietPreference') }}
          </p>
          <p
            class="text-rafik-secondary"
            v-for="(diet, index) in props.client.profile.diet_preference"
            :key="diet"
          >
            {{ diet }}
            <span v-if="index + 1 !== props.client.profile.diet_preference.length">, </span>
          </p>
          <p class="text-rafik-secondary" v-if="!props.client.profile.diet_preference">
            {{ t('dashboard.tabs.user.trainee.na') }}
          </p>
        </div>
      </div>
    </div>
    <div class="card p-8 grid gap-6 grid-cols-3 items-center 2xl:min-h-96" v-if="program">
      <div class="col-span-2 space-y-4">
        <h3 class="text-sm contentH-small 2xl:text-base">
          {{ t('dashboard.tabs.user.trainee.clientProgram') }}
        </h3>
        <h2 class="header-medium font-black">
          {{ program.program_name || t('dashboard.tabs.user.trainee.loading') }}
        </h2>
        <p class="text-body">
          {{ program.program_description || t('dashboard.tabs.user.trainee.loading') }}
        </p>
      </div>
      <div class="flex flex-col gap-3">
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.user.trainee.joinedOn') }}
          </p>
          <p class="text-rafik-secondary">
            {{
              new Date(props.client.program_details.created_at).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) || t('dashboard.tabs.user.trainee.na')
            }}
          </p>
        </div>
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.user.trainee.expiresOn') }}
          </p>
          <p class="text-rafik-secondary">
            {{
              new Date(props.client.program_details.expires_on).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) || t('dashboard.tabs.user.trainee.na')
            }}
          </p>
        </div>
        <!-- <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.user.trainee.pricePackage') }}
          </p>
          <p class="text-rafik-secondary">
            {{
              props.client.program_details.price_pavckage
                ? props.client.program_details.price_pavckage + ' AED'
                : t('dashboard.tabs.user.trainee.nonePaying')
            }}
          </p>
        </div> -->
        <div class="flex justify-between uppercase text-sm 2xl:text-base">
          <p class="text-rafik-pritext dark:text-rafik-darkpritext">
            {{ t('dashboard.tabs.user.trainee.trainer') }}
          </p>
          <router-link
            :to="{ name: 'single-user', params: { id: program.trainer_id } }"
            class="font-semibold"
            >{{ trainer_name }}</router-link
          >
        </div>
        <div class="flex justify-center uppercase">
          <router-link
            :to="{ name: 'program-details', params: { id: program.id } }"
            class="font-semibold"
            >{{ t('dashboard.tabs.user.trainee.visitProgram') }}</router-link
          >
        </div>
      </div>
    </div>
    <div class="card flex p-8 grid gap-6 justify-center items-center 2xl:min-h-96" v-else>
      <h3 class="header-medium">{{ t('dashboard.tabs.user.trainee.notAssigned') }}</h3>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../../lib/supabaseClient';
import Swal from 'sweetalert2';
import { useI18n } from 'vue-i18n';
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
    background: '#081411',
    color: '#E8F3ED'
  });
}

function showError(message: string) {
  Swal.fire({
    title: t('general.error'),
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}
// Props to receive the program object
const props = defineProps({
  client: {
    type: Object,
    required: true
  }
});
const trainer_name = ref<string>('');
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
const goals = ['Get fitter', 'Build Physique', 'Increase Strength', 'Recovery', 'Sport Specific'];
// Computed property to fetch weight from Supabase
const fetchWeight = async (weightId: number) => {
  try {
    const { data, error } = await supabase
      .from('weights')
      .select('weight')
      .eq('id', weightId)
      .single();

    if (error) {
      showError(t('dashboard.tabs.user.trainee.errorFetchingWeight') + error.message);
      return null;
    }

    return data?.weight || null;
  } catch (err) {
    showError(t('dashboard.tabs.user.trainee.unexpectedErrorFetchingWeight') + err);
    return null;
  }
};

const fetchProgram = async (programId: number) => {
  try {
    const { data, error } = await supabase.from('programs').select().eq('id', programId).single();

    if (error) {
      showError(t('dashboard.tabs.user.trainee.errorFetchingProgram') + error.message);
      return null;
    }

    return data || null;
  } catch (err) {
    showError(t('dashboard.tabs.user.trainee.unexpectedErrorFetchingProgram') + err);
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
    const { data, error } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', program.value.trainer_id)
      .single();

    if (error) {
      showError(t('dashboard.tabs.user.trainee.errorFetchingTrainerName') + error.message);
    } else {
      trainer_name.value = `${data.first_name} ${data.last_name}`;
    }
  }
});
</script>

<style scoped>
/* Your styles */
</style>
