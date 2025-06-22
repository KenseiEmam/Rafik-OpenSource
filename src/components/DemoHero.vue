<script setup lang="ts"></script>

<template>
  <section
    class="flex flex-col justify-center md:grid md:grid-cols-5 items-center my-16 flex-1 relative"
  >
    <!-- Mobile image / circles -->
    <div class="md:hidden relative top-6">
      <div class="w-40 h-40 rounded-full absolute right-0 opacity-80 bg-topsets" />
      <div
        class="w-40 h-40 rounded-full bottom-24 right-24 absolute opacity-80 bg-topsets-sectext dark:bg-topsets-darksectext"
      />
      <img
        class="max-h-64 object-cover ms-auto relative grayscale"
        src="/src/assets/demo.webp"
        alt=""
      />
    </div>

    <!-- Text -->
    <div class="md:col-span-3 relative z-20 -top-16">
      <h1 class="header-medium md:header-large font-black">Book&nbsp;Your&nbsp;Demo</h1>
      <h2 class="title-medium">Performance, Simplified</h2>
    </div>

    <!-- Desktop image / circles -->
    <div class="md:col-span-2 hidden md:block relative">
      <div class="w-80 h-80 rounded-full absolute right-0 opacity-80 bg-topsets" />
      <div
        class="w-80 h-80 rounded-full bottom-24 right-24 absolute opacity-80 bg-topsets-sectext dark:bg-topsets-darksectext"
      />
      <img
        class="max-h-128 w-full object-cover ms-auto relative grayscale"
        src="/src/assets/demo.webp"
        alt=""
      />
    </div>
  </section>
</template>
