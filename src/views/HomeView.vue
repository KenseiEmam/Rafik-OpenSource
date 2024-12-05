<script setup lang="ts">
import TheWelcome from '../components/TheWelcome.vue'
import { ref } from 'vue'
const activeComp = ref('Home')
function changeComp(): void {
  activeComp.value = 'register'
  console.log(activeComp)
}
</script>

<template>
  <main class="flex-1 flex-col flex">
    <Transition name="fade" appear>
      <TheWelcome @changeComp="changeComp()" v-if="activeComp == 'Home'" />
    </Transition>
  </main>
</template>
