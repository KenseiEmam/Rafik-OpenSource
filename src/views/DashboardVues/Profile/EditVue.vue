<template>
  <div class="flex h-screen overflow-auto">
    <div
      v-if="userStore.Trainer"
      class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 2xl:space-y-6 space-y-3"
    >
      <!-- Page Title -->
      <PageTitle
        :subheader="t('dashboard.profile.edit.my')"
        :header="t('dashboard.profile.edit.profile')"
      />

      <!-- Tabs -->
      <div
        class="flex gap-8 2xl:gap-16 items-center pb-2 border-b border-rafik-sectext dark:border-rafik-darksectext"
      >
        <button
          :class="activeTab === 'profile' ? 'text-rafik-pritext dark:text-rafik-darkpritext' : ''"
          class="nav-btn"
          @click="activeTab = 'profile'"
        >
          {{ t('dashboard.profile.edit.detailsTab') }}
        </button>
        <button
          :class="activeTab === 'account' ? 'text-rafik-pritext dark:text-rafik-darkpritext' : ''"
          class="nav-btn uppercase"
          @click="activeTab = 'account'"
        >
          {{ t('dashboard.profile.edit.changePasswordTab') }}
        </button>
        <button
          :class="
            activeTab === 'certifications' ? 'text-rafik-pritext dark:text-rafik-darkpritext' : ''
          "
          class="nav-btn uppercase"
          @click="activeTab = 'certifications'"
        >
          {{ t('dashboard.profile.edit.certificationsTab') }}
        </button>
      </div>

      <!-- Loading Spinner -->
      <div
        v-if="loading"
        class="h-full flex flex-col gap-2 items-center justify-center text-center w-full text-body"
      >
        <img
          src="@/assets/Large Icon.png"
          class="w-24 h-24 animate-bounce hidden dark:inline-block"
          alt=""
        />
        <img
          src="@/assets/Large Icon Light.png"
          class="w-24 h-24 animate-bounce dark:hidden"
          alt=""
        />
        <p class="text-lg animate-pulse">
          {{ t('dashboard.profile.edit.loading') }}
        </p>
      </div>

      <template v-else>
        <!-- Account Management Tab -->
        <div v-if="activeTab === 'account'">
          <div class="grid 2xl:w-2/3 grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div class="form-control">
                <label class="block text-sm font-medium" for="newPassword">
                  {{ t('dashboard.profile.edit.newPasswordLabel') }}
                </label>
                <input
                  id="newPassword"
                  :placeholder="t('dashboard.profile.edit.passwordPlaceholder')"
                  type="password"
                  v-model="newPassword"
                  class="rafik-text-input w-full"
                />
              </div>

              <div class="form-control">
                <label class="block text-sm font-medium" for="confirmPassword">
                  {{ t('dashboard.profile.edit.confirmPasswordLabel') }}
                </label>
                <input
                  id="confirmPassword"
                  :placeholder="t('dashboard.profile.edit.passwordPlaceholder')"
                  type="password"
                  v-model="confirmPassword"
                  class="rafik-text-input w-full"
                />
              </div>

              <ul class="list-disc text-sm mt-2 ml-6 text-gray-600">
                <li :class="{ 'text-red-500': !isPasswordValid }">
                  {{ t('dashboard.profile.edit.passwordRequirement1') }}
                </li>
                <li :class="{ 'text-red-500': !isPasswordValid }">
                  {{ t('dashboard.profile.edit.passwordRequirement2') }}
                </li>
                <li :class="{ 'text-red-500': !isPasswordValid }">
                  {{ t('dashboard.profile.edit.passwordRequirement3') }}
                </li>
              </ul>

              <button class="btn-lg" @click="changePassword">
                {{ t('dashboard.profile.edit.changePasswordButton') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Profile Information Tab -->
        <div v-else-if="activeTab === 'profile'">
          <form
            class="grid grid-cols-1 md:grid-cols-2 gap-4 2xl:w-2/3 items-center align-center"
            @submit.prevent="updateProfileInfo"
          >
            <div class="grid grid-cols-3 col-span-2 gap-6">
              <div class="flex flex-col items-center space-y-4">
                <img
                  v-if="userStore.Trainer.avatar"
                  :src="userStore.Trainer.avatar"
                  alt="Trainer Avatar"
                  class="w-44 h-44 2xl:h-64 2xl:w-64 rounded-xl"
                />
                <input
                  type="file"
                  @change="uploadPhoto"
                  accept="image/*"
                  class="hidden"
                  id="upload-photo"
                />
                <label
                  for="upload-photo"
                  class="btn-md-outline w-full w-44 2xl:w-64 cursor-pointer"
                >
                  {{ t('dashboard.profile.edit.uploadPhotoLabel') }}
                </label>
              </div>
              <div class="space-y-3">
                <!-- First Name -->
                <div class="form-control">
                  <label class="block text-sm font-medium" for="first_name">
                    {{ t('dashboard.profile.edit.firstNameLabel') }}
                  </label>
                  <input
                    id="first_name"
                    v-model="userStore.Trainer.first_name"
                    class="rafik-text-input w-full"
                    type="text"
                    required
                  />
                </div>
                <!-- Last Name -->
                <div class="form-control">
                  <label class="block text-sm font-medium" for="last_name">
                    {{ t('dashboard.profile.edit.lastNameLabel') }}
                  </label>
                  <input
                    id="last_name"
                    v-model="userStore.Trainer.last_name"
                    class="rafik-text-input w-full"
                    type="text"
                    required
                  />
                </div>
                <!-- Email (Read-only) -->
                <div class="form-control">
                  <label class="block text-sm font-medium" for="email">
                    {{ t('dashboard.profile.edit.emailLabel') }}
                  </label>
                  <input
                    id="email"
                    v-model="userStore.Trainer.email"
                    class="rafik-text-input w-full"
                    type="email"
                    readonly
                  />
                </div>
              </div>
              <div class="space-y-3">
                <!-- Title -->
                <div class="form-control">
                  <label class="block text-sm font-medium" for="title">
                    {{ t('dashboard.profile.edit.titleLabel') }}
                  </label>
                  <input
                    id="title"
                    v-model="userStore.Trainer.title"
                    class="rafik-text-input w-full"
                    type="text"
                    required
                  />
                </div>
                <!-- Phone -->
                <div class="form-control">
                  <label class="block text-sm font-medium" for="phone">
                    {{ t('dashboard.profile.edit.phoneLabel') }}
                  </label>
                  <input
                    id="phone"
                    v-model="userStore.Trainer.phone"
                    class="rafik-text-input w-full"
                    type="tel"
                    required
                  />
                </div>
                <!-- dob -->
                <div class="form-control">
                  <label class="block text-sm font-medium" for="dob">
                    {{ t('dashboard.profile.edit.dobLabel') }}
                  </label>
                  <VueDatePicker
                    :dark="darkness === 'true'"
                    v-model="userStore.Trainer.dob"
                    :enable-time-picker="false"
                    :max-date="new Date(new Date().setFullYear(new Date().getFullYear() - 16))"
                    placeholder="Select Date"
                  />
                </div>
              </div>
            </div>
            <div class="space-y-3">
              <!-- Nationality -->
              <div class="form-control">
                <label class="block text-sm font-medium" for="nationality">
                  {{ t('dashboard.profile.edit.nationalityLabel') }}
                </label>
                <select
                  id="nationality"
                  v-model="userStore.Trainer.nationality"
                  class="rafik-text-input w-full"
                  required
                >
                  <option value="" disabled selected>
                    {{ t('dashboard.profile.edit.nationalityPlaceholder') }}
                  </option>
                  <option
                    v-for="Nat in nationalStore.Nationalities"
                    :key="Nat.nationality"
                    :value="Nat.nationality"
                  >
                    {{ Nat.nationality }}
                  </option>
                </select>
              </div>

              <!-- Gender (Read-only) -->
              <div class="form-control">
                <label class="block text-sm font-medium" for="gender">
                  {{ t('dashboard.profile.edit.genderLabel') }}
                </label>
                <input
                  id="gender"
                  v-model="userStore.Trainer.gender"
                  class="rafik-text-input w-full"
                  type="text"
                  readonly
                />
              </div>

              <!-- Years of Experience -->
              <div class="form-control">
                <label class="block text-sm font-medium" for="years_of_experience">
                  {{ t('dashboard.profile.edit.experienceLabel') }}
                </label>
                <input
                  id="years_of_experience"
                  v-model.number="userStore.Trainer.years_of_experience"
                  class="rafik-text-input w-full"
                  type="number"
                  min="0"
                  required
                />
              </div>
            </div>

            <!-- Bio (Full width) -->
            <div class="form-control h-full">
              <label class="block text-sm font-medium" for="bio">
                {{ t('dashboard.profile.edit.bioLabel') }}
              </label>
              <textarea
                id="bio"
                v-model="userStore.Trainer.bio"
                class="rafik-text-input w-full h-full"
                :placeholder="t('dashboard.profile.edit.bioPlaceholder')"
              ></textarea>
            </div>

            <!-- Submit Button (Full width) -->
            <div class="md:col-span-2">
              <button type="submit" class="btn-lg w-full md:w-auto">
                {{ t('dashboard.profile.edit.saveProfileButton') }}
              </button>
            </div>
          </form>
        </div>

        <!-- Certifications Tab -->
        <div
          v-else-if="activeTab === 'certifications' && userStore.Trainer.certifications_links"
          class="grid 2xl:w-2/3 grid-cols-1 md:grid-cols-2 gap-6"
        >
          <Cetifications :certifications="userStore.Trainer.certifications_links" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import { useUserStore } from '@/stores/user';
import PageTitle from '@/components/Navigation/PageTitle.vue';
import Cetifications from '@/components/ProfileTabs/Cetifications.vue';
import { useNationalStore } from '@/stores/nationalities';
import Swal from 'sweetalert2';
import VueDatePicker from '@vuepic/vue-datepicker'; // presumably needed for <VueDatePicker/>
import '@vuepic/vue-datepicker/dist/main.css'; // or wherever your styling is
import { useI18n } from 'vue-i18n';

const { t , locale } = useI18n();
// Dark mode from localStorage
const darkness = localStorage.getItem('dark_mode');

// Accessing user store and nationality store
const userStore = useUserStore();
const nationalStore = useNationalStore();

// State to track loading data from server
const loading = ref(true);

// Active Tab states
type TTabs = 'account' | 'profile' | 'certifications';
const activeTab = ref<TTabs>('profile');

// Password states + validation
const newPassword = ref('');
const confirmPassword = ref('');
const isPasswordValid = ref(false);

// Computed if password is valid
const doPasswordsMatch = computed(() => newPassword.value === confirmPassword.value);
const canSubmit = computed(() => isPasswordValid.value && doPasswordsMatch.value);

// Validate password
function validatePassword() {
  const hasNumber = /\d/.test(newPassword.value);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword.value);
  const isLongEnough = newPassword.value.length >= 8;
  const notSimilarToEmail =
    !userStore.Trainer?.email || !userStore.Trainer.email.includes(newPassword.value);

  isPasswordValid.value = hasNumber && hasSpecialChar && isLongEnough && notSimilarToEmail;
}

// Alerts
function showSuccess(message: string) {
  Swal.fire({
    title: t('dashboard.profile.edit.successTitle'),
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 1500,
    text: message,
    toast: true,
    position: 'top-right',
    icon: 'success',
    background: '#081411',
    color: '#E8F3ED'
  });
}

function showError(message: string) {
  Swal.fire({
    title: t('dashboard.profile.edit.errorTitle'),
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}

// On mount, fetch logged trainer
onMounted(async () => {
  try {
    await userStore.getLoggedTrainer();
    if (userStore.Trainer?.certifications) {
      // do something if needed
    }
  } catch (err: any) {
    console.error('Error fetching trainer data:', err);
    showError(t('dashboard.profile.edit.fetchProfileError'));
  } finally {
    loading.value = false;
  }
  nationalStore.getNationalities();
});

// Changing password
async function changePassword() {
  validatePassword();
  if (!canSubmit.value) {
    showError(t('dashboard.profile.edit.passwordCriteriaFail'));
    return;
  }

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword.value });
    if (error) throw error;
    showSuccess(t('dashboard.profile.edit.passwordChangeSuccess'));
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (err: any) {
    console.error(err);
    showError(
      t('dashboard.profile.edit.passwordChangeFailed', {
        error: err.message || 'Unknown error'
      })
    );
  }
}

// Updating profile info
async function updateProfileInfo() {
  const UserId = localStorage.getItem('UserID');
  if (!UserId || !userStore.Trainer) {
    showError(t('dashboard.profile.edit.trainerDataNotFound'));
    return;
  }
  loading.value = true;
  try {
    // Update the users table
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        first_name: userStore.Trainer.first_name,
        last_name: userStore.Trainer.last_name,
        phone: userStore.Trainer.phone,
        dob: userStore.Trainer.dob,
        nationality: userStore.Trainer.nationality
      })
      .eq('id', UserId);

    if (userUpdateError) throw userUpdateError;

    // Update the trainer_profile table
    const { error: profileUpdateError } = await supabase
      .from('trainer_profile')
      .update({
        title: userStore.Trainer.title,
        years_of_experience: userStore.Trainer.years_of_experience,
        bio: userStore.Trainer.bio
      })
      .eq('id', userStore.Trainer.id);

    if (profileUpdateError) throw profileUpdateError;

    showSuccess(t('dashboard.profile.edit.profileUpdateSuccess'));
  } catch (err: any) {
    console.error(err);
    showError(
      t('dashboard.profile.edit.profileUpdateFail', {
        error: err.message || 'Unknown error'
      })
    );
  } finally {
    loading.value = false;
  }
}

