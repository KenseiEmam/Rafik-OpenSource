import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'
import router from '@/router'
import Swal from 'sweetalert2'
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
export type Program = {
  id: string
  created_at?:Date
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
  price_year?: number
  tags?: string[]
  workouts?: Workout[]
  program_photo?: string
  weekly_cycle?: number
  promos?: PromoCode[]
  induction?: Question[]
  follow?: Question[]
  referral?: string
  // Add any other properties your program might have
}
interface Question {
  type: string
  question?: string
  answer?: any
}
// Promo Codes
type PromoCode = {
  code: string
  value: number
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
  trainer:number|null,
  name:string,
  status:string[],
}
type Workout = {
  workout_name: string
  workout_summary?: string
  time_to_complete?: string
  sets_per_session?: number
  rest_day?: boolean
  exercises: Exercise[]
}
export const useProgramStore = defineStore('Program', () => {
  const AllPrograms = ref<Program[] | null>(null)
  const ActivePrograms = ref<Program[] | null>(null)
  const DraftedPrograms = ref<Program[] | null>(null)
  const AllCount = ref<number>(0);
  const Program = ref<Program | null>(null);



  // Organizational
  const All_Org_Count = ref<number>(0);
  const All_Org_Programs= ref<Program[] | null>(null)

  // Fetch all programs
  async function getAllPrograms() {
    const UserID = localStorage.getItem('UserID')

    if (!UserID) {
      throw new Error('No user ID found in localStorage.')
    }

    try {
      const { data, error } = await supabase
        .from('programs')
        .select()
        .eq('trainer_id', UserID)
        .neq('status', 'Deleted')

      if (error) {
        throw new Error(`Error fetching programs: ${error.message}`)
      }

      AllPrograms.value = data || []
      splitProgramsByStatus()
      return AllPrograms.value
    } catch (error: any) {
      console.error(error)
      alert(`Failed to load programs: ${error.message || 'Unknown error'}`)
    }
  }

  // Fetch all programs
  async function getOrgPrograms() {
    const orgID = localStorage.getItem('OrgID')

    if (!orgID) {
      throw new Error('No user organization ID found in localStorage.')
    }

    try {
      const { data, error } = await supabase
        .from('programs')
        .select()
        .eq('organization', orgID)
        .neq('status', 'Deleted')

      if (error) {
        throw new Error(`Error fetching programs: ${error.message}`)
      }

      All_Org_Programs.value = data || []
      return AllPrograms.value
    } catch (error: any) {
      console.error(error)
      alert(`Failed to load programs: ${error.message || 'Unknown error'}`)
    }
  }

  // Fetch Users Based On Filters with Pagination
  async function fetchAuditPrograms(filters: Filter, page: number, pageSize: number) {
    try {
      // Start building the query; count: 'exact' returns the total count
      let query = supabase
        .from("programs")
        .select("*", { count: "exact" });

      // Filter by status if provided (handling multiple statuses)
    if (filters.status && filters.status.length > 0) {
      query = query.in("status", filters.status);
    }

      // Filter by name (search in first_name or last_name, case-insensitive)
      if (filters.name && filters.name.trim() !== "") {
        query = query.or(
          `program_name.ilike.%${filters.name}%,program_description.ilike.%${filters.name}%`
        );
      }

      // Filter by trainer_id (if provided and is a valid number)
    if (filters.trainer!== undefined && filters.trainer!== null) {
      query = query.eq("trainer_id", filters.trainer);
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
      AllPrograms.value = data;
      if(count)
      AllCount.value = count;
      // Optionally, you can use count to display total records if required:
      // totalCount.value = count;

    } catch (error: any) {
      showError(error);
    }
  }

   // Fetch Users Based On Filters with Pagination
   async function fetchOrgAuditPrograms(filters: Filter, page: number, pageSize: number) {
    try {
      const orgID = localStorage.getItem('OrgID');
      if(!orgID)
      {
        throw new Error('Organizational ID not Found')
      }

      // Start building the query; count: 'exact' returns the total count
      let query = supabase
        .from("programs")
        .select("*", { count: "exact" });

      // Filter by status if provided (handling multiple statuses)
    if (filters.status && filters.status.length > 0) {
      query = query.in("status", filters.status);
    }

      // Filter by name (search in first_name or last_name, case-insensitive)
      if (filters.name && filters.name.trim() !== "") {
        query = query.or(
          `program_name.ilike.%${filters.name}%,program_description.ilike.%${filters.name}%`
        );
      }

      // Filter by trainer_id (if provided and is a valid number)
    if (filters.trainer!== undefined && filters.trainer!== null) {
      query = query.eq("trainer_id", filters.trainer);
    }

      // Apply pagination: calculate the start and end indexes for the range
      const start = (page - 1) * pageSize;
      const end = page * pageSize - 1;
      query = query.range(start, end);
      query = query.eq("organization",orgID)
      const { data, error, count } = await query;

      if (error || !data) {
        throw new Error(`Error fetching users: ${error?.message || "Users not found"}`);
      }

      // Store data  (and count if needed)
      All_Org_Programs.value = data;
      if(count)
      All_Org_Count.value = count;
      // Optionally, you can use count to display total records if required:
      // totalCount.value = count;

    } catch (error: any) {
      showError(error);
    }
  }

  // Fetch all programs related to a trainer
  async function getTrainersPrograms(UserID:number) {


    if (!UserID) {
      throw new Error('No user ID found in localStorage.')
    }

    try {
      const { data, error } = await supabase
        .from('programs')
        .select()
        .eq('trainer_id', UserID)
        .neq('status', 'Deleted')

      if (error) {
        throw new Error(`Error fetching programs: ${error.message}`)
      }

      AllPrograms.value = data || []
      splitProgramsByStatus()
      return AllPrograms.value
    } catch (error: any) {
      console.error(error)
      alert(`Failed to load programs: ${error.message || 'Unknown error'}`)
    }
  }

  // Split programs by status
  function splitProgramsByStatus() {
    if (!AllPrograms.value) return

    ActivePrograms.value = AllPrograms.value.filter((program) => program.status === 'Active')
    DraftedPrograms.value = AllPrograms.value.filter((program) => program.status !== 'Active')
  }

  // Fetch singular Program
  async function fetchProgram(id: string) {
    try {
      const orgID = localStorage.getItem('OrgID');
      const userID = localStorage.getItem('UserID');
      const roles = localStorage.getItem('Roles') || '';
      if(!userID)
        throw new Error('no user id??');
      // Start building the query
      let query = supabase
        .from('programs')
        .select()
        .eq('id', id)
        .neq('status', 'Deleted');

      // Filter by organization if orgID exists
      if (orgID) {
        query = query.eq('organization', orgID);
      }

      // Filter by trainer_id if user is not an Admin
      if (!roles.includes('Admin') && userID) {
        query = query.eq('trainer_id', userID);
      }

      const { data, error } = await query.single(); // Expect a single record

      if (error) throw new Error(error.message);
      if (data.trainer_id !== parseInt(userID)) {
        if (router.currentRoute.value.name !== 'audit-program') {
          router.push({ name: 'audit-program' });
        }
      }
      Program.value = data;
    } catch (error) {
      Swal.fire({
        title: 'Whoops',
        text: 'No program found',
        icon: 'error',
      }).then(() => {
        router.push({ name: 'programs-list' });
      });
      console.error('Error fetching program:', error);
    }
  }


  // Fetch only active programs
  async function getActivePrograms() {
    if (!AllPrograms.value) {
      await getAllPrograms() // Ensure all programs are fetched first
    }
    return ActivePrograms.value
  }

  // Fetch only drafted programs
  async function getDraftedPrograms() {
    if (!AllPrograms.value) {
      await getAllPrograms() // Ensure all programs are fetched first
    }
    return DraftedPrograms.value
  }

  // Update Program
  async function updateProgram(updateData: Program) {
    try {
      const { error } = await supabase.from('programs').update(updateData).eq('id', updateData.id)

      if (error) throw new Error(error.message)

      // Update local state
      if (Program.value?.id === updateData.id) {
        Object.assign(Program.value, updateData)
      }

    } catch (error) {
      showError('Error updating program:'+ error)
    }
  }
  // Add Program
  async function createProgram(newProgram: Program) {
    try {
      // Initialize with 7 empty workouts
      newProgram.workouts = Array.from({ length: 7 }, () => ({
        workout_name: '',
        workout_summary: '',
        time_to_complete: '',
        sets_per_session: 0,
        rest_day: false,
        exercises: [],
      }))

      // Insert the new program and return the inserted row
      const { data, error } = await supabase
        .from('programs')
        .insert(newProgram)
        .select()
        .single() // Ensures a single row is returned

      if (error) throw new Error(error.message)
      if (!data) throw new Error('Program creation failed')

      const programId = data.id
      const trainerId = newProgram.trainer_id // Assuming `trainer_id` is passed in `newProgram`

      // Retrieve the current programs array from trainer_profile
      const { data: trainerProfile, error: fetchError } = await supabase
        .from('trainer_profile')
        .select('programs') // Ensure this column exists in your table
        .eq('user_id', trainerId)
        .single()

      if (fetchError) throw new Error(fetchError.message)
      if (!trainerProfile) throw new Error('Trainer profile not found')

      // Ensure programs is an array, then append the new program_id
      const updatedProgramIds = Array.isArray(trainerProfile.programs)
        ? [...trainerProfile.programs, programId]
        : [programId] // Initialize if null

      // Update trainer_profile with the new programs array
      const { data: updatedTrainer, error: updateError } = await supabase
        .from('trainer_profile')
        .update({ programs: updatedProgramIds })
        .eq('user_id', trainerId)
        .select()
        .single() // Return the updated trainer profile

      if (updateError) throw new Error(updateError.message)
      if (!updatedTrainer) throw new Error('Trainer profile update failed')

      // Add to local state
      AllPrograms.value?.push(data)
      splitProgramsByStatus()
      router.push({ name: 'program-details', params: { id: programId } })

      return { program: data, trainerProfile: updatedTrainer } // Return both program & trainer profile
    } catch (error) {
      alert('Error creating program: ' + error)
      return null
    }
  }


  // Wipe out old date
  function wipeOut(){
    Program.value = null;
  }

  // Wipe out old date
  function wipeOutAll(){
    AllPrograms.value = [];
    ActivePrograms.value = [];
    DraftedPrograms.value = [];
  }

  return {
    AllPrograms,
    AllCount,
    ActivePrograms,
    DraftedPrograms,
    Program,
    All_Org_Count,
    All_Org_Programs,
    fetchOrgAuditPrograms,
    fetchAuditPrograms,
    wipeOut,
    wipeOutAll,
    getTrainersPrograms,
    getOrgPrograms,
    getAllPrograms,
    getActivePrograms,
    getDraftedPrograms,
    updateProgram,
    fetchProgram,
    createProgram,
  }
})
