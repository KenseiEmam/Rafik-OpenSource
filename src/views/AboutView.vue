<script setup lang="ts">
import WebsiteHeader from '../components/WebsiteHeader.vue'
import SocialIcons from '../components/SocialIcons.vue'
</script>
<template>
  <main class="website-body">
    <WebsiteHeader />
    <Transition name="slide-fade" appear>
      <div
        class="grid md:grid-cols-5 gap-16 items-end min-h-64 mb-16 relative card my-auto px-24 py-12"
      >
        <div class="md:col-span-3">
          <h1 class="title-medium">ABOUT RAFIK</h1>
          <h1 class="header-medium mb-4">THE FITNESS SQUIRE FOR ALL TYPES OF WARRIORS</h1>
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
        <div class="flex-col gap-6 flex md:col-span-2 border-l border-rafik-sectext pl-8">
          <img
            class="md:h-64 w-full 2xl:h-96 object-cover object-top ml-auto mb-auto"
            src="https://i.pinimg.com/originals/3a/9d/7d/3a9d7d1b48f60297e3daddd686b87c38.png"
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
