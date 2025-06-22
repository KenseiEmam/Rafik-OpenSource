<script setup lang="ts">
import { ref, watch, defineEmits } from 'vue';
import debounce from 'lodash/debounce';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from 'vue-i18n';
import draggable from 'vuedraggable';
const { t, locale } = useI18n();
// Props to receive the program object
const props = defineProps({
  program: {
    type: Object,
    required: true
  }
});
const isProcessing = ref(false); // New state for tracking processing

function cleanFileName(filename: string): string {
  const parts = filename.split('.');
  if (parts.length < 2) return 'file.pdf'; // Invalid filename

  const ext = parts.pop()?.toLowerCase(); // Get the extension
  const name = parts.join('.'); // Rejoin in case filename had multiple dots

  const cleanName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents/diacritics
    .replace(/[’‘“”]/g, '') // Remove fancy quotes
    .replace(/[^a-zA-Z0-9 ]/g, '') // Remove non-alphanumerics (except space)
    .trim()
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase();

  return `${cleanName}.${ext}`;
}

const handleFileUpload = async (event: any) => {
  const file = event.target.files[0];
  if (file) {
    const fileName = cleanFileName(file.name);
    isProcessing.value = true; // Set processing state to true
    try {
      // Upload the file to Supabase Storage under the "referrals" folder
      const { data, error } = await supabase.storage
        .from('storage') // your bucket name
        .upload(`ai_documents/${props.program.id}/${fileName}`, file, {
          cacheControl: '3600', // Cache for 1 hour
          upsert: true // To overwrite if the file already exists
        });

      if (error) {
        console.error('Error uploading file:', error.message);
        return;
      }

      console.log('File uploaded successfully:');

      let { data: chatbot, error: insertError } = await supabase
        .from('chatbots')
        .insert({
          trainer_id: props.program.trainer_id,
          program_id: props.program.id,
          system_prompt: `You are a TOPSETS AI, a customer support agent for a personal trainer. You will receive questions about their training program '${props.program.program_name}''.`
        })
        .select('id')
        .single();

      if (insertError || !chatbot) {
        console.error('Error inserting chatbot:', insertError?.message || 'No chatbot data');
        let { data: chatbot2, error: selectError2 } = await supabase
          .from('chatbots')
          .select('id')
          .eq('program_id', props.program.id)
          .single();
        if (selectError2 || !chatbot2) {
          console.error('Error selecting chatbot:', selectError2?.message || 'No chatbot2 data');
          throw 'Error inserting or selecting chatbot';
        } else {
          chatbot = chatbot2;
          console.log('Old Chatbot selected successfully', chatbot);
        }
      } else {
        console.log('Chatbot inserted successfully', chatbot);
      }

      const { error: embedError, data: embedData } = await supabase.functions.invoke('api', {
        method: 'POST',
        body: {
          endpoint: 'ai-embed',
          chatbotId: chatbot.id,
          path: `${props.program.id}/${fileName}`,
          type: 'file'
        }
      });

      if (embedError || embedData?.success === false) {
        console.error('Error embedding file:', embedData?.message, embedError.message);
        throw String(embedError || embedData.message);
      } else {
        console.log(embedData.message || 'File embedded successfully');
      }

      // Retrieve the public URL for the uploaded file
      const { data: urlData } = await supabase.storage.from('storage').getPublicUrl(data.path);

      if (!urlData?.publicUrl) {
        throw 'Failed to retrieve the URL for the program photo.';
      }

      // Update the program store with the referral link
      emit('updateProgramField', 'referral', urlData?.publicUrl);

      console.log('File uploaded successfully:', urlData?.publicUrl);
    } catch (err: any) {
      if (typeof err == 'string') {
        alert(err);
      }
      console.error('Error uploading file:', err);
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

      const { data: chatData, error: chatError } = await supabase
        .from('chatbots')
        .delete()
        .eq('program_id', props.program.id)
        .select('id')
        .single();

      if (chatError) {
        console.error('Error deleting chatbot:', chatError.message);
      } else {
        const { error: vectorsError, data: deletedVectors } = await supabase
          .from('ai_vectors')
          .delete()
          .filter('metadata->>chatbot_id', 'eq', String(chatData.id))
          .select('id');
        console.log('Vectors deleted:', deletedVectors);
        if (vectorsError) {
          console.error('Error deleting vectors:', vectorsError.message);
        }
      }

      // Delete the file from Supabase Storage
      const { error } = await supabase.storage
        .from('storage') // your bucket name
        .remove([`ai_documents/${props.program.id}/${fileName}`]);

      if (error) {
        console.error('Error deleting document:', error.message);
      }
      const {data:chatData2,error:chatError2} = await supabase.from('chatbots').delete().eq('program_id',props.program.id);

      if(chatError) throw new Error(chatError.message)
      // Clear the referral URL from the program
      emit('updateProgramField', 'referral', null);

      console.log('Document deleted successfully.');
    } catch (err: any) {
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
    question: '',
    answer: null
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
    question: '',
    answer: null
  });
  emitUpdate();
}

