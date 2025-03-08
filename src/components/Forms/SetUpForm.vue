<script setup lang="ts">
import { ref } from "vue";
import { supabase } from "@/lib/supabaseClient"; // Ensure Supabase is correctly set up
import router from "@/router";
import { useUserStore } from "@/stores/user";
import Swal from "sweetalert2";

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
    color: '#E8F3ED',
  })
}

function showError(message: string) {
  Swal.fire({
    title: 'Error!',
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED',
  })
}
const fileInput = ref<HTMLInputElement | null>(null);
const uploadedImage = ref<string | null>(null); // Preview image
const selectedFile = ref<File | null>(null); // File to upload
const userStore = useUserStore();
const isLoading = ref(false); // Loading state

if (!localStorage.getItem('LoggedInUser')) {
  router.push('login');
}
if (localStorage.getItem('LoggedInUser') && localStorage.getItem('UserID') && localStorage.getItem('LoggedInTrainer') == 'false') {
  router.push('register-as-a-trainer');
} else if (localStorage.getItem('LoggedInUser') && localStorage.getItem('UserID') && localStorage.getItem('LoggedInTrainer') == 'true') {
  router.push({ name: 'dashboard-home' });
}

const formData = ref({
  firstName: "",
  lastName: "",
  sex: "",
  age: null as number | null,
  nationality: "",
  phone: "",
});

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    selectedFile.value = file;

    // Preview the image
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
  if (fileInput.value) fileInput.value.value = "";
};

const validateAndSubmit = async () => {
  const email = localStorage.getItem("LoggedInUser");

  if (!email) {
    alert("No logged-in user found. Please log in.");
    return;
  }

  const { firstName, lastName, sex, age, nationality, phone } = formData.value;

  if (!selectedFile.value) {
    alert("Please upload a profile picture.");
    return;
  }

  if (!firstName || !lastName || !sex || !age || !nationality || !phone) {
    alert("All fields are required.");
    return;
  }

  if (age <= 0) {
    alert("Please enter a valid age.");
    return;
  }

  try {
    isLoading.value = true; // Start loading

    // Upload the file to Supabase storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from("storage") // Replace with your bucket name
      .upload(`avatars/${selectedFile.value.name}`, selectedFile.value, {
        cacheControl: "3600",
        upsert: true,
      });

    if (storageError) throw storageError;

    // Generate the public URL
    const { data: urlData } = supabase.storage
      .from("storage")
      .getPublicUrl(`avatars/${selectedFile.value.name}`);

    if (!urlData?.publicUrl) {
      throw new Error("Failed to generate public URL for the image.");
    }

    // Save the data to the `users` table
    const { data, error } = await supabase.from("users").upsert({
      email,
      first_name: firstName,
      last_name: lastName,
      sex,
      age,
      nationality,
      phone,
      avatar: urlData.publicUrl,
    });

    if (error) {
      console.error(error);
      alert("Error saving profile. Please try again.");
      return;
    }

    alert("Profile successfully updated!");
    userStore.getUserProfile();
  } catch (err) {
    console.error(err);
    alert("An error occurred. Please try again.");
  } finally {
    isLoading.value = false; // Stop loading
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
      <h2 class="text-body text-rafik-sectext">
        Set up your profile to tell your clients more about yourself...
      </h2>
      <div v-if="isLoading" class="text-center text-lg font-bold text-rafik-sectext">
        Loading...
      </div>
      <div v-else>
        <div class="flex gap-6 items-center">
          <div>
            <label for="profile-picture" class="block text-sm font-medium text-rafik-sectext mb-2">
              Profile Picture
            </label>
            <div v-if="uploadedImage" class="w-64 h-64 relative">
              <img :src="uploadedImage" alt="Uploaded Preview" class="w-full h-full object-cover rounded-lg" />
              <button
                @click="removeImage"
                class="absolute w-64 h-64 opacity-0 hover:opacity-50 text-white bg-red-500 hover:cursor-pointer top-0 flex items-center justify-center hover:bg-red-600 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Remove Image
              </button>
            </div>
            <div
              v-else
              class="w-64 h-64 border-2 border-dashed border-rafik-sectext rounded-lg flex items-center justify-center cursor-pointer hover:bg-rafik-secbg focus:ring-2 focus:ring-offset-2 focus:ring-background-rafik-pribg"
              @click="triggerFileInput"
            >
              <span class="text-center text-rafik-sectext">
                Drag and drop an image here, or click to upload
              </span>
            </div>
            <input
              type="file"
              id="profile-picture"
              accept="image/*"
              class="hidden"
              ref="fileInput"
              @change="handleFileChange"
            />
          </div>
        </div>
        <input type="submit" class="btn-lg" :disabled="isLoading" value="Submit" />
      </div>
    </form>
  </div>
</template>
