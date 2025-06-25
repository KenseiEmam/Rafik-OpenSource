<template>
  <div >
    <!-- Search Section -->
    <div class="flex items-center justify-between mb-4 gap-6">
      <div class="text-sm flex gap-3 min-w-max items-center">
        <p class="min-w-max">
          {{ t('dashboard.tabs.clients.weightLog.showingRows') }}
        </p>

        <select v-model="pageSize" @change="loadUsers" name="" class=" topsets-text-input min-w-24 p-2" id="">
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="30">30</option>
        </select>
      </div>
      <span class="ms-auto ">
        {{ "Total: " +  weightStore.Count  }}
      </span>
    </div>

    <!-- weight Table -->
    <table v-if="weightStore.AllWeights && weightStore.AllWeights.length > 0 && !loading" class="w-full text-center">
      <thead class="font-bold">
        <tr>
          <th>{{ t('dashboard.tabs.clients.weightLog.dateLogged') }}</th>
          <th>{{ t('dashboard.tabs.clients.weightLog.weight') }}</th>
          <th>
            {{ t('dashboard.tabs.clients.weightLog.goal') }}
          </th>
          <th>{{ t('dashboard.tabs.clients.weightLog.photo') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="weight in weightStore.AllWeights"
          :key="weight.id"
          class="border-b border-topsets-sectext dark:border-topsets-darksectext h-12"
        >
          <td>
            {{
              weight.created_at
                ? new Date(weight.created_at).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric'
                  })
                : '-'
            }}
          </td>
          <td>
            {{
              weight.weight
                ? weight.weight
                : '-'
            }}
          </td>
          <td>
            {{
              weight.goal_weight
                ? weight.goal_weight
                : '-'
            }}
          </td>
          <td>
            <a v-if="weight.image" :href="weight.image" target="_blank">
            <svg   xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" stroke="currentColor" fill="currentColor" class="text-body w-8 text-center mx-auto">
              <path d="M288 80c-65.2 0-118.8 29.6-159.9 67.7C89.6 183.5 63 226 49.4 256c13.6 30 40.2 72.5 78.6 108.3C169.2 402.4 222.8 432 288 432s118.8-29.6 159.9-67.7C486.4 328.5 513 286 526.6 256c-13.6-30-40.2-72.5-78.6-108.3C406.8 109.6 353.2 80 288 80zM95.4 112.6C142.5 68.8 207.2 32 288 32s145.5 36.8 192.6 80.6c46.8 43.5 78.1 95.4 93 131.1c3.3 7.9 3.3 16.7 0 24.6c-14.9 35.7-46.2 87.7-93 131.1C433.5 443.2 368.8 480 288 480s-145.5-36.8-192.6-80.6C48.6 356 17.3 304 2.5 268.3c-3.3-7.9-3.3-16.7 0-24.6C17.3 208 48.6 156 95.4 112.6zM288 336c44.2 0 80-35.8 80-80s-35.8-80-80-80c-.7 0-1.3 0-2 0c1.3 5.1 2 10.5 2 16c0 35.3-28.7 64-64 64c-5.5 0-10.9-.7-16-2c0 .7 0 1.3 0 2c0 44.2 35.8 80 80 80zm0-208a128 128 0 1 1 0 256 128 128 0 1 1 0-256z"/>
            </svg>
          </a>

            <span v-else>-</span>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Loading State -->
    <div
        v-else-if="loading"
        class="h-full flex flex-col gap-2 items-center justify-center text-center w-full text-body"
      >
        <img
          src="@/assets/ts-trans-dark.png"
          class="w-24 h-24 animate-bounce hidden dark:inline-block"
          alt=""
        />
        <img
          src="@/assets/ts-trans-light.png"
          class="w-24 h-24 animate-bounce dark:hidden"
          alt=""
        />
        <p class="text-lg animate-pulse">
          {{ t('dashboard.auditPrograms.list.loading') }}
        </p>
      </div>
      <!-- No Results -->
      <div v-else class="space-y-6 flex flex-col items-center py-12">
        <p class="text-topsets-pritext dark:text-topsets-darkpritext">
          User has not logged weight.
        </p>
      </div>
    <!-- Pagination -->
    <div
        v-if="!loading && weightStore.Count"
        class="flex justify-between items-center gap-4 my-6"
      >
        <!-- Page Number Tabs -->
        <p class="header-small text-xs min-w-max">
          {{ t('dashboard.auditPrograms.list.pagination.page', { page: page }) }}
        </p>
        <hr class="border w-full border-topsets-sectext dark:border-topsets-darksectext" />
        <div class="flex text-topsets-sectext dark:text-topsets-darksectext gap-4 px-4">
          <button
            v-for="p in Math.ceil(weightStore.Count / pageSize)"
            :key="p"
            @click="updatePage(p)"
            class="hover:text-topsets-pritext dark:hover:text-topsets-darkpritext"
            :class="p === page ? 'text-topsets-pritext dark:text-topsets-darkpritext' : ''"
          >
            {{ p }}
          </button>
        </div>
        <hr class="border w-full border-topsets-sectext dark:border-topsets-darksectext" />
        <!-- Previous/Next Buttons -->
        <button
          v-if="page > 1"
          @click="updatePage(page - 1)"
          class="px-4 py-2 text-topsets-sectext dark:text-topsets-darksectext min-w-max hover:text-topsets-pritext dark:hover:text-topsets-darkpritext"
        >
          {{ t('dashboard.auditPrograms.list.pagination.previousPage') }}
        </button>
        <button
          v-if="page < Math.ceil(weightStore.Count / pageSize)"
          @click="updatePage(page + 1)"
          class="px-4 py-2 text-topsets-sectext dark:text-topsets-darksectext min-w-max hover:text-topsets-pritext dark:hover:text-topsets-darkpritext"
        >
          {{ t('dashboard.auditPrograms.list.pagination.nextPage') }}
        </button>
      </div>
  </div>
</template>

<script setup lang="ts">
import { useWeightStore } from '@/stores/weightstores';
import { onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
const { t , locale } = useI18n();

const weightStore = useWeightStore();
const props = defineProps(['profile']);
const searchQuery = ref('');
const page = ref(1);
const pageSize = ref(10)
const loading = ref(false)

const show_action = ref();
const feels = ref(['Terrible', 'Poor', 'Average', 'Good', 'Excellent']);
onMounted(() => {
  loadUsers();
});

function updatePage(newPage: number) {
  loading.value = true;
  if (newPage >= 1 && newPage <= Math.ceil(weightStore.Count / pageSize.value)) {
    page.value = newPage;
    loadUsers();
  }
}

// Function to load program
async function loadUsers() {
  try {
    const res = await weightStore.getAllWeights(props.profile.id,page.value, pageSize.value);
    loading.value = false;
  } catch (error) {
    console.error('Error fetching program:', error);
  }
}
const computeMacros = (macros: number[]) => {
  if (macros.length == 0) {
    return 0;
  } else {
    return Math.ceil(macros[0] * 4 + macros[1] * 4 + macros[2] * 4);
  }
};
function handleLeave() {
  setTimeout(() => {
    show_action.value = null;
  }, 500);
}
const computedMeals = (weight: any) => {
  let value = 0;
  if (weight.breakfast && weight.breakfast.length > 0) value++;
  if (weight.lunch && weight.lunch.length > 0) value++;
  if (weight.dinner && weight.dinner.length > 0) value++;
  if (weight.supper && weight.supper.lenght > 0) value++;
  return value;
};

</script>

<style scoped>
/* Optional: Style for the search and filter section */
.input,
.search-bar {
  width: 100%;
}
</style>
