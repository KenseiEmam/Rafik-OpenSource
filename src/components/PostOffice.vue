
<template>
  <div :class="open ? 'right-0 h-screen':'-right-80 h-0'" class=" absolute  flex items-start">
    <button @click="open = !open" class="rounded-l-full bg-rafik-pribg border border-r-0 border-rafik-sectext px-8 py-4  mt-64 relative left-1 z-20">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="text-rafik-sectext w-8">
        <path d="M224 32L64 32C46.3 32 32 46.3 32 64l0 64c0 17.7 14.3 32 32 32l377.4 0c4.2 0 8.3-1.7 11.3-4.7l48-48c6.2-6.2 6.2-16.4 0-22.6l-48-48c-3-3-7.1-4.7-11.3-4.7L288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32zM480 256c0-17.7-14.3-32-32-32l-160 0 0-32-64 0 0 32L70.6 224c-4.2 0-8.3 1.7-11.3 4.7l-48 48c-6.2 6.2-6.2 16.4 0 22.6l48 48c3 3 7.1 4.7 11.3 4.7L448 352c17.7 0 32-14.3 32-32l0-64zM288 480l0-96-64 0 0 96c0 17.7 14.3 32 32 32s32-14.3 32-32z"/>
      </svg>
  </button>
    <div :class="open?'h-screen':'h-0'" class="  border-rafik-sectext border-l bg-rafik-pribg items-between justify-between gap-10  flex flex-col p-8  xl:py-16 h-full  relative z-10 ">
      <div class="flex gap-10 justify-between">
        <div >
          <h2 class="subheader-medium">POST</h2>
          <h2 class="header-medium">OFFICE</h2>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          stroke="currentColor"
          viewBox="0 0 448 512"
          class="w-6 text-rafik-sectext"
        >
        <path d="M224 0c-17.7 0-32 14.3-32 32l0 19.2C119 66 64 130.6 64 208l0 18.8c0 47-17.3 92.4-48.5 127.6l-7.4 8.3c-8.4 9.4-10.4 22.9-5.3 34.4S19.4 416 32 416l384 0c12.6 0 24-7.4 29.2-18.9s3.1-25-5.3-34.4l-7.4-8.3C401.3 319.2 384 273.9 384 226.8l0-18.8c0-77.4-55-142-128-156.8L256 32c0-17.7-14.3-32-32-32zm45.3 493.3c12-12 18.7-28.3 18.7-45.3l-64 0-64 0c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7z"/></svg>

      </div>
      <div class="space-y-8 flex-1 flex flex-col items-center justify-center over-flow-auto w-64">
        <svg xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          stroke="currentColor"
          class="w-12 text-rafik-sectext"
          viewBox="0 0 448 512">
          <path d="M176 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l16 0 0 34.4C92.3 113.8 16 200 16 304c0 114.9 93.1 208 208 208s208-93.1 208-208c0-41.8-12.3-80.7-33.5-113.2l24.1-24.1c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L355.7 143c-28.1-23-62.2-38.8-99.7-44.6L256 64l16 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L224 0 176 0zm72 192l0 128c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-128c0-13.3 10.7-24 24-24s24 10.7 24 24z"/></svg>
        <p>Feature Coming Soon</p>
      </div>
    </div>

  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';

  const open = ref(false)
</script>

