<script setup lang="ts">
import SocialIcons from '@/components/SocialIcons.vue'
import WebsiteHeader from '../components/Navigation/WebsiteHeader.vue'
</script>
<template>
  <main class="mebsite-body">
    <WebsiteHeader />
    <Transition name="slide-fade" appear>
      <div class="relative flex-1 flex flex-col h-full">
        <h1 class="header-large">MEET THE FOUNDERS</h1>
        <h1 class="contentH-medium mb-4">from fitness enthusiasts to fitneess enthusiasts</h1>
        <div class="grid md:grid-cols-3 gap-4 flex-1 min-h-128 mb-16 h-full align-stretch">
          <div
            class="border-2 flex flex-col relative align-bottom flex-1 border-rafik-secondary rounded-lg overflow-hidden"
          >
            <img
              src="https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/team/IMG_6536.jpeg"
              class="w-full h-full object-cover absolute grayscale"
              alt=""
            />
            <div class="w-full h-full bg-gradient-to-t from-rafik-secbg from-20 absolute"></div>
            <div class="p-8 space-y-1 relative mt-auto">
              <h3 class="title-small">
                Mohamed Marei
                <p class="label">CPT & Software Engineer</p>
              </h3>
              <h3 class="header-small">CHIEF EXECUTIVE OFFICER</h3>
              <SocialIcons
                class="w-5/6 pt-4"
                ln="hello"
                in="hello"
                fb="hello"
                tw="hello"
              ></SocialIcons>
            </div>
          </div>
          <div
            class="border-2 flex flex-col relative align-bottom flex-1 border-rafik-secondary rounded-lg overflow-hidden"
          >
            <img
              src="https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/team/IMG_7421.jpeg"
              class="w-full h-full object-cover absolute grayscale"
              alt=""
            />
            <div class="w-full h-full bg-gradient-to-t from-rafik-secbg from-20 absolute"></div>
            <div class="p-8 space-y-1 relative mt-auto">
              <h3 class="title-small">
                AbdulMounem Shetta
                <p class="label">CPT & Nutritionist</p>
              </h3>
              <h3 class="header-small">CHIEF OPERATIONS OFFICER</h3>
              <SocialIcons
                class="w-5/6 pt-4"
                ln="hello"
                in="hello"
                fb="hello"
                tw="hello"
              ></SocialIcons>
            </div>
          </div>
          <div
            class="border-2 flex flex-col relative align-bottom flex-1 border-rafik-secondary rounded-lg overflow-hidden"
          >
            <img
              src="https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/team/Sami%20Azzam%20Profile.JPG"
              class="w-full h-full object-cover absolute grayscale"
              alt=""
            />
            <div class="w-full h-full bg-gradient-to-t from-rafik-secbg from-20 absolute"></div>
            <div class="p-8 space-y-1 relative mt-auto">
              <h3 class="title-small">
                Sami Walid Azzam
                <p class="label">MS in Computer Engineering</p>
              </h3>
              <h3 class="header-small">CHIEF TECHNOLOGY OFFICER</h3>
              <SocialIcons
                class="w-5/6 pt-4"
                ln="hello"
                in="hello"
                fb="hello"
                tw="hello"
              ></SocialIcons>
            </div>
          </div>
        </div>
      </div>
    </Transition>
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
