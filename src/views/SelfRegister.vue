<script setup lang="ts">
import WebsiteHeader from '../components/Navigation/WebsiteHeader.vue';
// import OrganizationalRegistration from '@/components/Forms/OrganizationalRegistration.vue';
import { useI18n } from 'vue-i18n';
import Footer from '@/components/Navigation/Footer.vue';
import OrganizationalRegistration from '@/components/Forms/OrganizationalRegistration.vue';
const { t , locale } = useI18n();
</script>

<template>
  <main class="dark flex-1 mebsite-body flex-col flex">
    <WebsiteHeader />
    <Transition name="slide-fade" appear>
      <div class="grid md:grid-cols-2 items-center min-h-64 flex-1 mb-16">
        <div class="relative z-40">
          <h1 class="header-large mb-3"> Kick Start your inner Champion</h1>
          <OrganizationalRegistration />
          <h3 class="text-body">
            {{ t('register.alreadyRegistered') }}
            <RouterLink to="login"> {{ t('register.signInNow') }}</RouterLink>
          </h3>
        </div>
        <div class="relative">
          <div
            class="w-96 h-96 rounded-full bottom-0 opacity-80 absolute right-16 bg-rafik content"
          ></div>
          <img
            class="2xl:h-128  w-128 object-cover ms-auto relative grayscale"
            src="@/assets/athletesRegistration.png"
            alt=""
          />
        </div>
      </div>
    </Transition>
    <Footer/>
  </main>
</template>
