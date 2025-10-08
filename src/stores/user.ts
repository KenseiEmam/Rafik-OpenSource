import { ref } from 'vue';
import { defineStore } from 'pinia';
import { supabase } from '../lib/supabaseClient';
import { useSettingsStore } from './settingstores';
import router from '@/router';
import Swal from 'sweetalert2';
import UserDetails from '@/views/DashboardVues/All Users/UserDetails.vue';
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
    color: '#E8F3ED'
  });
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
    color: '#E8F3ED'
  });
}

interface UserInterface {
  id?: number;
  created_at?: Date;
  trainer_profile?: string;
  avatar?: string;
  email?: string;
  gender?: string; // Mapped from users.sex
  nationality?: string;
  dob?: Date;
  phone?: string;
  first_name?: string;
  last_name?: string;
  profile_id?: number;
  last_active?: Date | string;
  audit_status?: string;
  roles?: string[];
  organization?: number;
  groups?:number[];
}
interface ClientInterface extends UserInterface {
  program_details?: any;
  coach_details?: any;
  last_active?: Date;
  profile?: any;
}

interface TrainerInterface extends UserInterface {
  title: string;
  years_of_experience: number;
  certifications: number[];
  programs: number[];
  clients: number[];
  rating: number | null;
  bio: string | null;
  seats_available: number | null;
  preferred_clients: string[] | null;
  certifications_links: string[] | null;
  user_id: number | null;
  socials:Socials;
}

type Exercise = {
  id: string;
  exercise_name?: string;
  type?: string;
  intensity?: string;
  sets?: number;
  reps?: number;
};
type Socials = {instagram: string| null, facebook: string| null, snapchat: string| null,x: string| null}
type Filter = {
  roles: string[];
  name: string;
  active: boolean;
  enrolled?: boolean;
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
  trainer_id?: number;
  difficulty_level?: string;
  avg_session_time?: number;
  avg_days_per_week?: number;
  overall_rating?: number;
  price_one?: number;
  price_three?: number;
  price_six?: number;
  price_years?: number;
  tags?: string[];
  workouts?: Workout[];
  program_photo?: string;
  weekly_cycle?: number;
  // Add any other properties your program might have
};
interface Session {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
}
interface ChatClient {
  id: number;
  avatar: string | null;
  email: string;
  first_name: string;
  last_name: string;
  last_active?: string;
  program_details?: any;
}

