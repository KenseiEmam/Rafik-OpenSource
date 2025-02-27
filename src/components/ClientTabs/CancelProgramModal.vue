<template>
  <div
    v-if="props.visible"
    class="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
  >
    <div class="card rounded-lg shadow p-6 min-w-128 w-1/3">
      <h2 class="contentH-small">Raise Cancellation Request</h2>
      <p class="text-body mb-4">
        To protect client rights, trainers can only cancel requests after providing compelling reason and having their cancellation request approved. Please provide your reason below to cancel this clients subscription.
      </p>
      <form @submit.prevent="submitForm">

        <!-- Cancelation Reason Field -->
        <div class="mb-4">
          <label for="reason" class="block text-sm font-medium">Cancelation Reason</label>
          <textarea
            id="reason"
            v-model="reason"
            class="rafik-text-input"
            rows="4"
            required
            :class="{'border-red-500': errors.reason}"
          ></textarea>
          <span v-if="errors.reason" class="text-red-500 text-sm">{{ errors.reason}}</span>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-md bg-red-500 border-red-500 hover:bg-red-400 rounded mr-2"
          >
            Return
          </button>
          <button type="submit" class="btn-md rounded">
            Cancel Subscription
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useProgramStore } from "@/stores/programstores";
import { supabase } from "@/lib/supabaseClient"; // Ensure Supabase is correctly set up
import Swal from 'sweetalert2';
const props = defineProps({
  visible: Boolean,
});
const errors = ref<any>({});
const loading = ref(true)
const programStore = useProgramStore()
const emits = defineEmits(["close", "submit"]);
const reason= ref("")
const validateForm = () => {
  errors.value = {};

  if (!reason.value) {
    errors.value.reason = "Cancellatin reason is required.";
  }




  return Object.keys(errors.value).length === 0;
};

const submitForm = async () => {
  if (!validateForm()) return;


  // Emit the form data with the photo URL
  emits("submit", reason.value);

  // Reset the form
 reason.value = ""
};
onMounted(()=>{
  programStore.getAllPrograms().then(()=>{
    loading.value=false
  })
})

</script>
<style scoped>
li:hover{
  background-image: linear-gradient(135deg, #081411 36%, #295f42);
}
</style>
