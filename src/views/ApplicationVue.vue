<script setup lang="ts">
import WebsiteHeader from '../components/Navigation/WebsiteHeader.vue';
import Swal from 'sweetalert2';
import { useI18n } from 'vue-i18n';

const { t , locale } = useI18n();

// Function to show error alerts
function showError(message: string) {
  Swal.fire({
    title: t('application.alert'),
    text: message,
    icon: 'info',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}
</script>

<template>
  <!-- Main container following the same structure as TeamVue -->
  <main class="mebsite-body dark">
    <!-- Website Header -->
    <WebsiteHeader />

    <!-- Use Transition for the slide-fade effect -->
    <Transition name="slide-fade" appear>
      <div class="flex flex-col md:flex-row items-center justify-center flex-1">
        <!-- Right Column: Phone Image (visible on mobile) -->
        <div
          class="top-0 right-0 bottom-0 left-0 flex md:hidden items-center bg-rafik-secbg dark:bg-rafik-darksecbg rounded-full overflow-hidden justify-center"
        >
          <img src="@/assets/phones.png" alt="Phones" class="max-h-43" />
        </div>
        <!-- Left Column: Heading, Description, Buttons -->
        <div class="max-w-lg relative -top-16">
          <h1 class="subheader-small md:subheader-medium">
            {{ t('application.lookingForTrainer') }}
          </h1>
          <h1 class="header-medium md:header-large">{{ t('application.installOur') }}</h1>
          <h1 class="title-medium md:title-large leading-none mb-4">
            {{ t('application.rafik') }}
          </h1>
          <p class="text-body mb-4">
            {{ t('application.description') }}
          </p>

          <div class="flex justify-start">
            <div>
              <!-- App Store Button -->
              <a
                href="https://testflight.apple.com/join/gR5FvmYg"
                class="flex mt-3 w-64 h-16 bg-rafik-darksecbg hover:bg-black hover:opacity-70 hover:border text-white rounded-xl items-center justify-center"
              >
                <div class="mr-3">
                  <svg viewBox="0 0 384 512" width="30">
                    <path
                      fill="currentColor"
                      d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="text-sm">{{ t('application.download.downloadOnThe') }}</div>
                  <div class="text-2xl font-semibold font-sans -mt-1">
                    {{ t('application.download.appStore') }}
                  </div>
                </div>
              </a>

              <!-- Google Play Button -->
              <button
                @click="showError(t('application.errorMessage'))"
                class="flex mt-3 w-64 h-16 bg-rafik-darksecbg hover:bg-black hover:opacity-70 hover:border text-white rounded-lg items-center justify-center"
              >
                <div class="mr-3">
                  <svg viewBox="30 336.7 120.9 129.2" width="30">
                    <path
                      fill="#FFD400"
                      d="M119.2,421.2c15.3-8.4,27-14.8,28-15.3c3.2-1.7,6.5-6.2,0-9.7  c-2.1-1.1-13.4-7.3-28-15.3l-20.1,20.2L119.2,421.2z"
                    />
                    <path
                      fill="#FF3333"
                      d="M99.1,401.1l-64.2,64.7c1.5,0.2,3.2-0.2,5.2-1.3  c4.2-2.3,48.8-26.7,79.1-43.3L99.1,401.1L99.1,401.1z"
                    />
                    <path
                      fill="#48FF48"
                      d="M99.1,401.1l20.1-20.2c0,0-74.6-40.7-79.1-43.1  c-1.7-1-3.6-1.3-5.3-1L99.1,401.1z"
                    />
                    <path
                      fill="#3BCCFF"
                      d="M99.1,401.1l-64.3-64.3c-2.6,0.6-4.8,2.9-4.8,7.6  c0,7.5,0,107.5,0,113.8c0,4.3,1.7,7.4,4.9,7.7L99.1,401.1z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="text-sm">{{ t('application.download.getItOn') }}</div>
                  <div class="text-xl font-semibold font-sans -mt-1">
                    {{ t('application.download.googlePlay') }}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Right Column: Phone Image (visible on medium+ screens) -->
        <div class="top-0 right-0 bottom-0 left-0 md:flex hidden items-center justify-center">
          <img src="@/assets/phones.png" alt="Phones" class="max-h-43" />
        </div>
      </div>
    </Transition>
  </main>
</template>

<style scoped>
/* Additional style overrides if needed. Tailwind classes handle most of the styling. */
</style>
