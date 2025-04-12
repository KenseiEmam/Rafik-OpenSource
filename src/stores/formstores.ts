import { ref } from 'vue';
import { defineStore } from 'pinia';
import { supabase } from '../lib/supabaseClient';
import Swal from 'sweetalert2';

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

// Interface for Form
interface Form {
  created_at:Date;
  id: string;
  questions: any[];
  message_id: number;
  status: string;
  trainer_id: number;
  program_id: number;
  client_id: number;
  type: string;
}
type Filter = {
  client: number | null;
  type: string[];
  program: number | null;
  status: string;
};

export const useFormStore = defineStore('Forms', () => {
  const forms = ref<Form[] | null>([]);
  const form_detail = ref<Form | null>(null);
  const formcount = ref<number>(0)

  // Updated fetchForms function with filtering and pagination
  async function fetchForms(filters: Filter, page: number, pageSize: number) {
    try {
      const user_id = localStorage.getItem('UserID');
      // Start building the query with an exact count of total rows
      let query = supabase.from('forms').select('*', { count: 'exact' });

      // Filter by trainer_id using user_id from localStorage
      query = query.eq('trainer_id', user_id);

      // Filter by client id if provided
      if (filters.client !== null) {
        query = query.eq('client_id', filters.client);
      }

      // Filter by type if provided and not an empty string
      if (filters.status && filters.status.trim() !== '') {
        query = query.eq('status', filters.status);
      }

      // Filter by program id if provided
      if (filters.program !== null) {
        query = query.eq('program_id', filters.program);
      }

      // Filter by status array if provided
      if (filters.type && filters.type.length > 0) {
        query = query.in('type', filters.type);
      }

      // Apply pagination: calculate start and end indexes
      const start = (page - 1) * pageSize;
      const end = page * pageSize - 1;
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error || !data) {
        throw new Error(error?.message || 'Failed to fetch forms.');
      }

      forms.value = data;
      if (count) formcount.value = count;
      return { data: forms.value, count };
    } catch (error: any) {
      showError(error.message || 'Failed to fetch forms settings.');
    }
  }

  return {
    forms,
    form_detail,
    formcount,
    fetchForms
  };
});
