<template>
  <div
    v-if="props.visible"
    class="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
  >
    <div class="card rounded-lg shadow p-6">
      <h2 class="contentH-small">{{ t('dashboard.users.addUser.title') }}</h2>
      <p class="text-body mb-4">
        {{ t('dashboard.users.addUser.subtitle') }}
      </p>
      <form @submit.prevent="submitForm" class="grid grid-cols-1 gap-6">
        <!-- Email Field -->
        <div class="mb-4">
          <label for="user_email" class="block text-sm font-medium">
            {{ t('dashboard.users.addUser.emailLabel') }}
          </label>
          <input
            type="email"
            id="user_email"
            v-model="user.email"
            class="rafik-text-input"
            required
            :class="{ 'border-red-500': errors.email }"
          />
          <span v-if="errors.email" class="text-red-500 text-sm">
            {{ errors.email }}
          </span>
        </div>
        <!-- User Type Field -->
        <div class="mb-4">
          <label for="user_type" class="block text-sm font-medium">
            {{ t('dashboard.users.addUser.userTypeLabel') }}
          </label>
          <select
            id="user_type"
            v-model="user.type"
            class="rafik-text-input"
            required
            :class="{ 'border-red-500': errors.type }"
          >
            <option value="" disabled>
              {{ t('dashboard.users.addUser.selectUserType') }}
            </option>
            <option value="trainer">
              {{ t('dashboard.users.addUser.trainer') }}
            </option>
            <option value="trainee">
              {{ t('dashboard.users.addUser.trainee') }}
            </option>
          </select>
          <span v-if="errors.type" class="text-red-500 text-sm">
            {{ errors.type }}
          </span>
        </div>
        <!-- Action Buttons -->
        <div class="flex justify-end">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-md bg-red-500 border-red-500 hover:bg-red-400 rounded mr-2"
          >
            {{ t('dashboard.users.addUser.cancel') }}
          </button>
          <button type="submit" class="btn-md rounded">
            {{ t('dashboard.users.addUser.submit') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  visible: Boolean
});

const emits = defineEmits(['close', 'submit']);

interface UserForm {
  email: string;
  type: string;
}

const user = ref<UserForm>({
  email: '',
  type: ''
});

const errors = ref<{ email?: string; type?: string }>({});

const validateForm = () => {
  errors.value = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!user.value.email) {
    errors.value.email = t('dashboard.users.addUser.emailRequired');
  } else if (!emailRegex.test(user.value.email)) {
    errors.value.email = t('dashboard.users.addUser.invalidEmail');
  }

  if (!user.value.type) {
    errors.value.type = t('dashboard.users.addUser.userTypeRequired');
  }

  return Object.keys(errors.value).length === 0;
};

const submitForm = () => {
  if (!validateForm()) return;

  // Emit the email and user type to the parent component
  emits('submit', user.value.email, user.value.type);

  // Reset the form fields
  user.value.email = '';
  user.value.type = '';
};
</script>

<style scoped>
/* Add any component-specific styles here if needed */
</style>
