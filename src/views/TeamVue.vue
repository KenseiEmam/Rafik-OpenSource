<script setup lang="ts">
import SocialIcons from '@/components/SocialIcons.vue';
import WebsiteHeader from '../components/Navigation/WebsiteHeader.vue';
import { useI18n } from 'vue-i18n';
import Footer from '@/components/Navigation/Footer.vue';
const { t , locale } = useI18n();
</script>

<template>
  <main class="dark mebsite-body">
    <WebsiteHeader />
    <Transition name="slide-fade" appear>
      <div class="relative flex-1 flex flex-col h-full">
        <h1 class="header-large">{{ t('team.meetTheFounders') }}</h1>
        <h1 class="contentH-medium mb-4">{{ t('team.subtitle') }}</h1>
        <div class="grid md:grid-cols-3 gap-4 flex-1 min-h-128 mb-16 h-full align-stretch">
          <!-- Member 1 -->
          <div
            class="border-2 flex flex-col relative align-bottom flex-1 border-rafik-secondary rounded-lg overflow-hidden"
          >
            <img
              src="https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/team/IMG_6536.jpeg"
              class="w-full h-full object-cover absolute grayscale"
              alt=""
            />
            <div class="w-full h-full bg-gradient-to-t from-rafik-darksecbg from-20 absolute"></div>
            <div class="p-8 space-y-1 relative mt-auto">
              <h3 class="title-small">
                {{ t('team.members.mohamed.name') }}
                <p class="label">{{ t('team.members.mohamed.qualification') }}</p>
              </h3>
              <h3 class="header-small">{{ t('team.members.mohamed.role') }}</h3>
              <SocialIcons class="w-5/6 pt-4" ln="hello" in="hello" fb="hello" tw="hello" />
            </div>
          </div>
          <!-- Member 2 -->
          <div
            class="border-2 flex flex-col relative align-bottom flex-1 border-rafik-secondary rounded-lg overflow-hidden"
          >
            <img
              src="https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/team/IMG_7421.jpeg"
              class="w-full h-full object-cover absolute grayscale"
              alt=""
            />
            <div class="w-full h-full bg-gradient-to-t from-rafik-darksecbg from-20 absolute"></div>
            <div class="p-8 space-y-1 relative mt-auto">
              <h3 class="title-small">
                {{ t('team.members.abdulMounem.name') }}
                <p class="label">{{ t('team.members.abdulMounem.qualification') }}</p>
              </h3>
              <h3 class="header-small">{{ t('team.members.abdulMounem.role') }}</h3>
              <SocialIcons class="w-5/6 pt-4" ln="hello" in="hello" fb="hello" tw="hello" />
            </div>
          </div>
          <!-- Member 3 -->
          <div
            class="border-2 flex flex-col relative align-bottom flex-1 border-rafik-secondary rounded-lg overflow-hidden"
          >
            <img
              src="https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/team/Sami%20Azzam%20Profile.JPG"
              class="w-full h-full object-cover absolute grayscale"
              alt=""
            />
            <div class="w-full h-full bg-gradient-to-t from-rafik-darksecbg from-20 absolute"></div>
            <div class="p-8 space-y-1 relative mt-auto">
              <h3 class="title-small">
                {{ t('team.members.sami.name') }}
                <p class="label">{{ t('team.members.sami.qualification') }}</p>
              </h3>
              <h3 class="header-small">{{ t('team.members.sami.role') }}</h3>
              <SocialIcons class="w-5/6 pt-4" ln="hello" in="hello" fb="hello" tw="hello" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
    <Footer/>
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
