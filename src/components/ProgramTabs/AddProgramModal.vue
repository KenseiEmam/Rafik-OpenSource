<template>
  <div
    v-if="props.visible"
    class="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
  >
    <div class="card rounded-lg shadow p-6">
      <h2 class="contentH-small">Add Program</h2>
      <p class="text-body mb-4">
        New programs will be set to the status of draft. You may have up to 3 active programs at a time and 3 drafts.
      </p>
      <form @submit.prevent="submitForm" class="grid grid-cols-2 gap-6">
        <!-- Program Photo Field -->
        <div class="flex items-center justify-center flex-col">
          <label class="block text-sm font-medium mb-2">Program Photo</label>
          <div v-if="uploadedImage" class="w-64 h-64 relative ">
            <img
              :src="uploadedImage"
              alt="Uploaded Preview"
              class="w-full h-full object-cover rounded-lg "
            />
            <button
              @click.prevent="removeImage"
              class="absolute w-64 h-64 opacity-0 hover:opacity-50 text-white bg-red-500 hover:cursor-pointer top-0 flex items-center justify-center hover:bg-red-600 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Remove Image
            </button>
          </div>
          <div
            v-else
            class="w-64 h-64 border-2 border-dashed border-gray-400  rounded-lg flex items-center justify-center cursor-pointer hover:bg-rafik-secbg dark:bg-rafik-darksecbg focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="triggerFileInput"
          >
            <span class="text-center text-gray-500">
              Drag and drop an image here, or click to upload
            </span>
          </div>
          <input
            type="file"
            accept="image/*"
            class="hidden"
            ref="fileInput"
            @change="handleFileChange"
            required
          />
        </div>
        <div>

          <!-- Program Name Field -->
          <div class="mb-4">
            <label for="program_name" class="block text-sm font-medium">Program Name</label>
            <input
              type="text"
              id="program_name"
              v-model="program.program_name"
              class="rafik-text-input"
              required
              :class="{'border-red-500': errors.program_name}"
            />
            <span v-if="errors.program_name" class="text-red-500 text-sm">{{ errors.program_name }}</span>
          </div>

          <!-- Program Description Field -->
          <div class="mb-4">
            <label for="program_description" class="block text-sm font-medium">Program Description</label>
            <textarea
              id="program_description"
              v-model="program.program_description"
              class="rafik-text-input"
              rows="4"
              required
              :class="{'border-red-500': errors.program_description}"
            ></textarea>
            <span v-if="errors.program_description" class="text-red-500 text-sm">{{ errors.program_description }}</span>
          </div>

          <!-- Difficulty Level Field -->
          <div class="mb-4">
            <label for="difficulty_level" class="block text-sm font-medium">Difficulty Level</label>
            <select
              id="difficulty_level"
              v-model="program.difficulty_level"
              class="rafik-text-input"
              required
              :class="{'border-red-500': errors.difficulty_level}"
            >
              <option value="" disabled>Select Difficulty Level</option>
              <option value="Foundational">Foundational</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <span v-if="errors.difficulty_level" class="text-red-500 text-sm">{{ errors.difficulty_level }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class=" col-span-2 flex justify-end">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-md bg-red-500 border-red-500 hover:bg-red-400 rounded mr-2"
          >
            Cancel
          </button>
          <button type="submit" class="btn-md rounded">
            Add Program
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { supabase } from "@/lib/supabaseClient"; // Ensure Supabase is correctly set up

const props = defineProps({
  visible: Boolean,
});

const emits = defineEmits(["close", "submit"]);

const program = ref({
  program_name: "",
  program_description: "",
  trainer_id: localStorage.getItem("UserID"),
  status: "Draft",
  difficulty_level: "",
  tags:[],
  program_focus: [0, 0, 0, 0], // Default program focus array
});

const errors = ref<any>({});

const fileInput = ref<HTMLInputElement | null>(null);
const uploadedImage = ref<string | null>(null); // For preview
const selectedFile = ref<File | null>(null); // For upload

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    selectedFile.value = file;

    // Generate preview
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

const uploadFileToBucket = async (): Promise<string | null> => {
  if (!selectedFile.value) {
    alert("Please upload a program photo.");
    return null;
  }

  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from("storage") // Replace with your bucket name
      .upload(`media/${Date.now()}_${selectedFile.value.name}`, selectedFile.value, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading file:", error.message);
      alert("Failed to upload the program photo. Please try again.");
      return null;
    }

    // Retrieve the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from("storage")
      .getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      alert("Failed to retrieve the URL for the program photo.");
      return null;
    }

    return urlData.publicUrl;
  } catch (err) {
    console.error("Error during file upload:", err);
    alert("An error occurred while uploading the program photo.");
    return null;
  }
};

const validateForm = () => {
  errors.value = {};

  if (!program.value.program_name) {
    errors.value.program_name = "Program name is required.";
  }

  if (!program.value.program_description) {
    errors.value.program_description = "Program description is required.";
  }

  if (!program.value.difficulty_level) {
    errors.value.difficulty_level = "Please select a difficulty level.";
  }


  return Object.keys(errors.value).length === 0;
};

const submitForm = async () => {
  if (!validateForm()) return;

  const photoUrl = await uploadFileToBucket();
  if (!photoUrl) return;

  // Emit the form data with the photo URL
  emits("submit", {
    ...program.value,
    program_photo: photoUrl,
  });

  // Reset the form
  program.value = {
    program_name: "",
    program_description: "",
    trainer_id: localStorage.getItem("UserID"),
    status: "Draft",
    difficulty_level: "",
    tags:[],
    program_focus: [0, 0, 0, 0], // Reset program focus array
  };
  removeImage();
};
</script>
