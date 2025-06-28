<template>
  <div :dir="locale === 'ar' ? 'rtl' : 'ltr'" class="flex-1">
    <div class="flex justify-between items-center gap-4 mb-3">
      <!-- Search bar -->
      <div class="relative w-128">
        <input
          type="search"
          @input="handleSearch"
          class="block w-full p-4 text-sm text-topsets-sectext dark:text-topsets-darksectext border rounded-lg bg-topsets-pribg dark:bg-topsets-darkpribg"
          :placeholder="t('dashboard.groups.list.typeToSearchGroups')"
          required
        />
      </div>
      <button
        class="min-w-max btn-md-outline flex group"
        @click="showModal = true"
      >
        <div>{{ t('dashboard.groups.list.createGroup') }}</div>
      </button>
    </div>

    <ul
      v-if="props.groups?.length > 0"
      class="grid md:grid-cols-2 grid-rows-3 gap-6 items-center"
    >
      <router-link
        v-for="group in props.groups"
        :key="group.id"
        :to="{ name: 'group-details', params: { id: group.id } }"
        class="h-full text-topsets-sectext dark:text-topsets-darksectext"
      >
        <div
          class="card px-10 p-6 w-full hover:border-topsets border border-transparent flex flex-col h-full"
        >
          <!-- Top: Group Avatar & Name -->
          <div class="flex items-center border-b-2 py-4 border-topsets-pribg dark:border-topsets-darkpribg justify-between gap-4 mb-4">
            <div class="flex items-center gap-3">
              <img
                :src="group.group_avatar || '/group-placeholder.jpg'"
                alt="Group Avatar"
                class="w-14 h-14 2xl:w-24 2xl:h-24 rounded-full border-2 border-topsets object-cover"
              />
              <div>
                <p class="header-small">
                  {{ group.group_name }}
                </p>
                <p class="label text-topsets-sectext dark:text-topsets-darksectext">
                  {{ group.group_description || t('dashboard.groups.list.noDescription') }}
                </p>
                <p class="mt-6 dark:text-topsets-darksectext">
                  {{ group.users?.length || 0 }} users.
                </p>
              </div>
            </div>
            <!-- Status Badge -->
            <div class="mt-3">
              <span
                class="px-3 py-1 rounded-full font-semibold uppercase"
                :class="getStatusClasses(group.status)"
              >
                {{ group.status }}
              </span>
            </div>
          </div>

          <!-- Bottom: Administrators -->
          <div class="mt-auto">
            <p class="label text-topsets-pritext dark:text-topsets-darkpritext mb-2 py-2">
              {{ t('dashboard.groups.list.admins') }}
            </p>
            <div class="flex flex-wrap gap-1">
              <template v-if="group.admins && group.admins.length">
                <router-link
                  v-for="adminId in group.admins"
                  :key="adminId"
                  :to="{ name: 'single-user', params: { id: adminId } }"
                  class="label text-topsets-secondary card bg-topsets-pribg dark:bg-topsets-darkpribg hover:text-topsets-pritext dark:hover:text-topsets-darkpritext transition-colors"
                  @click.stop
                >
                  <div>
                    <h3 class="header-small">
                      {{
                        admins[adminId]
                          ? `${admins[adminId].first_name} ${admins[adminId].last_name}`.trim()
                          : 'Loading...'
                      }}
                    </h3>
                    <p class="label text-xm text-body">
                      {{
                        admins[adminId]
                          ? `${admins[adminId].email}`
                          : ''
                      }}
                    </p>
                  </div>
                </router-link>
              </template>
              <span v-else class="label text-topsets-sectext dark:text-topsets-darksectext">
                {{ t('dashboard.groups.list.noAdmins') }}
              </span>
            </div>
          </div>
        </div>
      </router-link>
    </ul>

    <div v-else class="space-y-6 flex flex-col items-center py-12">
      <p class="text-topsets-pritext dark:text-topsets-darkpritext">
        {{ t('dashboard.groups.list.noGroupsFound') }}
      </p>
    </div>

    <!-- Pagination Controls -->
    <div v-if="props.groups?.length" class="flex justify-between items-center gap-4 my-6">
      <p class="header-small min-w-max">
        {{ t('dashboard.groups.list.pageLabel') }} {{ props.page }}
      </p>
      <hr class="border w-full border-topsets-sectext dark:border-topsets-darksectext" />
      <div class="flex text-topsets-sectext dark:text-topsets-darksectext gap-4 px-4">
        <button
          v-for="p in totalPages"
          :key="p"
          @click="updatePage(p)"
          class="hover:text-topsets-pritext dark:hover:text-topsets-darkpritext"
          :class="{ 'text-topsets-pritext dark:text-topsets-darkpritext': p === props.page }"
        >
          {{ p }}
        </button>
      </div>
      <hr class="border w-full border-topsets-sectext dark:border-topsets-darksectext" />
      <button
        v-if="props.page > 1"
        @click="updatePage(props.page - 1)"
        class="px-4 py-2 hover:text-topsets-pritext dark:hover:text-topsets-darkpritext"
      >
        {{ t('dashboard.groups.list.previousPage') }}
      </button>
      <button
        v-if="props.page < totalPages"
        @click="updatePage(props.page + 1)"
        class="px-4 py-2 hover:text-topsets-pritext dark:hover:text-topsets-darkpritext"
      >
        {{ t('dashboard.groups.list.nextPage') }}
      </button>
    </div>

    <!-- Create Group Modal -->
    <AddGroupModal
      :visible="showModal"
      @close="showModal = false"
      @created="handleCreated"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGroupStore } from '@/stores/groupstores';
import AddGroupModal from './AddGroupModal.vue';
import { useUserStore } from '@/stores/user';
const { t, locale } = useI18n();
const groupStore = useGroupStore();
const userStore =useUserStore()
const props = defineProps<{
  groups: Array<{
    id: number;
    group_name: string;
    group_avatar?: string | null;
    group_description?: string | null;
    status: string;
    admins?: number[];
    users?: number[];
  }>;
  page: number;
  count: number;
  filter: string;
}>();

const emits = defineEmits<{
  (e: 'updatePage', page: number, filter: string): void;
  (e: 'updatePageSearch', page: number, query: string, filter: string): void;
}>();

// Modal visibility
const showModal = ref(false);

// Local refs for search/pagination
const holdQuery = ref('');
const filterEdit = ref(props.filter);

// Derived values
const totalPages = computed(() => Math.ceil(props.count / 9));
const admins = groupStore.admins;

// Sync filter prop
watch(() => props.filter, v => (filterEdit.value = v));

function handleSearch(e: Event) {
  const q = (e.target as HTMLInputElement).value;
  holdQuery.value = q;
  if (q) emits('updatePageSearch', props.page, q, filterEdit.value);
  else emits('updatePage', 1, filterEdit.value);
}

function updatePage(p: number) {
  if (p < 1 || p > totalPages.value) return;
  if (holdQuery.value) emits('updatePageSearch', p, holdQuery.value, filterEdit.value);
  else emits('updatePage', p, filterEdit.value);
}

function getStatusClasses(status: string) {
  switch (status.toLowerCase()) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'scheduled': return 'bg-blue-100 text-blue-800';
    case 'canceled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// After creation: reload and close modal
async function handleCreated(newGroup: any) {
  showModal.value = false;
  // Optionally, emit a refresh or directly push to list
  if (!userStore.userProfile) return;

  try {
    await groupStore.getAllGroups(userStore.userProfile);
  } catch (error) {
    console.error('Error fetching groups:', error);
  }
}
</script>
