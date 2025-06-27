import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'
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

// Group type based on Supabase schema
type Group = {
  id: number
  group_name: string
  group_avatar?: string | null
  group_description?: string | null
  status: string
  organization?: number | null
  admins?: string[]
  users?: string[]
}

// User details type for admins and members
type UserDetails = {
  id: string
  [key: string]: any
}

export const useGroupStore = defineStore('Group', () => {
  const AllGroups = ref<Group[]>([])
  const GroupItem = ref<Group | null>(null)

  // Refs for detailed user info
  const admins = ref<{ [id: string]: UserDetails }>({})
  const members = ref<{ [id: string]: UserDetails }>({})

  async function getAllGroups(userProfile: any) {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('organization', userProfile.organization)
        .order('id', { ascending: false })

      if (error) throw error
      AllGroups.value = data || []

      // Fetch related user details
      Promise.all([
        fetchAllUserDetails(AllGroups.value, 'admin'),
        fetchAllUserDetails(AllGroups.value, 'member')
      ]).catch(e => showError(`Failed to load group users: ${e.message || 'Unknown error'}`))

      return AllGroups.value
    } catch (err: any) {
      console.error(err)
      showError(`Failed to load groups: ${err.message || 'Unknown error'}`)
      return null
    }
  }

  async function getGroup(id: number) {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      GroupItem.value = data

      if (GroupItem.value) {
        await Promise.all([
          fetchAssessmentUserDetails([GroupItem.value], 'admin'),
          fetchAssessmentUserDetails([GroupItem.value], 'member')
        ])
      }

      return GroupItem.value
    } catch (err: any) {
      console.error(err)
      showError(`Failed to load group: ${err.message || 'Unknown error'}`)
      return null
    }
  }

  async function createGroup(newGroup: Partial<Group>) {
    try {
      const { data, error } = await supabase
        .from('groups')
        .insert(newGroup)
        .select()
        .single()

      if (error) throw error
      showSuccess('Group created successfully.')

      // Reflect group on users rows
      if (data.users?.length) {
        await supabase
          .from('users')
          .update({ group: data.id })
          .in('id', data.users)
      }

      AllGroups.value.unshift(data)
      return data
    } catch (err: any) {
      console.error(err)
      showError(`Failed to create group: ${err.message || 'Unknown error'}`)
      return null
    }
  }

  async function updateGroup(id: number, updates: Partial<Group>) {
    try {
      const { data, error } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      showSuccess('Group updated successfully.')

      // Reflect changes to user rows if users list changed
      if (updates.users) {
        await supabase
          .from('users')
          .update({ group: id })
          .in('id', updates.users)
      }

      const idx = AllGroups.value.findIndex(g => g.id === id)
      if (idx !== -1 && data) AllGroups.value[idx] = data
      if (GroupItem.value?.id === id && data) GroupItem.value = data

      return data
    } catch (err: any) {
      console.error(err)
      showError(`Failed to update group: ${err.message || 'Unknown error'}`)
      return null
    }
  }

  async function deleteGroup(id: number) {
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', id)

      if (error) throw error
      showSuccess('Group deleted successfully.')

      // Clear group on user rows
      await supabase
        .from('users')
        .update({ group: null })
        .eq('group', id)

      AllGroups.value = AllGroups.value.filter(g => g.id !== id)
      if (GroupItem.value?.id === id) GroupItem.value = null
    } catch (err: any) {
      console.error(err)
      showError(`Failed to delete group: ${err.message || 'Unknown error'}`)
    }
  }

  // Fetch users for groups
  async function fetchMultipleUserDetails(userIds: string[], type: 'admin' | 'member') {
    if (!userIds.length) return
    const store = type === 'admin' ? admins : members
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds)
    if (error) return console.error(error)
    data.forEach(u => { store.value[u.id] = u })
  }

  async function fetchAllUserDetails(groups: Group[], type: 'admin' | 'member') {
    const allIds: string[] = []
    groups.forEach(g => {
      const list = type === 'admin' ? g.admins : g.users
      if (list) allIds.push(...list)
    })
    const unique = [...new Set(allIds)]
    await fetchMultipleUserDetails(unique, type)
  }

  return {
    AllGroups,
    GroupItem,
    admins,
    members,
    getAllGroups,
    getGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    fetchAllUserDetails,
  }
})
