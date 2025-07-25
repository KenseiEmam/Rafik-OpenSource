<script setup lang="ts">
import WebsiteHeader from '../components/Navigation/WebsiteHeader.vue';
import LoginForm from '../components/Forms/LoginForm.vue';
import { useI18n } from 'vue-i18n';
import Footer from '@/components/Navigation/Footer.vue';
const { t , locale } = useI18n();
</script>

<template>
  <main class="dark flex-1 mebsite-body flex-col flex">
    <WebsiteHeader />
    <Transition name="slide-fade" appear>
      <div class="grid md:grid-cols-2 items-center min-h-64 flex-1 mb-16">
        <div class="space-y-6">
          <h1 class="header-large mb-3">
            {{ t('login.welcomeBack') }}
          </h1>
          <LoginForm />
          <div class="flex flex-col gap-2">
            <RouterLink to="reset-password" class="text-lg">--> {{ t('login.forgotPassword') }}</RouterLink>
            <RouterLink  to="register" class="text-lg">--> Just got invited by your admins?</RouterLink>
            <RouterLink to="request-demo" class="text-lg">--> Not a part of our team?</RouterLink>
          </div>







        </div>
        <div class="relative">
          <div
            class="w-96 h-96 rounded-full bottom-0 opacity-80 absolute -right-16 bg-rafik content"
          ></div>
          <img
            class="w-128 object-cover ms-auto relative grayscale"
            src="https://www.registerok.in/assets/images/company-man.png"
            alt=""
          />
        </div>
      </div>
    </Transition>
    <Footer/>
  </main>
</template>
