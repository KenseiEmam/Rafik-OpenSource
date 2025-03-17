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
  <div class="px-8 py-12 flex-1 flex flex-col w-full h-full 2xl:px-12 2xl:py-24">
    <div
      class="card w-full bg-rafik-secbg p-8 2xl:py-16 flex gap-6 2xl:gap-10 border-0 items-center"

    >
      <!-- User Avatar -->
      <img
        :src="props.user.avatar || 'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'"
        class="w-32 h-32 2xl:w-52 2xl:h-52 ring-rafik ring-1 rounded-full self-center"
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
        class="border-l border-rafik-sectext text-left px-8 flex flex-col gap-4 ml-auto py-4 h-full 2xl:h-44 justify-between"
      >
        <button class="text-left opacity-50 hover:text-red-500 2xl:text-lg">View Profile</button>
        <button class="text-left opacity-50 hover:text-red-500 2xl:text-lg">Check Charts</button>
        <button class="text-left opacity-50 hover:text-red-500 2xl:text-lg">Settings</button>
      </div>
    </div>
    <div class="space-y-8 flex-1 flex flex-col  h-full w-full items-center justify-center over-flow-auto w-64">
      <svg xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        stroke="currentColor"
        class="w-12 text-rafik-sectext"
        viewBox="0 0 448 512">
        <path d="M176 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l16 0 0 34.4C92.3 113.8 16 200 16 304c0 114.9 93.1 208 208 208s208-93.1 208-208c0-41.8-12.3-80.7-33.5-113.2l24.1-24.1c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L355.7 143c-28.1-23-62.2-38.8-99.7-44.6L256 64l16 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L224 0 176 0zm72 192l0 128c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-128c0-13.3 10.7-24 24-24s24 10.7 24 24z"/></svg>
      <p class="text-center">Statistics Dashboard <br> Coming Soon</p>
    </div>
  </div>
</template>



