import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient' // Make sure the supabase client is initialized properly
import Swal from 'sweetalert2' // For error handling

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
    const UserID = localStorage.getItem('UserID')
    if (!entitlements.value) return

    unusedEntitlementCount.value = entitlements.value.filter(
      (entitlement) => entitlement.client_id === null && entitlement.trainer_id === UserID,
    ).length
  }

  // Add a new entitlement
  async function createEntitlement(newEntitlement: any) {
    try {
      const { data, error } = await supabase.from('entitlements').insert([newEntitlement]).select()

      if (error) throw new Error(error.message)

      entitlements.value.push(data[0]) // Add the new entitlement to the local state
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
  async function updateEntitlement(id: string, updatedData: any) {
    try {
      const { data, error } = await supabase
        .from('entitlements')
        .update(updatedData)
        .eq('id', id)
        .select()

      if (error) throw new Error(error.message)

      // Update local state after the update
      const index = entitlements.value.findIndex((entitlement) => entitlement.id === id)
      if (index !== -1) {
        Object.assign(entitlements.value[index], data[0])
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
    updateEntitlement,
    getTableData,
  }
})
