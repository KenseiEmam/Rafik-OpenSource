<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user';
import { onMounted } from 'vue';
import router from '@/router';
const { t, tm, rt } = useI18n();
const userStore = useUserStore()
onMounted(() => {
  userStore.getUserProfileNO().then(()=>{
    if(localStorage.getItem("LoggedInTrainer"))
      router.push("/dashboard")
  })
});

</script>

<template>
  <div class="dark text-body flex-1 flex h-screen items-center relative">
    <div class="container mx-auto px-4 py-16">
      <div class="max-w-3xl mx-auto card shadow-lg rounded-lg p-6">
        <!-- Main Title -->
        <h1 class="title-small mb-4">
          No Access Record Found!
        </h1>

        <!-- Section 1: Introduction -->
        <section class="mt-6">

          <p class="text-body mt-2">
           While trying to set up your dashboard, we found no record of you being added as a trainer or admin.
          </p>
        </section>

        <!-- Section 2: Information We Collect -->
        <section class="mt-6">
          <p class="text-body mt-2">
           No reason to panic, here are some probable reasons why and how to address them:
          </p>
          <ul class="list-disc list-inside space-y-6 mt-2">
            <li class="flex itmes-center card gradient-bg p-6 w-full gap-4">
              <div class="w-1/2">
                <h3 class="header-small">Your organisation has not registered!</h3>
                <p class="text-body text-xs">If you have not recieved an email regarding your account that means your organization has not set up your account or their account. Try reaching out directly or requesting a demo!</p>
              </div>
              <router-link :to="{name:'demo'}" class="btn-md ms-auto text-center flex-col justify-center items-center flex"> Request a demo</router-link>
            </li>
            <li class="flex itmes-center card gradient-bg p-6 w-full gap-4">
              <div class="w-1/2">
                <h3 class="header-small">You are an athlete or trainee!</h3>
                <p class="text-body text-xs">If you have recieved an email regarding downloading the app and tried registering or logging in here you will face an issue. Download the app and login there instead!</p>
              </div>
              <router-link :to="{name:'application'}" class="btn-md-outline ms-auto text-center flex-col justify-center items-center flex"> Get App</router-link>
            </li>
            <li v-if="userStore.userProfile" class="flex itmes-center card gradient-bg p-6 w-full gap-4">
              <div class="w-1/2">
                <h3 class="header-small">Wrong Email?</h3>
                <p class="text-body text-xs">Is this the email you meant to register with? <span class="text-rafik-secondary">{{ userStore.userProfile.email }}</span> If not then logout and try again!</p>
              </div>
              <router-link :to="{name:'home'}" @click="userStore.LogOut" class="btn-md-outline border-red-500 hover:border-red-500 hover:bg-red-500 text-red-500 ms-auto text-center flex-col justify-center items-center flex"> Logout</router-link>
            </li>
          </ul>
        </section>



      </div>
    </div>
  </div>
</template>

<style>
/* Additional styling if needed */
</style>
