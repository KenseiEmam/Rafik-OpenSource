<template>
  <div v-if="token && !loadingOrg">
    <h3 class="contentH-medium">Sign up with {{ orgData.name }}</h3>
    <form  class="my-8 space-y-6 relative z-40" @submit.prevent="signUpNewUser">
           <div class="form-control">
                  <label class="block text-sm font-medium" for="first_name">
                    {{ t('dashboard.profile.edit.firstNameLabel') }}
                  </label>
                  <input
                    id="first_name"
                    v-model="first_name"
                    class="rafik-text-input w-full"
                    type="text"
                    required
                    placeholder="John"
                  />
                </div>
                <!-- Last Name -->
                <div class="form-control">
                  <label class="block text-sm font-medium" for="last_name">
                    {{ t('dashboard.profile.edit.lastNameLabel') }}
                  </label>
                  <input
                    id="last_name"
                    v-model="last_name"
                    class="rafik-text-input w-full"
                    type="text"
                    required
                    placeholder="Doe"
                  />
                </div>
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
          :placeholder="'your_name@'+(orgData.domains[0]||'rafikapp.ae')"
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
   <div v-else>
      <h1 class="title-large">
        Error!
      </h1>
      <p class="header-medium">
        No Token found!
      </p>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import router from '@/router';
import Swal from 'sweetalert2';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const token = route.query.token
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
const userStore =useUserStore()
const email = ref<string>('');
const password = ref<string>('');
const first_name = ref<string>('');
const last_name = ref<string>('');
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
      const { data, error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value
      });

      if (error) throw error;

      if (data && token)
        userStore.selfAddOrgUser({email:email.value, first_name:first_name.value, last_name:last_name.value}, token)
      else
        throw("token or email missing")
      // router.push({ name: 'login' });
      showSuccess(t('register.form.successMessage'));
      router.push({name:"application"})
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


const loadingOrg = ref(false);

// We'll store all org data in orgData
const orgData = ref<any>({
  id: null,
  created_at: null,
  name: '',
  domains: [],
  description: '',
  logo: '',
  country: '',
  address: '',
  trainer_assign: false,
  token:null,
});
// On mount, if user is 'Organization Admin', fetch org data
onMounted(async () => {

    loadingOrg.value = true;
    await getOrganization();
    loadingOrg.value = false;

});

// Fetching organization data based on user profile
async function getOrganization() {
  try {

    if (!token) {
      showError(t('dashboard.settings.orgNoOrgIdFound'));
      return;
    }

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('token', token)
      .single();

    if (error) {
      throw error;
    }

    // Initialize orgData
    orgData.value = { ...data };

  } catch (err: any) {
    console.error('Error fetching organization data:', err);
    showError(
      t('dashboard.settings.orgFetchError', {
        error: err.message || 'Unknown error'
      })
    );
  }
}
</script>
