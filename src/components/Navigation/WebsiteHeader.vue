<template>
  <header class="md:w-full flex items-center relative z-50 align-center gap-8 my-10">
    <nav class="flex mt-0 gap-6 text-sm md:text-base md:gap-8 w-full items-center">
      <img src="@/assets/rafik.png" :class="['w-24', { 'shimmer-effect': logoShimmer }]" alt="" />
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="organizations">For Organisations</RouterLink>
      <RouterLink to="coaches">For Coaches</RouterLink>
      <RouterLink to="athletes" class="min-w-max">For Athletes</RouterLink>
      <RouterLink to="request-demo" class="min-w-max">Get a Demo</RouterLink>
    </nav>
    <div v-if="!checkLogin()" class="md:flex gap-3 hidden items-center ms-auto min-w-max">
      <RouterLink to="register" class="btn-md">Request Demo</RouterLink>
      <RouterLink to="login" class="btn-md-outline">Login</RouterLink>
    </div>
    <div
      v-else-if="userStore.userProfile && checkUser()"
      class="md:flex hidden gap-4 items-center ms-auto min-w-max"
    >
      <img
        :src="
          userStore.userProfile.avatar ||
          'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'
        "
        class="w-16 h-16 2xl:w-20 2xl:h-20 border border-rafik-pribg ring-2 ring-rafik rounded-full object-cover"
        alt=""
      />
      <div
        :class="locale === 'ar' ? 'border-r' : 'border-l'"
        class="text-body text-rafik-sectext dark:text-rafik-darksectext uppercase pl-3 border-rafik-sectext dark:border-rafik-darksectext py-2"
      >
        <p>{{ t('header.auth.hello', { name: userStore.userProfile.first_name }) }}</p>
        <div class="flex gap-4">
          <RouterLink
            :to="{ name: 'dashboard-home' }"
            class="label text-rafik hover:text-rafik-secondary uppercase"
          >
            {{ t('header.auth.accessDashboard') }}
          </RouterLink>
          <button
            @click="userStore.LogOut()"
            class="label text-red-500 hover:text-red-300 uppercase"
          >
            {{ t('header.auth.logout') }}
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
const logoShimmer = ref(false);

onMounted(() => {
  setInterval(() => {
    logoShimmer.value = true;
    setTimeout(() => {
      logoShimmer.value = false;
    }, 1200); // matches shimmer duration
  }, 10000); // shimmer every 10 seconds
});
const userStore = useUserStore();
const { t, locale } = useI18n();

onMounted(() => {
  if (localStorage.getItem('LoggedInUser') && localStorage.getItem('UserID')) {
    userStore.getUserProfileNO();
  }
});

function checkLogin() {
  return !!localStorage.getItem('LoggedInUser');
}

function checkUser() {
  return !!localStorage.getItem('UserID');
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
  text-align: center;
}

nav a.router-link-exact-active {
  color: white;
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
    padding: 1rem 0;
  }
}
</style>
