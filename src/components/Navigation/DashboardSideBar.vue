<template>
  <div
    class="h-screen border-rafik-sectext border-r bg-rafik-pribg flex flex-col p-8 gap-8 2xl:items-between 2xl:p-16"
  >
    <div class="relative w-44 2xl:w-64">
      <img
        class="w-32 2xl:w-44 h-16 2xl:h-24 object-cover absolute -left-6 2xl:-left-10"
        src="/src/assets/rafik.png"
        alt=""
      />
    </div>
    <nav class="flex flex-col my-16 2xl:my-44 gap-4 2xl:gap-10">
      <RouterLink to="/dashboard" class="nav-btn">My <br />Dashboard</RouterLink>
      <RouterLink :to="{ name: 'programs-list' }" class="nav-btn"
        >Workout &<br />Programs</RouterLink
      >
      <RouterLink :to="{ name: 'client-list' }" class="nav-btn">My <br />Clients</RouterLink>
      <RouterLink :to="{ name: 'entitlement-list' }" class="nav-btn"
        >Program <br />Entitlements</RouterLink
      >
      <!-- <RouterLink to="" class="nav-btn">Settings &<br>Preferences</RouterLink> -->
      <RouterLink to="/my-profile" class="nav-btn">My<br />Profile</RouterLink>
    </nav>
    <nav class="flex flex-col gap-4 mt-auto 2xl:gap-8 text-xs">
      <RouterLink to="/" class="nav-btn 2xl:text-base">My Profile</RouterLink>
      <button @click="handleLogOut" class="text-left nav-btn 2xl:text-base text-red-600 pl-4">
        Logout
      </button>
    </nav>
  </div>
</template>
<script setup lang="ts">
import router from '@/router'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const handleLogOut = async (): Promise<void> => {
  userStore.LogOut()

  router.push({ name: 'home' })
}
</script>

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
