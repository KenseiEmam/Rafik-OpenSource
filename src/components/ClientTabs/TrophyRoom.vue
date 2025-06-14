<template>
  <div :dir="locale === 'ar' ? 'rtl' : 'ltr'" class="flex-1 2xl:space-y-6 pb-6 h-full">
    <p class="text-body w-1/2">
      {{ t('dashboard.tabs.clients.trophyRoom.intro') }}
    </p>
    <div v-if="client.best_perf" class="grid grid-cols-3 gap-6">
      <div v-for="perf in client.best_perf" :key="perf.exercise" class="card p-4 flex items-center gap-3">
        <h2 class="header-small">
          {{ exerciseNames[perf.exercise] || perf.exercise }}
        </h2>
        <p :class="locale === 'ar' ? 'me-auto max-w-24' : 'ms-auto max-w-24'">
          {{ t('dashboard.tabs.clients.trophyRoom.estimate') }}
        </p>
        <p class="text-rafik font-bold">{{ perf.orm }} {{ perf.intensity_mod || "Kgs" }}</p>
      </div>
    </div>
    <p v-else class="text-rafik-pritext dark:text-rafik-darkpritext text-lg font-semibold my-16 mx-auto text-center">
      {{ t('dashboard.tabs.clients.trophyRoom.empty') }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../lib/supabaseClient';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

// Props to receive the client object
type Perf = { exercise: string; orm: number; intensity_mod?:string; };
const props = defineProps<{ client: { best_perf?: Perf[] } }>();
const { client } = props;

// Reactive map of exercise IDs to names
const exerciseNames = ref<Record<string, string>>({});

onMounted(async () => {
  if (client.best_perf && client.best_perf.length) {
    const ids = client.best_perf.map(p => p.exercise);
    const { data, error } = await supabase
      .from('exercises')
      .select('id, exercise_name')
      .in('id', ids);
    if (!error && data) {
      data.forEach(ex => { exerciseNames.value[ex.id] = ex.exercise_name; });
    }
  }
});
</script>

<style scoped>
/* Your styles */
</style>
