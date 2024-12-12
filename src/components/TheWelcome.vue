<script setup lang="ts">
const emit = defineEmits(['changeComp'])
</script>

<template>
  <div class="grid md:grid-cols-5 items-center min-h-64 flex-1 mb-16 relative">
    <div class="flex absolute bottom-5 justify-center left-0 right-0">
      <div class="card rounded-full px-12">
        <h3 class="text-body text-center">
          Are you a trainee looking for trainers?
          <RouterLink to="application">Get Our App</RouterLink>
        </h3>
      </div>
    </div>
    <div class="col-span-3">
      <h1 class="header-large font-black">READY TO OPTIMIZE YOUR ONLINE TRAINING</h1>
      <h1 class="title-medium mb-16 text-5xl">JOIN NOW OUR AFFILIATE PROGRAM</h1>
      <div class="flex gap-4 my-5">
        <RouterLink to="login" @click="emit('changeComp')" class="btn-lg"
          >ACCESS THE DASHBOARD</RouterLink
        >
      </div>
    </div>
    <div class="col-span-2">
      <img
        class="max-h-128 ml-auto"
        src="https://i.pinimg.com/originals/3a/9d/7d/3a9d7d1b48f60297e3daddd686b87c38.png"
        alt=""
      />
    </div>
  </div>
</template>
