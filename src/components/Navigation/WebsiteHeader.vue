
<template>
  <header class="md:w-full flex items-center relative z-50 align-center gap-8 my-10">
    <nav class="flex mt-0 gap-6 md:gap-8 w-full ">
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="about">About</RouterLink>
      <RouterLink to="team">Team</RouterLink>
      <RouterLink to="/application" class="min-w-max">Get App</RouterLink>
      <a href="/#contact" class=" ">Contact Us</a>
    </nav>
    <div v-if="!checkLogin()" class="md:flex gap-8 hidden items-center ml-auto  min-w-max ">

      <RouterLink to="login" class="btn-sm ">Login</RouterLink>
      <RouterLink to="register" class="btn-sm-outline ">Register</RouterLink>
    </div>
    <div v-else-if="userStore.userProfile && checkUser()" class="md:flex hidden gap-4 items-center ml-auto min-w-max ">
      <img :src="userStore.userProfile.avatar || 'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'" class="w-16 h-16 2xl:w-20 2xl:h-20 border border-rafik-pribg ring-2 ring-rafik rounded-full object-cover" alt="">
      <div class="text-body text-rafik-sectext dark:text-rafik-darksectext uppercase pl-3 border-l border-rafik-sectext dark:border-rafik-darksectext py-2">
        <p> HELLO {{userStore.userProfile.first_name}}!</p>
        <div class="flex gap-4">
          <RouterLink :to="{name:'dashboard-home'}" class="label text-rafik hover:text-rafik-secondary uppercase">Access Dashboard</RouterLink>
          <button @click="userStore.LogOut()" class="label text-red-500 hover:text-red-300 uppercase">Logout</button>
        </div>
      </div>
    </div>
  </header>
</template>
<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { onMounted } from 'vue'
const userStore = useUserStore()
  onMounted(()=>{
    if(localStorage.getItem('LoggedInUser')&&localStorage.getItem('UserID')){
      userStore.getUserProfileNO()
  }})
  function checkLogin(){
    if(localStorage.getItem('LoggedInUser')){
      return true
    }
  else
  return false
  }
  function checkUser(){
    if(localStorage.getItem('UserID')){
      return true
    }
  else
  return false
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
  color: var(--vt-c-text-dark1);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
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
    font-size:1rem;
    padding: 1rem 0;
  }
}
</style>
