<template>
  <div class="flex h-screen overflow-hidden">
    <DashboardSideBar/>

    <div v-if="userProfile" class="flex-1">
      <router-view class="overflow-y-scroll" :user="userProfile" />

    </div>
    <PostOffice/>

  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabaseClient'
  const userProfile = ref<any | null>(null); // Adjust type based on your `users` table structure.

  async function getUserProfile() {
    try {
      const loggedInUser = localStorage.getItem('LoggedInUser');

      if (!loggedInUser) {
        throw new Error('No logged-in user found in localStorage.');
      }

      const { data, error } = await supabase
        .from('users')
        .select()
        .eq('email', loggedInUser);

      if (error) {
        throw new Error(`Error fetching user profile: ${error.message}`);
      }

      userProfile.value = data[0] ;
    } catch (error: any) {
      console.error(error);
      // Display a user-friendly error message in the UI instead of an alert.
      alert(`Failed to load user profile: ${error.message || 'Unknown error'}`);
    }
  }


  onMounted(() => {
    getUserProfile()
  })
import DashboardSideBar from '../../components/DashboardSideBar.vue'
import PostOffice from '../../components/PostOffice.vue'
</script>
