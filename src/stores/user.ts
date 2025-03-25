import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'
import { useSettingsStore } from './settingstores'
import router from '@/router'
import Swal from 'sweetalert2'
import UserDetails from '@/views/DashboardVues/All Users/UserDetails.vue'
// Success and Error Alerts
function showSuccess(message: string) {
  Swal.fire({
    title: 'Success!',
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 1500,
    text: message,
    toast: true,
    position: 'top-right',
    icon: 'success',
    background: '#081411',
    color: '#E8F3ED',
  })
}

// Function to show error alerts
function showError(message: string) {
  Swal.fire({
    title: 'Error!',
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED',
  })
}

interface UserInterface {
  id?: number
  created_at?:Date
  trainer_profile?: string
  avatar?: string
  email?: string
  gender?: string // Mapped from users.sex
  nationality?: string
  dob?: Date
  phone?: string
  first_name?: string
  last_name?: string
  profile_id?:number,
  last_active?: Date | string,
  audit_status?: string,
  roles? :string[]
}
interface ClientInterface extends UserInterface{
  program_details?: any
  last_active?: Date
  profile?: any
}

interface TrainerInterface extends UserInterface {

  title: string
  years_of_experience: number
  certifications: number[]
  programs: number[]
  clients: number[]
  rating: number | null
  bio: string | null
  seats_available: number | null
  preferred_clients: string[] | null
  certifications_links: string[] | null
  user_id:number | null
}

type Exercise = {
  id: string
  exercise_name?: string
  type?: string
  intensity?: string
  sets?: number
  reps?: number
}

type Filter = {
  roles:string[],
  name:string,
  active:boolean,
}
type Workout = {
  workout_name: string
  workout_summary?: string
  time_to_complete?: string
  sets_per_session?: number
  rest_day?: boolean
  exercises: Exercise[]
}
type Program = {
  id: string
  program_name?: string
  program_description?: string
  program_focus?: string[] // Add program_focus here (assumed to be an array of strings)
  status?: string
  trainer_id?: number
  difficulty_level?: string
  avg_session_time?: number
  avg_days_per_week?: number
  overall_rating?: number
  price_one?: number
  price_three?: number
  price_six?: number
  price_years?: number
  tags?: string[]
  workouts?: Workout[]
  program_photo?: string
  weekly_cycle?: number
  // Add any other properties your program might have
}
interface Session {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  expires_at?: number
}


