<template>
  <div
    v-if="loading"
    class="h-full flex flex-col gap-2 items-center justify-center text-center w-full text-body"
  >
    <!-- Dark Mode Icon -->
    <img
      src="@/assets/Large Icon.png"
      class="w-24 h-24 animate-bounce hidden dark:inline-block"
      alt=""
    />
    <!-- Light Mode Icon -->
    <img src="@/assets/Large Icon Light.png" class="w-24 h-24 animate-bounce dark:hidden" alt="" />
    <p class="text-lg animate-pulse">
      {{ t('dashboard.tabs.profile.certifications.loading') }}
    </p>
  </div>

  <form v-else class="space-y-6">
    <!-- No Certifications -->
    <p v-if="FetchedCerts.length === 0" class="text-body my-auto">
      {{ t('dashboard.tabs.profile.certifications.noCertifications') }}
    </p>

    <!-- Certifications List -->
    <ul v-else class="flex flex-col gap-3 w-full">
      <li
        v-for="cert in FetchedCerts"
        :key="cert.name"
        class="card flex justify-between items-center p-4 border rounded-lg"
      >
        <span>{{ cert.name }}</span>
        <div class="flex gap-2">
          <a :href="cert.url" target="_blank" class="btn-md-outline">
            {{ t('dashboard.tabs.profile.certifications.view') }}
          </a>
          <button
            v-if="!admin"
            @click.prevent="handleDelete(cert.name)"
            class="btn-md-outline border-red-500 hover:bg-red-500 text-red-500"
          >
            {{ t('dashboard.tabs.profile.certifications.delete') }}
          </button>
        </div>
      </li>
    </ul>

    <!-- Upload More -->
    <div v-if="!admin" class="flex">
      <input
        type="file"
        multiple
        @change="uploadCertification"
        accept="image/*, application/pdf"
        class="hidden w-full"
        id="upload-photo"
      />
      <label for="upload-photo" class="btn-md-outline cursor-pointer">
        {{ t('dashboard.tabs.profile.certifications.uploadMore') }}
      </label>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import Swal from 'sweetalert2';
import { useI18n } from 'vue-i18n';

const { t , locale } = useI18n();

const props = defineProps<{
  certifications?: string[];
  admin?: boolean;
}>();

const FetchedCerts = ref<{ name: string; url: string }[]>([]);
const loading = ref(true);
const selectedFile = ref<File | null>(null);

// Show success and error alerts
const showSuccess = (messageKey: string, interpolation: Record<string, any> = {}) => {
  Swal.fire({
    title: t('dashboard.tabs.profile.certifications.successTitle'),
    text: t(messageKey, interpolation),
    icon: 'success',
    showConfirmButton: false,
    timer: 1500,
    toast: true,
    position: 'top-right',
    background: '#081411',
    color: '#E8F3ED'
  });
};

const showError = (messageKey: string, interpolation: Record<string, any> = {}) => {
  Swal.fire({
    title: t('dashboard.tabs.profile.certifications.errorTitle'),
    text: t(messageKey, interpolation),
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
};

// Fetch certification URLs
const fetchCerts = async () => {
  try {
    let fetchedCerts = <any[]>([])
    if(props.certifications)
    fetchedCerts = props.certifications.map((cert) => {
      // Ensure we only pass the relative path, not a full URL
      const relativePath = cert.replace(
        /^https?:\/\/[^/]+\/storage\/v1\/object\/public\/storage\//,
        ''
      );

      return {
        name: relativePath.split('/').pop() ?? '',
        url: supabase.storage.from('storage').getPublicUrl(relativePath).data.publicUrl
      };
    });

    FetchedCerts.value = fetchedCerts;
  } catch (err: any) {
    console.error(err);
    showError('dashboard.tabs.profile.certifications.fetchFailed', { error: err.message });
  } finally {
    loading.value = false;
  }
};

// Upload multiple certifications
const uploadCertification = async (event: Event) => {
  const UserId = localStorage.getItem('UserID');
  if (!UserId) {
    showError('dashboard.tabs.profile.certifications.trainerNotFound');
    return;
  }

  const target = event.target as HTMLInputElement;
  if (!target.files) return;

  loading.value = true;

  for (const file of target.files) {
    // Check if file is already uploaded
    if (FetchedCerts.value.some((cert) => cert.name === file.name)) {
      showError('dashboard.tabs.profile.certifications.alreadyUploaded', { fileName: file.name });
      continue;
    }

    const uploadedUrl = await uploadFileToBucket(file);
    if (uploadedUrl) {
      FetchedCerts.value.push({ name: file.name, url: uploadedUrl });
      showSuccess('dashboard.tabs.profile.certifications.uploadSuccess', { fileName: file.name });
      // Update the trainer profile with the new certification link
      await updateTrainerProfileCertification(uploadedUrl);
    }
  }

  loading.value = false;
};

// Upload file to storage
const uploadFileToBucket = async (file: File): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('storage')
      .upload(`certifications/${file.name}`, file, {
        cacheControl: '3600',
        upsert: false // Prevent overwriting existing files
      });

    if (error) {
      showError('dashboard.tabs.profile.certifications.uploadFailed', { error: error.message });
      return null;
    }

    return supabase.storage.from('storage').getPublicUrl(data.path).data.publicUrl;
  } catch (err: any) {
    console.error(err);
    showError('dashboard.tabs.profile.certifications.uploadFailed', { error: err.message });
    return null;
  }
};

