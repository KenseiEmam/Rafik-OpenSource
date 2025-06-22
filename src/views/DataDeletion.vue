<template>
  <section id="data-deletion" class="dark flex-1 mb-16 p-12">
    <div class="max-w-md mx-auto p-6 card shadow-md rounded-lg">
      <h2 class="header-small">{{ t('deleteAccount.header') }}</h2>
      <p class="text-body mb-4">{{ t('deleteAccount.description') }}</p>

      <form @submit.prevent="submitRequest" class="space-y-4">
        <div class="form-control">
          <label for="email">{{ t('deleteAccount.form.emailLabel') }}</label>
          <input
            v-model="formData.email"
            name="email"
            class="topsets-text-input"
            type="email"
            required
          />
        </div>

        <div class="form-control">
          <label for="fullname">{{ t('deleteAccount.form.fullNameLabel') }}</label>
          <input v-model="formData.fullname" name="fullname" class="topsets-text-input" type="text" />
        </div>

        <div class="flex items-center space-x-2">
          <input
            type="checkbox"
            v-model="formData.confirmed"
            class="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
          />
          <label for="confirm" class="text-body text-sm min-w-max">
            {{ t('deleteAccount.form.confirmLabel') }}
          </label>
        </div>

        <div class="flex w-full">
          <button
            type="submit"
            :disabled="!formData.confirmed || sending"
            class="btn-lg mx-auto disabled:bg-gray-300"
          >
            {{
              sending ? t('deleteAccount.form.processing') : t('deleteAccount.form.submitButton')
            }}
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
import { useI18n } from 'vue-i18n';

const { t , locale } = useI18n();

const formData = ref({
  email: '',
  fullname: '',
  confirmed: false,
  type: 'delete account request'
});
const sending = ref(false);

function showSuccess(message: any) {
  Swal.fire({
    title: t('general.success'),
    text: message,
    icon: 'success',
    toast: true,
    position: 'top-right',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    background: '#132e3d',
    color: '#ececec'
  });
}

function showError(message: any) {
  Swal.fire({
    title: t('general.error'),
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#132e3d',
    color: '#ececec'
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

    showSuccess(data?.message || t('deleteAccount.form.successMessage'));
    formData.value = { email: '', fullname: '', confirmed: false, type: 'delete account request' };
  } catch (err: any) {
    console.error(err);
    showError(t('deleteAccount.form.errorSubmitting') + err.message);
  } finally {
    sending.value = false;
  }
}
</script>
