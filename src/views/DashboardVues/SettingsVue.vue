<template>
  <div class="flex h-screen overflow-auto">
    <div
      v-if="userStore.userProfile?.roles"
      class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 2xl:space-y-6 space-y-3"
    >
      <!-- Page Title -->
      <PageTitle
        :subheader="t('dashboard.settings.subheader')"
        :header="t('dashboard.settings.header')"
      />

      <!-- Tabs -->
      <div
        class="flex gap-8 2xl:gap-16 items-center pb-2 border-b border-topsets-sectext dark:border-topsets-darksectext"
      >
        <!-- General Settings Tab -->
        <button
          :class="
            activeTab === 'General Setting' ? 'text-topsets-pritext dark:text-topsets-darkpritext' : ''
          "
          class="nav-btn"
          @click="setActiveTab('General Setting')"
        >
          {{ t('dashboard.settings.generalSettingsTab') }}
        </button>

        <!-- Trainer Settings Tab -->
        <button
          v-if="userStore.userProfile.roles.includes('Trainer')"
          :class="
            activeTab === 'Trainer Settings' ? 'text-topsets-pritext dark:text-topsets-darkpritext' : ''
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Trainer Settings')"
        >
          {{ t('dashboard.settings.trainerSettingsTab') }}
        </button>

        <!-- Roles & Permissions Tab -->
        <button
          v-if="userStore.userProfile.roles.includes('Administrator') || userStore.userProfile.roles.includes('Organization Admin')"
          :class="
            activeTab === 'Roles and Permissions'
              ? 'text-topsets-pritext dark:text-topsets-darkpritext'
              : ''
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Roles and Permissions')"
        >
          {{ t('dashboard.settings.rolesAndPermissionsTab') }}
        </button>

        <!-- Notifcations  -->
        <button
          :class="
            activeTab === 'Notifications'
              ? 'text-topsets-pritext dark:text-topsets-darkpritext'
              : ''
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Notifications')"
        >
          {{ t('dashboard.settings.notificationsTab') }}
        </button>

        <!-- Organization Settings Tab (Only if user is Organization Admin) -->
        <button
          v-if="userStore.userProfile.roles.includes('Organization Admin')"
          :class="
            activeTab === 'Organization Settings'
              ? 'text-topsets-pritext dark:text-topsets-darkpritext'
              : ''
          "
          class="nav-btn uppercase"
          @click="setActiveTab('Organization Settings')"
        >
          {{ t('dashboard.settings.organizationSettingsTab') }}
        </button>
      </div>

      <!-- Tab Contents -->
      <div>
        <transition name="slide-fade">
          <!-- General Settings -->
          <GeneralSettings v-if="activeTab === 'General Setting'" />

          <!-- Trainer Settings -->
          <TrainerSettings
            v-else-if="
              activeTab === 'Trainer Settings' && userStore.userProfile.roles.includes('Trainer')
            "
          />

          <!-- Roles & Permissions -->
          <RolesandPerms
            v-else-if="
              activeTab === 'Roles and Permissions' &&
              userStore.userProfile.roles.includes('Administrator') || userStore.userProfile.roles.includes('Organization Admin')
            "
          />
          <!-- Notification Settings -->
          <Notifications
           v-else-if="
              activeTab === 'Notifications'
            "
          />
          <!-- Organization Settings -->
          <template
            v-else-if="
              activeTab === 'Organization Settings' &&
              userStore.userProfile.roles.includes('Organization Admin')
            "
          >
            <!-- Loading Spinner -->
            <div
              v-if="loadingOrg"
              class="h-full flex flex-col gap-2 items-center justify-center text-center w-full text-body"
            >
              <!-- Example spinner images (adjust paths as needed) -->
              <img
                src="@/assets/ts-trans-dark.png"
                class="w-24 h-24 animate-bounce hidden dark:inline-block"
                alt="spinner"
              />
              <img
                src="@/assets/ts-trans-light.png"
                class="w-24 h-24 animate-bounce dark:hidden"
                alt="spinner"
              />
              <p class="text-lg animate-pulse">
                {{ t('dashboard.settings.organizationSettingsTabLoading') }}
              </p>
            </div>

            <!-- Organization Form (split into 2 columns) -->
            <div v-else class="grid 2xl:w-2/3 grid-cols-1 md:grid-cols-2 gap-6">
              <!-- LEFT COLUMN -->
              <div class="space-y-4 flex flex-col items-center md:items-stretch">
                <!-- Organization Logo -->
                <div class="flex flex-col items-center md:items-start space-y-3">
                  <img
                    :src="orgData.logo || '/placeholder.jpg'"
                    alt="Organization Logo"
                    class="w-44 h-44 2xl:h-64 2xl:w-64 rounded-xl"
                  />
                  <input
                    type="file"
                    id="uploadOrgLogo"
                    class="hidden"
                    @change="selectFile"
                    accept="image/*"
                  />
                  <label
                    for="uploadOrgLogo"
                    class="btn-md-outline w-full w-44 2xl:w-64 cursor-pointer text-center"
                  >
                    {{ t('dashboard.settings.organizationLogoUploadLabel') }}
                  </label>
                </div>

                <!-- Organization Name -->
                <div class="form-control w-full">
                  <label class="block text-sm font-medium">
                    {{ t('dashboard.settings.orgNameLabel') }}
                  </label>
                  <input
                    v-model="orgData.name"
                    class="topsets-text-input w-full"
                    type="text"
                    :placeholder="t('dashboard.settings.orgNamePlaceholder')"
                  />
                </div>

                <!-- Description (textarea) -->
                <div class="form-control w-full">
                  <label class="block text-sm font-medium">
                    {{ t('dashboard.settings.orgDescriptionLabel') }}
                  </label>
                  <textarea
                    v-model="orgData.description"
                    rows="2"
                    class="topsets-text-input w-full whitespace-pre-wrap"
                    :placeholder="t('dashboard.settings.orgDescriptionPlaceholder')"
                  ></textarea>
                </div>
              </div>

              <!-- RIGHT COLUMN -->
              <div class="space-y-4">
                <!-- Country (select) -->
                <div class="form-control">
                  <label class="block text-sm font-medium">
                    {{ t('dashboard.settings.orgCountryLabel') }}
                  </label>
                  <select v-model="orgData.country" class="topsets-text-input w-full">
                    <option :value="''" disabled>
                      {{ t('dashboard.settings.orgCountryPlaceholder') }}
                    </option>
                    <option v-for="c in countries" :key="c.code" :value="c.code">
                      {{ c.name }}
                    </option>
                  </select>
                </div>

                <!-- Address -->
                <div class="form-control">
                  <label class="block text-sm font-medium">
                    {{ t('dashboard.settings.orgAddressLabel') }}
                  </label>
                  <textarea
                    v-model="orgData.address"
                    class="topsets-text-input w-full"
                    type="text"
                    rows="3"
                    :placeholder="t('dashboard.settings.orgAddressPlaceholder')"
                  ></textarea>
                </div>

                <!-- Domains (textarea) -->
                <div class="form-control">
                  <label class="block text-sm font-medium">
                    {{ t('dashboard.settings.orgDomainsLabel') }}
                  </label>
                  <textarea
                    v-model="domainString"
                    class="topsets-text-input w-full"
                    rows="7"
                    :placeholder="t('dashboard.settings.orgDomainsPlaceholder')"
                  ></textarea>
                </div>

                <!-- Trainer Assign (toggle) -->
                <div class="form-control flex flex-row items-center gap-3 switch-mt">
                  <span class="text-lg font-medium">
                    {{ t('dashboard.settings.orgTrainerAssignLabel') }}
                  </span>
                  <label
                    class="flex items-center ms-auto mr-4 space-x-2 cursor-pointer switch-label"
                  >
                    <input
                      type="checkbox"
                      id="trainerAssign"
                      v-model="orgData.trainer_assign"
                      class="hidden"
                    />
                    <div
                      class="w-16 h-8 flex items-center border-topsets-pritext dark:border-topsets-darkpritext border-2 rounded-full transition-all"
                      :class="{ 'bg-topsets': orgData.trainer_assign }"
                    >
                      <div
                        class="w-8 h-8 bg-topsets-pritext dark:bg-topsets-darkpritext rounded-full shadow-md transform transition-transform"
                        :class="
                          orgData.trainer_assign
                            ? locale === 'ar'
                              ? '-translate-x-8'
                              : 'translate-x-8'
                            : ''
                        "
                      ></div>
                    </div>
                  </label>
                </div>
              </div>
                      <!-- A Popup for cropping -->
            <!-- You can replace it with the framework's Modal component -->
            <div class="modal-wrap fixed right-0 left-0 top-0 bottom-0 h-screen w-screen z-40 flex flex-col items-center justify-center" v-if="isShowModal">
              <div class="modal-mask w-full h-full absolute bg-black opacity-50"></div>
              <div class="modal-scroll-view w-1/3  m-auto ">
                <div class="modal  flex flex-col gap-3 bg-black relative card p-8">
                  <div class="modal-title">
                    <span class="contentH-small">Crop Image</span>

                  </div>

                  <div class="modal-content">
                    <!-- The component imported from `vue-picture-cropper` plugin -->
                    <VuePictureCropper
                      :boxStyle="{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#f8f8f8',
                        margin: 'auto',
                      }"
                      :img="pic"
                      :options="{
                        viewMode: 1,
                        dragMode: 'crop',
                        aspectRatio: 1 / 1,
                      }"
                      @ready="ready"
                    />
                  </div>
                  <div class="tools flex gap-3">
                      <button class="btn-md bg-red-400 hover:bg-red-500 border-red-500" @click="isShowModal = false">
                        Cancel
                      </button>
                      <button @click="getResult" class="btn-md" >
                        Crop
                      </button>
                    </div>
                </div>
                </div>
                </div>
              <!-- SAVE BUTTON (Full-width row) -->
              <div class="md:col-span-2">
                <button class="btn-lg w-full md:w-auto" @click="updateOrganization">
                  {{ t('dashboard.settings.orgSaveButton') }}
                </button>
              </div>
            </div>
          </template>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useUserStore } from '@/stores/user';
