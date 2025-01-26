<script setup lang="ts">
import WebsiteHeader from '../components/WebsiteHeader.vue'
import RegistrationForm from '../components/RegistrationForm.vue'
</script>

<template>
  <main class="flex-1 website-body flex-col flex">
    <WebsiteHeader />
    <Transition name="slide-fade" appear>
      <div class="grid md:grid-cols-2 items-center min-h-64 flex-1 mb-16">
        <div>
          <h1 class="header-large mb-3">REGISTER NOW TO BECOME AN AFFILIATE</h1>

          <RegistrationForm />
          <h3 class="text-body">
            Already Registered?
            <RouterLink to="login"> Sign In Now</RouterLink>
          </h3>
        </div>
        <div class="relative">
          <div
            class="w-96 h-96 rounded-full bottom-0 opacity-80 absolute right-16 bg-rafik content"
          ></div>

          <img
            class="w-128 object-cover ml-auto relative grayscale"
            src="https://static.vecteezy.com/system/resources/thumbnails/046/464/329/small_2x/smiling-man-holding-and-pointing-at-laptop-on-transparent-background-png.png"
            alt=""
          />
        </div>
      </div>
    </Transition>
  </main>
</template>
