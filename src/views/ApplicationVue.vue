<script setup lang="ts">
import WebsiteHeader from '../components/Navigation/WebsiteHeader.vue'
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
    title: 'Not There Yet!',
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED',
  })
}
</script>

<template>
  <!-- Main container following the same structure as TeamVue -->
  <main class="mebsite-body dark">
    <!-- Same WebsiteHeader as in TeamVue -->
    <WebsiteHeader />

    <!-- Use Transition for the slide-fade effect -->
    <Transition name="slide-fade" appear>
      <!--
        Flex container with a vertical gradient background
        going from dark green to near-black, text in white.
      -->
      <!--
          Use a responsive flex layout:
          - Stack content in a column on smaller screens
          - Place them side by side on medium+ screens
        -->
      <div class="flex flex-col md:flex-row items-center justify-center flex-1 ">
         <!-- Right Column: Phone Image center horizontally and vertically -->
         <div class="top-0 right-0 bottom-0 left-0 flex md:hidden items-center bg-rafik-secbg dark:bg-rafik-darksecbg rounded-full overflow-hidden justify-center">
          <!-- Use your local phones.png image -->
          <img src="@/assets/phones.png" alt="Phones" class="max-h-43" />
        </div>
        <!-- Left Column: Heading, Description, Buttons -->
        <div class="max-w-lg relative -top-16">
          <h1 class="subheader-small md:subheader-medium">Looking for your perfect trainer?</h1>
          <h1 class="header-medium md:header-large">INSTALL OUR</h1>
          <h1 class="title-medium md:title-large leading-none mb-4">RAFIK SQUIRE APP</h1>
          <p class="text-body mb-4">
            Optimize your training, diet, sports performance and more, with nifty pricing, certified
            trainers, and communication to keep your programs customized to your needs.
          </p>
          <div class="flex flex-col gap-2 max-w-[235px]">
            <!-- Play Store Button -->
            <button
            @click="showError('Contact US for Android Testing')"
              class="btn-lg-outline"
            >
              PLAY STORE
            </button>
            <!-- APP Store Button -->
            <button
              disabled
              class="btn-lg bg-gray-500 border-0 hover:bg-gray-400"
            >
              APP STORE<br> (Coming Soon)
            </button>
          </div>
        </div>

        <!-- Right Column: Phone Image center horizontally and vertically -->
        <div class="top-0 right-0 bottom-0 left-0 md:flex hidden items-center justify-center">
          <!-- Use your local phones.png image -->
          <img src="@/assets/phones.png" alt="Phones" class="max-h-43" />
        </div>
      </div>
    </Transition>
  </main>
</template>

<style scoped>
/*
  Additional style overrides can go here if needed.
  Tailwind classes handle most of the styling.
*/
</style>
