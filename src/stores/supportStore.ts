import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'
import Swal from 'sweetalert2'

// Success and Error Alerts
function showSuccess(message: string) {
  Swal.fire({
    title: 'Success!',
    text: message,
    icon: 'success',
    showConfirmButton: false,
    timer: 1500,
    toast: true,
    position: 'top-right',
    timerProgressBar: true,
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
    background: '#081411',
    color: '#E8F3ED',
  })
}

// Interfaces for Ticket and TicketMessage
export interface Ticket {
  id?: number
  created_by: number
  subject: string
  message: string
  related_to?: string
  media?: string[]
  created_at: string
  updated_at?: string
  last_updated_by: number
  status: string
}

export interface TicketMessage {
  id?: number
  ticket_id: number
  sender_id: number
  sender_role: string // e.g. "user" or "support"
  message: string
  created_at: string
}

export const useSupportStore = defineStore('Support', () => {
  // Store state
  const tickets = ref<Ticket[]>([])
  const selectedTicket = ref<Ticket | null>(null)
  const ticketMessages = ref<TicketMessage[]>([])

  // Fetch all tickets created by the current user.
  async function getTickets(currentUserId: number) {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('created_by', currentUserId)
      .order('created_at', { ascending: false })

    if (error) {
      showError(`Failed to fetch tickets: ${error.message}`)
      return
    }
    tickets.value = data as Ticket[]
  }

  // Fetch a single ticket (by its id) along with its conversation thread (messages)
  async function getTicket(ticketId: number) {
    // Fetch ticket details
    const { data: ticketData, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single()

    if (ticketError) {
      showError(`Failed to fetch ticket: ${ticketError.message}`)
      return
    }
    selectedTicket.value = ticketData as Ticket

    // Fetch associated messages by filtering on ticket_id
    await getTicketMessages(ticketId)
  }

  // Separate function to fetch messages for a specific ticket id
  async function getTicketMessages(ticketId: number) {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (error) {
      showError(`Failed to fetch ticket messages: ${error.message}`)
      return
    }
    ticketMessages.value = data as TicketMessage[]
  }

  // Create a new ticket
  async function createTicket(ticketData: Partial<Ticket>) {
    // Set default values if not provided
    ticketData.status = ticketData.status || 'open'
    const now = new Date().toISOString()
    ticketData.created_at = now
    ticketData.updated_at = now
    // For new tickets, assume last_updated_by is the creator
    ticketData.last_updated_by = ticketData.last_updated_by || ticketData.created_by!

    const { data, error } = await supabase.from('support_tickets').insert(ticketData).single()

    if (error) {
      showError(`Failed to create ticket: ${error.message}`)
      return null
    }
    showSuccess('Ticket created successfully.')
    // Optionally update the tickets list immediately
    tickets.value.unshift(data as Ticket)
    return data
  }

  // Update an existing ticket (e.g. change status, update details)
  async function updateTicket(ticketId: number, updateData: Partial<Ticket>) {
    updateData.updated_at = new Date().toISOString()
    const { data, error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticketId)
      .single()

    if (error) {
      showError(`Failed to update ticket: ${error.message}`)
      return null
    }
    showSuccess('Ticket updated successfully.')
    // Update local state if the ticket is the currently selected one
    if (selectedTicket.value && selectedTicket.value.id === ticketId) {
      selectedTicket.value = data as Ticket
    }
    // Optionally, refresh the tickets list
    await getTickets(updateData.last_updated_by as number)
    return data
  }

  // Add a response (message) to a ticket's conversation thread
  async function addResponse(ticketId: number, responseData: Partial<TicketMessage>) {
    // Ensure the ticket_id and created_at are set
    responseData.ticket_id = ticketId
    responseData.created_at = new Date().toISOString()

    const { data, error } = await supabase.from('ticket_messages').insert(responseData).single()

    if (error) {
      showError(`Failed to add response: ${error.message}`)
      return null
    }
    showSuccess('Response added successfully.')
    // Append the new message to the conversation thread
    ticketMessages.value.push(data as TicketMessage)
    // Optionally, update the ticket's updated_at and last_updated_by fields
    await updateTicket(ticketId, {
      updated_at: new Date().toISOString(),
      last_updated_by: responseData.sender_id!,
    })
    return data
  }

  return {
    tickets,
    selectedTicket,
    ticketMessages,
    getTickets,
    getTicket,
    getTicketMessages,
    createTicket,
    updateTicket,
    addResponse,
  }
})