export const useUserStore = defineStore('User', () => {
  // For Logged in User
  const User = ref<UserInterface>({});
  const Trainer = ref<TrainerInterface | null>(null);
  const userProfile = ref<UserInterface | null>(null);

  // For Other Users
  const AllClients = ref<ClientInterface[]>([]); // Ensure it's typed as an array
  const ChatClients = ref<ChatClient[]>([]);
  const Entitled = ref<ClientInterface[]>([]); // Ensure it's typed as an array
  const Client = ref<ClientInterface | null>(null); // Ensure Client can be null
  const O_Trainer = ref<TrainerInterface | null>(null);
  const UserDetail = ref<UserInterface>({});
  const client_count = ref<number | null>(0);
  const session = ref<Session>({});
  const All_Users = ref<any | null>();
  const All_count = ref<number>(0);

  // Organizationals
  const All_Org_Users = ref<any | null>();
  const All_Org_count = ref<number>(0);

  //Login Handler
  function LogIn(data: UserInterface, sesh: Session) {
    User.value.id = data.id;
    User.value.email = data.email;
    session.value = {
      access_token: sesh.access_token,
      refresh_token: sesh.refresh_token,
      expires_in: sesh.expires_in,
      expires_at: sesh.expires_at
    };

    if (User.value.email) {
      localStorage.setItem('LoggedInUser', User.value.email);
      // Trainer Check
      getUserProfile();
    }

    if (session.value.access_token) localStorage.setItem('AccessToken', session.value.access_token);
  }

  // Logout Handler
  function LogOut() {
    User.value = {};
    userProfile.value = null;
    session.value = {};
    localStorage.removeItem('LoggedInUser');
    localStorage.removeItem('LoggedInTrainer');
    localStorage.removeItem('UserID');
    localStorage.removeItem('AccessToken');
    localStorage.removeItem('Roles');
    localStorage.removeItem('OrgID');
  }

  // Fetch User Profile Function
  async function getUserProfile() {
    const loggedInUser = localStorage.getItem('LoggedInUser');

    if (!loggedInUser) {
      console.error('No logged-in user found in localStorage.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*') // Select only required fields
        .eq('email', loggedInUser)
        .single();

      if (error || !data) {
        throw new Error(`Error fetching user profile: ${error?.message || 'User not found'}`);
      }

      // Store user information in localStorage
      localStorage.setItem('UserID', data.id);
      localStorage.setItem('LoggedInTrainer', data.is_staff ? 'true' : 'false');
      localStorage.setItem('Roles', data.roles);
      if (data.organization !== null) localStorage.setItem('OrgID', data.organization);
      userProfile.value = data;

      // Redirect based on trainer status
      router.push({ name: 'dashboard-home' });

      return userProfile.value;
    } catch (error: any) {
      localStorage.removeItem('UserID');
      localStorage.removeItem('LoggedInTrainer');
      localStorage.removeItem('Roles');
      localStorage.removeItem('OrgID');

      // Redirect only if user profile is not found
      router.push('/setup-user-profile');
    }
  }

  // Fetch Users Based On Filters with Pagination
  async function fetchUsers(filters: Filter, page: number, pageSize: number) {
    try {
      // Start building the query; count: 'exact' returns the total count
      let query = supabase.from('users').select('*', { count: 'exact' });

      // Filter by roles if provided
      if (filters.roles && filters.roles.length > 0) {
        query = query.contains('roles', filters.roles);
      }

      // Filter by name (search in first_name or last_name, case-insensitive)
      if (filters.name && filters.name.trim() !== '') {
        query = query.or(`first_name.ilike.%${filters.name}%,last_name.ilike.%${filters.name}%`);
      }

      // 3) If filters.enrolled is true, filter out users whose profile entry
      //    has coach != null (this covers both direct coach assignments and program assignments)
      if (filters.enrolled) {
        // Get profiles with coaches (this includes both direct coach assignments and program assignments)
        const { data: enrolledProfiles, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .not('coach', 'is', null);

        if (profileError) {
          throw new Error(`Error fetching enrolled profiles: ${profileError.message}`);
        }

        // If there are no such profiles, we can force an empty result:
        if (!enrolledProfiles || enrolledProfiles.length === 0) {
          query = query.in('profile_id', [0]); // There's presumably no profile row with id=0
        } else {
          // Collect valid profile IDs and filter the user query on them
          const enrolledProfileIds = enrolledProfiles.map((p) => p.id);
          query = query.in('profile_id', enrolledProfileIds);
        }
      }

      // Apply pagination: calculate the start and end indexes for the range
      const start = (page - 1) * pageSize;
      const end = page * pageSize - 1;
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error || !data) {
        throw new Error(`Error fetching users: ${error?.message || 'Users not found'}`);
      }

      // Store data (and count if needed)
      All_Users.value = data;
      if (count) All_count.value = count;
      // Optionally, you can use count to display total records if required:
      // totalCount.value = count;
    } catch (error: any) {
      showError(error);
    }
  }

  // Fetch Users Based On ID
  async function fetchUser(id: number) {
    try {
      const orgID = localStorage.getItem('OrgID');

      // Build base query
      let query = supabase.from('users').select('*').eq('id', id);

      // Conditionally filter by organization if orgID exists
      if (orgID) {
        query = query.eq('organization', orgID);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        throw new Error(`Error fetching users: ${error?.message || 'Users not found'}`);
      }

      UserDetail.value = data;
    } catch (error: any) {
      showError(error);
    }
  }

  // Fetch Users Based On Org, Filters with Pagination
  async function fetchOrgUsers(filters: Filter, page: number, pageSize: number) {
    try {
      const orgID = localStorage.getItem('OrgID');
      if (!orgID) {
        throw new Error('Organizational ID not Found');
      }

      // Basic query
      let query = supabase.from('users').select('*', { count: 'exact' }).eq('organization', orgID);

      // 1) Filter by roles if provided
      if (filters.roles && filters.roles.length > 0) {
        query = query.contains('roles', filters.roles);
      }

      // 2) Filter by name
      if (filters.name && filters.name.trim() !== '') {
        query = query.or(`first_name.ilike.%${filters.name}%,last_name.ilike.%${filters.name}%`);
      }

      // 3) If filters.enrolled is true, filter out users whose profile entry
      //    has coach != null (this covers both direct coach assignments and program assignments)
      if (filters.enrolled) {
        // Get profiles with coaches (this includes both direct coach assignments and program assignments)
        const { data: enrolledProfiles, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .not('coach', 'is', null);

        if (profileError) {
          throw new Error(`Error fetching enrolled profiles: ${profileError.message}`);
        }

        // If there are no such profiles, we can force an empty result:
        if (!enrolledProfiles || enrolledProfiles.length === 0) {
          query = query.in('profile_id', [0]); // There's presumably no profile row with id=0
        } else {
          // Collect valid profile IDs and filter the user query on them
          const enrolledProfileIds = enrolledProfiles.map((p) => p.id);
          query = query.in('profile_id', enrolledProfileIds);
        }
      }

      // Apply pagination
      const start = (page - 1) * pageSize;
      const end = page * pageSize - 1;
      query = query.range(start, end);

      // Execute
      const { data, error, count } = await query;
      if (error || !data) {
        throw new Error(`Error fetching users: ${error?.message || 'Users not found'}`);
      }

      // Fetch profile data separately to avoid relationship conflicts
      const profileIds = data.filter(user => user.profile_id).map(user => user.profile_id);
      let profilesData: any = {};

      if (profileIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, coach, user_program_id')
          .in('id', profileIds);

        if (!profilesError && profiles) {
          profilesData = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<number, any>);
        }
      }

      // Attach profile data to users
      const usersWithProfiles = data.map(user => ({
        ...user,
        profiles: user.profile_id ? profilesData[user.profile_id] : null
      }));

      All_Org_Users.value = usersWithProfiles;
      if (count) All_Org_count.value = count;
    } catch (error: any) {
      showError(error);
    }
  }

  // Fetch Logged In Trainer
  async function getLoggedTrainer() {
    try {
      const id = localStorage.getItem('UserID');
      if (!id) {
        throw new Error('No user ID found in the store.');
      }
      // Fetch the user profile based on the provided user ID (id)
      const { data: userProfiles, error: profileError } = await supabase
        .from('trainer_profile')
        .select('*')
        .eq('user_id', id) // Match user_id, as we have the user id here
        .maybeSingle(); // Use maybeSingle to handle cases with no or multiple profiles

      if (profileError) {
        throw new Error(`Error fetching user profile: ${profileError.message}`);
      }

      if (!userProfiles) {
        return null; // If no profile found for the given user ID, return null
      }

      // Fetch user details from the users table based on the provided user_id
      const { data: users, error: userError } = await supabase
        .from('users')
        .select(
          'id, avatar, email, first_name, last_name, dob,sex, nationality, phone, last_active'
        )
        .eq('id', id)
        .single(); // We expect a single user here

      if (userError) {
        throw new Error(`Error fetching user details: ${userError.message}`);
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
        ...userProfiles
      };

      return Trainer.value;
    } catch (error: any) {
      console.error(error);
      alert(`Failed to load client: ${error.message || 'Unknown error'}`);
      return null;
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

      const userIds = userProfiles.map((profile) => profile.user_id);

      // Fetch user details from users table
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id,avatar, email, first_name, last_name')
        .in('id', userIds);

      if (userError) {
        throw new Error(`Error fetching user details: ${userError.message}`);
      }

      // Merge client details with their respective program details
      AllClients.value = userProfiles
        .map((profile) => {
          const user = users.find((u) => u.id === profile.user_id);
          const programDetails = programs.filter((program) => program.client_id === profile.id);
          return (!!user && programDetails) //TODO: Temp
            ? {
                id: user.id,
                avatar: user.avatar,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                program_details: programDetails
              }
            : null;
        })
        .filter((client) => client !== null);
    } catch (error: any) {
      console.error(error);
      alert(`Failed to load clients: ${error.message || 'Unknown error'}`);
    }
  }
  // Fetches Entitled
  async function getEntitled() {
    try {
      // Fetch user_programs where entitlement_id matches the given id
      const { data: programs, error: programError } = await supabase
        .from('user_programs')
        .select('*')
        .eq('trainer_id', localStorage.getItem('UserID'))
        .neq('status', 'cancelled')
        .not('entitlement_id', 'is', null); // ✅ Correct way to filter out NULLs

      if (programError) {
        throw new Error(`Error fetching user programs: ${programError.message}`);
      }

      if (!programs || programs.length === 0) {
        Entitled.value = [];
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

      const userIds = userProfiles.map((profile) => profile.user_id);

      // Fetch user details from users table
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);

      if (userError) {
        throw new Error(`Error fetching user details: ${userError.message}`);
      }

      // Merge client details with their respective program details
      Entitled.value = userProfiles
        .map((profile) => {
          const user = users.find((u) => u.id === profile.user_id);
          const programDetails = programs.find((program) => program.client_id === profile.id);

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
                last_active: user.last_active
              }
            : null;
        })
        .filter((client) => client !== null);
    } catch (error: any) {
      console.error(error);
      alert(`Failed to load clients: ${error.message || 'Unknown error'}`);
    }
  }
async function getActiveClientsForTrainer(page: number, pageSize: number) {
  try {
    const trainerId = localStorage.getItem('UserID');
    if (!trainerId) throw new Error('Trainer ID not found.');

    // Step 1: Get paginated profiles coached by this trainer
    const { data: profiles, error: profileError, count } = await supabase
      .from('profiles')
      .select('id, user_id, user_program_id', { count: 'exact' }) // Get total count for pagination
      .eq('coach', trainerId)
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (profileError || !profiles) throw profileError;

    const userIds = profiles.map(p => p.user_id).filter(p=>p.user_program_id !== null)
    const profileIds = profiles.map(p => p.id);

    // Step 2: Get users and their programs *only for these paginated profiles*
    const [{ data: users, error: userError }, { data: programs, error: programError }] =
      await Promise.all([
        supabase
          .from('users')
          .select('id, avatar, email, first_name, last_name, dob, sex, nationality, phone, last_active')
          .in('id', userIds),
        supabase
          .from('user_programs')
          .select('*')
          .in('client_id', profileIds)
          .neq('status', 'cancelled')
      ]);

    if (userError || programError) throw userError || programError;

    // Step 3: Merge data
    AllClients.value = profiles
      .map(profile => {
        const user = users.find(u => u.id === profile.user_id);
        const programDetails = programs.find(p => p.client_id === profile.id);
        return (user && programDetails) //TODO: Temp
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
              profile,
              program_details: programDetails,
              last_active: user.last_active
            }
          : null;
      })
      .filter((client): client is NonNullable<typeof client> => client !== null);

    // Step 4: Set total count
    client_count.value = count ?? AllClients.value.length;
  } catch (error: any) {
    showError(error.message || 'Unexpected error');
    AllClients.value = [];
    client_count.value = 0;
  }
}