export const useUserStore = defineStore('User', () => {


  // For Logged in User
  const User = ref<UserInterface>({})
  const Trainer = ref<TrainerInterface | null>(null)
  const userProfile = ref<UserInterface | null>(null)




  // For Other Users
  const AllClients = ref<ClientInterface[]>([]) // Ensure it's typed as an array
  const ChatClients = ref<ClientInterface[]>([]) // Ensure it's typed as an array
  const Entitled = ref<ClientInterface[]>([]) // Ensure it's typed as an array
  const Client = ref<ClientInterface | null>(null) // Ensure Client can be null
  const O_Trainer = ref<TrainerInterface | null>(null)
  const UserDetail = ref<UserInterface>({})
  const client_count = ref<number | null>(0)
  const session = ref<Session>({})
  const All_Users = ref<any|null>()
  const All_count = ref<number>(0)






  //Login Handler
  function LogIn(data: UserInterface, sesh: Session) {
    User.value.id = data.id
    User.value.email = data.email
    session.value = {
      access_token: sesh.access_token,
      refresh_token: sesh.refresh_token,
      expires_in: sesh.expires_in,
      expires_at: sesh.expires_at,
    }

    if (User.value.email) {
      localStorage.setItem('LoggedInUser', User.value.email)
      // Trainer Check
      getUserProfile()
    }

    if (session.value.access_token) localStorage.setItem('AccessToken', session.value.access_token)
  }

  // Logout Handler
  function LogOut() {
    User.value = {}
    userProfile.value = null
    session.value = {}
    localStorage.removeItem('LoggedInUser')
    localStorage.removeItem('LoggedInTrainer')
    localStorage.removeItem('UserID')
    localStorage.removeItem('AccessToken')
    localStorage.removeItem("Roles");
  }

 // Fetch User Profile Function
async function getUserProfile() {
  const loggedInUser = localStorage.getItem("LoggedInUser");

  if (!loggedInUser) {
    console.error("No logged-in user found in localStorage.");
    return;
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*") // Select only required fields
      .eq("email", loggedInUser)
      .single();

    if (error || !data) {
      throw new Error(`Error fetching user profile: ${error?.message || "User not found"}`);
    }

    // Store user information in localStorage
    localStorage.setItem("UserID", data.id);
    localStorage.setItem("LoggedInTrainer", data.is_staff ? "true" : "false");
    localStorage.setItem("Roles", data.roles);

    userProfile.value = data;

    // Redirect based on trainer status
    router.push({ name: "dashboard-home" });

    return userProfile.value;
  } catch (error:any) {
    localStorage.removeItem("UserID");
    localStorage.removeItem("LoggedInTrainer");
    localStorage.removeItem("Roles");

    // Redirect only if user profile is not found
    router.push("/setup-user-profile");

  }
}


// Fetch Users Based On Filters with Pagination
async function fetchUsers(filters: Filter, page: number, pageSize: number) {
  try {
    // Start building the query; count: 'exact' returns the total count
    let query = supabase
      .from("users")
      .select("*", { count: "exact" });

    // Filter by roles if provided
    if (filters.roles && filters.roles.length > 0) {
      query = query.contains("roles", filters.roles);
    }

    // Filter by name (search in first_name or last_name, case-insensitive)
    if (filters.name && filters.name.trim() !== "") {
      query = query.or(
        `first_name.ilike.%${filters.name}%,last_name.ilike.%${filters.name}%`
      );
    }


    // Apply pagination: calculate the start and end indexes for the range
    const start = (page - 1) * pageSize;
    const end = page * pageSize - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;

    if (error || !data) {
      throw new Error(`Error fetching users: ${error?.message || "Users not found"}`);
    }

    // Store data (and count if needed)
    All_Users.value = data;
    if(count)
    All_count.value = count;
    // Optionally, you can use count to display total records if required:
    // totalCount.value = count;

  } catch (error: any) {
    showError(error);
  }
}

// Fetch Users Based On ID
async function fetchUser(id: number) {
  try {
    // Start building the query; count: 'exact' returns the total count


    const { data, error} = await supabase.from('users').select('*').eq('id',id).single();

    if (error || !data) {
      throw new Error(`Error fetching users: ${error?.message || "Users not found"}`);
    }

    // Store data (and count if needed)
    UserDetail.value = data;


  } catch (error: any) {
    showError(error);
  }
}

// Fetch Logged In Trainer
async function getLoggedTrainer() {
  try {
    const id = localStorage.getItem('UserID')
    if (!id) {
      throw new Error('No user ID found in the store.')
    }
    // Fetch the user profile based on the provided user ID (id)
    const { data: userProfiles, error: profileError } = await supabase
      .from('trainer_profile')
      .select('*')
      .eq('user_id', id) // Match user_id, as we have the user id here
      .single() // Since we're looking for a single profile

    if (profileError) {
      throw new Error(`Error fetching user profile: ${profileError.message}`)
    }

    if (!userProfiles) {
      return null // If no profile found for the given user ID, return null
    }

    // Fetch user details from the users table based on the provided user_id
    const { data: users, error: userError } = await supabase
      .from('users')
      .select(
        'id, avatar, email, first_name, last_name, dob,sex, nationality, phone, last_active',
      )
      .eq('id', id)
      .single() // We expect a single user here

    if (userError) {
      throw new Error(`Error fetching user details: ${userError.message}`)
    }

    // Assign the client object with the user details and associated program
    Trainer.value = {
      user_id: id,
      avatar: users.avatar,
      email: users.email,
      gender: users.sex,
      nationality: users.nationality,
      phone: users.phone,
      first_name: users.first_name,
      last_name: users.last_name,
      dob: users.dob,
      last_active: users.last_active, // This includes the single program the client is associated with
      ...userProfiles,
    }

    return Trainer.value
  } catch (error: any) {
    console.error(error)
    alert(`Failed to load client: ${error.message || 'Unknown error'}`)
    return null
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
        .neq('status', 'cancelled')

      if (programError) {
        throw new Error(`Error fetching user programs: ${programError.message}`)
      }

      if (!programs || programs.length === 0) {
        AllClients.value = []
        return
      }

      // Extract client IDs from user_profiles
      const clientProfileIds = programs.map((p) => p.client_id)

      // Fetch user_ids from user_profiles
      const { data: userProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id')
        .in('id', clientProfileIds)

      if (profileError) {
        throw new Error(`Error fetching user profiles: ${profileError.message}`)
      }

      const userIds = userProfiles.map((profile) => profile.user_id)

      // Fetch user details from users table
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id,avatar, email, first_name, last_name')
        .in('id', userIds)

      if (userError) {
        throw new Error(`Error fetching user details: ${userError.message}`)
      }

      // Merge client details with their respective program details
      AllClients.value = userProfiles
        .map((profile) => {
          const user = users.find((u) => u.id === profile.user_id)
          const programDetails = programs.filter((program) => program.client_id === profile.id)
          return user
            ? {
                id: user.id,
                avatar: user.avatar,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                program_details: programDetails,
              }
            : null
        })
        .filter((client) => client !== null)
    } catch (error: any) {
      console.error(error)
      alert(`Failed to load clients: ${error.message || 'Unknown error'}`)
    }
  }
  // Fetches Entitled related to anEntitlement
  async function getEntitled() {
    try {
      // Fetch user_programs where entitlement_id matches the given id
      const { data: programs, error: programError } = await supabase
        .from('user_programs')
        .select('*')
        .eq('trainer_id', localStorage.getItem("UserID"))
        .neq('status', 'cancelled')
        .not('entitlement_id', 'is', null) // ✅ Correct way to filter out NULLs

      if (programError) {
        throw new Error(`Error fetching user programs: ${programError.message}`)
      }

      if (!programs || programs.length === 0) {
        Entitled.value = []
        return
      }

      // Extract client IDs from user_profiles
      const clientProfileIds = programs.map((p) => p.client_id)

      // Fetch user_ids from user_profiles
      const { data: userProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id')
        .in('id', clientProfileIds)

      if (profileError) {
        throw new Error(`Error fetching user profiles: ${profileError.message}`)
      }

      const userIds = userProfiles.map((profile) => profile.user_id)

      // Fetch user details from users table
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds)

      if (userError) {
        throw new Error(`Error fetching user details: ${userError.message}`)
      }

      // Merge client details with their respective program details
      Entitled.value = userProfiles
      .map((profile) => {
        const user = users.find((u) => u.id === profile.user_id)
        const programDetails = programs.find(
          (program) => program.client_id === profile.id,
        )

        return user
          ? {
              id: user.id,
              avatar: user.avatar,
              email: user.email,
              gender: user.sex,
              nationality: user.nationality,
              phone: user.phone,
              first_name: user.first_name,
              last_name: user.last_name,
              dob: user.dob,
              profile: profile,
              program_details: programDetails,
              last_active: user.last_active,
            }
          : null
      })
      .filter((client) => client !== null)
    } catch (error: any) {
      console.error(error)
      alert(`Failed to load clients: ${error.message || 'Unknown error'}`)
    }
  }

  async function getActiveClientsForTrainer(page: number, pageSize: number) {
    try {
      const trainerId = localStorage.getItem('UserID')
      if (!trainerId) {
        showError('Trainer ID not found in local storage.')
        AllClients.value = []
        client_count.value = 0
        return
      }

      // Fetch total count for pagination
      const { count, error: countError } = await supabase
        .from('user_programs')
        .select('client_id', { count: 'exact', head: true })
        .eq('trainer_id', trainerId)
        .neq('status', 'cancelled')

      if (countError) {
        showError(`Error fetching total count: ${countError.message}`)
        AllClients.value = []
        client_count.value = 0
        return
      }

      const { data: activePrograms, error: programError } = await supabase
        .from('user_programs')
        .select('*')
        .eq('trainer_id', trainerId)
        .neq('status', 'cancelled')
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (programError) {
        showError(`Error fetching user programs: ${programError.message}`)
        AllClients.value = []
        client_count.value = 0
        return
      }

      if (!activePrograms || activePrograms.length === 0) {
        AllClients.value = []
        client_count.value = count
        return
      }

      const clientProfileIds = [...new Set(activePrograms.map((program) => program.client_id))]

      const { data: userProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id')
        .in('id', clientProfileIds)

      if (profileError) {
        showError(`Error fetching user profiles: ${profileError.message}`)
        AllClients.value = []
        client_count.value = count
        return
      }

      const userIds = userProfiles.map((profile) => profile.user_id)

      const { data: users, error: userError } = await supabase
        .from('users')
        .select(
          'id, avatar, email, first_name, last_name, dob, sex, nationality, phone, last_active',
        )
        .in('id', userIds)

      if (userError) {
        showError(`Error fetching user details: ${userError.message}`)
        AllClients.value = []
        client_count.value = count
        return
      }

      AllClients.value = userProfiles
        .map((profile) => {
          const user = users.find((u) => u.id === profile.user_id)
          const programDetails = activePrograms.find(
            (program) => program.client_id === profile.id,
          )

          return user
            ? {
                id: user.id,
                avatar: user.avatar,
                email: user.email,
                gender: user.sex,
                nationality: user.nationality,
                phone: user.phone,
                first_name: user.first_name,
                last_name: user.last_name,
                dob: user.dob,
                profile: profile,
                program_details: programDetails,
                last_active: user.last_active,
              }
            : null
        })
        .filter((client) => client !== null)

      client_count.value = count
    } catch (error: any) {
      showError(`Unexpected error: ${error.message || 'Unknown error'}`)
      AllClients.value = []
      client_count.value = 0
    }
  }
  async function getChatClients() {
    try {
      const trainerId = localStorage.getItem('UserID')
      if (!trainerId) {
        showError('Trainer ID not found in local storage.')
        ChatClients.value = []
        client_count.value = 0
        return
      }

      // Fetch total count for pagination
      const { count, error: countError } = await supabase
        .from('user_programs')
        .select('client_id', { count: 'exact', head: true })
        .eq('trainer_id', trainerId)
        .neq('status', 'cancelled')

      if (countError) {
        showError(`Error fetching total count: ${countError.message}`)
        ChatClients.value = []
        client_count.value = 0
        return
      }

      const { data: activePrograms, error: programError } = await supabase
        .from('user_programs')
        .select('*')
        .eq('trainer_id', trainerId)
        .neq('status', 'cancelled')

      if (programError) {
        showError(`Error fetching user programs: ${programError.message}`)
        ChatClients.value = []
        client_count.value = 0
        return
      }

      if (!activePrograms || activePrograms.length === 0) {
        ChatClients.value = []
        client_count.value = count
        return
      }

      const clientProfileIds = [...new Set(activePrograms.map((program) => program.client_id))]

      const { data: userProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id')
        .in('id', clientProfileIds)

      if (profileError) {
        showError(`Error fetching user profiles: ${profileError.message}`)
        ChatClients.value = []
        client_count.value = count
        return
      }

      const userIds = userProfiles.map((profile) => profile.user_id)

      const { data: users, error: userError } = await supabase
        .from('users')
        .select(
          'id, avatar, email, first_name, last_name, dob, sex, nationality, phone, last_active',
        )
        .in('id', userIds)

      if (userError) {
        showError(`Error fetching user details: ${userError.message}`)
        ChatClients.value = []
        client_count.value = count
        return
      }

      ChatClients.value = userProfiles
        .map((profile) => {
          const user = users.find((u) => u.id === profile.user_id)
          const programDetails = activePrograms.filter(
            (program) => program.client_id === profile.id,
          )

          return user
            ? {
                id: user.id,
                avatar: user.avatar,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                program_details: programDetails[0],
                last_active: user.last_active,
              }
            : null
        })
        .filter((client) => client !== null)

      client_count.value = count
    } catch (error: any) {
      showError(`Unexpected error: ${error.message || 'Unknown error'}`)
      AllClients.value = []
      client_count.value = 0
    }
  }
  // Update Client Program
  async function updateClientProgram(updateData: Program) {
    try {
      const { error } = await supabase
        .from('user_programs')
        .update(updateData)
        .eq('id', updateData.id)

      if (error) throw new Error(error.message)

      // Update local state
      if (Client.value?.program_details?.id === updateData.id) {
        Object.assign(Client.value?.program_details, updateData)
        showSuccess('Successfully updated client workout plan!')
      }
    } catch (error) {
      showError('Error updating program:' + error)
    }
  }

  async function getClient(id: number) {
    try {

      // Fetch the user profile based on the provided user ID (id)
      const { data: userProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id) // Match user_id, as we have the user id here
        .single() // Since we're looking for a single profile

      if (profileError) {
        throw new Error(`Error fetching user profile: ${profileError.message}`)
      }

      if (!userProfiles) {
        return null // If no profile found for the given user ID, return null
      }
      const is_admin = localStorage.getItem('Roles')?.includes('Admin');
      const user_id = localStorage.getItem('UserID');

      let programs, programError; // Declare variables outside

        ({ data: programs, error: programError } = await supabase
          .from('user_programs')
          .select('*')
          .eq('client_id', userProfiles.id)
          .eq('trainer_id', user_id)
          .neq('status', 'cancelled')
          .single());


      // Now, `programs` and `programError` are accessible here
      if (programError) {
        console.error('Error fetching program:', programError);
      }
      let promAssign = null
      if (programs) {
        promAssign = programs
      }

      // Fetch user details from the users table based on the provided user_id
      const { data: users, error: userError } = await supabase
        .from('users')
        .select(
          'id, avatar, email, first_name, last_name, dob,sex, nationality, phone, last_active',
        )
        .eq('id', id)
        .single() // We expect a single user here

      if (userError) {
        throw new Error(`Error fetching user details: ${userError.message}`)
      }

      // Assign the client object with the user details and associated program
      Client.value = {
        id: users.id,
        avatar: users.avatar,
        email: users.email,
        gender: users.sex,
        nationality: users.nationality,
        phone: users.phone,
        first_name: users.first_name,
        last_name: users.last_name,
        dob: users.dob,
        profile: userProfiles,
        program_details: promAssign,
        last_active: users.last_active, // This includes the single program the client is associated with
      }

      return Client.value
    } catch (error: any) {
      console.error(error)
      alert(`Failed to load client: ${error.message || 'Unknown error'}`)
      return null
    }
  }
  async function getUserClient(id: number) {
    try {

      // Fetch the user profile based on the provided user ID (id)
      const { data: userProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id) // Match user_id, as we have the user id here
        .single() // Since we're looking for a single profile

      if (profileError) {
        throw new Error(`Error fetching user profile: ${profileError.message}`)
      }

      if (!userProfiles) {
        return null // If no profile found for the given user ID, return null
      }
      const is_admin = localStorage.getItem('Roles')?.includes('Admin');
      const user_id = localStorage.getItem('UserID');

      let programs, programError; // Declare variables outside


        ({ data: programs, error: programError } = await supabase
          .from('user_programs')
          .select('*')
          .eq('client_id', userProfiles.id)
          .neq('status', 'cancelled')
          .single());


      // Now, `programs` and `programError` are accessible here
      if (programError) {
        console.error('Error fetching program:', programError);
      }
      let promAssign = null
      if (programs) {
        promAssign = programs
      }

      // Fetch user details from the users table based on the provided user_id
      const { data: users, error: userError } = await supabase
        .from('users')
        .select(
          'id, avatar, email, first_name, last_name, dob,sex, nationality, phone, last_active',
        )
        .eq('id', id)
        .single() // We expect a single user here

      if (userError) {
        throw new Error(`Error fetching user details: ${userError.message}`)
      }

      // Assign the client object with the user details and associated program
      Client.value = {
        id: users.id,
        avatar: users.avatar,
        email: users.email,
        gender: users.sex,
        nationality: users.nationality,
        phone: users.phone,
        first_name: users.first_name,
        last_name: users.last_name,
        dob: users.dob,
        profile: userProfiles,
        program_details: promAssign,
        last_active: users.last_active, // This includes the single program the client is associated with
      }

      return Client.value
    } catch (error: any) {
      console.error(error)
      alert(`Failed to load client: ${error.message || 'Unknown error'}`)
      return null
    }
  }


  async function getTrainer(id:number) {
    try {
      if (!id) {
        throw new Error('No user ID found in the store.')
      }
      // Fetch the user profile based on the provided user ID (id)
      const { data: userProfiles, error: profileError } = await supabase
        .from('trainer_profile')
        .select('*')
        .eq('user_id', id) // Match user_id, as we have the user id here
        .single() // Since we're looking for a single profile

      if (profileError) {
        throw new Error(`Error fetching user profile: ${profileError.message}`)
      }

      if (!userProfiles) {
        return null // If no profile found for the given user ID, return null
      }

      // Fetch user details from the users table based on the provided user_id
      const { data: users, error: userError } = await supabase
        .from('users')
        .select(
          'id, avatar, email, first_name, last_name, dob,sex, nationality, phone, last_active',
        )
        .eq('id', id)
        .single() // We expect a single user here

      if (userError) {
        throw new Error(`Error fetching user details: ${userError.message}`)
      }

      // Assign the client object with the user details and associated program
      O_Trainer.value = {
        user_id: id,
        avatar: users.avatar,
        email: users.email,
        gender: users.sex,
        nationality: users.nationality,
        phone: users.phone,
        first_name: users.first_name,
        last_name: users.last_name,
        dob: users.dob,
        last_active: users.last_active, // This includes the single program the client is associated with
        ...userProfiles,
      }

      return O_Trainer.value
    } catch (error: any) {
      console.error(error)
      alert(`Failed to load client: ${error.message || 'Unknown error'}`)
      return null
    }
  }
  // Fetch User Profile Function with no RR
  async function getUserProfileNO() {
    const loggedInUser = localStorage.getItem('LoggedInUser')

    if (!loggedInUser) {
      throw new Error('No logged-in user found in localStorage.')
    }

    try {
      const { data, error } = await supabase.from('users').select().eq('email', loggedInUser)

      if (error) {
        throw new Error(`Error fetching user profile: ${error.message}`)
      }
      // Fetch Settings for User
      const useSettings = useSettingsStore()

      useSettings.fetchSettings(data[0].id)
      const { error:logerror } = await supabase.from('users').update({last_active: new Date()}).eq('email', loggedInUser).select()

      if (logerror) {
        throw new Error(`Error fetching updating last active: ${logerror.message}`)
      }

      localStorage.setItem('UserID', data[0].id)
      localStorage.setItem('LoggedInTrainer', data[0].is_staff)
      localStorage.setItem("Roles", data[0].roles);
      userProfile.value = data[0]
      return userProfile.value
    } catch (error: any) {
      console.error(error)
      localStorage.removeItem('UserID')
      localStorage.removeItem("Roles");
      // Display a user-friendly error message in the UI instead of an alert.
      alert(`Failed to load user profile: ${error.message || 'Unknown error'}`)
    }
  }


  // Wipe out old date
  function wipeOut(){
    O_Trainer.value = null
    Client.value = null
    UserDetail.value = {}
  }

  return {
    User,
    userProfile,
    AllClients,
    ChatClients,
    Entitled,
    Client,
    Trainer,
    client_count,
    All_Users,
    All_count,
    UserDetail,
    O_Trainer,
    getChatClients,
    getActiveClientsForTrainer,
    getUserClient,
    LogIn,
    LogOut,
    wipeOut,
    getUserProfile,
    getUserProfileNO,
    getClients,
    getLoggedTrainer,
    getEntitled,
    getClient,
    updateClientProgram,
    fetchUsers,
    fetchUser,
    getTrainer
  }
})
