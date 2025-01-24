<template>
  <div class="flex justify-center items-center  ">
    <form class="card border-rafik p-8 rounded-lg shadow-md w-full  space-y-6">
      <h1 class="header-large">Almost There!</h1>
      <h2 class="text-body text-rafik-sectext">Set up your profile to tell your clients more about yourself, get verified and begin making your own workouts and programs. We look forward to adding you to our roster of professionals and seeing you grow with us!</h2>
      <div class="flex gap-6 items-center">

        <!-- Profile Picture -->
        <div>
          <label
            for="profile-picture"
            class="text-body uppercase mb-2"
          >
            Profile Picture
          </label>
          <div
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
            <!-- First Name -->
            <div class="">
              <label for="first-name" class="text-body uppercase">First Name</label>
              <input
                type="text"
                id="first-name"
                class="rafik-text-input"
                placeholder="Enter your first name"
              />
            </div>

            <!-- Last Name -->
            <div>
              <label for="last-name" class="text-body uppercase">Last Name</label>
              <input
                type="text"
                id="last-name"
                class="rafik-text-input"
                placeholder="Enter your last name"
              />
            </div>
            <p class="label text-rafik-sectext">Upload a nice photo of your face, try to include your entire face with your hair and collar showing. The more professional your photo, the nicer it will look to your potential clients.
              Try to keep your uploads in a 1x1 square format and below 250 mbs in size.
              </p>
        </div>
      </div>



      <!-- Sex -->
      <div>
        <label for="sex" class="text-body uppercase">Sex</label>
        <select
          id="sex"
          class="rafik-text-input"
        >
          <option class="text-rafik-sectext" value="" disabled selected>Select your sex</option>
          <option class="text-rafik-sectext" value="male">Male</option>
          <option class="text-rafik-sectext" value="female">Female</option>
          <option class="text-rafik-sectext" value="other">Other</option>
        </select>
      </div>

      <!-- Age -->
      <div>
        <label for="age" class="text-body uppercase">Age</label>
        <input
          type="number"
          id="age"
          class="rafik-text-input"
          placeholder="Enter your age"
        />
      </div>

      <!-- Nationality -->
      <div>
        <label for="nationality" class="text-body uppercase">Nationality</label>
        <input
          type="text"
          id="nationality"
          class="rafik-text-input"
          placeholder="Enter your nationality"
        />
      </div>

      <!-- Phone Number -->
      <div>
        <label for="phone" class="text-body uppercase">Phone Number</label>
        <input
          type="tel"
          id="phone"
          class="rafik-text-input"
          placeholder="Enter your phone number"
        />
      </div>

      <!-- Submit Button -->
      <input type="submit" class="btn-lg" value="submit">
    </form>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    console.log("File selected:", file.name);
  }
};

const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0];
  if (file) {
    console.log("File dropped:", file.name);
  }
};
</script>
