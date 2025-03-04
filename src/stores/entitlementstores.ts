import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient' // Make sure the supabase client is initialized properly
import Swal from 'sweetalert2' // For error handling
import type { Program } from './programstores'

interface Entitlement {
  id: string // Unique identifier for the entitlement record
  trainer_id: string // Foreign key linked to public.users.id (trainer)
  client_id: string | null // Foreign key linked to public.profiles.id (client), null if unassigned
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
        .select(
          'id, client_id, status, start_date, end_date, created_at, updated_at, cancellation_reason, trainer_id, program_id',
        )
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
      (entitlement) => entitlement.client_id === null,
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

  // Update an entitlement (e.g., assign a client to an entitlement)
  async function assignEntitlement(trainer_id: string, client_id: string, updatedData: Program) {
    try {
      const entitlementData = {
        client_id,
        status: 'active',
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await supabase
        .from('entitlements')
        .update(entitlementData)
        .eq('id', trainer_id)
        .select()

      if (error) throw new Error(error.message)

      const { data: userProgramData, error: userProgramError } = await supabase
        .from('user_programs')
        .insert({
          trainer_id,
          client_id: client_id,
          program_id: updatedData.id,
          status: 'active',
          entitlement_id: data[0].id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_on: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
          price_package: updatedData.price_one,
          workouts: updatedData.workouts,
          weekly_cycle: updatedData.weekly_cycle,
        })
        .select()

      if (userProgramError) throw new Error(userProgramError.message)

      // Update local state after the update
      const index = entitlements.value.findIndex((entitlement) => entitlement.id === data[0].id)
      if (index !== -1) {
        Object.assign(entitlements.value[index], data[0])
        updateUnusedEntitlementCount()
      }
    } catch (error) {
      console.error('Error updating entitlement:', error)
      Swal.fire({
        title: 'Error',
        text: 'Failed to update entitlement.',
        icon: 'error',
      })
    }
  }

  // Get entitlements for a trainer in a specific format for the table
  function getTableData() {
    return entitlements.value.map((entitlement: any) => {
      return {
        client: entitlement.client_id ? entitlement.client_id : 'Unassigned',
        joinedOn: entitlement.created_at,
        expiredOn: entitlement.end_date,
        status: entitlement.status,
      }
    })
  }

  return {
    entitlements,
    unusedEntitlementCount,
    getEntitlements,
    createEntitlement,
    assignEntitlement,
    getTableData,
  }
})
