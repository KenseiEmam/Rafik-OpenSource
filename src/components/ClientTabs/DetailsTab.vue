<template>
  <div class="flex-1 space-y-6 pb-6">
    <div class="grid grid-cols-3 gap-6">
      <div class="flex flex-col gap-3 2xl:gap-6">
        <h3 class="contentH-small text-sm 2xl:text-base mb-6 2xl:mb-8">Client Profile</h3>
        <div class="flex justify-between uppercase text-xs ">
          <p class="text-rafik-pritext">Age</p>
          <p class="text-rafik-secondary">{{ props.client.age || 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-xs ">
          <p class="text-rafik-pritext">Gender</p>
          <p class="text-rafik-secondary">{{ props.client.gender || 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-xs ">
          <p class="text-rafik-pritext">Nationality</p>
          <p class="text-rafik-secondary">{{ props.client.nationality || 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-xs ">
          <p class="text-rafik-pritext">Phone</p>
          <p class="text-rafik-secondary">{{ props.client.phone || 'N/A' }}</p>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <h3 class="contentH-small text-sm 2xl:text-base mb-6">Client Metrics</h3>
        <div class="flex justify-between uppercase text-xs ">
          <p class="text-rafik-pritext">Height</p>
          <p class="text-rafik-secondary">{{ props.client.profile.height || 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-xs ">
          <p class="text-rafik-pritext">Weight</p>
          <!-- Use the computed value for weight -->
          <p class="text-rafik-secondary">{{ weight || 'N/A' }} kg</p>
        </div>
        <div class="flex justify-between uppercase text-xs ">
          <p class="text-rafik-pritext">Goal Weight</p>
          <p class="text-rafik-secondary">{{ props.client.profile.weight_goal + 'kg' || 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-xs ">
          <p class="text-rafik-pritext">Body Fat Percent</p>
          <p class="text-rafik-secondary">{{ props.client.profile.body_fat + '%' || 'N/A' }}</p>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <h3 class="contentH-small text-sm 2xl:text-base mb-6">Client Fitness</h3>
        <div class="flex justify-between uppercase text-xs ">
          <p class="text-rafik-pritext">Experience</p>
          <p class="text-rafik-secondary">{{ props.client.profile.experience || 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-xs ">
          <p class="text-rafik-pritext">Fitness Goal</p>
          <p class="text-rafik-secondary" v-for="goal,index in props.client.profile.fitness_goal" :key="goal">{{ goals[goal]}} <span v-if="index+1 !== props.client.profile.fitness_goal.length">,</span></p>
          <p class="text-rafik-secondary" v-if="!props.client.profile.fitness_goal">N/A</p>
        </div>
        <div class="flex justify-between uppercase text-xs ">
          <p class="text-rafik-pritext">Sports Played</p>
          <p class="text-rafik-secondary" v-for="sport,index in props.client.profile.sports_played" :key="sport">{{ sport}} <span v-if="index+1 !== props.client.profile.sports_played.length">,</span></p>
          <p class="text-rafik-secondary" v-if="!props.client.profile.sports_played">N/A</p>
        </div>
        <div class="flex justify-between uppercase text-xs ">
          <p class="text-rafik-pritext">Diet Preference</p>
          <p class="text-rafik-secondary" v-for="diet,index in props.client.profile.diet_preference" :key="diet">{{ diet}}<span v-if="index+1 !== props.client.profile.diet_preference.length">, </span></p>
          <p class="text-rafik-secondary" v-if="!props.client.profile.diet_preference">N/A</p>
        </div>
      </div>
    </div>
    <div class="card p-8 grid gap-6 grid-cols-3 items-center " v-if="program">
      <div class="col-span-2 space-y-4">
        <h3 class="text-sm contentH-small 2xl:text-base">Client Program</h3>
        <h2 class="header-medium font-black">{{program.program_name||"Loading..."}}</h2>
        <p class=text-body>{{program.program_description||"Loading..."}}</p>
      </div>
      <div class="flex flex-col gap-3">
        <div class="flex justify-between uppercase text-xs ">
          <p class="text-rafik-pritext">Joined On</p>
          <p class="text-rafik-secondary">{{ new Date(props.client.program_details.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) || 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-xs ">
          <p class="text-rafik-pritext">Expires On</p>
          <p class="text-rafik-secondary">{{ new Date(props.client.program_details.expires_at).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) || 'N/A' }}</p>
        </div>
        <div class="flex justify-between uppercase text-xs ">
          <p class="text-rafik-pritext">Price Package</p>
          <p class="text-rafik-secondary" >{{ props.client.program_details.price_pavckage + ' AED' || 'N/A' }}</p>
        </div>
        <div class="flex justify-center uppercase ">
          <router-link :to="{name:'program-details', params:{id:program.id}}" class="font-semibold">Visit Program</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { supabase } from "../../lib/supabaseClient";
import Swal from "sweetalert2";
 // Success and Error Alerts
  function showSuccess(message: string) {
    Swal.fire({
      title: "Success!",
      showConfirmButton:false,
      timerProgressBar:true,
      timer:1500,
      text: message,
      toast: true,
      position: "top-right",
      icon: "success",
      background: "#081411",
      color: "#E8F3ED",
    });
  }

  function showError(message: string) {
    Swal.fire({
      title: "Error!",
      text: message,
      icon: "error",
      confirmButtonColor: "#d33",
      background: "#081411",
      color: "#E8F3ED",
    });
  }
// Props to receive the program object
const props = defineProps({
  client: {
    type: Object,
    required: true,
  },
});

// Reactive reference to store the weight
const weight = ref<string | null>(null);
const program= ref<any>(null);
const goals = ["Lose Weight","Tone",  "Add Muscle", "Increase Strength", "Increase Fitness", "Improve Speed", "Improve Agility", "Sport Specific"]
// Computed property to fetch weight from Supabase
const fetchWeight = async (weightId: number) => {
  try {
    const { data, error } = await supabase
      .from('weights')
      .select('weight')
      .eq('id', weightId)
      .single();

    if (error) {
      showError('Error fetching weight:'+error.message);
      return null;
    }

    return data?.weight || null;
  } catch (err) {
    showError('Unexpected error fetching weight:'+ err);
    return null;
  }
};

const fetchProgram = async (programId: number) => {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select()
      .eq('id', programId)
      .single();

    if (error) {
      showError('Error fetching program:'+ error.message);
      return null;
    }

    return data || null;
  } catch (err) {
    showError('Unexpected error fetching program:'+ err);
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
  if (programId){
    const parentProgram  = await fetchProgram (programId);
    program.value = parentProgram;
  }
});
</script>

<style scoped>
/* Your styles */
</style>
