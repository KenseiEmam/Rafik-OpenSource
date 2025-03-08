<template>
  <div>
    <form class="my-8 space-y-6" @submit.prevent="signUpNewUser">
      <!-- Email Field -->
      <div class="form-control">
        <label for="email" class="block text-sm font-medium">Email Address</label>
        <input
          id="email"
          v-model="email"
          class="rafik-text-input"
          type="email"
          placeholder="rafik@example.com"
          required
        />
      </div>

      <!-- Password Field -->
      <div class="form-control">
        <label for="password" class="block text-sm font-medium">Password</label>
        <input
          id="password"
          v-model="password"
          class="rafik-text-input"
          type="password"
          placeholder="*******"
          required
          @input="validatePassword"
        />
        <ul
          class="list-disc text-xs mt-2 ml-6 text-gray-600"
          :class="{'text-red-500': !isPasswordValid}"
        >
          <li>Must be at least 8 characters long.</li>
          <li>Must contain at least one number and one special character.</li>
          <li>Must not be too similar to the email address.</li>
        </ul>
      </div>

      <!-- Confirm Password Field -->
      <div class="form-control">
        <label for="confirm-password" class="block text-sm font-medium">Confirm Password</label>
        <input
          id="confirm-password"
          v-model="confirmPassword"
          class="rafik-text-input"
          type="password"
          placeholder="*******"
          required
        />
      </div>

      <!-- Submit Button -->
      <button type="submit" class="btn-lg w-full" :disabled="!canSubmit">
        JOIN NOW
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { supabase } from "@/lib/supabaseClient";
import router from '@/router'
import Swal from 'sweetalert2'
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

// Function to show error alerts
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
const email = ref<string>("");
const password = ref<string>("");
const confirmPassword = ref<string>("");

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
        password: password.value,

      });

      if (error) throw error;
      router.push({name:'login'});
      showSuccess("Registration successful! Check your email to confirm your account.");
    } catch (error) {
      if (error instanceof Error) {
       showError(`Error: ${error.message}`);
      }
    }
  } else {
   showError("Please ensure the form meets all requirements before submitting.");
  }
}
</script>
