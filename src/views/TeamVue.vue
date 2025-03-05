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
              src="https://plus.unsplash.com/premium_photo-1664298503962-9e633a8fd13f?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
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
              src="https://media.istockphoto.com/id/1371934584/photo/portrait-of-a-confident-mature-businesswoman-working-in-a-modern-office.jpg?s=612x612&w=0&k=20&c=NF_IO6IEXY3HifRIhRqP0KDFJFdlFwaMwo3zfOOvKnQ="
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
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKuq-N45aHV7TOJRNRFqXGiLJ2II8GkfvGzA&s"
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
