<template>
  <div
    :dir="locale === 'ar' ? 'rtl' : 'ltr'"
    class="h-screen overflow-y-auto border-topsets-sectext dark:border-topsets-darksectext bg-topsets-secbg dark:bg-topsets-darksecbg flex flex-col p-8 gap-8 2xl:items-between 2xl:p-16"
  >
    <div class="relative">
      <!-- Light mode image: visible by default, hidden in dark mode -->
      <img
        class="w-24 2xl:h-auto 2xl:w-44 object-cover block dark:hidden"
        src="/src/assets/ts-trans-light.png"
        alt="Light mode logo"
      />
      <!-- Dark mode image: hidden by default, visible in dark mode -->
      <img
        class="w-64 2xl:h-auto 2xl:w-44 object-cover hidden dark:block"
        src="/src/assets/ts-trans-dark.png"
        alt="Dark mode logo"
      />
    </div>
    <nav v-if="userStore.userProfile?.roles" class="flex flex-col gap-4 2xl:gap-10 my-auto">
      <RouterLink :to="{ name: 'dashboard-home' }" class=" flex items-center gap-2">
        <svg class="w-5 h-5 me-2 text-body" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 13h8V3H3v10zM13 21h8v-6h-8v6zM13 3v6h8V3h-8zM3 21h8v-4H3v4z"/></svg>
        <span class="nav-btn" v-html="t('dashboard.sidebar.myDashboard')" />
      </RouterLink>

      <RouterLink
        :to="{ name: 'events-calendar' }"
        class="  flex items-center gap-2"

      >
        <svg class="w-5 h-5 me-2 text-body" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span class="nav-btn max-w-min" v-html="t('dashboard.sidebar.calendar')" />
      </RouterLink>

      <RouterLink
        :to="{ name: 'assessments' }"
        class=" flex items-center gap-2"
        v-if="userStore.userProfile?.roles.includes('Organization Admin') ||
          userStore.userProfile?.roles.includes('Organization Trnr')"
      >
        <svg class="w-5 h-5 me-2 text-body" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        <span class="nav-btn" v-html="t('dashboard.sidebar.myAssessments')" />
      </RouterLink>

      <RouterLink
        v-if="
          userStore.userProfile?.roles.includes('Trainer') ||
          userStore.userProfile?.roles.includes('Organization Trnr')
        "
        :to="{ name: 'programs-list' }"
        class=" flex items-center gap-2"
      >
        <svg class="w-5 h-5 me-2 text-body" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 20l9-5-9-5-9 5 9 5z"/><polyline points="12 12 12 20"/><polyline points="12 12 21 7"/><polyline points="12 12 3 7"/></svg>
        <span class="nav-btn" v-html="t('dashboard.sidebar.workoutPrograms')" />
      </RouterLink>

      <RouterLink
        v-if="
          userStore.userProfile?.roles.includes('Trainer') ||
          userStore.userProfile?.roles.includes('Organization Trnr')
        "
        :to="{ name: 'client-list' }"
        class=" flex items-center gap-2"
      >
        <svg class="w-5 h-5 me-2 text-body" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-3-3.87"/><path d="M9 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>
        <span class="nav-btn" v-html="t('dashboard.sidebar.myClients')" />
      </RouterLink>

      <RouterLink
        v-if="userStore.userProfile?.roles.includes('Trainer')"
        :to="{ name: 'entitlement-list' }"
        class=" flex items-center gap-2"
      >
        <svg class="w-5 h-5 me-2 text-body" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 1v22"/><path d="M5 6h14"/><path d="M5 18h14"/></svg>
        <span class="nav-btn" v-html="t('dashboard.sidebar.programEntitlements')" />
      </RouterLink>

      <RouterLink
        v-if="userStore.userProfile?.roles.includes('Administrator')"
        :to="{ name: 'users-list' }"
        class=" flex items-center gap-2"
      >
        <svg class="w-5 h-5 me-2 text-body" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M4 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>
        <span class="nav-btn" v-html="t('dashboard.sidebar.listOfUsers')" />
      </RouterLink>

      <RouterLink
        v-if="userStore.userProfile?.roles.includes('Organization Admin')"
        :to="{ name: 'org-users-list' }"
        class=" flex items-center gap-2"
      >
        <svg class="w-5 h-5 me-2 text-body" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-3-3.87"/><path d="M8 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>
        <span class="nav-btn" v-html="t('dashboard.sidebar.listOfUsers')" />
      </RouterLink>

      <RouterLink
        v-if="userStore.userProfile?.roles.includes('Organization Admin')"
        :to="{ name: 'org-programs-list' }"
        class=" flex items-center gap-2"
      >
        <svg class="w-5 h-5 me-2 text-body" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 7h18"/><path d="M3 12h18"/><path d="M3 17h18"/></svg>
        <span class="nav-btn" v-html="t('dashboard.sidebar.auditPrograms')" />
      </RouterLink>

      <RouterLink
        :to="{ name: 'audit-list' }"
        class=" flex items-center gap-2"
        v-if="userStore.userProfile?.roles.includes('Administrator')"
      >
        <svg class="w-5 h-5 me-2 text-body" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 7h18"/><path d="M3 12h18"/><path d="M3 17h18"/></svg>
        <span class="nav-btn" v-html="t('dashboard.sidebar.auditPrograms')" />
      </RouterLink>

      <RouterLink
        :to="{ name: 'assessment-templates-list' }"
        class=" flex items-center gap-2"
        v-if="userStore.userProfile?.roles.includes('Organization Admin') ||
          userStore.userProfile?.roles.includes('Organization Trnr')"
      >
        <svg class="w-5 h-5 me-2 text-body" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>
        <span class="nav-btn" v-html="t('dashboard.sidebar.assessmentTemplates')" />
      </RouterLink>

      <RouterLink
        :to="{ name: 'forms-list' }"
        class=" flex items-center gap-2"
        v-if="userStore.userProfile?.roles.includes('Trainer') ||
          userStore.userProfile?.roles.includes('Organization Trnr')"
      >
        <svg class="w-5 h-5 me-2 text-body" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 20h9"/><path d="M12 4h9"/><path d="M4 9h16"/><path d="M4 15h16"/></svg>
        <span class="nav-btn" v-html="t('dashboard.sidebar.auditForms')" />
      </RouterLink>

      <RouterLink :to="{ name: 'settings' }" class=" flex items-center gap-2">
        <svg class="w-5 h-5 me-2 text-body" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <span class="nav-btn" v-html="t('dashboard.sidebar.settingsPreferences')" />
      </RouterLink>
    </nav>

    <nav v-if="userStore.userProfile?.roles" class="flex flex-col gap-4 mt-auto 2xl:gap-8 text-sm">
      <RouterLink
        v-if="
          userStore.userProfile?.roles.includes('Trainer') ||
          userStore.userProfile?.roles.includes('Organization Trnr')
        "
        :to="{ name: 'ticket-list' }"
        class=" flex items-center gap-2 2xl:text-lg text-base"
      >
        <svg class="w-5 h-5 me-2 text-body" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5-2 4-2 4 2 4 2"/></svg>
        <span class="nav-btn" v-html="t('dashboard.sidebar.support')" />
      </RouterLink>

      <RouterLink
        v-if="
          userStore.userProfile?.roles.includes('Trainer') ||
          userStore.userProfile?.roles.includes('Organization Trnr')
        "
        :to="{ name: 'trainer-profile' }"
        class=" flex items-center gap-2 2xl:text-lg text-base"
      >
        <svg class="w-5 h-5 me-2 text-body" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M4 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>
        <span class="nav-btn" v-html="t('dashboard.sidebar.myProfile')" />
      </RouterLink>

      <a @click="handleLogOut" class=" flex items-center gap-2 2xl:text-lg text-base text-red-600 pl-4">
        <svg class="w-5 h-5 me-2 text-body" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        {{ t('dashboard.sidebar.logout') }}
      </a>
    </nav>
  </div>
</template>


<script setup lang="ts">
import router from '@/router';
import { useUserStore } from '@/stores/user';
import { useI18n } from 'vue-i18n';

const userStore = useUserStore();
const { t, locale } = useI18n();

const handleLogOut = async (): Promise<void> => {
  userStore.LogOut();
  router.push({ name: 'home' });
};
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
}

nav a.router-link-exact-active {
  color: #132e3d;
}
.dark nav a.router-link-exact-active {
  color: #ffffff;
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {

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
    margin-left: -1rem;
    font-size: 1rem;
    padding: 1rem 0;
  }
}
</style>
