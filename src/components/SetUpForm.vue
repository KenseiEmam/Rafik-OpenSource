<script setup lang="ts">
import { ref } from "vue";
import { supabase } from "@/lib/supabaseClient"; // Ensure this is correctly set up

const fileInput = ref<HTMLInputElement | null>(null);
const uploadedImage = ref<string | null>(null);

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
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImage.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImage.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const removeImage = () => {
  uploadedImage.value = null;
  if (fileInput.value) fileInput.value.value = "";
};

const validateAndSubmit = async () => {
  const email = localStorage.getItem("LoggedInUser");

  if (!email) {
    alert("No logged-in user found. Please log in.");
    return;
  }

  const { firstName, lastName, sex, age, nationality, phone } = formData.value;

  if (!uploadedImage) {
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
    const { data, error } = await supabase.from("users").upsert({
      email,
      first_name: firstName,
      last_name: lastName,
      sex,
      age,
      nationality,
      phone,
      avatar: uploadedImage, // Assuming you store the image as a Base64 string or upload it to storage.
    });

    if (error) {
      console.error(error);
      alert("Error saving profile. Please try again.");
      return;
    }

    alert("Profile successfully updated!");
  } catch (err) {
    console.error(err);
    alert("An error occurred. Please try again.");
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
        Set up your profile to tell your clients more about yourself, get
        verified, and begin making your own workouts and programs. We look
        forward to adding you to our roster of professionals and seeing you
        grow with us!
      </h2>
      <div class="flex gap-6 items-center">
        <div>
          <!-- Profile Picture -->
          <label
            for="profile-picture"
            class="block text-sm font-medium text-rafik-sectext mb-2"
          >
            Profile Picture
          </label>
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
            class="w-64 h-64 border-2 border-dashed border-rafik-sectext rounded-lg flex items-center justify-center cursor-pointer hover:bg-rafik-secbg focus:ring-2 focus:ring-offset-2 focus:ring-background-rafik-pribg"
            @dragover.prevent
            @drop.prevent="handleDrop"
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
          <p class="label text-rafik-sectext">
            Upload a nice photo of your face, try to include your entire face
            with your hair and collar showing...
          </p>
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
      <div>
        <label for="age" class="text-body uppercase">Age</label>
        <input
          v-model="formData.age"
          type="number"
          id="age"
          class="rafik-text-input"
          placeholder="Enter your age"
        />
      </div>
      <div>
        <label for="nationality" class="text-body uppercase">Nationality</label>
        <input
          v-model="formData.nationality"
          type="text"
          id="nationality"
          class="rafik-text-input"
          placeholder="Enter your nationality"
        />
      </div>
      <div>
        <label for="phone" class="text-body uppercase">Phone Number</label>
        <input
          v-model="formData.phone"
          type="tel"
          id="phone"
          class="rafik-text-input"
          placeholder="Enter your phone number"
        />
      </div>
      <input type="submit" class="btn-lg" value="Submit" />
    </form>
  </div>
</template>
