<script setup lang="ts">
const emit = defineEmits(['changeComp'])
</script>

<template>
  <div class="grid md:grid-cols-5 items-center min-h-screen flex-1 relative 2xl:-mt-32">
    <div class="flex fixed z-40 bottom-5 justify-center left-0 right-0">
      <div class="card rounded-full px-12">
        <h3 class="text-body text-center">
          Are you a trainee looking for trainers?
          <RouterLink to="application">Get Our App</RouterLink>
        </h3>
      </div>
    </div>
    <div class="col-span-3 relative z-20">
      <h1 class="header-large font-black">READY TO OPTIMIZE YOUR ONLINE TRAINING?</h1>
      <h1 class="title-medium mb-16 text-5xl">JOIN NOW OUR AFFILIATE PROGRAM</h1>
      <div class="flex gap-4 my-5">
        <RouterLink to="login" @click="emit('changeComp')" class="btn-lg"
          >ACCESS THE DASHBOARD</RouterLink
        >
      </div>
    </div>
    <div class="col-span-2 relative">
      <div
        class="w-80 h-80 rounded-full bottom-16 opacity-80 absolute right-0 bg-rafik content"
      ></div>
      <div
        class="w-80 h-80 rounded-full bottom-24 opacity-80 absolute right-24 bg-rafik-sectext content"
      ></div>
      <img
        class="max-h-128 w-full object-cover ml-auto relative grayscale"
        src="/src/assets/running_man.png"
        alt=""
      />
    </div>
  </div>
</template>
