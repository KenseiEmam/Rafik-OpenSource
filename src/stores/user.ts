import { ref} from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'
import router from '@/router'
interface UserInterface  {
  id?:string,
  email?:string,
  full_name?:string
}
interface Session {
  access_token?:string,
  refresh_token?:string,
  expires_in?: number,
  expires_at?: number,
}
export const useUserStore = defineStore('User', () => {
  const User= ref<UserInterface>({
  })
  const session = ref<Session>({})
  const userProfile = ref<any | null>(null); // Adjust type based on your `users` table structure.

  //Login Handler
  function LogIn(data:UserInterface, sesh:Session) {
    User.value.id =data.id
    User.value.email= data.email
    session.value = {
      access_token:sesh.access_token,
      refresh_token:sesh.refresh_token,
      expires_in: sesh.expires_in,
      expires_at: sesh.expires_at,
    }


    if(User.value.email){
      localStorage.setItem('LoggedInUser', User.value.email)
      // Trainer Check
      getUserProfile()
    }



    if(session.value.access_token)
      localStorage.setItem('AccessToken', session.value.access_token)
  }


  // Logout Handler
  function LogOut() {
    User.value={
    }
    userProfile.value =  null;
    session.value = {}
    localStorage.removeItem('LoggedInUser')
    localStorage.removeItem('LoggedInTrainer')
    localStorage.removeItem('UserID')
    localStorage.removeItem('AccessToken')
  }


  // Fetch User Profile Function
  async function getUserProfile() {
    const loggedInUser = localStorage.getItem('LoggedInUser');

      if (!loggedInUser) {
        throw new Error('No logged-in user found in localStorage.');
      }

    try {
      const { data, error } = await supabase
        .from('users')
        .select()
        .eq('email', loggedInUser);

      if (error) {
        throw new Error(`Error fetching user profile: ${error.message}`);
      }
      localStorage.setItem('UserID', data[0].id)
      localStorage.setItem('LoggedInTrainer',data[0].is_trainer)
      userProfile.value = data[0]
      router.push({ name: 'dashboard-home' })
      return userProfile.value ;

    } catch (error: any) {
      console.error(error);
      localStorage.removeItem('UserID')
      router.push({ name: 'setupprofile' })
      // Display a user-friendly error message in the UI instead of an alert.
      alert(`Failed to load user profile: ${error.message || 'Unknown error'}`);
    }
  }
   // Fetch User Profile Function with no RR
   async function getUserProfileNO() {
    const loggedInUser = localStorage.getItem('LoggedInUser');

      if (!loggedInUser) {
        throw new Error('No logged-in user found in localStorage.');
      }

    try {
      const { data, error } = await supabase
        .from('users')
        .select()
        .eq('email', loggedInUser);

      if (error) {
        throw new Error(`Error fetching user profile: ${error.message}`);
      }
      localStorage.setItem('UserID', data[0].id)
      localStorage.setItem('LoggedInTrainer',data[0].is_trainer)
      userProfile.value = data[0]
      return userProfile.value ;

    } catch (error: any) {
      console.error(error);
      localStorage.removeItem('UserID')
      // Display a user-friendly error message in the UI instead of an alert.
      alert(`Failed to load user profile: ${error.message || 'Unknown error'}`);
    }
  }
  return { User, userProfile, LogIn, LogOut, getUserProfile, getUserProfileNO }
})