// Confirm before deleting
function handleDelete(name: string) {
  Swal.fire({
    title: t('dashboard.tabs.profile.certifications.deleteConfirmTitle'),
    text: t('dashboard.tabs.profile.certifications.deleteConfirmText'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('dashboard.tabs.profile.certifications.deleteConfirmButton'),
    confirmButtonColor: '#CB901C',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  }).then((result) => {
    if (result.isConfirmed) {
      deleteCertification(name);
    }
  });
}

// Update trainer profile with new certification link
const updateTrainerProfileCertification = async (newCertificationUrl: string) => {
  const userId = localStorage.getItem('UserID');
  if (!userId) {
    showError('dashboard.tabs.profile.certifications.userIdNotFound');
    return;
  }

  try {
    // Step 1: Fetch the current trainer profile
    const { data: profile, error: fetchError } = await supabase
      .from('trainer_profile')
      .select('certifications_links')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Step 2: Modify the certifications_links array
    const updatedCertifications = [...(profile?.certifications_links || []), newCertificationUrl];

    // Step 3: Update the certifications_links array in the database
    const { error: updateError } = await supabase
      .from('trainer_profile')
      .update({
        certifications_links: updatedCertifications
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    showSuccess('dashboard.tabs.profile.certifications.trainerProfileUpdated');
  } catch (err: any) {
    console.error(err);
    showError('dashboard.tabs.profile.certifications.trainerProfileUpdateFailed', {
      error: err.message
    });
  }
};

// Delete certification
const deleteCertification = async (certName: string) => {
  const cert = FetchedCerts.value.find((cert) => cert.name === certName);
  if (!cert) return;

  const UserId = localStorage.getItem('UserID');
  if (!UserId) {
    showError('dashboard.tabs.profile.certifications.userIdNotFound');
    return;
  }

  loading.value = true;
  try {
    // Step 1: Remove the file from Supabase storage
    const { error: deleteError } = await supabase.storage
      .from('storage')
      .remove([`certifications/${certName}`]);
    if (deleteError) throw deleteError;

    // Step 2: Fetch the current trainer profile
    const { data: profile, error: fetchError } = await supabase
      .from('trainer_profile')
      .select('certifications_links')
      .eq('user_id', UserId)
      .single();

    if (fetchError) throw fetchError;

    // Step 3: Modify the certifications_links array by removing the deleted certification
    const updatedCertifications = profile?.certifications_links.filter((url: string) => {
      return !url.includes(certName);
    });

    // Step 4: Update the trainer profile with the modified certifications_links array
    const { error: updateError } = await supabase
      .from('trainer_profile')
      .update({
        certifications_links: updatedCertifications
      })
      .eq('user_id', UserId);

    if (updateError) throw updateError;

    // Step 5: Remove the certification from the local state
    FetchedCerts.value = FetchedCerts.value.filter((cert) => cert.name !== certName);

    showSuccess('dashboard.tabs.profile.certifications.deleteSuccess', { certName });
  } catch (err: any) {
    console.error(err);
    showError('dashboard.tabs.profile.certifications.deleteFailed', { error: err.message });
  } finally {
    loading.value = false;
  }
};

// Fetch certifications on mount
onMounted(async () => {
  await fetchCerts();
});
</script>
