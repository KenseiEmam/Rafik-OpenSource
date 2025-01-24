
<template>
    <div class=" min-h-screen border-rafik-sectext border-r bg-rafik-pribg items-between justify-between flex flex-col p-8  2xl:p-16 ">
      <div class="relative w-24 xl:w-44 2xl:w-64">

        <img
              class="w-24 xl:w-44 2xl:w-64 h-24 xl:h-44 2xl:h-64  absolute -left-6 xl:-left-10 2xl:-left-16"
              src="/src/assets/rafik.png"
              alt=""
            />
      </div>
    <nav class="flex flex-col  gap-2 xl:gap-6 2xl:gap-10 text-xs xl:text-sm">

      <RouterLink to="/dashboard" class="text-xs xl:text-sm 2xl:text-base">My <br>Dashboard</RouterLink>
      <RouterLink to="about" class="text-xs xl:text-sm 2xl:text-base">Workout &<br>Programs</RouterLink>
      <RouterLink to="team" class="text-xs xl:text-sm 2xl:text-base">My <br>Clients</RouterLink>
      <RouterLink to="/application" class="text-xs xl:text-sm 2xl:text-base">Program <br>Entitlements</RouterLink>
      <RouterLink to="/application" class="text-xs xl:text-sm 2xl:text-base">Settings &<br>Preferences</RouterLink>
    </nav>
    <nav class="flex flex-col  gap-2 xl:gap-4 2xl:gap-8 text-xs xl:text-sm">

<RouterLink to="/" class="text-xs xl:text-sm 2xl:text-base">My Profile</RouterLink>
<!-- <RouterLink to="team" class="text-xs xl:text-sm 2xl:text-base text-rafik-alternate" >Help</RouterLink> -->
<button @click="handleLogOut" class="text-left text-xs xl:text-sm 2xl:text-base text-red-600 pl-4">Logout</button>
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
