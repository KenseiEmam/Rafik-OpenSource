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
              'bg-rafik-secondary text-rafik-pritext': formData.preferredClients.includes(client),
              'text-rafik-sectext': !formData.preferredClients.includes(client),
            }"
            @click="toggleClientSelection(client)"
          >
            {{ client }}
          </div>
        </div>
        <p class="label text-rafik-sectext mt-2">
          You can select up to 5 preferred client types.
        </p>
      </div>

      <!-- Certifications -->
      <div>
        <label class="text-body uppercase">Relevant Certifications</label>
        <p class="text-rafik-sectext label my-2">
          Please make sure you upload your training license relevant to your country of operation, as well as one training certification. Other certifications such as diplomas or specialization certificates are not necessary to access the dashboard, however, they may play an important role when accepting program submissions.
        </p>
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
              v-for="(file, index) in uploadedFiles"
              :key="file.name"
              class="text-rafik-sectext flex justify-between py-2 border-b border-rafik-sectext"
            >
              <p>{{ file.name }}</p>
              <button @click="handleFileRemove(index)" class="text-red-500 hover:text-red-300">Remove</button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Loading Indicator -->
      <div v-if="loading" class="text-center 2xl:my-auto subheader-small uppercase animate-pulse">
        Loading Entitlement and Profile Data Please Hold...
      </div>

      <!-- Submit Button -->
      <input type="submit" class="btn-lg" :disabled="loading" value="Submit" />
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useUserStore } from "@/stores/user";
import { useEntitlementStore } from "@/stores/entitlementstores";
import { supabase } from "@/lib/supabaseClient";
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

const userStore = useUserStore();
const entitlementStore = useEntitlementStore();
const loading = ref(false);

const formData = ref({
  preferredTitle: "",
  professionalSummary: "",
  yearsExperience: null as number | null,
  preferredClients: [] as string[],
});

const clientOptions = ["Athletes", "General Fitness", "Rehabilitation", "Weight Loss", "Strength Training"];

const toggleClientSelection = (client: string) => {
  if (formData.value.preferredClients.includes(client)) {
    formData.value.preferredClients = formData.value.preferredClients.filter(c => c !== client);
  } else if (formData.value.preferredClients.length < 5) {
    formData.value.preferredClients.push(client);
  }
};

const uploadedFiles = ref<File[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    uploadedFiles.value = [...uploadedFiles.value, ...Array.from(input.files)];
  }
};

const handleFileRemove = (index: number) => {
  uploadedFiles.value.splice(index, 1);
};

const handleSubmit = async () => {
  if (loading.value) return;

  const userId = localStorage.getItem("UserID");
  if (!userId) {
    showError("No logged-in user found. Please log in.");
    return;
  }

  const { preferredTitle, professionalSummary, yearsExperience, preferredClients } = formData.value;

  if (!preferredTitle || !professionalSummary || !yearsExperience || preferredClients.length === 0) {
    showError("All fields are required.");
    return;
  }

  try {
    loading.value = true;

    const uploadedFileUrls = [];
    for (const file of uploadedFiles.value) {
      const { data, error } = await supabase.storage
        .from("storage")
        .upload(`certifications/${userId}/${file.name}`, file, { upsert: true });

      if (error) throw error;

      uploadedFileUrls.push(
        `https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/${data.path}`
      );
    }

    const { data: trainerProfile, error: trainerError } = await supabase
      .from("trainer_profile")
      .insert({
        user_id: userId,
        title: preferredTitle,
        bio: professionalSummary,
        programs: [],
        clients: [],
        certifications: [],
        years_of_experience: yearsExperience,
        preferred_clients: preferredClients,
        certifications_links: uploadedFileUrls,
      })
      .select()
      .single();

    if (trainerError) throw trainerError;

    await entitlementStore.createMultipleEntitlements(userId, 20);

    showSuccess("Profile successfully updated!");
    userStore.getUserProfile();
  } catch (err) {
    console.error(err);
    showError("An error occurred. Please try again.");
  } finally {
    loading.value = false;
  }
};
</script>