import PageTitle from '@/components/Navigation/PageTitle.vue';
import GeneralSettings from '@/components/SettingsTabs/GeneralSettings.vue';
import TrainerSettings from '@/components/SettingsTabs/TrainerSettings.vue';
import RolesandPerms from '@/components/SettingsTabs/RolesandPerms.vue';
import Swal from 'sweetalert2';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/lib/supabaseClient';
import { countries } from '@/lib/countries'; // Assuming you have a JSON file with country data
import VuePictureCropper, { cropper } from 'vue-picture-cropper'
import Notifications from '@/components/SettingsTabs/Notifications.vue';
const { t, locale } = useI18n(); // now we also destructure `locale`
const userStore = useUserStore();

const activeTab = ref('General Setting');

// Change active tab handler
function setActiveTab(tab: string) {
  activeTab.value = tab;
}

// Success and Error Alerts
function showSuccess(message: string) {
  Swal.fire({
    title: t('dashboard.settings.successTitle'),
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 1500,
    text: message,
    toast: true,
    position: 'top-right',
    icon: 'success',
    background: '#132e3d',
    color: '#ececec'
  });
}

function showError(message: string) {
  Swal.fire({
    title: t('dashboard.settings.errorTitle'),
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#132e3d',
    color: '#ececec'
  });
}

