import { ref} from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'
import router from '@/router'
interface UserInterface  {
  id?:string,
  email?:string,
  full_name?:string
}
interface ClientInterface {
  id?: string;
  avatar?:string;
  email?: string;
  first_name?: string;
  last_name?:string;
  program_details?: any;
}

type Program = {
  id: string;
  program_name?: string;
  program_description?: string;
  program_focus?: string[]; // Add program_focus here (assumed to be an array of strings)
  status?: string;
  trainer_id?: number,
  difficulty_level?: string;
  avg_session_time?: number;
  avg_days_per_week?: number;
  overall_rating?: number;
  price_one?: number;
  price_three?: number;
  price_six?: number;
  price_years?: number;
  tags?:string[];
  workouts?:Workout[];
  program_photo?: string;
  weekly_cycle?:number;
  // Add any other properties your program might have
};
interface Session {
  access_token?:string,
  refresh_token?:string,
  expires_in?: number,
  expires_at?: number,
}
export const useUserStore = defineStore('User', () => {
  const User= ref<UserInterface>({
  })
  const AllClients = ref <ClientInterface>([])
  const Client = ref <ClientInterface>({})
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

  async function getClients(id: number) {
    try {
      // Fetch user_programs where program_id matches the given id
      const { data: programs, error: programError } = await supabase
        .from('user_programs')
        .select('*')
        .eq('program_id', id);

      if (programError) {
        throw new Error(`Error fetching user programs: ${programError.message}`);
      }

      if (!programs || programs.length === 0) {
        AllClients.value = [];
        return;
      }

      // Extract client IDs from user_profiles
      const clientProfileIds = programs.map((p) => p.client_id);

      // Fetch user_ids from user_profiles
      const { data: userProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id')
        .in('id', clientProfileIds);

      if (profileError) {
        throw new Error(`Error fetching user profiles: ${profileError.message}`);
      }

      const userIds = userProfiles.map(profile => profile.user_id);

      // Fetch user details from users table
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id,avatar, email, first_name, last_name')
        .in('id', userIds);

      if (userError) {
        throw new Error(`Error fetching user details: ${userError.message}`);
      }

      // Merge client details with their respective program details
      AllClients.value = userProfiles.map(profile => {
        const user = users.find(u => u.id === profile.user_id);
        const programDetails = programs.filter(program => program.client_id === profile.id);
        return user ? { id: user.id, avatar:user.avatar, email: user.email, first_name: user.first_name, last_name: user.last_name, program_details: programDetails } : null;
      }).filter(client => client !== null);
    } catch (error: any) {
      console.error(error);
      alert(`Failed to load clients: ${error.message || 'Unknown error'}`);
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
  return { User, userProfile, AllClients, LogIn, LogOut, getUserProfile, getUserProfileNO, getClients }
})
