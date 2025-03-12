<script setup lang="ts">
import WebsiteHeader from '../components/Navigation/WebsiteHeader.vue'
import SocialIcons from '../components/SocialIcons.vue'
</script>
<template>
  <main class="flex-1 mebsite-body flex-col flex">
    <WebsiteHeader />
      <div
        class="flex flex-col md:grid grid-cols-5 gap-16  relative card  flex-1  items-center w-full min-h-128  mb-16 px-3 py-6 md:py-12 md:px-24"
      >
        <div class="md:col-span-3">
          <h1 class="uppercase font-black text-rafik text-xl md:text-5xl 2xl:text-7xl md:title-medium">ABOUT RAFIK</h1>
          <h1 class="uppercase text-rafik-pritext md:header-medium mb-4">THE FITNESS SQUIRE FOR ALL TYPES OF WARRIORS</h1>
          <p class="text-body mb-8">
            Vestibulum condimentum, sapien sit amet ornare sodales, elit sem dapibus lectus, a
            ullamcorper mi mi et dui. Vestibulum nulla libero, porta auctor faucibus at, sagittis in
            nulla. Nam mollis eget nunc nec porta. Morbi nisi magna, luctus a urna ut, efficitur
            fringilla orci. Donec rutrum eleifend dolor ac ultricies. Proin elementum leo quis nulla
            tristique, congue accumsan libero facilisis. Maecenas id convallis dolor. In efficitur
            nibh ac lorem tristique, et laoreet nisl pretium.
          </p>
          <SocialIcons class="w-3/4" :in="'hi'" :fb="'hi'" :yt="'hi'" :tw="'hi'" />
        </div>
        <div class="flex-col gap-6 flex md:col-span-2 md:border-l border-rafik-sectext md:pl-8">
          <img
            class="md:h-64 w-full 2xl:h-96 object-cover object-top ml-auto mb-auto"
            src="/src/assets/rafik.png"
            alt=""
          />
          <div>
            <h3 class="contentH-small mb-2">Our Vision</h3>
            <p class="text-sm">
              Vestibulum condimentum, sapien sit amet ornare sodales, elit sem dapibus lectus, a
              ullamcorper mi mi et dui.
            </p>
          </div>
          <div>
            <h3 class="contentH-small mb-2">Our Mission</h3>
            <p class="text-sm">
              Vestibulum condimentum, sapien sit amet ornare sodales, elit sem dapibus lectus, a
              ullamcorper mi mi et dui.
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
