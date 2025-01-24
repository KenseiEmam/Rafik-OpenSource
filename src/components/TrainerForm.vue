<template>
  <div class="flex justify-center items-center">
    <form
      @submit.prevent="handleSubmit"
      class="card border-rafik p-8 rounded-lg shadow-md w-full space-y-6"
    >
      <h1 class="header-large">Professional Details</h1>
      <h2 class="text-body text-rafik-sectext">
        Let’s set up your professional profile to showcase your skills and attract the right clients.
      </h2>

      <!-- Preferred Title -->
      <div>
        <label for="preferred-title" class="text-body uppercase">Preferred Title</label>
        <input
          v-model="formData.preferredTitle"
          type="text"
          id="preferred-title"
          class="rafik-text-input"
          placeholder="Enter your preferred title (e.g., Certified Personal Trainer)"
        />
      </div>

      <!-- Professional Summary -->
      <div>
        <label for="professional-summary" class="text-body uppercase">Professional Summary</label>
        <textarea
          v-model="formData.professionalSummary"
          id="professional-summary"
          class="rafik-text-input"
          placeholder="Write a short professional summary about yourself"
        ></textarea>
      </div>

      <!-- Years of Experience -->
      <div>
        <label for="years-experience" class="text-body uppercase">Years of Experience</label>
        <input
          v-model="formData.yearsExperience"
          type="number"
          id="years-experience"
          class="rafik-text-input"
          placeholder="Enter your years of experience"
        />
      </div>

      <!-- Preferred Clients -->
      <div>
        <label class="text-body uppercase">Preferred Clients</label>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="client in clientOptions"
            :key="client"
            class="px-4 py-2 border rounded-lg text-sm cursor-pointer hover:bg-rafik-secbg"
            :class="{
              'bg-rafik-secondary text-rafik-pritext': formData.preferredClients.includes(
                client
              ),
              'text-rafik-sectext': !formData.preferredClients.includes(client),
            }"
            @click="toggleClientSelection(client)"
          >
            {{ client }}
          </div>
        </div>
        <p class="text-sm text-rafik-sectext mt-2">
          You can select up to 5 preferred client types.
        </p>
      </div>

      <!-- Certifications -->
      <div>
        <label class="text-body uppercase">Relevant Certifications</label>
        <div class="w-full flex flex-col gap-4">
          <div
            class="border-2 border-dashed border-rafik-sectext rounded-lg flex items-center justify-center cursor-pointer hover:bg-rafik-secbg focus:ring-2 focus:ring-offset-2 focus:ring-background-rafik-pribg p-4"
            @click="triggerFileInput"
          >
            <span class="text-rafik-sectext">
              Drag and drop files here, or click to upload
            </span>
          </div>
          <input
            type="file"
            ref="fileInput"
            class="hidden"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            @change="handleFileChange"
          />
          <ul v-if="uploadedFiles.length" class="list-disc pl-5">
            <li
              v-for="file in uploadedFiles"
              :key="file.name"
              class="text-rafik-sectext"
            >
              {{ file.name }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Submit Button -->
      <input type="submit" class="btn-lg" value="Submit" />
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { supabase } from "@/lib/supabaseClient"; // Import your Supabase client

const formData = ref({
  preferredTitle: "",
  professionalSummary: "",
  yearsExperience: null as number | null,
  preferredClients: [] as string[],
});

const clientOptions = [
  "Disabilities",
  "Seniors",
  "Children",
  "Weight Management",
  "Rehabilitation",
  "Strength and Conditioning",
  "Bodybuilders",
  "Martial Arts",
];

const uploadedFiles = ref<File[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

const toggleClientSelection = (client: string) => {
  const index = formData.value.preferredClients.indexOf(client);
  if (index === -1 && formData.value.preferredClients.length < 5) {
    formData.value.preferredClients.push(client);
  } else if (index !== -1) {
    formData.value.preferredClients.splice(index, 1);
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    // Append new files to the uploadedFiles list
    uploadedFiles.value = Array.from(target.files);
  }
};

const handleSubmit = async () => {
  const userId = localStorage.getItem("UserID");
  if (!userId) {
    alert("No logged-in user found. Please log in.");
    return;
  }

  const { preferredTitle, professionalSummary, yearsExperience, preferredClients } =
    formData.value;

  if (!preferredTitle || !professionalSummary || !yearsExperience || preferredClients.length === 0) {
    alert("All fields are required.");
    return;
  }

  try {
    // Upload multiple certification files to Supabase bucket and collect their URLs
    const uploadedFileUrls: string[] = [];
    for (const file of uploadedFiles.value) {
      const { data, error } = await supabase.storage
        .from("certifications")
        .upload(`certifications/${userId}/${file.name}`, file, { upsert: true });

      if (error) throw error;

      const { publicUrl } = supabase.storage
        .from("certifications")
        .getPublicUrl(`certifications/${userId}/${file.name}`);
      uploadedFileUrls.push(publicUrl);
    }

    // Insert data into `trainer_profile` table
    const { data: trainerProfile, error: trainerError } = await supabase
      .from("trainer_profile")
      .insert({
        user_id: userId,
        preferred_title: preferredTitle,
        professional_summary: professionalSummary,
        years_experience: yearsExperience,
        preferred_clients: preferredClients,
        certifications: uploadedFileUrls,
      })
      .select()
      .single();

    if (trainerError) throw trainerError;

    // Update the user's trainer_profile ID
    const { error: userError } = await supabase
      .from("users")
      .update({ trainer_profile: trainerProfile.id })
      .eq("id", userId);

    if (userError) throw userError;

    alert("Profile successfully updated!");
  } catch (err) {
    console.error(err);
    alert("An error occurred. Please try again.");
  }
};
</script>
