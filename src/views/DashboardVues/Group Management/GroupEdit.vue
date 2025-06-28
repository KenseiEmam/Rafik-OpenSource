<template>
  <div class="flex h-screen overflow-auto px-8 py-12 flex-col space-y-6">
    <!-- Actions -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h3 class="contentH-large mb-3">{{ group?.group_name || t('dashboard.groups.edit.title') }}</h3>
        <p class="subheader-small" v-if="group.created_at">
          Created at: {{ formatDate(group.created_at) }}
        </p>
      </div>
      <div class="flex gap-4">
        <button class="btn-md uppercase" @click="saveGroup">{{ t('dashboard.groups.edit.save') }}</button>
        <button class="btn-md-outline uppercase" @click="cancelEdit">{{ t('dashboard.groups.edit.cancel') }}</button>
      </div>
    </div>
<div>

</div>
    <!-- Editing Form -->
    <div v-if="group" class="space-y-6">
      <!-- Group Avatar Upload -->
<div class="flex items-center justify-center flex-col">

  <div v-if="uploadedImage" class="w-full h-64 rounded relative">
    <img :src="uploadedImage" alt="Group Avatar" class="w-full h-full object-cover" />
    <button
      @click.prevent="removeImage"
      class="absolute w-full h-64 rounded opacity-0 hover:opacity-50 text-white bg-red-500 top-0 flex items-center justify-center hover:bg-red-600 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
    >
      Remove Photo
    </button>
  </div>

  <div
    v-else
    class="w-full h-64 rounded border-2 border-dashed border-gray-400 flex items-center justify-center cursor-pointer hover:bg-topsets-secbg dark:bg-topsets-darksecbg focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    @click="triggerFileInput"
  >
    <span class="text-center text-gray-500 text-xs">
      {{ t('dashboard.groups.modal.dragDrop') }}
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

      <div class="space-y-4">
        <h2 class="header-small">{{ t('dashboard.groups.edit.name') }}</h2>
        <input v-model="editable.group_name" class="w-full topsets-text-input" />

        <h2 class="header-small">{{ t('dashboard.groups.edit.description') }}</h2>
        <textarea v-model="editable.group_description" class="w-full topsets-text-input" rows="3" />
      </div>

      <!-- Status -->
      <div>
        <label class="block text-sm font-medium mb-2">{{ t('dashboard.groups.edit.status') }}</label>
        <select v-model="editable.status" class="topsets-text-input w-full">
          <option value="active">{{ t('dashboard.groups.status.active') }}</option>
          <option value="scheduled">{{ t('dashboard.groups.status.scheduled') }}</option>
          <option value="canceled">{{ t('dashboard.groups.status.canceled') }}</option>
        </select>
      </div>

      <!-- Admins MultiSelect -->
      <div>
        <label class="block text-sm font-medium mb-2">{{ t('dashboard.groups.edit.assignAdmins') }}</label>
        <MultiSelect
          v-model="editable.admins"
          :options="allUsers"
          :label="(u:any) => u.name"
          :value="(u:any) => u.id"
          searchable
          dark
        />
      </div>

      <!-- Users MultiSelect -->
      <div>
        <label class="block text-sm font-medium mb-2">{{ t('dashboard.groups.edit.assignUsers') }}</label>
        <MultiSelect
          v-model="editable.users"
          :options="allUsers"
          :label="(u:any) => u.name"
          :value="(u:any) => u.id"
          searchable
          dark
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-else class="text-center mt-24 text-lg">{{ t('general.loading') }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useGroupStore} from '@/stores/groupstores';
import type { Group} from '@/stores/groupstores';
import { useUserStore } from '@/stores/user';
import MultiSelect from '@/components/MultiSelect.vue';
import { supabase } from '@/lib/supabaseClient';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const groupStore = useGroupStore();
const userStore = useUserStore();

const groupId = Number(route.params.id);
const group = ref<Group>({} as Group);
const fileInput = ref<HTMLInputElement | null>(null);
const uploadedImage = ref<string | null>(null);
const selectedFile = ref<File | null>(null);

const triggerFileInput = () => fileInput.value?.click();

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    selectedFile.value = file;
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
  if (!selectedFile.value) return null;
  const { data, error } = await supabase.storage
    .from('storage') // replace with your actual bucket name
    .upload(`media/${Date.now()}_${selectedFile.value.name}`, selectedFile.value, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Upload error', error.message);
    return null;
  }

  const { data: urlData } = supabase.storage.from('storage').getPublicUrl(data.path);
  return urlData?.publicUrl ?? null;
};
async function saveGroup() {
  let avatarUrl = null;
  if (selectedFile.value) {
    avatarUrl = await uploadFileToBucket();
    if (!avatarUrl) return;
  }

  await groupStore.updateGroup(groupId, {
    group_name: editable.group_name,
    group_description: editable.group_description,
    status: editable.status,
    admins: editable.admins.map(a => a.id),
    users: editable.users.map(u => u.id),
    group_avatar: avatarUrl ?? group.value.group_avatar // Keep existing if no new
  });

  await load();
}

const editable = reactive({
  group_name: '',
  group_description: '',
  status: 'active',
    admins: [] as { id: number; name: string }[],
  users: [] as { id: number; name: string }[],
});
const allUsers = ref<{ id: number; name: string }[]>([]);

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

async function load() {
  const g = await groupStore.getGroup(groupId);
  if (!g) return router.back();
  group.value = g;

  await groupStore.fetchAllUserDetails([g], 'admin');
  await userStore.fetchOrgUsers({ roles: [], name: '', enrolled: false ,active:true }, 1, 1000);
if (g.group_avatar) uploadedImage.value = g.group_avatar;

  // After fetching, map them to options
 allUsers.value = (userStore.All_Org_Users || []).map((user: any) => ({
  id: user.id,
  name: `${user.first_name} ${user.last_name}`.trim(),
}));


Object.assign(editable, {
  group_name: g.group_name,
  group_description: g.group_description,
  status: g.status,
  admins: allUsers.value.filter((a: any) => g.admins?.includes(a.id)),
  users: allUsers.value.filter((u: any) => g.users?.includes(u.id)),
});



}



function cancelEdit() {
  load();
}

onMounted(load);
</script>
