import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient' // Make sure the supabase client is initialized properly
import Swal from 'sweetalert2' // For error handling
import type { Program } from './programstores'
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
interface Entitlement {
  id: string // Unique identifier for the entitlement record
  trainer_id: string // Foreign key linked to public.users.id (trainer)
  user_program_id: string | null
  client_id: string | null // Foreign key linked to public.profiles.id (client)
  program_id: string // Foreign key linked to public.programs.id (program)
  status: 'active' | 'inactive' // Status of entitlement, can be 'active' or 'inactive'
  start_date: string // Timestamp of when the entitlement starts
  end_date: string // Timestamp of when the entitlement expires
  created_at: string // Timestamp when the entitlement record was created
  updated_at: string // Timestamp when the entitlement record was last updated
  cancellation_reason: string | null // Reason for cancellation (null if not cancelled)
}

interface UserProgram {
  id: string // Unique identifier for the program record
  created_at: string // Timestamp when the program record was created
  expires_on: string // Timestamp of when the program expires
  trainer_id: string // Foreign key linked to public.users.id (trainer)
  program_id: string // Foreign key linked to public.programs.id (program)
  client_id: string // Foreign key linked to public.profiles.id (client)
  entitlement_id: string // Foreign key linked to public.entitlements.id (entitlement)
  price_package: number | null
  current_intensity: number | null
  current_volume: number | null
  intensity_progress: number | null
  volume_progress: number | null
  workouts: string | null
  months_package: number | null
  expired_on: string | null
  cancellation_reason: string | null
  status: 'active' | 'canceled' | null
  weekly_cycle: number | null
}
export const useEntitlementStore = defineStore('Entitlement', () => {
  // State to hold entitlements and unused count
  const entitlements = ref<Entitlement[]>([])
  const unusedEntitlementCount = ref<number>(0)

  // Fetch all entitlements for a specific trainer
  async function getEntitlements() {
    const UserID = localStorage.getItem('UserID')
    try {
      if (!UserID) throw 'Trainer ID is required'
      const { data, error } = await supabase
        .from('entitlements')
        .select('*')
        .eq('trainer_id', UserID)

      if (error) throw new Error(error.message)
      entitlements.value = data || []
      updateUnusedEntitlementCount() // Update the unused entitlement count whenever entitlements are fetched

      return entitlements.value
    } catch (error) {
      console.error('Error fetching entitlements:', error)
      Swal.fire({
        title: 'Error',
        text: 'Failed to load entitlements.',
        icon: 'error',
      })
    }
  }

  // Count unused entitlements (those with null client_id)
  function updateUnusedEntitlementCount() {
    if (!entitlements.value) return

    unusedEntitlementCount.value = entitlements.value.filter(
      (entitlement) => entitlement.user_program_id === null,
    ).length
  }

  // Add a new entitlement
  async function createEntitlement(newEntitlement: any) {
    try {
      const { data, error } = await supabase.from('entitlements').insert([newEntitlement]).select()

      if (error) throw new Error(error.message)

      entitlements.value.push(data[0]) // Add the new entitlement to the local state
      updateUnusedEntitlementCount()
    } catch (error) {
      console.error('Error creating entitlement:', error)
      Swal.fire({
        title: 'Error',
        text: 'Failed to create entitlement.',
        icon: 'error',
      })
    }
  }
  // Create Multiple Entitlements

  async function createMultipleEntitlements(trainerId: string, count: number) {
    try {
      const entitlements = Array.from({ length: count }, () => ({
        trainer_id: trainerId,
        status: "available", // Adjust based on your logic
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("entitlements").insert(entitlements);
      if (error) throw error;

      console.log(`${count} entitlements created successfully.`);
    } catch (err) {
      console.error("Error creating entitlements:", err);
    }
  }

  // Update an entitlement (e.g., assign a client to an entitlement)
  async function assignEntitlement(trainer_id: string, client_id: string, updatedData: Program) {
    try {
      const { data: userProgramData, error: userProgramError } = await supabase
        .from('user_programs')
        .insert({
          trainer_id,
          client_id,
          program_id: updatedData.id,
          status: 'active',
          expires_on: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
          price_package: updatedData.price_one,
          months_package:1,
          workouts: updatedData.workouts,
          weekly_cycle: updatedData.weekly_cycle,
        })
        .select('*')
        .single()

      if (userProgramError) throw new Error(userProgramError.message)
      const entitlementData = {
        status: 'active',
        client_id,
        user_program_id: userProgramData.id,
      }
      const { data, error } = await supabase
        .from('entitlements')
        .update(entitlementData)
        .eq('id', trainer_id)
        .select('id')
        .single()

      if (error) throw new Error(error.message)

      const { data: updateData, error: updateError } = await supabase
        .from('user_programs')
        .update({
          entitlement_id: data.id,
        })
        .eq('id', userProgramData.id)
        .select('id')
        .single()

      if (updateError) throw new Error(updateError.message)

        const { data: userData, error: userError } = await supabase
        .from('profiles')
        .update({
          user_program_id: updateData.id,
        })
        .eq('id', client_id)
        .select()

      if (userError) throw new Error(userError.message)

      // Update local state after the update
      const index = entitlements.value.findIndex((entitlement) => entitlement.id === data.id)
      if (index !== -1) {
        Object.assign(entitlements.value[index], data)
        updateUnusedEntitlementCount()
      }

    } catch (error) {
      showError('Error updating entitlement:' + error)

    }
  }

  return {
    entitlements,
    unusedEntitlementCount,
    getEntitlements,
    createMultipleEntitlements,
    createEntitlement,
    assignEntitlement,
  }
})
