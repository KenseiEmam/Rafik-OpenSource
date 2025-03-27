<template>
  <div>
    <form class="my-8 space-y-6" @submit.prevent="signUpNewUser">
      <!-- Email Field -->
      <div class="form-control">
        <label for="email" class="block text-sm font-medium">
          {{ t('register.form.emailLabel') }}
        </label>
        <input
          id="email"
          v-model="email"
          class="rafik-text-input"
          type="email"
          placeholder="rafik@example.ae"
          required
        />
      </div>

      <!-- Password Field -->
      <div class="form-control">
        <label for="password" class="block text-sm font-medium">
          {{ t('register.form.passwordLabel') }}
        </label>
        <input
          id="password"
          v-model="password"
          class="rafik-text-input"
          type="password"
          :placeholder="t('register.form.passwordPlaceholder')"
          required
          @input="validatePassword"
        />
        <ul class="list-disc text-sm mt-2 ml-6" :class="{ 'text-red-500': !isPasswordValid }">
          <li>{{ t('register.form.passwordCriteria.item1') }}</li>
          <li>{{ t('register.form.passwordCriteria.item2') }}</li>
          <li>{{ t('register.form.passwordCriteria.item3') }}</li>
        </ul>
      </div>

      <!-- Confirm Password Field -->
      <div class="form-control">
        <label for="confirm-password" class="block text-sm font-medium">
          {{ t('register.form.confirmPasswordLabel') }}
        </label>
        <input
          id="confirm-password"
          v-model="confirmPassword"
          class="rafik-text-input"
          type="password"
          :placeholder="t('register.form.passwordPlaceholder')"
          required
        />
      </div>

      <!-- Submit Button -->
      <button type="submit" class="btn-lg w-full" :disabled="!canSubmit">
        {{ t('register.form.joinNowButton') }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import router from '@/router';
import Swal from 'sweetalert2';
import { useI18n } from 'vue-i18n';

const { t , locale } = useI18n();

// SweetAlert2 helper functions using translations
function showSuccess(message: string) {
  Swal.fire({
    title: t('general.success'),
    text: message,
    icon: 'success',
    toast: true,
    position: 'top-right',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    background: '#081411',
    color: '#E8F3ED'
  });
}

function showError(message: string) {
  Swal.fire({
    title: t('general.error'),
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}

const email = ref<string>('');
const password = ref<string>('');
const confirmPassword = ref<string>('');

// Reactive validation states
const isPasswordValid = ref<boolean>(false);
const doPasswordsMatch = computed(() => password.value === confirmPassword.value);
const canSubmit = computed(() => isPasswordValid.value && doPasswordsMatch.value);

function validatePassword() {
  const hasNumber = /\d/.test(password.value);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password.value);
  const isLongEnough = password.value.length >= 8;
  const notSimilarToEmail = !email.value || !email.value.includes(password.value);

  isPasswordValid.value = hasNumber && hasSpecialChar && isLongEnough && notSimilarToEmail;
}

async function signUpNewUser() {
  if (canSubmit.value) {
    try {
      const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value
      });

      if (error) throw error;
      router.push({ name: 'login' });
      showSuccess(t('register.form.successMessage'));
      // Reset form fields
      email.value = '';
      password.value = '';
      confirmPassword.value = '';
    } catch (error) {
      if (error instanceof Error) {
        showError(t('register.form.errorSending') + error.message);
      }
    }
  } else {
    showError(t('register.form.requirementsError'));
  }
}
</script>
