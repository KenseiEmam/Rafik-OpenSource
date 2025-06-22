<template>
  <div>
    <form class="my-8 space-y-4" @submit.prevent="handleLogin">
      <div class="form-control">
        <label for="email">{{ t('login.form.email') }}</label>
        <input
          name="email"
          v-model="email"
          class="topsets-text-input"
          type="email"
          placeholder="topsets@example.com"
          required
        />
      </div>
      <div class="form-control">
        <label for="password">{{ t('login.form.password') }}</label>
        <input
          v-model="password"
          name="password"
          class="topsets-text-input"
          type="password"
          placeholder="*******"
          required
        />
      </div>
      <input
        type="submit"
        class="btn-lg"
        :value="loading ? t('login.form.loading') : t('login.form.access')"
        :disabled="loading"
      />
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import router from '@/router';
import { useUserStore } from '@/stores/user';
import { useI18n } from 'vue-i18n';
const loading = ref<boolean>(false);
const email = ref<string>('');
const password = ref<string>('');
const userStore = useUserStore();
const { t , locale } = useI18n();

if (localStorage.getItem('LoggedInUser') && localStorage.getItem('UserID')) {
  router.push({ name: 'dashboard-home' });
} else if (localStorage.getItem('LoggedInUser') && !localStorage.getItem('UserID')) {
  router.push('setup-user-profile');
}
const handleLogin = async (): Promise<void> => {
  try {
    loading.value = true;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    });
    if (error) throw error;
    else {
      const returnedData = {
        id: parseInt(data.user?.id),
        email: data.user?.email
      };
      const returnedSession = {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_in: data.session?.expires_in,
        expires_at: data.session?.expires_at
      };
      userStore.LogIn(returnedData, returnedSession);
    }
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message);
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped></style>
