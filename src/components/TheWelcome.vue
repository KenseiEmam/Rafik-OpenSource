<script setup lang="ts">
import WelcomeItem from './WelcomeItem.vue'
import DocumentationIcon from './icons/IconDocumentation.vue'
import ToolingIcon from './icons/IconTooling.vue'
import EcosystemIcon from './icons/IconEcosystem.vue'
import CommunityIcon from './icons/IconCommunity.vue'
import SupportIcon from './icons/IconSupport.vue'
const emit = defineEmits(['changeComp'])
</script>

<template>
  <div class="grid md:grid-cols-2 items-center min-h-64 flex-1 mb-16">
    <div>
      <h1 class="header-large w-96 mb-3">JOIN NOW TO BECOME AN</h1>
      <h1 class="title-large mb-5">affiliate trainer</h1>
      <h1 class="header-medium w-96">AND MAKE THE MOST OUT OF YOUR</h1>
      <h1 class="header-medium text-rafik">CLIENT SUBSCRIPTIONS</h1>
      <div class="flex gap-4 my-5">
        <RouterLink to="/register" @click="emit('changeComp')" class="btn-lg">REGISTER</RouterLink>
        <RouterLink to="/login" class="btn-lg-outline">LOGIN</RouterLink>
      </div>
      <h3 class="text-body">
        Are you a trainee looking for trainers?
        <RouterLink to="application">Get Our App</RouterLink>
      </h3>
    </div>
    <div>
      <img
        class="max-h-128 ml-auto"
        src="https://i.pinimg.com/originals/3a/9d/7d/3a9d7d1b48f60297e3daddd686b87c38.png"
        alt=""
      />
    </div>
  </div>
</template>
