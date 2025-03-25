<script setup lang="ts">
import WebsiteHeader from '../components/Navigation/WebsiteHeader.vue';
import LoginForm from '../components/Forms/LoginForm.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <main class="dark flex-1 mebsite-body flex-col flex">
    <WebsiteHeader />
    <Transition name="slide-fade" appear>
      <div class="grid md:grid-cols-2 items-center min-h-64 flex-1 mb-16">
        <div>
          <h1 class="header-large mb-3">
            {{ t('login.welcomeBack') }}
          </h1>
          <LoginForm />
          <h3 class="text-body">
            {{ t('login.notRegisteredYet') }}
            <RouterLink to="register"> {{ t('login.signUpNow') }}</RouterLink>
          </h3>
        </div>
        <div class="relative">
          <div
            class="w-96 h-96 rounded-full bottom-0 opacity-80 absolute -right-16 bg-rafik content"
          ></div>
          <img
            class="w-128 object-cover ml-auto relative grayscale"
            src="https://www.registerok.in/assets/images/company-man.png"
            alt=""
          />
        </div>
      </div>
    </Transition>
  </main>
</template>
