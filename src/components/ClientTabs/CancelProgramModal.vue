<template>
  <div
    v-if="props.visible"
    class="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
  >
    <div class="card rounded-lg shadow p-6 min-w-128 w-1/3">
      <h2 class="contentH-small">
        {{ t('dashboard.tabs.clients.cancelProgram.raiseCancellationRequest') }}
      </h2>
      <p class="text-body mb-4">
        {{ t('dashboard.tabs.clients.cancelProgram.cancellationDescription') }}
      </p>
      <form @submit.prevent="submitForm">
        <!-- Cancellation Reason Field -->
        <div class="mb-4">
          <label for="reason" class="block text-sm font-medium">
            {{ t('dashboard.tabs.clients.cancelProgram.cancellationReason') }}
          </label>
          <textarea
            id="reason"
            v-model="reason"
            class="rafik-text-input"
            rows="4"
            required
            :class="{ 'border-red-500': errors.reason }"
          ></textarea>
          <span v-if="errors.reason" class="text-red-500 text-sm">{{ errors.reason }}</span>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-md bg-red-500 border-red-500 hover:bg-red-400 rounded mr-2"
          >
            {{ t('dashboard.tabs.clients.cancelProgram.returnButton') }}
          </button>
          <button type="submit" class="btn-md rounded">
            {{ t('dashboard.tabs.clients.cancelProgram.cancelSubscription') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useProgramStore } from '@/stores/programstores';
import { supabase } from '@/lib/supabaseClient'; // Ensure Supabase is correctly set up
import Swal from 'sweetalert2';
import { useI18n } from 'vue-i18n';
const { t , locale } = useI18n();
const props = defineProps({
  visible: Boolean
});
const errors = ref<any>({});
const loading = ref(true);
const programStore = useProgramStore();
const emits = defineEmits(['close', 'submit']);
const reason = ref('');
const validateForm = () => {
  errors.value = {};

  if (!reason.value) {
    errors.value.reason = t('dashboard.tabs.clients.cancelProgram.reasonRequired');
  }

  return Object.keys(errors.value).length === 0;
};

const submitForm = async () => {
  if (!validateForm()) return;

  // Emit the form data with the photo URL
  emits('submit', reason.value);

  // Reset the form
  reason.value = '';
};
onMounted(() => {
  programStore.getAllPrograms().then(() => {
    loading.value = false;
  });
});
</script>
<style scoped>
li:hover {
  background-image: linear-gradient(135deg, #081411 36%, #295f42);
}
</style>
