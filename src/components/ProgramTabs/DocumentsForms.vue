<script setup lang="ts">
import { ref, watch, defineEmits } from "vue";
import debounce  from "lodash/debounce";
import { supabase } from "@/lib/supabaseClient";
// Props to receive the program object
const props = defineProps({
  program: {
    type: Object,
    required: true,
  },
});
const isProcessing = ref(false); // New state for tracking processing

const handleFileUpload = async (event: any) => {
  const file = event.target.files[0];
  if (file) {
    isProcessing.value = true; // Set processing state to true
    try {
      // Upload the file to Supabase Storage under the "referrals" folder
      const { data, error } = await supabase.storage
        .from('storage') // your bucket name
        .upload(`media/${file.name}`, file, {
          cacheControl: '3600', // Cache for 1 hour
          upsert: true, // To overwrite if the file already exists
        });

      if (error) {
        console.error('Error uploading file:', error.message);
        return;
      }

      // Retrieve the public URL for the uploaded file
      const { data: urlData } = await supabase.storage
        .from("storage")
        .getPublicUrl(data.path);

      if (!urlData?.publicUrl) {
        alert("Failed to retrieve the URL for the program photo.");
        return null;
      }

      // Update the program store with the referral link
      emit('updateProgramField', 'referral', urlData?.publicUrl);

      console.log('File uploaded successfully:', urlData?.publicUrl);
    } catch (err: any) {
      console.error('Error uploading file:', err.message);
    } finally {
      isProcessing.value = false; // Set processing state to false after the process
    }
  } else {
    console.warn('No file selected');
  }
};

const fileInput = ref<HTMLInputElement | null>(null);

const deleteDocument = async () => {
  if (props.program.referral) {
    isProcessing.value = true; // Set processing state to true
    try {
      // Extract the file name from the referral URL
      const fileName = props.program.referral.split('/').pop();

      // Delete the file from Supabase Storage
      const { error } = await supabase.storage
        .from('storage') // your bucket name
        .remove([`media/${fileName}`]);

      if (error) {
        console.error('Error deleting document:', error.message);
        return;
      }

      // Clear the referral URL from the program
      emit('updateProgramField', 'referral', null);

      console.log('Document deleted successfully.');
    } catch (err:any) {
      console.error('Error deleting document:', err.message);
    } finally {
      isProcessing.value = false; // Set processing state to false after the process
    }
  } else {
    console.warn('No document to delete.');
  }
};

interface Question {
  type: string;
  question?: string;
  answer?: any;
}

// Inductions
const inductions = ref<Question[]>(props.program.inductions || []);
const follow = ref<Question[]>(props.program.follow || []);

function addInduction(type: string) {
  inductions.value.push({
    type: type,
    question: "",
    answer: null,
  });
  emitUpdate();
}
// Using 'fileInput' to trigger file selection
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

function removeInduction(index: number) {
  inductions.value.splice(index, 1);
  emitUpdate();
}

// Follow-up
function addFollow(type: string) {
  follow.value.push({
    type: type,
    question: "",
    answer: null,
  });
  emitUpdate();
}

function removeFollow(index: number) {
  follow.value.splice(index, 1);
  emitUpdate();
}

// Debounced function to update the program
const emit = defineEmits(["updateProgramField"]);

const emitUpdate = debounce(() => {
  emit("updateProgramField", "inductions", inductions.value);
  emit("updateProgramField", "follow", follow.value);
}, 500);

// Watch for question input changes
watch(
  () => [...inductions.value, ...follow.value].map((q) => q.question),
  emitUpdate,
  { deep: true }
);
</script>

