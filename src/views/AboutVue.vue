<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import WebsiteHeader from '../components/Navigation/WebsiteHeader.vue';
import SocialIcons from '../components/SocialIcons.vue';

const { t , locale } = useI18n();
</script>

<template>
  <main class="flex-1 mebsite-body flex-col flex dark about">
    <WebsiteHeader />
    <div
      class="flex flex-col md:grid grid-cols-5 gap-16 relative card flex-1 items-center w-full min-h-128 mb-16 px-3 py-6 md:py-12 md:px-24"
    >
      <div class="md:col-span-3">
        <h1
          class="uppercase font-black text-rafik text-xl md:text-5xl 2xl:text-7xl md:title-medium"
        >
          {{ t('about.pageTitle') }}
        </h1>
        <h1 class="uppercase text-rafik-pritext dark:text-rafik-darkpritext md:header-medium mb-4">
          {{ t('about.pageSubtitle') }}
        </h1>
        <!-- Using v-html to render the HTML tags in the translation string -->
        <p class="mb-8" v-html="t('about.description')"></p>
        <SocialIcons class="w-3/4" :in="'hi'" :fb="'hi'" :yt="'hi'" :tw="'hi'" />
      </div>
      <div
        class="flex-col gap-6 flex md:col-span-2 md:border-l border-rafik-sectext dark:border-rafik-darksectext md:pl-8"
      >
        <img
          class="md:h-64 w-full 2xl:h-96 object-cover object-top ml-auto mb-auto"
          src="/src/assets/rafik.png"
          alt=""
        />
        <div>
          <h3 class="contentH-small mb-2">{{ t('about.visionTitle') }}</h3>
          <p class="text-sm">
            {{ t('about.visionDescription') }}
          </p>
        </div>
        <div>
          <h3 class="contentH-small mb-2">{{ t('about.missionTitle') }}</h3>
          <p class="text-sm">
            {{ t('about.missionDescription') }}
          </p>
        </div>
      </div>
    </div>
  </main>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