async function getChatClients() {
  try {
    const trainerId = localStorage.getItem('UserID');
    if (!trainerId) {
      showError('Trainer ID not found in local storage.');
      ChatClients.value = [];
      return;
    }

    // Get profiles where this trainer is the coach
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('coach', trainerId);

    if (profileError || !profiles) throw profileError || new Error('No profiles found');

    const profileIds = profiles.map(p => p.id);
    const userIds = profiles.map(p => p.user_id);

    // Fetch users associated with those profiles
    const [{ data: users, error: userError }, { data: programs, error: programError }] =
      await Promise.all([
        supabase.from('users')
          .select('id, avatar, email, first_name, last_name, last_active')
          .in('id', userIds),
        supabase.from('user_programs')
          .select('*')
          .in('client_id', profileIds)
          .neq('status', 'cancelled')
      ]);

    if (userError || programError) throw userError || programError;

     // Safely map users to clients
    const clients = profiles.map((profile) => {
      const user = users?.find(u => u.id === profile.user_id);
      const programDetails = programs?.find(p => p.client_id === profile.id); //TODO: Temp
      if (!user) return null;

      return {
        id: user.id,
        avatar: user.avatar,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        last_active: user.last_active,
        program_details: programDetails || { id: null } // Create a dummy program_details for direct coach assignments
      } as ChatClient;
    }).filter((client): client is ChatClient => client !== null);

    ChatClients.value = clients;

  } catch (error: any) {
    showError(`Unexpected error: ${error.message || 'Unknown error'}`);
    ChatClients.value = [];
  }
}

  // Update Client Program
  async function updateClientProgram(updateData: Program) {
    try {
      const { error } = await supabase
        .from('user_programs')
        .update(updateData)
        .eq('id', updateData.id);

      if (error) throw new Error(error.message);

      // Update local state
      if (Client.value?.program_details?.id === updateData.id) {
        Object.assign(Client.value?.program_details, updateData);
        showSuccess('Successfully updated client workout plan!');
      }
    } catch (error) {
      showError('Error updating program:' + error);
    }
  }
  // Fetch Singular Client
  async function getClient(id: number) {
    try {
      console.log(`[getClient] Fetching client for user ID: ${id}`);

      // Fetch the user profile based on the provided user ID (id)
      let { data: userProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id) // Match user_id, as we have the user id here
        .maybeSingle(); // Use maybeSingle to handle cases with no or multiple profiles

      console.log(`[getClient] Profile fetch result:`, { userProfiles, profileError });

      // If there's a profileError, log it but don't throw - we'll handle missing profiles below
      if (profileError) {
        console.warn(`[getClient] Profile fetch warning:`, profileError);
      }

      if (!userProfiles) {
        console.log(`[getClient] No profile found for user ID: ${id}, creating minimal profile...`);
        // Insert minimal profile (coach will be set later if needed)
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ user_id: id })
          .select('*')
          .maybeSingle();
        if (insertError || !newProfile) {
          showError(`Failed to create minimal profile: ${insertError?.message}`);
          return null;
        }
        console.log(`[getClient] Minimal profile created:`, newProfile);
        // Use the new profile for the rest of the function
        userProfiles = newProfile;
        // Update the user's profile_id field
        const { error: updateUserError } = await supabase
          .from('users')
          .update({ profile_id: newProfile.id })
          .eq('id', id);
        if (updateUserError) {
          showError(`Failed to update user with new profile_id: ${updateUserError.message}`);
          return null;
        }
      }
      const is_admin = localStorage.getItem('Roles')?.includes('Admin');
      const user_id = localStorage.getItem('UserID');

      let programs, programError; // Declare variables outside
      let coachDetails = null;

      // Try to fetch program first
      console.log(`[getClient] Fetching program for profile ID: ${userProfiles.id}, trainer ID: ${user_id}`);
      ({ data: programs, error: programError } = await supabase
        .from('user_programs')
        .select('*')
        .eq('client_id', userProfiles.id)
        .eq('trainer_id', user_id)
        .neq('status', 'cancelled')
        .single());

      console.log(`[getClient] Program fetch result:`, { programs, programError });

      // If no program found, try to fetch coach details
      if (programError && programError.code === 'PGRST116') {
        console.log(`[getClient] No program found, checking for coach assignment`);
        // No program found, check if user is assigned to a coach
        if (userProfiles.coach) {
          console.log(`[getClient] User has coach assignment: ${userProfiles.coach}`);
          const { data: coach, error: coachError } = await supabase
            .from('users')
            .select('id, first_name, last_name, email, avatar')
            .eq('id', userProfiles.coach)
            .single();

          console.log(`[getClient] Coach fetch result:`, { coach, coachError });

          if (!coachError && coach) {
            coachDetails = coach;
          }
        } else {
          console.log(`[getClient] User has no coach assignment`);
        }
      }

      // Now, `programs` and `programError` are accessible here
      if (programError && programError.code !== 'PGRST116') {
        console.error('[getClient] Error fetching program:', programError);
      }
      let promAssign = null;
      if (programs) {
        promAssign = programs;
      }

      // Fetch user details from the users table based on the provided user_id
      const { data: users, error: userError } = await supabase
        .from('users')
        .select(
          'id, avatar, email, first_name, last_name, dob,sex, nationality, phone, last_active'
        )
        .eq('id', id)
        .single(); // We expect a single user here

      if (userError) {
        throw new Error(`Error fetching user details: ${userError.message}`);
      }

      // Assign the client object with the user details and associated program/coach
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
        coach_details: coachDetails,
        last_active: users.last_active // This includes the single program the client is associated with
      };

      return Client.value;
    } catch (error: any) {
      console.error('[getClient] Unexpected error:', error);
      showError(`Failed to load client: ${error.message || 'Unknown error'}`);
      return null;
    }
  }
  // Fetch User Client????
  async function getUserClient(id: number) {
    try {
      // Fetch the user profile based on the provided user ID (id)
      const { data: userProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id) // Match user_id, as we have the user id here
        .maybeSingle(); // Use maybeSingle to handle cases with no or multiple profiles

      if (profileError) {
        throw new Error(`Error fetching user profile: ${profileError.message}`);
      }

      if (!userProfiles) {
        return null; // If no profile found for the given user ID, return null
      }
      const is_admin = localStorage.getItem('Roles')?.includes('Admin');
      const user_id = localStorage.getItem('UserID');

      let programs, programError; // Declare variables outside
      let coachDetails = null;

      // Try to fetch program first
      ({ data: programs, error: programError } = await supabase
        .from('user_programs')
        .select('*')
        .eq('client_id', userProfiles.id)
        .neq('status', 'cancelled')
        .single());

      // If no program found, try to fetch coach details
      if (programError && programError.code === 'PGRST116') {
        // No program found, check if user is assigned to a coach
        if (userProfiles.coach) {
          const { data: coach, error: coachError } = await supabase
            .from('users')
            .select('id, first_name, last_name, email, avatar')
            .eq('id', userProfiles.coach)
            .single();

          if (!coachError && coach) {
            coachDetails = coach;
          }
        }
      }

      // Now, `programs` and `programError` are accessible here
      if (programError && programError.code !== 'PGRST116') {
        console.error('Error fetching program:', programError);
      }
      let promAssign = null;
      if (programs) {
        promAssign = programs;
      }

      // Fetch user details from the users table based on the provided user_id
      const { data: users, error: userError } = await supabase
        .from('users')
        .select(
          'id, avatar, email, first_name, last_name, dob,sex, nationality, phone, last_active'
        )
        .eq('id', id)
        .single(); // We expect a single user here

      if (userError) {
        throw new Error(`Error fetching user details: ${userError.message}`);
      }

      // Assign the client object with the user details and associated program/coach
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
        coach_details: coachDetails,
        last_active: users.last_active // This includes the single program the client is associated with
      };

      return Client.value;
    } catch (error: any) {
      console.error(error);
      alert(`Failed to load client: ${error.message || 'Unknown error'}`);
      return null;
    }
  }

  // Fetch Trainer Profile
  async function getTrainer(id: number) {
    try {
      if (!id) {
        throw new Error('No user ID found in the store.');
      }
      // Fetch the user profile based on the provided user ID (id)
      const { data: userProfiles, error: profileError } = await supabase
        .from('trainer_profile')
        .select('*')
        .eq('user_id', id) // Match user_id, as we have the user id here
        .maybeSingle(); // Use maybeSingle to handle cases with no or multiple profiles

      if (profileError) {
        throw new Error(`Error fetching user profile: ${profileError.message}`);
      }

      if (!userProfiles) {
        return null; // If no profile found for the given user ID, return null
      }

      // Fetch user details from the users table based on the provided user_id
      const { data: users, error: userError } = await supabase
        .from('users')
        .select(
          'id, avatar, email, first_name, last_name, dob,sex, nationality, phone, last_active'
        )
        .eq('id', id)
        .single(); // We expect a single user here

      if (userError) {
        throw new Error(`Error fetching user details: ${userError.message}`);
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
        ...userProfiles
      };

      return O_Trainer.value;
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
      const { data, error } = await supabase.from('users').select().eq('email', loggedInUser);

      if (error) {
        throw new Error(`Error fetching user profile: ${error.message}`);
      }
      // Fetch Settings for User
      const useSettings = useSettingsStore();

      useSettings.fetchSettings(data[0].id);
      const { error: logerror } = await supabase
        .from('users')
        .update({ last_active: new Date() })
        .eq('email', loggedInUser)
        .select();

      if (logerror) {
        throw new Error(`Error fetching updating last active: ${logerror.message}`);
      }

      localStorage.setItem('UserID', data[0].id);
      localStorage.setItem('LoggedInTrainer', data[0].is_staff);
      localStorage.setItem('Roles', data[0].roles);
      if (data[0].organization) localStorage.setItem('OrgID', data[0].organization);
      userProfile.value = data[0];
      return userProfile.value;
    } catch (error: any) {
      console.error(error);
      localStorage.removeItem('UserID');
      localStorage.removeItem('Roles');
      localStorage.removeItem('OrgID');
      // Display a user-friendly error message in the UI instead of an alert.
      alert(`Failed to load user profile: ${error.message || 'Unknown error'}`);
    }
  }

  async function addOrgUser(emails: string[], type: 'trainer' | 'trainee') {
    const insertedEmails: string[] = [];
    for (const email of emails) {
      try {
        const orgId = localStorage.getItem('OrgID');
        const newUser = {
          email: email,
          roles:
            type === 'trainer'
              ? ['Organization Trnr', 'Organization Trnee']
              : ['Organization Trnee'],
          is_staff:   type === 'trainer'
              ? true : false,
          organization: orgId
        };

        // Bulk insert the new user.
        const { data, error } = await supabase.from('users').insert(newUser).select().single();

        if (error) throw new Error(error.message);
        if (!data) throw new Error('User creation failed');

        const userSettings = { user_id: data.id };

        const { error: settingsError } = await supabase
          .from('user_settings')
          .insert(userSettings)
          .select()
          .single();

        if (settingsError) throw new Error(settingsError.message);

        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', orgId)
          .single();
        if (orgError) throw new Error(orgError.message);
        if (!orgData) throw new Error('Organization not found');

        const profileData = { user_id: data.id };
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select('id')
          .single();
        if (profileError) throw new Error(profileError.message);
        const update: any = { profile_id: profile.id };
        if (type === 'trainer') {
          const trainerProfile = {
            user_id: data.id,
            title: `${orgData.name} - Trainer`
          };
          const { data: trainer, error: trainerError } = await supabase
            .from('trainer_profile')
            .insert(trainerProfile)
            .select('id')
            .single();
          if (trainerError) throw new Error(trainerError.message);
          update.trainer_profile = trainer.id;
        }
        const { error: updateError } = await supabase
          .from('users')
          .update(update)
          .eq('id', data.id);

        if (updateError) throw new Error(updateError.message);
        // Add the successfully inserted email to our array.
        insertedEmails.push(email);
        // Also update local state.
        All_Org_Users.value?.push?.(data);
      } catch (error) {
        alert('Error creating user: ' + error);
      }
    }

    // If at least one user was inserted, send the org join request emails.
    if (insertedEmails.length > 0) {
      try {
        const { data, error } = await supabase.functions.invoke('smtp/org-join-request', {
          method: 'POST',
          body: insertedEmails // Passing the array of emails.
        });
        if (error) {
          console.error('Error sending org join request emails:', error);
        } else {
          console.log('Org join request emails sent:', data);
        }
      } catch (error) {
        console.error('Error invoking org join request function:', error);
      }
    }
  }
  async function selfAddOrgUser(details: any, token: any) {
    const insertedEmails: string[] = [];

      try {

        const {data:orgData, error:orgError} = await supabase.from('organizations').select('*').eq('token', token).single();
        if (orgError) throw new Error(orgError.message);
        if (!orgData) throw new Error('Organization not found');


        const newUser = {
          email: details.email,
          first_name : details.first_name,
          last_name : details.last_name,
          roles: ['Organization Trnee'],
          is_staff: false,
          organization: orgData.id,
        };

        // Bulk insert the new user.
        const { data, error } = await supabase.from('users').insert(newUser).select().single();

        if (error) throw new Error(error.message);
        if (!data) throw new Error('User creation failed');

        const userSettings = { user_id: data.id };

        const { error: settingsError } = await supabase
          .from('user_settings')
          .insert(userSettings)
          .select()
          .single();

        if (settingsError) throw new Error(settingsError.message);


        const profileData = { user_id: data.id };
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select('id')
          .single();
        if (profileError) throw new Error(profileError.message);
        const update: any = { profile_id: profile.id };

        const { error: updateError } = await supabase
          .from('users')
          .update(update)
          .eq('id', data.id);

        if (updateError) throw new Error(updateError.message);

        insertedEmails.push(details.email);

      } catch (error) {
        alert('Error creating user: ' + error);
      }


    // If at least one user was inserted, send the org join request emails.
    if (insertedEmails.length > 0) {
      try {
        const { data, error } = await supabase.functions.invoke('smtp/org-join-request', {
          method: 'POST',
          body: insertedEmails // Passing the array of emails.
        });
        if (error) {
          console.error('Error sending org join request emails:', error);
        } else {
          console.log('Org join request emails sent:', data);
        }
      } catch (error) {
        console.error('Error invoking org join request function:', error);
      }
    }
  }

  // Wipe out old date
  function wipeOut() {
    O_Trainer.value = null;
    Client.value = null;
    UserDetail.value = {};
  }

  // Assign user to coach
  async function assignUsersToCoach(coachId: string, email: string) {
    try {
      const orgID = localStorage.getItem('OrgID');
      if (!orgID) {
        throw new Error('Organizational ID not Found');
      }

      // Get user by email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, profile_id')
        .eq('email', email)
        .eq('organization', orgID)
        .single();

      if (userError) {
        throw new Error(`User with email ${email} not found or not part of organization`);
      }

      if (user.profile_id) {
        // User already has a profile, update the coach
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ coach: coachId })
          .eq('id', user.profile_id);

        if (profileError) {
          throw new Error(`Error updating profile for ${email}: ${profileError.message}`);
        }
      } else {
        // User doesn't have a profile, create one
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({ user_id: user.id, coach: coachId })
          .select('id')
          .single();

        if (profileError) {
          throw new Error(`Error creating profile for ${email}: ${profileError.message}`);
        }

        // Update user with the new profile_id
        const { error: updateError } = await supabase
          .from('users')
          .update({ profile_id: newProfile.id })
          .eq('id', user.id);

        if (updateError) {
          throw new Error(`Error updating user profile_id for ${email}: ${updateError.message}`);
        }
      }

      showSuccess('User assigned to coach successfully');
    } catch (error: any) {
      showError(error.message);
    }
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
    All_Org_Users,
    All_Org_count,
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
    fetchOrgUsers,
    getTrainer,
    addOrgUser,
    selfAddOrgUser,
    assignUsersToCoach
  };
});
