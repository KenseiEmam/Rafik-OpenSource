<script setup lang="ts">
import WebsiteHeader from '../components/Navigation/WebsiteHeader.vue';
import ResetPasswordForm from '../components/Forms/ResetPasswordForm.vue';
import { useI18n } from 'vue-i18n';
import Footer from '@/components/Navigation/Footer.vue';
const { t, locale } = useI18n();
</script>

<template>
  <main class="dark flex-1 mebsite-body flex-col flex">
    <WebsiteHeader />
    <Transition name="slide-fade" appear>
      <div class="grid md:grid-cols-2 items-center min-h-64 flex-1 mb-16">
        <div class="space-y-6">
          <h1 class="header-large mb-3">
            {{ t('resetPassword.header') }}
          </h1>
          <ResetPasswordForm />
          <div class="flex flex-col gap-2">
            <RouterLink to="login" class="text-lg">--> {{ t('resetPassword.backToLogin') }}</RouterLink>
            <RouterLink to="register" class="text-lg">--> {{ t('resetPassword.notRegistered') }}</RouterLink>
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