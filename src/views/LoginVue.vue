<script setup lang="ts">
import WebsiteHeader from '../components/WebsiteHeader.vue'
import LoginForm from '../components/LoginForm.vue'
import { ref } from 'vue'
</script>

<template>
  <main class="flex-1 website-body flex-col flex">
    <WebsiteHeader />
    <Transition name="fade" appear>
      <div class="grid md:grid-cols-2 items-center min-h-64 flex-1 mb-16">
        <div>
          <h1 class="header-large mb-3">WELCOME BACK! TIME TO CATCH-UP</h1>

          <LoginForm />
          <h3 class="text-body">
            Not Registered Yet?
            <RouterLink to="register"> Sign Up Now</RouterLink>
          </h3>
        </div>
        <div>
          <img
            class="max-h-128 ml-auto"
            src="https://i.pinimg.com/originals/3a/9d/7d/3a9d7d1b48f60297e3daddd686b87c38.png"
            alt=""
          />
        </div>
      </div>
    </Transition>
  </main>
</template>
