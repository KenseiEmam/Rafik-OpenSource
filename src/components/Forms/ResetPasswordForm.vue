<template>
  <div>
    <form class="my-8 space-y-4" @submit.prevent="handleResetPassword">
      <div class="form-control">
        <label for="email">{{ t('resetPassword.form.email') }}</label>
        <input
          name="email"
          v-model="email"
          class="rafik-text-input"
          type="email"
          placeholder="rafik@example.com"
          required
        />
      </div>
      <input
        type="submit"
        class="btn-lg"
        :value="loading ? t('resetPassword.form.loading') : t('resetPassword.form.sendReset')"
        :disabled="loading"
      />
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from 'vue-i18n';

const loading = ref<boolean>(false);
const email = ref<string>('');
const { t } = useI18n();

const handleResetPassword = async (): Promise<void> => {
  try {
    loading.value = true;
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}`,
    });
    
    if (error) throw error;
    
    alert(t('resetPassword.form.emailSent'));
    email.value = '';
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