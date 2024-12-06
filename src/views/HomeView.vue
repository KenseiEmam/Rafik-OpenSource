<script setup lang="ts">
import TheWelcome from '../components/TheWelcome.vue'
import WebsiteHeader from '../components/WebsiteHeader.vue'
import { ref } from 'vue'
const activeComp = ref('Home')
function changeComp(): void {
  activeComp.value = 'register'
  console.log(activeComp)
}
</script>

<template>
  <main class="flex-1 website-body flex-col flex">
    <WebsiteHeader />
    <Transition name="fade" appear>
      <TheWelcome @changeComp="changeComp()" v-if="activeComp == 'Home'" />
    </Transition>
  </main>
</template>