/* ------------------------------------------------------------------
   ORGANIZATION SETTINGS LOGIC
   ------------------------------------------------------------------ */




// Cropping state & refs
const isShowModal = ref<boolean>(false)
const uploadInput = ref<HTMLInputElement | null>(null)
const pic = ref<string>('')
const result = reactive({ dataURL: '', blobURL: '' })
const selectedFile = ref<File | null>(null)

function selectFile(e: Event) {
  pic.value = ''
  result.dataURL = ''
  result.blobURL = ''
  const { files } = e.target as HTMLInputElement
  if (!files || !files.length) return
  const file = files[0]
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => {
    pic.value = String(reader.result)
    isShowModal.value = true
    if (!uploadInput.value) return
    uploadInput.value.value = ''
  }
}



function ready() {

  console.log('Cropper is ready.')
}

async function getResult() {
  if (!cropper) return
  const base64 = cropper.getDataURL()
  const blob: Blob | null = await cropper.getBlob()
  if (!blob) return
  const file = await cropper.getFile({})
  result.dataURL = base64
  result.blobURL = URL.createObjectURL(blob)
  isShowModal.value = false
  // set selectedFile for upload
  selectedFile.value = file
  // trigger upload with cropped file
  if(file){
  try {
    loadingOrg.value = true;
    const uploadedUrl = await uploadOrgLogoToBucket(file);
    if (uploadedUrl) {
      orgData.value.logo = uploadedUrl;
      updateOrganization()
    }
  } catch (err: any) {
    console.error('Error uploading logo:', err);
    showError(
      t('dashboard.settings.orgLogoUploadFail', {
        error: err.message || 'Unknown error'
      })
    );
  } finally {
    loadingOrg.value = false;
  }
  }


}

