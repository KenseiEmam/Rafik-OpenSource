<script setup lang="ts">
import { ref } from 'vue'
import SocialIcons from '@/components/SocialIcons.vue'
import Swal from 'sweetalert2'
import { supabase } from '@/lib/supabaseClient'

// SweetAlert2 helper functions
function showSuccess(message: string) {
  Swal.fire({
    title: 'Success!',
    text: message,
    icon: 'success',
    toast: true,
    position: 'top-right',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    background: '#081411',
    color: '#E8F3ED',
  })
}

function showError(message: string) {
  Swal.fire({
    title: 'Error!',
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED',
  })
}

// Reactive form data
const formData = ref({
  name: '',
  email: '',
  message: '',
})
const sending = ref(false)

// Function to send email via Supabase Edge Function ("smtp")
async function sendEmail() {
  sending.value = true
  try {
    const { data, error } = await supabase.functions.invoke('smtp', {
      body: { ...formData.value },
    })

    if (error) {
      throw error
    }

    // Assuming the function returns an object with a "message" property
    showSuccess(data?.message || 'Email sent successfully!')
    formData.value = { name: '', email: '', message: '' }
  } catch (err: any) {
    console.error(err)
    showError('Error sending email: ' + err.message)
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <section id="contact" class="flex-1 card mb-16 p-12">
    <div class="grid md:grid-cols-3 my-auto w-full gap-8">
      <div class="col-span-2 gap-4 relative flex flex-col">
        <h1 class="title-small">Would Love to Hear From You</h1>
        <p class="mb-4 text-body">
          Have a question about our training? Our Models? Our Services? Reach us through the methods
          down below!
        </p>
        <div class="flex-1 flex flex-col gap-4">
          <div class="flex items-center w-full gap-4 py-4 pr-4">
            <div class="card rounded-full bg-rafik-sectext p-4">
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
              <h3 class="header-small">Give us a call:</h3>
              <p class="text-body">mob: +971 56 866 3114</p>
            </div>
          </div>
          <div class="flex items-center w-full gap-4 py-4 pr-4">
            <div class="card rounded-full bg-rafik-sectext p-4">
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
              <h3 class="header-small">Mail us:</h3>
              <p class="text-body">admin@rafik.ae</p>
            </div>
          </div>
          <div class="flex items-center w-full gap-4 py-4 pr-4">
            <div class="card rounded-full bg-rafik-sectext p-4">
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
              <h3 class="header-small">Find Us At:</h3>
              <p class="text-body">Enter address here...</p>
            </div>
          </div>
          <!-- Contact details section -->
          <SocialIcons class="w-3/4 mx-auto mt-6" :in="'hi'" :fb="'hi'" :yt="'hi'" :tw="'hi'" />
        </div>
      </div>
      <div
        class="border-l pl-8 space-y-4 border-rafik-sectext flex w-full items-center justify-center flex-col w-full"
      >
        <h3 class="header-small">Send us A Message</h3>
        <form class="space-y-4 w-full" @submit.prevent="sendEmail">
          <div class="form-control">
            <label for="Name">Full Name</label>
            <input name="Name" class="rafik-text-input" type="text" placeholder="rafik" required />
          </div>
          <div class="form-control">
            <label for="email">Email Address</label>
            <input
              name="email"
              class="rafik-text-input"
              type="email"
              placeholder="rafik@example.com"
              required
            />
          </div>
          <div class="form-control">
            <label for="message">Message</label>
            <textarea
              name="message"
              class="rafik-text-input"
              rows="6"
              placeholder="Write us a message here..."
              required
            ></textarea>
          </div>
          <div class="flex w-full">
            <button type="submit" class="btn-lg mx-auto">SEND</button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
