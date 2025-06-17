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
        <button @click="showTemplateModal = true" class="btn-sm-outline">
          {{ t('dashboard.assessmentTemplates.list.createNew') }}
        </button>
      </div>

      <!-- Data Table -->
      <div v-if="!loading" class="card border-0 bg-rafik-secbg dark:bg-rafik-darksecbg">
        <table class="w-full">
          <thead>
            <tr class="border-b border-rafik-sectext dark:border-rafik-darksectext">
              <th class="text-left p-4">{{ t('dashboard.assessmentTemplates.list.table.name') }}</th>
              <th class="text-left p-4">{{ t('dashboard.assessmentTemplates.list.table.description') }}</th>
              <th class="text-left p-4">{{ t('dashboard.assessmentTemplates.list.table.control') }}</th>
              <th class="text-left p-4">{{ t('dashboard.assessmentTemplates.list.table.primary') }}</th>
              <th class="text-left p-4">{{ t('dashboard.assessmentTemplates.list.table.createdAt') }}</th>
              <th class="text-left p-4">{{ t('dashboard.assessmentTemplates.list.table.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="template in filteredTemplates"
              :key="template.id"
              class="border-b border-rafik-sectext dark:border-rafik-darksectext"
            >
              <td class="p-4">{{ template.template_name }}</td>
              <td class="p-4">{{ template.template_description }}</td>
              <td class="p-4">{{ template.drills?.control }}</td>
              <td class="p-4">{{ template.drills?.primary }}</td>
              <td class="p-4">{{ formatDate(template.created_at) }}</td>
              <td class="p-4 relative">
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
                    @click="handleEdit(template)"
                    class="px-3 py-5 hover:bg-rafik-pribg w-full text-center dark:bg-rafik-darkpribg hover:text-rafik-pritext dark:hover:text-rafik-darkpritext dark:text-rafik-darksectext rounded"
                  >
                    {{ t('dashboard.assessmentTemplates.list.actions.edit') }}
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
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from 'vue-i18n';
import PageTitle from '@/components/Navigation/PageTitle.vue';
import TemplateModal from '@/components/TemplateModal.vue';
import debounce from 'lodash/debounce';
import Swal from 'sweetalert2';

const { t } = useI18n();
const userStore = useUserStore();
const loading = ref(true);
const show_action = ref<string | null>(null);
const searchQuery = ref('');
const templates = ref<any[]>([]);
const showTemplateModal = ref(false);
const selectedTemplate = ref<any>(null);
const isEditing = ref(false);

// Computed property for filtered templates
const filteredTemplates = computed(() => {
  if (!searchQuery.value) return templates.value;
  const query = searchQuery.value.toLowerCase();
  return templates.value.filter(
    (template) =>
      template.template_name?.toLowerCase().includes(query) ||
      template.template_description?.toLowerCase().includes(query)
  );
});

// Handle search input with debounce
const handleSearch = debounce((event: Event) => {
  const target = event.target as HTMLInputElement;
  searchQuery.value = target.value;
}, 300);

// Format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

// Handle mouse leave for action menu
const handleLeave = () => {
  show_action.value = null;
};

// Fetch templates based on user role
const fetchTemplates = async () => {
  try {
    loading.value = true;
    let query = supabase
      .from('assessment_template')
      .select('*');

    // If user is an organization trainer, only show their templates
    if (userStore.userProfile?.roles.includes('Organization Trnr')) {
      query = query.eq('created_by', userStore.userProfile.id);
    }
    // If user is an organization admin, show all templates in their organization
    else if (userStore.userProfile?.roles.includes('Organization Admin')) {
      query = query.eq('organization', userStore.userProfile.organization);
    }

    const { data, error } = await query;

    if (error) throw error;
    templates.value = data || [];
  } catch (error) {
    console.error('Error fetching templates:', error);
  } finally {
    loading.value = false;
  }
};

// Handle template submission
const handleTemplateSubmit = async (templateData) => {
  try {
    const drills = {
      control: templateData.control,
      primary: templateData.primary,
      rounds: templateData.rounds,
      controlValue: templateData.controlValue
    };

    if (isEditing.value && selectedTemplate.value?.id) {
      // Update existing template
      const { error } = await supabase
        .from('assessment_template')
        .update({
          template_name: templateData.name,
          template_description: templateData.description,
          drills: drills
        })
        .eq('id', selectedTemplate.value.id);

      if (error) throw error;
    } else {
      // Create new template
      const { error } = await supabase
        .from('assessment_template')
        .insert({
          template_name: templateData.name,
          template_description: templateData.description,
          drills: drills,
          created_by: userStore.userProfile?.id,
          organization: userStore.userProfile?.organization
        });

      if (error) throw error;
    }

    // Reset form and refresh list
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

// Handle edit template
const handleEdit = (template) => {
  selectedTemplate.value = {
    id: template.id,
    name: template.template_name,
    description: template.template_description,
    control: template.drills?.control || '',
    primary: template.drills?.primary || '',
    rounds: template.drills?.rounds || 0,
    controlValue: template.drills?.controlValue || 0
  };
  isEditing.value = true;
  showTemplateModal.value = true;
};

// Handle delete template
const handleDelete = async (template: any) => {
  try {
    const result = await Swal.fire({
      title: t('dashboard.assessmentTemplates.list.deleteConfirm.title'),
      text: t('dashboard.assessmentTemplates.list.deleteConfirm.text'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('general.yes'),
      cancelButtonText: t('general.no')
    });

    if (result.isConfirmed) {
      const { error } = await supabase
        .from('assessment_template')
        .delete()
        .eq('id', template.id);

      if (error) throw error;

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