// Photo upload logic
const selectedFile = ref<File | null>(null);

async function uploadPhoto(event: Event) {
  const UserId = localStorage.getItem('UserID');
  if (!UserId || !userStore.Trainer) {
    showError(t('dashboard.profile.edit.trainerDataNotFound'));
    return;
  }
  loading.value = true;
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
    const uploadedUrl = await uploadFileToBucket();
    if (uploadedUrl) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ avatar: uploadedUrl })
          .eq('id', UserId);
        if (error) throw error;
        userStore.Trainer.avatar = uploadedUrl;
        showSuccess(t('dashboard.profile.edit.photoUpdateSuccess'));
      } catch (err: any) {
        console.error(err);
        showError(
          t('dashboard.profile.edit.photoUpdateFail', {
            error: err.message || 'Unknown error'
          })
        );
      } finally {
        loading.value = false;
      }
    }
  }
}

async function uploadFileToBucket(): Promise<string | null> {
  if (!selectedFile.value) {
    showError(t('dashboard.profile.edit.noImageSelected'));
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from('storage')
      .upload(`avatars/${Date.now()}_${selectedFile.value.name}`, selectedFile.value, {
        cacheControl: '3600',
        upsert: true
      });
    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from('storage').getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.error(err);
    showError(t('dashboard.profile.edit.uploadFail', { error: err.message }));
    return null;
  }
}
</script>

<style scoped>
.form-control label {
  margin-bottom: 0.25rem;
}
</style>
