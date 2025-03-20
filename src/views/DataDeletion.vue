<template>
  <section id="data-deletion" class="dark flex-1 mb-16 p-12">
    <div class="max-w-md mx-auto p-6 card  shadow-md rounded-lg">
      <h2 class="header-small">Request Account & Data Deletion</h2>
      <p class="text-body mb-4">Fill in your details below to request the deletion of your account and associated data.</p>

      <form @submit.prevent="submitRequest" class="space-y-4">
        <div class="form-control">
          <label for="email">Email Address</label>
          <input v-model="formData.email" name="email" class="rafik-text-input" type="email" required />
        </div>

        <div class="form-control">
          <label for="fullname">Full Name</label>
          <input v-model="formData.fullname" name="fullname" class="rafik-text-input" type="text" />
        </div>

        <div class="flex items-center space-x-2">
          <input type="checkbox" v-model="formData.confirmed" class="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500">
          <label for="confirm" class="text-body text-xs min-w-max">I understand that this action is irreversible.</label>
        </div>

        <div class="flex w-full">
          <button type="submit" :disabled="!formData.confirmed || sending" class="btn-lg mx-auto disabled:bg-gray-300">
            {{ sending ? 'Processing...' : 'Submit Request' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Swal from 'sweetalert2';
import { supabase } from '@/lib/supabaseClient';

const formData = ref({
  email: '',
  fullname: '',
  confirmed: false,
  type:'delete account request'
});
const sending = ref(false);

function showSuccess(message:any) {
  Swal.fire({
    title: 'Success!',
    text: message,
    icon: 'success',
    toast: true,
    position: 'top-right',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    background: '#081411',
    color: '#E8F3ED',
  });
}

function showError(message:any) {
  Swal.fire({
    title: 'Error!',
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED',
  });
}

async function submitRequest() {
  if (!formData.value.email) return;
  sending.value = true;
  try {
    const { data, error } = await supabase.functions.invoke('smtp', {
      body: { ...formData.value }
    });

    if (error) throw error;

    showSuccess(data?.message || 'Your request has been submitted. We will process it shortly.');
    formData.value = { email: '', fullname: '', confirmed: false, type:'delete account request' };
  } catch (err:any) {
    console.error(err);
    showError('Error submitting request: ' + err.message);
  } finally {
    sending.value = false;
  }
}
</script>
