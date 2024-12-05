<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="wrapper w-full">
    <nav class="flex gap-8 w-full mb-16">
      <RouterLink to="/">Access</RouterLink>
      <RouterLink to="/about">About</RouterLink>
      <RouterLink to="/team">Team</RouterLink>
      <RouterLink to="/application">Download App</RouterLink>
      <RouterLink to="/contact">Contact Us</RouterLink>
      <RouterLink to="/login" class="ml-auto text-rafik">Login</RouterLink>
      <RouterLink to="/register" class="text-rafik-secondary">Register</RouterLink>
    </nav>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--vt-c-text-dark-1);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
