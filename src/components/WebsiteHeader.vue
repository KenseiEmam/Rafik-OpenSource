<script setup lang="ts"></script>
<template>
  <header class="w-full flex items-center relative z-50 align-center my-10">
    <nav class="flex mt-0 gap-8 w-full">
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="about">About</RouterLink>
      <RouterLink to="team">Team</RouterLink>
      <RouterLink to="/application">Download App</RouterLink>
    </nav>
    <div class="flex gap-8 items-center ml-auto min-w-max">
      <a href="/#contact">Contact Us</a>
      <RouterLink to="login" class="btn-sm">Login</RouterLink>
      <RouterLink to="register" class="btn-sm-outline">Register</RouterLink>
    </div>
  </header>
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
  }
}
</style>
