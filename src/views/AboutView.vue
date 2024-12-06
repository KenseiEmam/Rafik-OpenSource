<script setup lang="ts">
import WebsiteHeader from '../components/WebsiteHeader.vue'
</script>
<template>
  <main class="website-body">
    <WebsiteHeader />
    <div class="about">
      <h1>This is an about page</h1>
    </div>
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
