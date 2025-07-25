<template>
  <div>
    <form class="my-8 space-y-4" @submit.prevent="handleChangePassword">
      <div class="form-control">
        <label for="newPassword">{{ t('changePassword.form.newPassword') }}</label>
        <input
          name="newPassword"
          v-model="newPassword"
          class="rafik-text-input"
          type="password"
          placeholder="*******"
          required
          minlength="6"
        />
      </div>
      <div class="form-control">
        <label for="confirmPassword">{{ t('changePassword.form.confirmPassword') }}</label>
        <input
          name="confirmPassword"
          v-model="confirmPassword"
          class="rafik-text-input"
          type="password"
          placeholder="*******"
          required
          minlength="6"
        />
      </div>
      <input
        type="submit"
        class="btn-lg"
        :value="loading ? t('changePassword.form.loading') : t('changePassword.form.updatePassword')"
        :disabled="loading"
      />
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import router from '@/router';
import { useI18n } from 'vue-i18n';

const loading = ref<boolean>(false);
const newPassword = ref<string>('');
const confirmPassword = ref<string>('');
const { t } = useI18n();

const handleChangePassword = async (): Promise<void> => {
  try {
    loading.value = true;
    
    // Validate passwords match
    if (newPassword.value !== confirmPassword.value) {
      alert(t('changePassword.form.passwordMismatch'));
      return;
    }
    
    // Validate password length
    if (newPassword.value.length < 6) {
      alert(t('changePassword.form.passwordTooShort'));
      return;
    }
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword.value
    });
    
    if (error) throw error;
    
    alert(t('changePassword.form.passwordUpdated'));
    router.push({ name: 'dashboard-home' });
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