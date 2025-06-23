<template>
  <div v-if="user"
    class="grid grid-cols-3 grid w-full my-3 rows-3 items-center relative flex-1 gap-4 items-stretch"
  >
  <div class="card row-span-2 p-6">
    <h3 class="2xl:contentH-small ">Performance Target</h3>
  </div>
  <div class="card  p-6">
    <h3 class="2xl:contentH-small ">Best Trainee</h3>
  </div>
  <div class="card row-span-3 p-6">
    <h3 class="2xl:contentH-small ">Trainees Forms</h3>
  </div>
  <div class="card p-6">
    <h3 class="2xl:contentH-small ">Trainees at Risk</h3>
  </div>
  <div class="card col-span-2 p-6">
    <h3 class="2xl:contentH-small ">Today's Assessments</h3>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { supabase } from '@/lib/supabaseClient'; // Ensure Supabase is correctly set up
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const props = defineProps({
  user: Object
});

</script>