<template>
  <div class="grid md:grid-cols-2 2xl:grid-cols-3 items-start h-full relative flex-1 gap-4">
    <!-- Induction Form -->
    <div style="height: 60vh;" class="card p-8 h-full overflow-y-auto space-y-4">
      <h3 class="contentH-medium">Client Induction Form</h3>
      <p class="text-label text-rafik-sectext dark:text-rafik-darksectext">
        The client induction form is sent to all clients once they are subscribed to the program. It should usually include questions pertaining to client readiness and also about their goals for the specific program.
      </p>
      <div class="text-xs 2xl:text-sm flex gap-4 flex-wrap divide-x divide-rafik-sectext">
        <button @click="addInduction('text')" class="pl-2 hover:text-rafik-pritext dark:text-rafik-darkpritext">+ Add Text </button>
        <button @click="addInduction('number')" class="pl-2 hover:text-rafik-pritext dark:text-rafik-darkpritext">+ Add Number </button>
        <button @click="addInduction('boolean')" class="pl-2 hover:text-rafik-pritext dark:text-rafik-darkpritext">+ Add Boolean</button>
        <button @click="addInduction('upload')" class="pl-2 hover:text-rafik-pritext dark:text-rafik-darkpritext">+ Add Media Upload</button>
      </div>
      <div class="flex flex-col gap-3">
        <div v-for="(question, index) in inductions" :key="index" class="card p-6 border-rafik gradient-bg flex justify-between items-center">
          <div class="space-y-2">
            <p class="uppercase text-xs 2xl:text-sm font-semibold">{{ question.type }} Question</p>
            <input
              v-model="question.question"
              class="bg-transparent text-rafik-pritext dark:text-rafik-darkpritext px-0 header-small text-base 2xl:text-lg focus:outline-none border-none focus:ring-0"
              type="text"
              :placeholder="'Add a new ' + question.type + ' Question'"
              :id="question.type + index"
            />
          </div>
          <button @click="removeInduction(index)" class="text-red-500 hover:text-red-300 text-xl">X</button>
        </div>
      </div>
    </div>

    <!-- Follow-Up Form -->
    <div style="height: 60vh;" class="card p-8 h-full overflow-y-auto space-y-4">
      <h3 class="contentH-medium">Client Follow-Up Form</h3>
      <p class="text-label text-rafik-sectext dark:text-rafik-darksectext">
        The follow-up form is sent automatically to clients on a regular basis based on the interval set up in your settings. This form usually asks clients about their progress and urges them to update their weight setting.
      </p>
      <div class="text-xs 2xl:text-sm flex gap-4 flex-wrap divide-x divide-rafik-sectext">
        <button @click="addFollow('text')" class="pl-2 hover:text-rafik-pritext dark:text-rafik-darkpritext">+ Add Text </button>
        <button @click="addFollow('number')" class="pl-2 hover:text-rafik-pritext dark:text-rafik-darkpritext">+ Add Number </button>
        <button @click="addFollow('boolean')" class="pl-2 hover:text-rafik-pritext dark:text-rafik-darkpritext">+ Add Boolean</button>
        <button @click="addFollow('upload')" class="pl-2 hover:text-rafik-pritext dark:text-rafik-darkpritext">+ Add Media Upload</button>
      </div>
      <div class="flex flex-col gap-3">
        <div v-for="(question, index) in follow" :key="index" class="card p-6 border-rafik gradient-bg flex justify-between items-center">
          <div class="space-y-2">
            <p class="uppercase text-xs 2xl:text-sm font-semibold">{{ question.type }} Question</p>
            <input
              v-model="question.question"
              class="bg-transparent text-rafik-pritext dark:text-rafik-darkpritext px-0 header-small text-base 2xl:text-lg focus:outline-none border-none focus:ring-0"
              type="text"
              :placeholder="'Add a new ' + question.type + ' Question'"
              :id="question.type + index"
            />
          </div>
          <button @click="removeFollow(index)" class="text-red-500 hover:text-red-300 text-xl">X</button>
        </div>
      </div>
    </div>

    <!-- Referral Document -->
    <div class="card p-8 overflow-y-auto space-y-4 col-span-2 2xl:col-span-1">
      <h3 class="contentH-medium">AI Referral Document</h3>
      <p class="text-label text-rafik-sectext dark:text-rafik-darksectext">
        The AI referral document is used to respond to clients on a daily basis. Clients will have the option to refer to the trainer AI chat for quick questions, and the trainer can review the AI's response. Direct trainer messages will occur in a different inbox.
      </p>
      <div class="flex flex-col gap-4">
        <!-- View Document button -->
        <a :href="program.referral" target="_blank" v-if="program.referral" class="btn-lg-outline">
          VIEW DOCUMENT
        </a>
    <!-- File input and buttons -->
    <input
      type="file"
      @change="handleFileUpload"
      class="hidden"
      ref="fileInput"
    />
    <button
      v-if="!isProcessing"
      @click="triggerFileInput"
      class="btn-lg"
      :disabled="isProcessing"
    >
      {{ program.referral ? 'CHANGE DOCUMENT' : 'UPLOAD DOCUMENT' }}
    </button>

        <!-- Delete Document button -->
        <button
          v-if="program.referral && !isProcessing"
          @click="deleteDocument"
          class="btn-lg bg-red-500 hover:bg-red-600 uppercase"
          :disabled="isProcessing"
        >
          Delete Document
        </button>

        <!-- Processing placeholder -->
        <div v-if="isProcessing" class="absolute inset-0 flex items-center justify-center bg-opacity-50 bg-gray-500 z-10">
          <div class="text-white">Processing...</div>
        </div>
      </div>
    </div>
  </div>
</template>
