<template>
  <div v-if="user"
    class="grid grid-cols-3 grid w-full my-3 rows-3 items-center relative flex-1 gap-4 items-stretch"
  >
  <div class="card  row-span-2 p-6">
    <h3 class="2xl:contentH-small ">My Subscription</h3>
        <!-- Subscription Plan Details Card -->
    <div class="items-center justify-center align-center content-center h-full grid ">
      <div >
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="header-small text-topsets">{{ t('dashboard.settings.currentSubscriptionPlan') }}</h3>
            <p class="text-body mt-2 opacity-80">
              {{ t('dashboard.settings.subscriptionPlanDescription') }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span class="px-4 py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
              Active
            </span>
          </div>
        </div>

        <!-- Plan Details Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <!-- Plan Name -->
          <div class="flex flex-col ">
            <span class="text-sm font-medium text-topsets-sectext dark:text-topsets-darksectext uppercase mb-2">
              {{ t('dashboard.settings.planName') }}
            </span>
            <span class="text-lg font-semibold text-topsets-pritext dark:text-topsets-darkpritext">
              Enterprise Pro
            </span>
          </div>

          <!-- Number of Trainers -->
          <div class="flex flex-col">
            <span class="text-sm font-medium text-topsets-sectext dark:text-topsets-darksectext uppercase mb-2">
              {{ t('dashboard.settings.activeTrainers') }}
            </span>
            <span class="text-lg font-semibold text-topsets-pritext dark:text-topsets-darkpritext">
              24 / 50
            </span>
          </div>

          <!-- Number of Trainees -->
          <div class="flex flex-col">
            <span class="text-sm font-medium text-topsets-sectext dark:text-topsets-darksectext uppercase mb-2">
              {{ t('dashboard.settings.activeTrainees') }}
            </span>
            <span class="text-lg font-semibold text-topsets-pritext dark:text-topsets-darkpritext">
              1,247 / 2,000
            </span>
          </div>

          <!-- Yearly Cost -->
          <div class="flex flex-col">
            <span class="text-sm font-medium text-topsets-sectext dark:text-topsets-darksectext uppercase mb-2">
              {{ t('dashboard.settings.yearlyCost') }}
            </span>
            <span class="text-lg font-semibold text-topsets-pritext dark:text-topsets-darkpritext">
              $1,299.00
            </span>
          </div>
        </div>

        <!-- Plan Features -->
        <div class="mb-8">
          <h4 class="text-sm font-medium text-topsets-sectext dark:text-topsets-darksectext uppercase mb-4">
            {{ t('dashboard.settings.planFeatures') }}
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span class="text-body">Unlimited Programs</span>
            </div>
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span class="text-body">Advanced Analytics</span>
            </div>
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span class="text-body">Priority Support</span>
            </div>
            <!-- <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span class="text-body">Custom Branding</span>
            </div> -->
            <!-- <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span class="text-body">API Access</span>
            </div> -->
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span class="text-body">Dedicated Success Manager</span>
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <div class="flex justify-end">
          <router-link :to="{name:'settings'}"
            class="btn-lg"
          >
            Show in Settings
        </router-link>
        </div>
      </div>
   </div>
  </div>
    <div class="card row-span-2 p-6">
    <h3 class="2xl:contentH-small ">Monthly Rundown</h3>
        <div class="grid grid-cols-2 h-full gap-3 content-center">
          <div class="flex flex-col h-full">

             <img src="https://www.iconpacks.net/icons/1/free-pie-chart-icon-683-thumb.png" class="w-full">
          </div>

      <div class="flex flex-col gap-3 h-full justify-center pb-3">
        <div class="flex justify-between w-full gap-3">
          <h4 class="header-small text-lg">
            Finances this month:
          </h4>
         <p class="text-body">
           $30,500
        </p>
        </div>
        <div class="flex justify-between w-full gap-3">
          <h4 class="header-small text-lg">
            Trainer Retention:
          </h4>
         <p class="text-body">
           50%
        </p>
        </div>
        <div class="flex justify-between w-full gap-3">
          <h4 class="header-small text-lg">
            Athlete Performance:
          </h4>
         <p class="text-body">
           +20%
        </p>
        </div>
        <div class="flex justify-between w-full gap-3">
          <h4 class="header-small text-lg">
            Assessments Processed:
          </h4>
         <p class="text-body">
           52
        </p>
        </div>
      </div>
    </div>
  </div>

  <div class="card row-span-3 p-6">
    <div class="flex justify-between items-center">

      <h3 class="2xl:contentH-small ">Today's Assessments <span v-if="!loadAssessments">({{ assessments.length }})</span></h3>
      <router-link class="btn-sm-outline" :to="{name:'assessments'}">View My Asessments</router-link>
    </div>
    <div class="h-full w-full flex overflow-x-auto gap 3 ">
      <p class="m-auto" v-if="loadAssessments && assessments.length <= 0">Loading Assessment Data...</p>
      <p class="m-auto" v-else-if="!loadAssessments && assessments.length <= 0">No assessments for today.</p>
      <div class="flex flex-1 overflow-x-auto gap-3 items-center  " v-else>
           <router-link
        :to="{
          name: 'assessment-details',
          params: { id: assessment.id }
        }"
        v-for="(assessment, index) in assessments"
        :key="assessment.id"
        class=" text-topsets-sectext dark:text-topsets-darksectext"
      >
        <div
          class="gradient-bg card p-6 w-full hover:border-topsets border border-transparent flex flex-col"
        >
          <!-- Top Section: Trainee Details -->
          <div v-if="assessment.trainees" class="flex flex-col items-center border-b-2 py-4 border-topsets-pribg dark:border-topsets-darkpribg justify-between gap-4 mb-4">
            <div class="flex items-center gap-3 ">
              <img
                :src="
                  assessmentStore.trainees[assessment.trainees?.[0]]?.avatar ||
                  '/user-placeholder.jpg'
                "
                alt="Trainee Avatar"
                class="w-14 h-14 2xl:w-24 2xl:h-24 rounded-full border-2 border-topsets object-cover"
              />
              <div>
                <p class="header-small">
                  {{
                    assessmentStore.trainees[assessment.trainees?.[0]]
                      ? `${assessmentStore.trainees[assessment.trainees?.[0]].first_name || ''} ${assessmentStore.trainees[assessment.trainees?.[0]].last_name || ''}`.trim() ||
                        'Unknown Trainee'
                      : 'Loading...'
                  }}
                </p>
               <!-- Middle Section: Assessment Template Name and Date -->
          <div class="flex-1 mb-4">
            <h2 class="title-small text-base 2xl:text-xl mb-2">
              {{
                assessment.template && assessmentStore.templateData[assessment.template]
                  ? assessmentStore.templateData[assessment.template].template_name ||
                    assessmentStore.templateData[assessment.template].name ||
                    'Untitled Assessment'
                  : 'Loading...'
              }}
            </h2>
            <p class="label text-topsets-pritext dark:text-topsets-darkpritext">
              {{ formatDate(assessment.created_at) }}
            </p>
              </div>
            </div>

          </div>
            <!-- Status Badge -->
            <div class="mt-3">
              <span
                class="px-3 py-1 rounded-full font-semibold uppercase"
                :class="getStatusClasses(assessment.status)"
              >
                {{ assessment.status }}
              </span>
            </div>
          </div>
        </div>
      </router-link>
      </div>
    </div>
  </div>

 <div class="card p-6">
    <h3 class="2xl:contentH-small ">Top Trainers</h3>
    <div class="flex flex-col  h-full justify-center">
      <div class=" gradient-bg p-6 card">
          <div  class="flex items-center border-topsets-pribg dark:border-topsets-darkpribg justify-between gap-4 mb-4">
            <div class="flex items-center gap-3 ">
              <img
                :src="
                  '/user-placeholder.jpg'
                "
                alt="Trainee Avatar"
                class="w-14 h-14 2xl:w-24 2xl:h-24 rounded-full border-2 border-topsets object-cover"
              />
              <div>
                <h3 class="header-small">
                  John topsets
                </h3>
               <!-- Middle Section: Assessment Template Name and Date -->
          <div class="flex-1 mb-4">
            <h2 class="title-small text-sm mb-2">
             #1 Top Trainer
            </h2>
            <p class="label text-topsets-pritext dark:text-topsets-darkpritext">
              {{ formatDate(new Date().toString()) }}
            </p>
              </div>
            </div>

          </div>
            <!-- Status Badge -->
            <div class="mt-3">
              <span
                class="px-3 py-1 bg-green-200 text-green-700 rounded-full font-semibold uppercase"

              >
                Active
              </span>
            </div>
          </div>
      </div>
    </div>
  </div>
    <div class="card  p-6">
    <h3 class="2xl:contentH-small ">Top Athletes</h3>
        <div class="flex flex-col  h-full justify-center">
      <div class="flex flex-col  h-full justify-center">
      <div class=" gradient-bg p-6 card">
          <div  class="flex items-center border-topsets-pribg dark:border-topsets-darkpribg justify-between gap-4 mb-4">
            <div class="flex items-center gap-3 ">
              <img
                :src="
                  '/user-placeholder.jpg'
                "
                alt="Trainee Avatar"
                class="w-14 h-14 2xl:w-24 2xl:h-24 rounded-full border-2 border-topsets object-cover"
              />
              <div>
                <h3 class="header-small">
                  Jill topsets
                </h3>
               <!-- Middle Section: Assessment Template Name and Date -->
          <div class="flex-1 mb-4">
            <h2 class="title-small text-sm mb-2">
             #1 Top Athlete
            </h2>
            <p class="label text-topsets-pritext dark:text-topsets-darkpritext">
              {{ formatDate(new Date().toString()) }}
            </p>
              </div>
            </div>

          </div>
            <!-- Status Badge -->
            <div class="mt-3">
              <span
                class="px-3 py-1 bg-green-200 text-green-700 rounded-full font-semibold uppercase"

              >
                Active
              </span>
            </div>
          </div>
      </div>
    </div>
    </div>
  </div>

  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { supabase } from '@/lib/supabaseClient'; // Ensure Supabase is correctly set up
import { useI18n } from 'vue-i18n';
import { useAssessmentStore, type Assessment } from '@/stores/assessmentstores';

const { t, locale } = useI18n();

const assessments = ref<Assessment[]>([])
const loadAssessments = ref(false)
const assessmentStore = useAssessmentStore()
const props = defineProps({
  user: Object
});
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}


function getStatusClasses(status: string): string {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'complete':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    case 'canceled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

onMounted(async () => {
  loadAssessments.value = true;

  try {
    const result = await assessmentStore.getTodaysAssessments(props.user);
    assessments.value = result || []; // fallback to empty array
  } catch (error) {
    console.error("Failed to load today's assessments:", error);
    assessments.value = [];
  } finally {
    loadAssessments.value = false;
  }
});

</script>
