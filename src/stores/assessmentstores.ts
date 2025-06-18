import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabaseClient'
import Swal from "sweetalert2"

// Success and Error Alerts
function showSuccess(message: string) {
  Swal.fire({
    title: "Success!",
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 1500,
    text: message,
    toast: true,
    position: "top-right",
    icon: "success",
    background: "#081411",
    color: "#E8F3ED",
  });
}

function showError(message: string) {
  Swal.fire({
    title: "Error!",
    text: message,
    icon: "error",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#d33",
    background: "#081411",
    color: "#E8F3ED",
  });
}

// Assessment type based on Supabase schema
export type Assessment = {
  id: number;
  created_at: string;
  slot: number;
  assessors?: any[];
  drills?: any[];
  trainees?: any[];
  started?: string | null;
  ended?: string | null;
  trainee_results?: any;
  overall_performance?: any;
  comments?: any[];
  summary?: string | null;
  status: string;
  organization?: number | null;
};

export const useAssessmentStore = defineStore('Assessment', () => {
  const AllAssessments = ref<Assessment[]>([]);
  const AssessmentItem = ref<Assessment | null>(null);

  async function getAssessment(id: number) {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      AssessmentItem.value = data;
      return AssessmentItem.value;
    } catch (error: any) {
      console.error(error);
      showError(`Failed to load assessment: ${error.message || 'Unknown error'}`);
      return null;
    }
  }

  async function getAllAssessments(userProfile: any) {
    try {
      let query = supabase
        .from('assessments')
        .select('*')
        .eq('organization', userProfile.organization)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data;
      if (userProfile?.roles?.includes('Organization Trnr') && !userProfile?.roles?.includes('Organization Admin')) {
        filtered = data.filter((assessment: any) => Array.isArray(assessment.assessors) && assessment.assessors.includes(userProfile.id));
      }
      AllAssessments.value = filtered;
      return AllAssessments.value;
    } catch (error: any) {
      console.error(error);
      showError(`Failed to load assessments: ${error.message || 'Unknown error'}`);
      return null;
    }
  }

  return { AssessmentItem, AllAssessments, getAssessment, getAllAssessments };
}); 