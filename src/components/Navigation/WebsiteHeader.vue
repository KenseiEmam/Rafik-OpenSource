<template>
  <header class="md:w-full flex items-center relative z-50 align-center gap-8 my-10">
    <nav class="flex mt-0 gap-6 md:gap-8 w-full">
      <RouterLink to="/">{{ t('header.nav.home') }}</RouterLink>
      <RouterLink to="about">{{ t('header.nav.about') }}</RouterLink>
      <RouterLink to="team">{{ t('header.nav.team') }}</RouterLink>
      <RouterLink to="/application" class="min-w-max">{{ t('header.nav.getApp') }}</RouterLink>
      <a href="/#contact" class="">{{ t('header.nav.contactUs') }}</a>
    </nav>
    <div v-if="!checkLogin()" class="md:flex gap-8 hidden items-center ml-auto min-w-max">
      <RouterLink to="login" class="btn-sm">{{ t('header.auth.login') }}</RouterLink>
      <RouterLink to="register" class="btn-sm-outline">{{ t('header.auth.register') }}</RouterLink>
    </div>
    <div
      v-else-if="userStore.userProfile && checkUser()"
      class="md:flex hidden gap-4 items-center ml-auto min-w-max"
    >
      <img
        :src="
          userStore.userProfile.avatar ||
          'https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/avatars/default-avatar.png'
        "
        class="w-16 h-16 2xl:w-20 2xl:h-20 border border-rafik-pribg ring-2 ring-rafik rounded-full object-cover"
        alt=""
      />
      <div :class="locale === 'ar'?'border-r':'border-l'"
        class="text-body text-rafik-sectext dark:text-rafik-darksectext uppercase pl-3  border-rafik-sectext dark:border-rafik-darksectext py-2"
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
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const userStore = useUserStore();
const { t ,locale } = useI18n();

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
    font-size: 1rem;
    padding: 1rem 0;
  }
}
</style>
