<template>
  <div class="flex h-screen overflow-auto">
    <div class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 2xl:space-y-6 space-y-3">
      <!-- Page Title -->
      <PageTitle
        :subheader="t('dashboard.assessmentTemplates.list.pageTitle.subheader')"
        :header="t('dashboard.assessmentTemplates.list.pageTitle.header')"
      />

      <!-- Search and Filter Controls -->
      <div class="flex justify-between items-end gap-4 mb-3 relative">
        <!-- Search Bar -->
        <div class="relative w-128">
          <input
            type="search"
            @input="handleSearch"
            class="block w-full p-4 text-sm text-rafik-sectext dark:text-rafik-darksectext border rounded-lg bg-rafik-pribg dark:bg-rafik-darkpribg"
            :placeholder="t('dashboard.assessmentTemplates.list.searchPlaceholder')"
            required
          />
        </div>
        <!-- Create New Button -->
        <button @click="showTemplateModal = true" class="btn-md-outline">
          {{ t('dashboard.assessmentTemplates.list.createNew') }}
        </button>
      </div>

      <!-- Data Table -->
      <div v-if="!loading">
        <table class="w-full text-center">
          <thead>
            <tr >
              <th class="uppercase p-4">{{ t('dashboard.assessmentTemplates.list.table.name') }}</th>
              <th class="uppercase p-4">{{ t('dashboard.assessmentTemplates.list.table.createdBy') }}</th>
              <th class="uppercase p-4">{{ t('dashboard.assessmentTemplates.list.table.noDrills') }}</th>
              <th class="uppercase p-4">{{ t('dashboard.assessmentTemplates.list.table.createdAt') }}</th>
              <th class="uppercase p-4"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="template in filteredTemplates"
              :key="template.id"  class="rounded-xl p-4 w-full"
            >
              <td  class="bg-rafik-secbg dark:bg-rafik-darksecbg p-4 rounded-s">{{ template.template_name }}</td>
              <td  class="bg-rafik-secbg dark:bg-rafik-darksecbg">{{ template.created_by }}</td>
              <td  class="bg-rafik-secbg dark:bg-rafik-darksecbg">{{ template.drills?.length }}</td>
              <td  class="bg-rafik-secbg dark:bg-rafik-darksecbg">{{ formatDate(template.created_at) }}</td>
              <td  class="bg-rafik-secbg dark:bg-rafik-darksecbg relative rounded-e">
                <svg
                  @click="show_action = template.id"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  class="text-rafik-sectext dark:text-rafik-darksectext h-7 mx-7 hover:text-rafik-pritext dark:hover:text-rafik-darkpritext cursor-pointer ms-auto"
                  viewBox="0 0 128 512"
                >
                  <path
                    d="M64 360a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm0-160a56 56 0 1 0 0 112 56 56 0 1 0 0-112zM120 96A56 56 0 1 0 8 96a56 56 0 1 0 112 0z"
                  />
                </svg>
                <div
                  v-if="show_action == template.id"
                  @mouseleave="handleLeave()"
                  class="absolute min-w-16 z-40 top-15 right-0 flex flex-col items-end text-sm rounded bg-rafik-secbg dark:bg-rafik-darksecbg shadow-lg divide-y divide-rafik-sectext dark:divide-rafik-darksectext"
                >
                  <button
                   @click="router.push({name:'assessment-template', params:{id:template.id}})"  class="px-3 py-5 hover:bg-rafik-pribg w-full text-center dark:bg-rafik-darkpribg hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darksectext rounded"
                  >
                    View
                  </button>
                  <button
                    @click="handleDelete(template)"
                    class="px-3 py-5 text-red-500 hover:bg-rafik-pribg dark:bg-rafik-darkpribg hover:text-red-300 rounded"
                  >
                    {{ t('dashboard.assessmentTemplates.list.actions.delete') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Loading State -->
      <div
        v-else
        class="h-full flex flex-col gap-2 items-center justify-center text-center w-full text-body"
      >
        <img
          src="@/assets/Large Icon.png"
          class="w-24 h-24 animate-bounce hidden dark:inline-block"
          alt=""
        />
        <img src="@/assets/Large Icon Light.png" class="w-24 h-24 animate-bounce dark:hidden" alt="" />
        <p class="text-lg animate-pulse">{{ t('general.loading') }}</p>
      </div>
    </div>

    <!-- Template Modal -->
    <TemplateModal
      :visible="showTemplateModal"
      :is-editing="isEditing"
      :template-data="selectedTemplate"
      @close="() => {
        showTemplateModal = false;
        selectedTemplate = null;
        isEditing = false;
      }"
      @submit="handleTemplateSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { useI18n } from 'vue-i18n';
import PageTitle from '@/components/Navigation/PageTitle.vue';
import TemplateModal from '@/components/Template Modal/TemplateModal.vue';
import debounce from 'lodash/debounce';
import Swal from 'sweetalert2';
import router from '@/router';
import { useTemplateStore } from '@/stores/templatestores';

const { t } = useI18n();
const userStore = useUserStore();
const templateStore = useTemplateStore();

const loading = ref(true);
const show_action = ref<string | null>(null);
const searchQuery = ref('');
const showTemplateModal = ref(false);
const selectedTemplate = ref<any>(null);
const isEditing = ref(false);

// Use store's AllTemplates instead of local ref
const filteredTemplates = computed(() => {
  if (!searchQuery.value) return templateStore.AllTemplates;
  const query = searchQuery.value.toLowerCase();
  return templateStore.AllTemplates.filter(
    (template:any) =>
      template.template_name?.toLowerCase().includes(query) ||
      template.template_description?.toLowerCase().includes(query)
  );
});

const handleSearch = debounce(async (event: Event) => {
  const target = event.target as HTMLInputElement;
  searchQuery.value = target.value;
  await templateStore.searchTemplates(searchQuery.value);
}, 300);

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

const handleLeave = () => {
  show_action.value = null;
};

const fetchTemplates = async () => {
  loading.value = true;
  await templateStore.fetchTemplates(userStore.userProfile);
  loading.value = false;
};

const handleTemplateSubmit = async (templateData: any) => {
  try {
    await templateStore.createTemplate({
      template_name: templateData.name,
      template_description: templateData.description,
      drills: [],
      created_by: userStore.userProfile?.id,
      organization: userStore.userProfile?.organization
    });

    showTemplateModal.value = false;
    isEditing.value = false;
    selectedTemplate.value = null;
    await fetchTemplates();

  } catch (error) {
    console.error('Error saving template:', error);
    Swal.fire({
      icon: 'error',
      title: t('dashboard.assessmentTemplates.saveError.title'),
      text: t('dashboard.assessmentTemplates.saveError.text')
    });
  }
};

const handleDelete = async (template: any) => {
  try {
    const result = await Swal.fire({
      title: t('dashboard.assessmentTemplates.list.deleteConfirm.title'),
      text: t('dashboard.assessmentTemplates.list.deleteConfirm.text'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#CB901C',
      cancelButtonColor: '#d33',
      background: '#081411',
      color: '#E8F3ED',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      await templateStore.deleteTemplate(template.id);
      await fetchTemplates();
      Swal.fire({
        icon: 'success',
        title: t('general.success'),
        text: t('dashboard.assessmentTemplates.list.deleteSuccess')
      });
    }
  } catch (error) {
    console.error('Error deleting template:', error);
    Swal.fire({
      icon: 'error',
      title: t('general.error'),
      text: t('dashboard.assessmentTemplates.list.deleteError')
    });
  }
  show_action.value = null;
};

onMounted(() => {
  fetchTemplates();
});
</script>


<style scoped>
table {
  width: 100%;
  border-collapse: separate; /* Keep this for row spacing */
  border-spacing: 0 1rem; /* Add vertical spacing between rows */
}

tbody > tr {
  border-radius: 0.375rem;
  outline: 1px solid rgba(0, 0, 0, 0.175);
}

.card:hover {
  background-image: linear-gradient(135deg, #f3eeeb 36%, #fff2cb);
}
.dark .card:hover {
  background-image: linear-gradient(135deg, #081411 36%, #295f42);
}
</style>
