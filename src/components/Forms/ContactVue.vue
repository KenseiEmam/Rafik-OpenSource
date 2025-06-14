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
    class="flex-1  mb-16 items-center w-full"
  >
    <div class="flex flex-col md:grid md:grid-cols-2 my-auto w-full gap-8">
      <!-- Left Column: Contact Details -->
      <div class=" gap-4 relative flex flex-col justify-evenly h-full">
        <h1 class="font-black uppercase text-rafik md:title-small text-xl md:text-4xl">
          {{ t('home.form.header') }}
        </h1>
        <p class="mb-4 text-body">
          {{ t('home.form.description') }}
        </p>
        <div class="flex-1 flex flex-col gap-8 h-full">
          <!-- Call -->
          <div class="flex card p-6 items-center w-full gap-4 py-4 pr-4">
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
          <!-- Call -->
          <div class="flex card p-6 items-center w-full gap-4 py-4 pr-4">
            <div class="card rounded-full bg-rafik-sectext dark:bg-rafik-darksectext p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                class="w-6 text-rafik-pribg"
                viewBox="0 0 448 512"
              >
               <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
              </svg>
            </div>
            <div class="w-full">
              <h3 class="uppercase text-rafik-pritext dark:text-rafik-darkpritext md:header-small">
                Whatsapp Us:
              </h3>
              <p class="text-body">{{ t('home.form.call.number') }}</p>
            </div>
          </div>
          <!-- Mail -->
          <div class="flex card p-6 items-center w-full gap-4 py-4 pr-4">
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
              <p class="text-body">admin@rafik.ae</p>
            </div>
          </div>
          <!-- Find Us -->
          <!-- <div class="flex items-center w-full gap-4 py-4 pr-4">
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
          </div> -->
          <!-- Social Icons -->
          <!-- <SocialIcons class="w-3/4 mx-auto mt-6" :in="'hi'" :fb="'hi'" :yt="'hi'" :tw="'hi'" /> -->
        </div>
      </div>
      <!-- Right Column: Contact Form -->
      <div
        class="card p-6 space-y-4 border-rafik-sectext dark:border-rafik-darksectext flex w-full  flex-col"
      >
        <h3 class="uppercase text-rafik-pritext dark:text-rafik-darkpritext md:header-small">
          Or Send us a message:
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
              placeholder="rafik@example.com"
              required
            />
          </div>
          <div class="form-control">
            <label for="message">{{ t('home.form.formLabels.message') }}</label>
            <textarea
              name="message"
              v-model="formData.message"
              class="rafik-text-input whitespace-pre-wrap"
              rows="6"
              :placeholder="t('home.form.formPlaceholders.message')"
              required
            ></textarea>
          </div>
          <div class="flex w-full">
            <button type="submit" class="btn-lg-outline w-full">
              {{ t('home.form.sendButton') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
