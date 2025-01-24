<script setup lang="ts">
interface User {
  first_name: string;
  last_name: string;
  avatar:string;
  // Add other fields if needed
}

const props = defineProps<{
  user: User;
}>();
</script>

<template>
  <div class="px-8 py-12 flex-1 w-full 2xl:px-12 2xl:py-24">
    <div
      class="card w-full p-8 xl:py-16 flex gap-6 xl:gap-10 border-rafik-alternate border items-center"
      style="background-image: linear-gradient(135deg, #081411 36%, #295f42);"
    >
      <!-- User Avatar -->
      <img
        :src="props.user.avatar"
        class="w-32 h-32 xl:w-52 xl:h-52 ring-rafik ring-1 rounded-full self-center"
        alt="User Avatar"
      >

      <!-- Welcome Text Section -->
      <div class="w-1/2 flex flex-col justify-center">
        <h2 class="header-small text-rafik-sectext">Welcome Back</h2>
        <h2 class="title-small">{{ props.user.first_name }}</h2>
        <p class="text-body mt-6">
          We’ve kept an eye on your clients and programs while you were gone and made some charts.
          Please take your time to check them out below.
        </p>
      </div>

      <!-- Button Section -->
      <div
        class="border-l border-rafik-sectext text-left px-8 flex flex-col gap-4 ml-auto py-4 h-full xl:h-44 justify-between"
      >
        <button class="text-left opacity-50 hover:text-red-500 text-lg">View Profile</button>
        <button class="text-left opacity-50 hover:text-red-500 text-lg">Check Charts</button>
        <button class="text-left opacity-50 hover:text-red-500 text-lg">Settings</button>
      </div>
    </div>
  </div>
</template>



