<script setup lang="ts">
const emit = defineEmits(['changeComp']);
import { useI18n } from 'vue-i18n';
const { t , locale } = useI18n();
</script>

<template>
  <div
    class="flex flex-col justify-center md:grid md:grid-cols-5 items-center min-h-screen flex-1 relative -mt-32"
  >
    <div class="md:flex hidden fixed z-40 bottom-5 justify-center left-0 right-0">
      <!-- <div class="card rounded-full px-12">
        <h3 class="text-body text-center">
          {{ t('home.welcome.traineeQuery') }}
          <RouterLink to="application">{{ t('home.welcome.getOurApp') }}</RouterLink>
        </h3>
      </div> -->
    </div>
    <div class="md:hidden relative top-6">
      <div
        class="w-40 h-40 rounded-full bottom-16 opacity-80 absolute right-0 bg-rafik content"
      ></div>
      <div
        class="w-40 h-40 rounded-full bottom-24 opacity-80 absolute right-24 bg-rafik-sectext dark:bg-rafik-darksectext content"
      ></div>
      <img
        class="max-h-64 object-cover ml-auto relative grayscale"
        src="/src/assets/running_man.png"
        alt=""
      />
    </div>
    <div class="md:col-span-3 relative z-20 -top-16">
      <h1 class="header-small md:header-large font-black">
        {{ t('home.welcome.headline1') }}
      </h1>
      <h1 class="title-medium mb-16 text-2xl md:text-5xl">
        {{ t('home.welcome.headline2') }}
      </h1>
      <div class="md:flex gap-4 my-5 hidden">
        <RouterLink to="login" @click="emit('changeComp')" class="btn-lg">
          {{ t('home.welcome.accessDashboard') }}
        </RouterLink>
      </div>
      <div class="flex flex-col gap-4 my-5 md:hidden">
        <div class="label text-center text-sm">
          {{ t('home.welcome.trainerAccess') }}
        </div>
        <RouterLink to="application" class="btn-lg-outline uppercase">
          {{ t('home.welcome.traineeGetApp') }}
        </RouterLink>
      </div>
    </div>
    <div class="md:col-span-2 hidden md:block relative">
      <div
        class="w-80 h-80 rounded-full bottom-16 opacity-80 absolute right-0 bg-rafik content"
      ></div>
      <div
        class="w-80 h-80 rounded-full bottom-24 opacity-80 absolute right-24 bg-rafik-sectext dark:bg-rafik-darksectext content"
      ></div>
      <img
        class="max-h-128 w-full object-cover ml-auto relative grayscale"
        src="/src/assets/running_man.png"
        alt=""
      />
    </div>
  </div>
</template>
