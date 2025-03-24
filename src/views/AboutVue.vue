<script setup lang="ts">
import WebsiteHeader from '../components/Navigation/WebsiteHeader.vue'
import SocialIcons from '../components/SocialIcons.vue'
</script>
<template>
  <main class="flex-1 mebsite-body flex-col flex dark">
    <WebsiteHeader />
      <div
        class="flex flex-col md:grid grid-cols-5 gap-16  relative card  flex-1  items-center w-full min-h-128  mb-16 px-3 py-6 md:py-12 md:px-24"
      >
        <div class="md:col-span-3">
          <h1 class="uppercase font-black text-rafik text-xl md:text-5xl 2xl:text-7xl md:title-medium">ABOUT RAFIK</h1>
          <h1 class="uppercase text-rafik-pritext dark:text-rafik-darkpritext md:header-medium mb-4">THE FITNESS SQUIRE FOR ALL</h1>
          <p class=" mb-8">
            In an era where fitness information is everywhere, navigating the noise has never been harder. While science-backed knowledge is more accessible than ever, social media has also given rise to self-proclaimed "experts" who mislead people with flashy trends and empty promises—draining their time, money, and sometimes even harming their health.

            <br><br>

            That’s why we created <strong class="text-rafik-darkpritext">Rafik</strong>. We believe that <strong class="text-rafik-darkpritext">everyone deserves access to reliable fitness expertise</strong>—guidance that is not only effective but also ethical and sustainable. However, we also understand the challenges: in-person coaching can be expensive, and finding the right <strong class="text-rafik-darkpritext">online</strong> trainer can feel like a gamble. <strong class="text-rafik-darkpritext">Rafik eliminates the guesswork</strong> by <strong class="text-rafik-darkpritext">connecting you with the right trainer</strong> while ensuring <strong class="text-rafik-darkpritext">accountability</strong> at every step.

            <br><br>

            And to the trainers—<strong class="text-rafik-darkpritext">we’ve got your back, too!</strong> By sharing your <strong class="text-rafik-darkpritext">verified</strong> programs on our platform, you gain access to a <strong class="text-rafik-darkpritext">serious and dedicated audience</strong> who genuinely wants to transform their lives. Rafik helps you <strong class="text-rafik-darkpritext">manage, track, and grow your client base</strong> while ensuring your hard work gets the <strong class="text-rafik-darkpritext">recognition it deserves</strong> through a fair and transparent review system.

            <br><br>

            <strong class="text-rafik-darkpritext">Rafik is our gift to the fitness community—we hope you enjoy it!</strong>
            </p>

          <SocialIcons class="w-3/4" :in="'hi'" :fb="'hi'" :yt="'hi'" :tw="'hi'" />
        </div>
        <div class="flex-col gap-6 flex md:col-span-2 md:border-l border-rafik-sectext dark:border-rafik-darksectext md:pl-8">
          <img
            class="md:h-64 w-full 2xl:h-96 object-cover object-top ml-auto mb-auto"
            src="/src/assets/rafik.png"
            alt=""
          />
          <div>
            <h3 class="contentH-small mb-2">Our Vision</h3>
            <p class="text-sm">
              To empower individuals in the MENA to achieve their fitness goals with confidence and accountability, by providing personalized and reliable connections to expert trainers at affordable prices.
            </p>
          </div>
          <div>
            <h3 class="contentH-small mb-2">Our Mission</h3>
            <p class="text-sm">
              At Rafik, we connect people to fitness professionals who truly understand their needs, ensuring a tailored journey with measurable results. Through a platform built on trust, expertise, and accountability, we aim to foster a supportive community where everyone can reach their full potential, no matter their starting point.
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
