<script setup lang="ts">
import { ref } from 'vue';
import SocialIcons from '@/components/SocialIcons.vue';
import Swal from 'sweetalert2';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from 'vue-i18n';

const { t , locale } = useI18n();

// SweetAlert2 helper functions using translations
function showSuccess(message: string) {
  Swal.fire({
    title: t('general.success'),
    text: message || t('home.form.successMessage'),
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
    text: t('home.form.errorSending') + message,
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}

// Reactive form data
const formData = ref({
  name: '',
  email: '',
  message: ''
});
const sending = ref(false);

// Function to send email via Supabase Edge Function ("smtp")
async function sendEmail() {
  sending.value = true;
  try {
    const { data, error } = await supabase.functions.invoke('smtp', {
      body: { ...formData.value }
    });

    if (error) {
      throw error;
    }

    // Assuming the function returns an object with a "message" property
    showSuccess(data?.message || t('home.form.successMessage'));
    formData.value = { name: '', email: '', message: '' };
  } catch (err: any) {
    console.error(err);
    showError(err.message);
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <section
    id="contact"
    class="flex-1 card mb-16 items-center w-full min-h-128 px-3 py-6 md:py-12 md:px-12"
  >
    <div class="flex flex-col md:grid md:grid-cols-3 my-auto w-full gap-8">
      <!-- Left Column: Contact Details -->
      <div class="col-span-2 gap-4 relative flex flex-col">
        <h1 class="font-black uppercase text-rafik md:title-small text-xl md:text-3xl">
          {{ t('home.form.header') }}
        </h1>
        <p class="mb-4 text-body">
          {{ t('home.form.description') }}
        </p>
        <div class="flex-1 flex flex-col gap-4">
          <!-- Call -->
          <div class="flex items-center w-full gap-4 py-4 pr-4">
            <div class="card rounded-full bg-rafik-sectext dark:bg-rafik-darksectext p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                class="w-6 text-rafik-pribg"
                viewBox="0 0 512 512"
              >
                <path
                  d="M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z"
                />
              </svg>
            </div>
            <div class="w-full">
              <h3 class="uppercase text-rafik-pritext dark:text-rafik-darkpritext md:header-small">
                {{ t('home.form.call.label') }}
              </h3>
              <p class="text-body">{{ t('home.form.call.number') }}</p>
            </div>
          </div>
          <!-- Mail -->
          <div class="flex items-center w-full gap-4 py-4 pr-4">
            <div class="card rounded-full bg-rafik-sectext dark:bg-rafik-darksectext p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                class="w-6 text-rafik-pribg"
                viewBox="0 0 512 512"
              >
                <path
                  d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48L48 64zM0 176L0 384c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-208L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z"
                />
              </svg>
            </div>
            <div class="w-full">
              <h3 class="uppercase text-rafik-pritext dark:text-rafik-darkpritext md:header-small">
                {{ t('home.form.mail.label') }}
              </h3>
              <p class="text-body">{{ t('home.form.mail.address') }}</p>
            </div>
          </div>
          <!-- Find Us -->
          <div class="flex items-center w-full gap-4 py-4 pr-4">
            <div class="card rounded-full bg-rafik-sectext dark:bg-rafik-darksectext p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                class="w-6 text-rafik-pribg"
                viewBox="0 0 384 512"
              >
                <path
                  d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"
                />
              </svg>
            </div>
            <div class="w-full">
              <h3 class="uppercase text-rafik-pritext dark:text-rafik-darkpritext md:header-small">
                {{ t('home.form.find.label') }}
              </h3>
              <p class="text-body">{{ t('home.form.find.address') }}</p>
            </div>
          </div>
          <!-- Social Icons -->
          <SocialIcons class="w-3/4 mx-auto mt-6" :in="'hi'" :fb="'hi'" :yt="'hi'" :tw="'hi'" />
        </div>
      </div>
      <!-- Right Column: Contact Form -->
      <div
        class="md:border-l md:pl-8 space-y-4 border-rafik-sectext dark:border-rafik-darksectext flex w-full items-center justify-center flex-col"
      >
        <h3 class="uppercase text-rafik-pritext dark:text-rafik-darkpritext md:header-small">
          {{ t('home.form.sendMessage') }}
        </h3>
        <form class="space-y-4 w-full" @submit.prevent="sendEmail">
          <div class="form-control">
            <label for="Name">{{ t('home.form.formLabels.fullName') }}</label>
            <input
              name="Name"
              v-model="formData.name"
              class="rafik-text-input"
              type="text"
              :placeholder="t('home.form.formPlaceholders.fullName')"
              required
            />
          </div>
          <div class="form-control">
            <label for="email">{{ t('home.form.formLabels.email') }}</label>
            <input
              name="email"
              v-model="formData.email"
              class="rafik-text-input"
              type="email"
              :placeholder="t('home.form.formPlaceholders.email')"
              required
            />
          </div>
          <div class="form-control">
            <label for="message">{{ t('home.form.formLabels.message') }}</label>
            <textarea
              name="message"
              v-model="formData.message"
              class="rafik-text-input"
              rows="6"
              :placeholder="t('home.form.formPlaceholders.message')"
              required
            ></textarea>
          </div>
          <div class="flex w-full">
            <button type="submit" class="btn-lg mx-auto">
              {{ t('home.form.sendButton') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
