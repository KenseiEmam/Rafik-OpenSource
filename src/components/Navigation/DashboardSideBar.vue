<template>
  <div
    class="h-screen border-rafik-sectext dark:border-rafik-darksectext bg-rafik-secbg dark:bg-rafik-darksecbg flex flex-col p-8 gap-8 2xl:items-between 2xl:p-16"
  >
    <div class="relative">
      <!-- Light mode image: visible by default, hidden in dark mode -->
  <img
    class="w-24 2xl:h-auto 2xl:w-44 object-cover block dark:hidden"
    src="/src/assets/rafik_light.png"
    alt="Light mode logo"
  />
  <!-- Dark mode image: hidden by default, visible in dark mode -->
  <img
    class="w-24 2xl:h-auto 2xl:w-44 object-cover hidden dark:block"
    src="/src/assets/rafik.png"
    alt="Dark mode logo"
  />
    </div>
    <nav class="flex flex-col  gap-4 2xl:gap-10 my-auto">
      <RouterLink :to="{ name: 'dashboard-home' }" class="nav-btn">My <br />Dashboard</RouterLink>
      <RouterLink v-if="userStore.userProfile.roles.includes('Trainer')" :to="{ name: 'programs-list' }" class="nav-btn"
        >Workout &<br />Programs</RouterLink
      >
      <RouterLink v-if="userStore.userProfile.roles.includes('Trainer')" :to="{ name: 'client-list' }" class="nav-btn">My <br />Clients</RouterLink>
      <RouterLink v-if="userStore.userProfile.roles.includes('Trainer')" :to="{ name: 'entitlement-list' }" class="nav-btn"
        >Program <br />Entitlements</RouterLink
      >
      <RouterLink v-if="userStore.userProfile.roles.includes('Admin')" :to="{ name: 'users-list' }" class="nav-btn"
        >List of <br />Users</RouterLink
      >
      <RouterLink :to="{ name: 'settings' }" class="nav-btn">Settings &<br>Preferences</RouterLink>

    </nav>
    <nav class="flex flex-col gap-4 mt-auto 2xl:gap-8 text-xs">
      <RouterLink :to="{ name: 'trainer-profile' }" class="nav-btn 2xl:text-base">My Profile</RouterLink>
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
  color: #190a03
}
.dark nav a.router-link-exact-active {
  color: #ffffff
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