function removeFollow(index: number) {
  follow.value.splice(index, 1);
  emitUpdate();
}

// Debounced function to update the program
const emit = defineEmits(['updateProgramField']);

const emitUpdate = debounce(() => {
  emit('updateProgramField', 'inductions', inductions.value);
  emit('updateProgramField', 'follow', follow.value);
}, 500);

// Watch for question input changes
watch(() => [...inductions.value, ...follow.value].map((q) => q.question), emitUpdate, {
  deep: true
});
</script>

<template>
  <div class="grid md:grid-cols-2 2xl:grid-cols-3 items-start h-full relative flex-1 gap-4">
    <!-- Induction Form -->
    <div style="height: 60vh" class="card p-8 h-full overflow-y-auto space-y-4">
      <h3 class="contentH-medium">
        {{ t('dashboard.tabs.program.docForms.clientInductionForm') }}
      </h3>
      <p class="text-label text-topsets-sectext dark:text-topsets-darksectext">
        {{ t('dashboard.tabs.program.docForms.clientInductionDescription') }}
      </p>
      <div
        class="text-sm 2xl:text-sm flex gap-4 flex-wrap divide-x divide-topsets-sectext dark:divide-topsets-darksectext"
      >
        <button
          @click="addInduction('text')"
          class="pl-2 hover:text-topsets-pritext dark:hover:text-topsets-darkpritext dark:text-topsets-darkpritext"
        >
          {{ t('dashboard.tabs.program.docForms.addTextInduction') }}
        </button>
        <button
          @click="addInduction('number')"
          class="pl-2 hover:text-topsets-pritext dark:hover:text-topsets-darkpritext dark:text-topsets-darkpritext"
        >
          {{ t('dashboard.tabs.program.docForms.addNumberInduction') }}
        </button>
        <button
          @click="addInduction('boolean')"
          class="pl-2 hover:text-topsets-pritext dark:hover:text-topsets-darkpritext dark:text-topsets-darkpritext"
        >
          {{ t('dashboard.tabs.program.docForms.addBooleanInduction') }}
        </button>
        <button
          @click="addInduction('upload')"
          class="pl-2 hover:text-topsets-pritext dark:hover:text-topsets-darkpritext dark:text-topsets-darkpritext"
        >
          {{ t('dashboard.tabs.program.docForms.addMediaUploadInduction') }}
        </button>
      </div>
      <div class="flex flex-col gap-3">
        <draggable
          class="flex flex-col gap-4 mb-5"
          v-model="inductions"
          handle=".handle"
          item-key="id"
        >
          <template #item="{ element, index }">
            <div
              class="card p-6 pl-2 border-topsets gradient-bg flex justify-between items-center text-left border gap-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 320 512"
                fill="currentColor"
                class="h-6 mr-3 handle text-topsets-sectext dark:text-topsets-darksectext hover:cursor-move"
              >
                <path
                  d="M40 352l48 0c22.1 0 40 17.9 40 40l0 48c0
                       22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0
                       -48c0-22.1 17.9-40 40-40zm192 0l48 0c22.1 0 40
                       17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1
                       0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40zM40 320
                       c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40l48
                       0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40
                       40l-48 0zM232 192l48 0c22.1 0 40 17.9 40 40l0
                       48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9
                       -40-40l0-48c0-22.1 17.9-40 40-40zM40 160c-22.1
                       0-40-17.9-40-40L0 72C0 49.9 17.9 32 40 32l48 0c22.1
                       0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48
                       0zM232 32l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1
                       -17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0
                       -48c0-22.1 17.9-40 40-40z"
                />
              </svg>
              <div class="space-y-2 w-full">
                <p class="uppercase text-sm 2xl:text-sm font-semibold">
                  {{ t('dashboard.tabs.program.docForms.questionLabel', { type: element.type }) }}
                </p>
                <input
                  v-model="element.question"
                  class="bg-transparent text-topsets-pritext dark:text-topsets-darkpritext px-0 text-base 2xl:text-lg focus:outline-none border-none focus:ring-0 w-full"
                  type="text"
                  :placeholder="
                    t('dashboard.tabs.program.docForms.addNewQuestionPlaceholder', {
                      type: element.type
                    })
                  "
                  :id="element.type + index"
                />
              </div>
              <button
                @click="removeInduction(index)"
                class="text-red-500 hover:text-red-300 text-xl"
              >
                {{ t('dashboard.tabs.program.docForms.removeInduction') }}
              </button>
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <!-- Follow-Up Form -->
    <div style="height: 60vh" class="card p-8 h-full overflow-y-auto space-y-4">
      <h3 class="contentH-medium">{{ t('dashboard.tabs.program.docForms.clientFollowUpForm') }}</h3>
      <p class="text-label text-topsets-sectext dark:text-topsets-darksectext">
        {{ t('dashboard.tabs.program.docForms.clientFollowUpDescription') }}
      </p>
      <div
        class="text-sm 2xl:text-sm flex gap-4 flex-wrap divide-x divide-topsets-sectext dark:divide-topsets-darksectext"
      >
        <button
          @click="addFollow('text')"
          class="pl-2 hover:text-topsets-pritext dark:hover:text-topsets-darkpritext dark:text-topsets-darkpritext"
        >
          {{ t('dashboard.tabs.program.docForms.addTextFollow') }}
        </button>
        <button
          @click="addFollow('number')"
          class="pl-2 hover:text-topsets-pritext dark:hover:text-topsets-darkpritext dark:text-topsets-darkpritext"
        >
          {{ t('dashboard.tabs.program.docForms.addNumberFollow') }}
        </button>
        <button
          @click="addFollow('boolean')"
          class="pl-2 hover:text-topsets-pritext dark:hover:text-topsets-darkpritext dark:text-topsets-darkpritext"
        >
          {{ t('dashboard.tabs.program.docForms.addBooleanFollow') }}
        </button>
        <button
          @click="addFollow('upload')"
          class="pl-2 hover:text-topsets-pritext dark:hover:text-topsets-darkpritext dark:text-topsets-darkpritext"
        >
          {{ t('dashboard.tabs.program.docForms.addMediaUploadFollow') }}
        </button>
      </div>
      <div class="flex flex-col gap-3">
        <draggable class="flex flex-col gap-4 mb-5" v-model="follow" handle=".handle" item-key="id">
          <template #item="{ element, index }">
            <div
              class="card p-6 pl-2 border-topsets gradient-bg flex justify-between items-center text-left border gap-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 320 512"
                fill="currentColor"
                class="h-6 mr-3 handle text-topsets-sectext dark:text-topsets-darksectext hover:cursor-move"
              >
                <path
                  d="M40 352l48 0c22.1 0 40 17.9 40 40l0 48c0
                       22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0
                       -48c0-22.1 17.9-40 40-40zm192 0l48 0c22.1 0 40
                       17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1
                       0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40zM40 320
                       c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40l48
                       0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40
                       40l-48 0zM232 192l48 0c22.1 0 40 17.9 40 40l0
                       48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9
                       -40-40l0-48c0-22.1 17.9-40 40-40zM40 160c-22.1
                       0-40-17.9-40-40L0 72C0 49.9 17.9 32 40 32l48 0c22.1
                       0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48
                       0zM232 32l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1
                       -17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0
                       -48c0-22.1 17.9-40 40-40z"
                />
              </svg>
              <div class="space-y-2 w-full">
                <p class="uppercase text-sm 2xl:text-sm font-semibold">
                  {{ t('dashboard.tabs.program.docForms.questionLabel', { type: element.type }) }}
                </p>
                <input
                  v-model="element.question"
                  class="bg-transparent text-topsets-pritext dark:text-topsets-darkpritext px-0 text-base 2xl:text-lg focus:outline-none border-none focus:ring-0 w-full"
                  type="text"
                  :placeholder="
                    t('dashboard.tabs.program.docForms.addNewQuestionPlaceholder', {
                      type: element.type
                    })
                  "
                  :id="element.type + index"
                />
              </div>
              <button @click="removeFollow(index)" class="text-red-500 hover:text-red-300 text-xl">
                {{ t('dashboard.tabs.program.docForms.removeFollow') }}
              </button>
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <!-- Referral Document -->
    <div class="card p-8 overflow-y-auto space-y-4 col-span-2 2xl:col-span-1">
      <h3 class="contentH-medium">{{ t('dashboard.tabs.program.docForms.aiReferralDocument') }}</h3>
      <p class="text-label text-topsets-sectext dark:text-topsets-darksectext">
        {{ t('dashboard.tabs.program.docForms.aiReferralDescription') }}
      </p>
      <div class="flex flex-col gap-4">
        <!-- View Document button -->
        <a :href="program.referral" target="_blank" v-if="program.referral" class="btn-lg-outline">
          {{ t('dashboard.tabs.program.docForms.viewDocument') }}
        </a>
        <!-- File input and buttons -->
        <input
          type="file"
          accept="application/pdf"
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
          {{
            program.referral
              ? t('dashboard.tabs.program.docForms.changeDocument')
              : t('dashboard.tabs.program.docForms.uploadDocument')
          }}
        </button>

        <!-- Delete Document button -->
        <button
          v-if="program.referral && !isProcessing"
          @click="deleteDocument"
          class="btn-lg bg-red-500 hover:bg-red-600 uppercase"
          :disabled="isProcessing"
        >
          {{ t('dashboard.tabs.program.docForms.deleteDocument') }}
        </button>

        <!-- Processing placeholder -->
        <div
          v-if="isProcessing"
          class="absolute inset-0 flex items-center justify-center bg-opacity-50 bg-gray-500 z-10"
        >
          <div class="text-white">{{ t('dashboard.tabs.program.docForms.processing') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
