<template>
  <div
    v-if="visible && userStore.userProfile?.roles?.includes('Organization Admin')"
    :dir="locale === 'ar' ? 'rtl' : 'ltr'"
    class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="card rounded-lg shadow-lg p-8 w-full max-w-md mx-4">
      <h2 class="contentH-medium mb-6">
        {{ t('dashboard.groups.modal.title') }}
      </h2>

            <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Group Avatar Upload -->
        <div class="flex items-center justify-center flex-col">
          <label class="block text-sm font-medium mb-2">
            Add Avatar
          </label>
          <div v-if="uploadedImage" class="w-full h-64 rounded relative">
            <img
              :src="uploadedImage"
              alt="Group Avatar"
              class="w-full h-full object-cover "
            />
            <button
              @click.prevent="removeImage"
              class="absolute w-full h-64 rounded opacity-0 hover:opacity-50 text-white bg-red-500 hover:cursor-pointer top-0 flex items-center justify-center hover:bg-red-600 focus:ring-2 focus:ring-offset-2 focus:ring-red-500 "
            >
             Remove
            </button>
          </div>
          <div
            v-else
            class="w-full h-64 rounded border-2 border-dashed border-gray-400  flex items-center justify-center cursor-pointer hover:bg-topsets-secbg dark:bg-topsets-darksecbg focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="triggerFileInput"
          >
            <span class="text-center text-gray-500 text-xs">
              Drag and drop to add image
            </span>
          </div>
          <input
            type="file"
            accept="image/*"
            class="hidden"
            ref="fileInput"
            @change="handleFileChange"
          />
        </div>

        <!-- Group Name -->
        <div>
          <label class="block text-sm font-medium mb-2">
            {{ t('dashboard.groups.modal.groupName') }}
          </label>
          <input
            v-model="form.group_name"
            type="text"
            class="topsets-text-input w-full"
            :placeholder="t('dashboard.groups.modal.groupNamePlaceholder')"
            required
          />
        </div>

        <!-- Group Description -->
        <div>
          <label class="block text-sm font-medium mb-2">
            {{ t('dashboard.groups.modal.groupDescription') }}
          </label>
          <textarea
            v-model="form.group_description"
            class="topsets-text-input w-full h-24"
            :placeholder="t('dashboard.groups.modal.groupDescriptionPlaceholder')"
          />
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium mb-2">
            {{ t('dashboard.groups.modal.status') }}
          </label>
          <select
            v-model="form.status"
            class="topsets-text-input w-full"
            required
          >
            <option value="active">
              {{ t('dashboard.groups.modal.statusActive') }}
            </option>
            <option value="scheduled">
              {{ t('dashboard.groups.modal.statusScheduled') }}
            </option>
            <option value="canceled">
              {{ t('dashboard.groups.modal.statusCanceled') }}
            </option>
          </select>
        </div>

        <!-- Assign Admins -->
        <div>
          <label class="block text-sm font-medium mb-2">
            {{ t('dashboard.groups.modal.assignAdmins') }}
          </label>
          <MultiSelect
            v-model="form.admins"
            :options="adminOptions"
            :label="(opt: any) => opt.name"
            :value="(opt: any) => opt"
            :dark="darkMode"
            searchable
          />
        </div>

        <!-- Assign Members -->
        <div>
          <label class="block text-sm font-medium mb-2">
            {{ t('dashboard.groups.modal.assignMembers') }}
          </label>
          <MultiSelect
            v-model="form.users"
            :options="memberOptions"
            :label="(opt: any) => opt.name"
            :value="(opt: any) => opt"
            :dark="darkMode"
            searchable
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-4 mt-8">
          <button
            type="button"
            @click="handleClose"
            class="btn-md bg-red-500 border-red-500 hover:bg-red-400 rounded"
          >
            {{ t('dashboard.groups.modal.cancel') }}
          </button>
          <button
            type="submit"
            class="btn-md rounded"
          >
            {{ t('dashboard.groups.modal.create') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>



<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user';
import { useGroupStore } from '@/stores/groupstores';
import MultiSelect from '@/components/MultiSelect.vue';
import { supabase } from '@/lib/supabaseClient';
import type { Group } from '@/stores/groupstores'; // ✅ Update path if different
const { t, locale } = useI18n();
const userStore = useUserStore();
const groupStore = useGroupStore();

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits(['close', 'created']);

const darkMode = localStorage.getItem('dark_mode') === 'true';

// Option interface for selects
interface Option {
  id: number;
  name: string;
}

// Form state: arrays of Option
const form = ref<{
  group_name: string;
  group_description: string;
  status: string;
  admins: Option[];
  users: Option[];
  group_avatar?: string;
}>({
  group_name: '',
  group_description: '',
  status: 'active',
  admins: [],
  users: [],
  group_avatar: ''
});


// Options for selects
const adminOptions = ref<Option[]>([]);
const memberOptions = ref<Option[]>([]);

// Load users as Option[]
onMounted(async () => {
  const org = userStore.userProfile?.organization;
  if (!org) return;


  const { data: users , error} = await supabase.from('users').select('id, first_name, last_name').eq('organization', org);

  if (!error && users) {
    adminOptions.value = users.map((u:any) => ({ id: u.id as number, name: `${u.first_name} ${u.last_name}` }));
    memberOptions.value = [...adminOptions.value];
  }
});
const fileInput = ref<HTMLInputElement | null>(null);
const uploadedImage = ref<string | null>(null); // For preview
const selectedFile = ref<File | null>(null); // For upload

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    selectedFile.value = file;

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImage.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const removeImage = () => {
  uploadedImage.value = null;
  selectedFile.value = null;
  if (fileInput.value) fileInput.value.value = '';
};

const uploadFileToBucket = async (): Promise<string | null> => {
  if (!selectedFile.value) {
    alert(t('dashboard.tabs.program.add.uploadImageError'));
    return null;
  }

  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('storage') // Replace with your bucket name
      .upload(`media/${Date.now()}_${selectedFile.value.name}`, selectedFile.value, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error(t('dashboard.tabs.program.add.uploadError'), error.message);
      alert(t('dashboard.tabs.program.add.uploadErrorMessage'));
      return null;
    }

    // Retrieve the public URL for the uploaded file
    const { data: urlData } = supabase.storage.from('storage').getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      alert(t('dashboard.tabs.program.add.urlError'));
      return null;
    }

    return urlData.publicUrl;
  } catch (err) {
    console.error(t('dashboard.tabs.program.add.uploadError'), err);
    alert(t('dashboard.tabs.program.add.uploadErrorMessage'));
    return null;
  }
};

async function handleSubmit() {
  let avatarUrl: string | null = null;

  // Upload avatar if selected
  if (selectedFile.value) {
    avatarUrl = await uploadFileToBucket();
    if (!avatarUrl) return; // Exit if upload fails
  }

  const payload = {
    group_name: form.value.group_name,
    group_description: form.value.group_description,
    status: form.value.status,
    admins: form.value.admins.map(o => o.id),
    users: form.value.users.map(o => o.id),
    group_avatar: avatarUrl || null,
    organization: userStore.userProfile?.organization
  };

  const group = await groupStore.createGroup(payload as Partial<Group>);
  if (group) emit('created', group);
  resetForm();
}

function handleClose() {
  resetForm();
  emit('close');
}

function resetForm() {
  form.value = {
    group_name: '',
    group_description: '',
    status: 'active',
    admins: [],
    users: [],
    group_avatar: ''
  };
  removeImage();
}

</script>

<style scoped>
/* Modal styling if needed */
</style>