const loadingOrg = ref(false);

// We'll store all org data in orgData
const orgData = ref<any>({
  id: null,
  created_at: null,
  name: '',
  domains: [],
  description: '',
  logo: '',
  country: '',
  address: '',
  trainer_assign: false
});

const domainString = ref('');


// On mount, if user is 'Organization Admin', fetch org data
onMounted(async () => {
  if (userStore.userProfile?.roles?.includes('Organization Admin')) {
    loadingOrg.value = true;
    await getOrganization();
    loadingOrg.value = false;
  }
});

// Fetching organization data based on user profile
async function getOrganization() {
  try {
    const orgId = userStore.userProfile?.organization;
    if (!orgId) {
      showError(t('dashboard.settings.orgNoOrgIdFound'));
      return;
    }

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (error) {
      throw error;
    }

    // Initialize orgData
    orgData.value = { ...data };
    // If domains is an array, convert to multiline text
    if (Array.isArray(data.domains)) {
      domainString.value = data.domains.join(', ');
    }
  } catch (err: any) {
    console.error('Error fetching organization data:', err);
    showError(
      t('dashboard.settings.orgFetchError', {
        error: err.message || 'Unknown error'
      })
    );
  }
}

// Called by "Save" button to update the org row
async function updateOrganization() {
  try {
    // Convert domainString to array
    const domainsArray =
      domainString.value.trim().length > 0
        ? domainString.value.split(',').map((d: string) => d.trim())
        : [];

    const { error } = await supabase
      .from('organizations')
      .update({
        name: orgData.value.name,
        domains: domainsArray,
        description: orgData.value.description,
        logo: orgData.value.logo,
        country: orgData.value.country,
        address: orgData.value.address,
        trainer_assign: orgData.value.trainer_assign
      })
      .eq('id', orgData.value.id);

    if (error) throw error;

    showSuccess(t('dashboard.settings.orgUpdateSuccess'));
    // Optionally refetch data
    await getOrganization();
  } catch (err: any) {
    console.error('Error updating organization:', err);
    showError(
      t('dashboard.settings.orgUpdateFail', {
        error: err.message || 'Unknown error'
      })
    );
  }
}


// Actually upload the file to your Supabase Storage
async function uploadOrgLogoToBucket(file: File): Promise<string | null> {
  try {
    const fileName = `org_logos/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('storage').upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

    if (error) throw error;
    const { data: publicUrlData } = supabase.storage.from('storage').getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
</script>

<style scoped>
.form-control label {
  margin-bottom: 0.25rem;
}
.switch-mt {
  margin-top: 2rem !important;
}
.switch-label {
  margin-bottom: 0 !important;
}
</style>
