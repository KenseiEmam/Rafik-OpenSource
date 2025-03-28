<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import isEqual from 'lodash/isEqual';
import debounce from 'lodash/debounce';
import { supabase } from '@/lib/supabaseClient';
import ReviewStars from '../ReviewStars.vue';
import Swal from 'sweetalert2';
import router from '@/router';
import ClientDetails from '@/views/DashboardVues/Clients/ClientDetails.vue';
import { useI18n } from 'vue-i18n';

const { t , locale } = useI18n();

// Function to show error alerts
function showError(message: string) {
  Swal.fire({
    title: t('dashboard.tabs.program.reviews.errorTitle'),
    timer: 1500,
    text: message,
    toast: true,
    position: 'top-right',
    icon: 'error',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}

// Props to receive the program object
const props = defineProps({
  program: {
    type: Object,
    required: true
  },
  admin: Boolean
});

type Review = {
  user: number;
  trainer: number;
  program: number;
  user_name: string;
  content: string;
  rating: number;
};

const reviews = ref<Review[]>([]);

async function loadReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('program', props.program.id);

  if (error) {
    showError(error.message);
    return;
  }

  reviews.value = data ?? [];
}

async function RouteOff(id: number) {
  const { data: userid, error } = await supabase
    .from('users')
    .select('id')
    .eq('profile_id', id)
    .single();

  if (error || !userid) {
    showError(t('dashboard.tabs.program.reviews.noUserError'));
    return;
  }

  let routename = 'client-details';
  if (props.admin) routename = 'single-user';

  router.push({ name: routename, params: { id: userid.id } });
}

onMounted(loadReviews);
</script>

<template>
  <div class="flex flex-col flex-1 gap-4">
    <div class="flex justify-between w-full">
      <h2 class="header-medium">
        {{ t('dashboard.tabs.program.reviews.overallRating') }} :
        {{ program.overall_rating
          ? (Math.round(program.overall_rating * 100) / 100).toFixed(1)
          : (Math.round(0 * 100) / 100).toFixed(1)
        }}
        <span class="text-rafik">⭐</span>
      </h2>
      <p class="header-small">
        {{ t('dashboard.tabs.program.reviews.basedOnTotal', { count: reviews.length }) }}
      </p>
    </div>
    <div class="grid 2xl:grid-cols-2 items-start relative flex-1 gap-4">
      <div
        @click="RouteOff(review.user)"
        class="card hover:scale-105 hover:bg-yellow-100 dark:hover:bg-green-800 cursor-pointer hover:opacity-80 transform p-6 space-y-3 2xl:space-y-4"
        v-for="review in reviews"
        :key="review.user"
      >
        <h3 class="header-small">{{ review.user_name }}</h3>
        <ReviewStars :rating="review.rating" :max-stars="5" />
        <p class="text-body">{{ review.content }}</p>
      </div>
      <p v-if="reviews.length === 0" class="my-16 w-full text-center text-sm text-body">
        {{ t('dashboard.tabs.program.reviews.noReviews') }}
      </p>
    </div>
  </div>
</template>
