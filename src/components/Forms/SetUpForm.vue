<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { supabase } from '@/lib/supabaseClient'; // Ensure Supabase is correctly set up
import router from '@/router';
import { useUserStore } from '@/stores/user';
import Swal from 'sweetalert2';
import { useNationalStore } from '@/stores/nationalities';
import VuePictureCropper, { cropper } from 'vue-picture-cropper'
import { useI18n } from 'vue-i18n';
const { t , locale } = useI18n();
// Cropping state & refs
const isShowModal = ref<boolean>(false)
const uploadInput = ref<HTMLInputElement | null>(null)
const pic = ref<string>('')
const result = reactive({ dataURL: '', blobURL: '' })


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

  console.log('Cropper is ready!')
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
  if (file) {
    selectedFile.value = file;

    // Preview the image
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImage.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

}


const nationalStore = useNationalStore();
const darkness = localStorage.getItem('dark_mode');
onMounted(() => {
  nationalStore.getNationalities();
});
// Success and Error Alerts
function showSuccess(message: string) {
  Swal.fire({
    title: 'Success!',
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
    title: 'Error!',
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}
const isLoading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const uploadedImage = ref<string | null>(null); // Preview image
const selectedFile = ref<File | null>(null); // File to upload
const userStore = useUserStore();
if (!localStorage.getItem('LoggedInUser')) {
  router.push('login');
}
if (
  localStorage.getItem('LoggedInUser') &&
  localStorage.getItem('UserID') &&
  localStorage.getItem('LoggedInTrainer') == 'false'
) {
  router.push('rnot-a-member');
} else if (
  localStorage.getItem('LoggedInUser') &&
  localStorage.getItem('UserID') &&
  localStorage.getItem('LoggedInTrainer') == 'true'
) {
  router.push({ name: 'dashboard-home' });
}

const formData = ref({
  firstName: '',
  lastName: '',
  sex: '',
  dob: new Date(new Date().setFullYear(new Date().getFullYear() - 16)),
  nationality: '',
  phone: ''
});

const triggerFileInput = () => {
  fileInput.value?.click();
};



const removeImage = () => {
  uploadedImage.value = null;
  selectedFile.value = null;
  if (fileInput.value) fileInput.value.value = '';
};

const validateAndSubmit = async () => {
  const email = localStorage.getItem('LoggedInUser');
  isLoading.value = true;
  if (!email) {
    showError('No logged-in user found. Please log in.');
    return;
  }

  const { firstName, lastName, sex, dob, nationality, phone } = formData.value;

  if (!selectedFile.value) {
    showError('Please upload a profile picture.');
    return;
  }

  if (!firstName || !lastName || !sex || !dob || !nationality ) {
    showError('All fields are required.');
    return;
  }

  if (dob === null) {
    showError('Please enter a valid date of birth.');
    return;
  }

  try {
    // Upload the file to Supabase storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('storage') // Replace with your bucket name
      .upload(`avatars/${selectedFile.value.name}`, selectedFile.value, {
        cacheControl: '3600',
        upsert: true
      });

    if (storageError) throw storageError;

    // Generate the public URL
    const { data: urlData } = supabase.storage
      .from('storage')
      .getPublicUrl(`avatars/${selectedFile.value.name}`);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to generate public URL for the image.');
    }
    const darkness = localStorage.getItem('dark_mode');

    // Save the data to the `users` table
    const { data, error } = await supabase
      .from('users')
      .upsert({
        email,
        first_name: firstName,
        last_name: lastName,
        sex,
        dob,
        nationality,
        phone,
        avatar: urlData.publicUrl
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      showError('Error saving profile. Please try again.');
      return;
    }
    const userId = data.id;
    // Insert settings
    const { data: settingsProfile, error: settingsError } = await supabase
      .from('user_settings')
      .insert({
        user_id: userId
      })
      .select()
      .single();

    if (settingsError) throw settingsError;

    showSuccess('Profile successfully updated!');
    userStore.getUserProfile();
  } catch (err) {
    console.error(err);
    showError('An error occurred. Please try again.');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="flex justify-center items-center">
    <form
      @submit.prevent="validateAndSubmit"
      class="card border-rafik p-8 rounded-lg shadow-md w-full space-y-6"
    >
      <h1 class="header-large">Almost There!</h1>
      <h2 class="text-body text-rafik-sectext dark:text-rafik-darksectext">
        Set up your profile to tell your clients more about yourself...
      </h2>
      <div
        v-if="isLoading"
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
        <p>Loading...</p>
      </div>
      <div v-else>
        <div>
          <!-- Profile Picture -->
          <label
            for="profile-picture"
            class="block text-sm font-medium text-rafik-sectext dark:text-rafik-darksectext mb-2"
          >
            Profile Picture
          </label>
          <p class="label text-rafik-sectext dark:text-rafik-darksectext">
            Upload a nice photo of your face...
          </p>
          <div v-if="uploadedImage" class="w-64 h-64 relative">
            <img
              :src="uploadedImage"
              alt="Uploaded Preview"
              class="w-full h-full object-cover rounded-lg"
            />
            <button
              @click="removeImage"
              class="absolute w-64 h-64 opacity-0 hover:opacity-50 text-white bg-red-500 hover:cursor-pointer top-0 flex items-center justify-center hover:bg-red-600 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Remove Image
            </button>
          </div>

          <div
            v-else
            class="w-64 h-64 border-2 border-dashed border-rafik-sectext dark:border-rafik-darksectext rounded-lg flex items-center justify-center cursor-pointer hover:bg-rafik-secbg dark:bg-rafik-darksecbg focus:ring-2 focus:ring-offset-2 focus:ring-background-rafik-pribg"
            @click="triggerFileInput"
          >
            <span class="text-center text-rafik-sectext dark:text-rafik-darksectext">
              Drag and drop an image here, or click to upload
            </span>
          </div>

          <input
            type="file"
            id="profile-picture"
            accept="image/*"
            class="hidden"
            ref="fileInput"
            @change="selectFile"
          />
        </div>
        <div class="space-y-6 w-full">
          <div>
            <label for="first-name" class="text-body uppercase">First Name</label>
            <input
              v-model="formData.firstName"
              type="text"
              id="first-name"
              class="rafik-text-input"
              placeholder="Enter your first name"
            />
          </div>
          <div>
            <label for="last-name" class="text-body uppercase">Last Name</label>
            <input
              v-model="formData.lastName"
              type="text"
              id="last-name"
              class="rafik-text-input"
              placeholder="Enter your last name"
            />
          </div>
        </div>
      </div>
      <div>
        <label for="sex" class="text-body uppercase">Sex</label>
        <select v-model="formData.sex" id="sex" class="rafik-text-input">
          <option value="" disabled selected>Select your sex</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      <!-- dob -->
      <div class="form-control">
        <label class="block text-sm font-medium" for="dob">Date of Birth:</label>
        <VueDatePicker
          :dark="darkness === 'true'"
          v-model="formData.dob"
          placeholder="Select Date"
          :enable-time-picker="false"
          :max-date="new Date(new Date().setFullYear(new Date().getFullYear() - 16))"
        />
      </div>
      <!-- Nationality -->
      <div class="form-control">
        <label class="block text-sm font-medium" for="nationality">Nationality</label>
        <select
          id="nationality"
          v-model="formData.nationality"
          class="rafik-text-input w-full"
          required
        >
          <option value="" disabled selected>Select Nationality:</option>
          <option v-for="Nat in nationalStore.Nationalities" :value="Nat.nationality">
            {{ Nat.nationality }}
          </option>
        </select>
      </div>
      <div>
        <label for="phone" class="text-body uppercase">Phone Number</label>
        <vue-tel-input
          id="phone"
          v-model="formData.phone"
          styleClasses="phone-input"
          placeholder="Enter your phone number"
          :inputOptions="{ showDialCode: true, styleClasses: 'rafik-text-input' }"
          invalidMsg="'Invalid phone number'"
          validCharactersOnly
          autocomplete="on"
          name="telephone"
        />
      </div>
      <input :disabled="isLoading" type="submit" class="btn-lg" value="Submit" />
    </form>
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
  </div>
</template>
