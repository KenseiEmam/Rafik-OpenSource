import { ref} from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'
import router from '@/router'
import Swal from "sweetalert2"
// Success and Error Alerts
  function showSuccess(message: string) {
    Swal.fire({
      title: "Success!",
      showConfirmButton:false,
      timerProgressBar:true,
      timer:1500,
      text: message,
      toast: true,
      position: "top-right",
      icon: "success",
      background: "#081411",
      color: "#E8F3ED",
    });
  }

  // Function to show error alerts
function showError(message: string) {
  Swal.fire({
    title: "Error!",
    text: message,
    icon: "error",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#d33",
      background:"#081411",
      color:"#E8F3ED",
  });
}

interface UserInterface  {
  id?:string,
  email?:string,
  full_name?:string
}
interface ClientInterface {
  id: string;
  avatar?:string;
  email?: string;
  age?:number;
  gender?:string;
  nationality?:string;
  phone?:string;
  first_name?: string;
  last_name?:string;
  program_details?: any;
  last_active?: Date;
  profile?:any;
}
type Exercise = {
  id: string;
  exercise_name?: string;
  type?: string;
  intensity?: string;
  sets?: number;
  reps?: number;
};
type Workout = {
  workout_name: string;
  workout_summary?: string;
  time_to_complete?: string;
  sets_per_session?: number;
  rest_day?: boolean;
  exercises: Exercise[];
};
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
  const AllClients = ref<ClientInterface[]>([]); // Ensure it's typed as an array
  const Client = ref<ClientInterface | null>(null); // Ensure Client can be null
  const client_count = ref<number|null>(0);
  const session = ref<Session>({});
  const userProfile = ref<any | null>(null);


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
      router.push('/setup-user-profile')
      // Display a user-friendly error message in the UI instead of an alert.
      alert(`Failed to load user profile: ${error.message || 'Unknown error'}`);
    }
  }
  // Fetches clients related to a program
  async function getClients(id: number) {
    try {
      // Fetch user_programs where program_id matches the given id
      const { data: programs, error: programError } = await supabase
        .from('user_programs')
        .select('*')
        .eq('program_id', id)
        .neq('status', 'cancelled');

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


  async function getActiveClientsForTrainer(page:number , pageSize:number ) {
    try {
      const trainerId = localStorage.getItem('UserID');
      if (!trainerId) {
        showError("Trainer ID not found in local storage.");
        AllClients.value = [];
        client_count.value = 0;
        return;
      }

      // Fetch total count for pagination
      const { count, error: countError } = await supabase
        .from('user_programs')
        .select('client_id', { count: 'exact', head: true })
        .eq('trainer_id', trainerId)
        .neq('status', 'cancelled');


      if (countError) {
        showError(`Error fetching total count: ${countError.message}`);
        AllClients.value = [];
        client_count.value = 0;
        return;
      }

      const { data: activePrograms, error: programError } = await supabase
        .from('user_programs')
        .select('*')
        .eq('trainer_id', trainerId)
        .neq('status', 'cancelled')
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (programError) {
        showError(`Error fetching user programs: ${programError.message}`);
        AllClients.value = [];
        client_count.value = 0;
        return;
      }

      if (!activePrograms || activePrograms.length === 0) {
        AllClients.value = [];
        client_count.value = count;
        return;
      }

      const clientProfileIds = [...new Set(activePrograms.map(program => program.client_id))];

      const { data: userProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id')
        .in('id', clientProfileIds);

      if (profileError) {
        showError(`Error fetching user profiles: ${profileError.message}`);
        AllClients.value = [];
        client_count.value = count;
        return;
      }

      const userIds = userProfiles.map(profile => profile.user_id);

      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, avatar, email, first_name, last_name, age, sex, nationality, phone, last_active')
        .in('id', userIds);

      if (userError) {
        showError(`Error fetching user details: ${userError.message}`);
        AllClients.value = [];
        client_count.value = count;
        return;
      }

      AllClients.value = userProfiles.map(profile => {
        const user = users.find(u => u.id === profile.user_id);
        const programDetails = activePrograms.filter(program => program.client_id === profile.id);

        return user ? {
          id: user.id,
          avatar: user.avatar,
          email: user.email,
          gender: user.sex,
          nationality: user.nationality,
          phone: user.phone,
          first_name: user.first_name,
          last_name: user.last_name,
          age: user.age,
          profile: profile,
          program_details: programDetails,
          last_active: user.last_active,
        } : null;
      }).filter(client => client !== null);

      client_count.value = count;
    } catch (error:any) {
      showError(`Unexpected error: ${error.message || 'Unknown error'}`);
      AllClients.value = [];
      client_count.value = 0;
    }
  }

  // Update Client Program
    async function updateClientProgram(updateData: Program) {
      try {
        const { error } = await supabase
          .from("user_programs")
          .update(updateData)
          .eq("id", updateData.id);

        if (error) throw new Error(error.message);

        // Update local state
        if (Client.value?.program_details?.id === updateData.id) {
          Object.assign(Client.value?.program_details, updateData);
          showSuccess("Successfully updated client workout plan!")
        }
      } catch (error) {
        showError("Error updating program:"+ error)
      }
    }


  async function getClient(id: string) {
    try {
      // Fetch the user profile based on the provided user ID (id)
      const { data: userProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id) // Match user_id, as we have the user id here
        .single(); // Since we're looking for a single profile

      if (profileError) {
        throw new Error(`Error fetching user profile: ${profileError.message}`);
      }

      if (!userProfiles) {
        return null; // If no profile found for the given user ID, return null
      }

      // Fetch the single program associated with the client
      const { data: programs, error: programError } = await supabase
        .from('user_programs')
        .select('*')
        .eq('client_id', userProfiles.id)
        .single(); // We expect a single program here

      if (programError) {
        throw new Error(`Error fetching user program: ${programError.message}`);
      }

      if (!programs) {
        return null; // If no program found for the client, return null
      }

      // Fetch user details from the users table based on the provided user_id
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, avatar, email, first_name, last_name, age,sex, nationality, phone, last_active')
        .eq('id', id)
        .single(); // We expect a single user here

      if (userError) {
        throw new Error(`Error fetching user details: ${userError.message}`);
      }

      // Assign the client object with the user details and associated program
      Client.value = {
        id: users.id,
        avatar: users.avatar,
        email: users.email,
        gender:users.sex,
        nationality:users.nationality,
        phone:users.phone,
        first_name: users.first_name,
        last_name: users.last_name,
        age:users.age,
        profile:userProfiles,
        program_details: programs,
        last_active:users.last_active // This includes the single program the client is associated with
      };

      return Client.value;

    } catch (error: any) {
      console.error(error);
      alert(`Failed to load client: ${error.message || 'Unknown error'}`);
      return null;
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
  return { User, userProfile, AllClients, Client, client_count, getActiveClientsForTrainer, LogIn, LogOut, getUserProfile, getUserProfileNO, getClients, getClient, updateClientProgram }
})
