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
  assessors?: string[]; // Array of user IDs (users table)
  drills?: any[];
  trainees?: string[]; // Array of user IDs (users table)
  started?: string | null;
  ended?: string | null;
  trainee_results?: any;
  overall_performance?: any;
  comments?: any[];
  summary?: string | null;
  status: string;
  organization?: number | null;
  template?: string | null; // The assessment_template id from the assessment_templates table
  template_data?: any; // To be fetched from the assessment_templates table
};

// User type for trainees and assessors
type UserDetails = {
  id: string;
  [key: string]: any;
};

export const useAssessmentStore = defineStore('Assessment', () => {
  const AllAssessments = ref<Assessment[]>([]);
  const AssessmentItem = ref<Assessment | null>(null);

  // New refs for trainees and assessors
  const trainees = ref<{ [id: string]: UserDetails }>({});
  const assessors = ref<{ [id: string]: UserDetails }>({});

  // New ref for template data
  const templateData = ref<{ [id: string]: any }>({});
async function getAssessment(id: number) {
  try {
    const { data, error } = await supabase
      .from('assessment')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Assign basic data
    AssessmentItem.value = data;

    if(AssessmentItem.value)
    // Enrich: fetch related template and user info
    await Promise.all([
      fetchAllUserDetails([AssessmentItem.value])
    ]);

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
        .from('assessment')
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

      // (non-blocking) After getting assessments, fetch template data and user details
      Promise.all([
        fetchAllTemplateData(filtered),
        fetchAllUserDetails(filtered)
      ]).catch(e => {
        console.error(e);
        showError(`Failed to load assessment data: ${e.message || 'Unknown error'}`);
      });

      return AllAssessments.value;
    } catch (error: any) {
      console.error(error);
      showError(`Failed to load assessments: ${error.message || 'Unknown error'}`);
      return null;
    }
  }
async function getTodaysAssessments(userProfile: any) {
  try {
    // Get today’s start and end in UTC
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const { data, error } = await supabase
      .from('assessment')
      .select('*')
      .eq('organization', userProfile.organization)
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    let filtered = data;
    if (
      userProfile?.roles?.includes('Organization Trnr') &&
      !userProfile?.roles?.includes('Organization Admin')
    ) {
      filtered = filtered.filter(
        (assessment: any) =>
          Array.isArray(assessment.assessors) && assessment.assessors.includes(userProfile.id)
      );
    }

    // Optionally: fetch related data
    Promise.all([
      fetchAllTemplateData(filtered),
      fetchAllUserDetails(filtered),
    ]).catch(e => {
      console.error(e);
      showError(`Failed to load assessment data: ${e.message || 'Unknown error'}`);
    });

    return filtered;
  } catch (error: any) {
    console.error(error);
    showError(`Failed to load today's assessments: ${error.message || 'Unknown error'}`);
    return null;
  }
}

  // Fetch user details for a single user ID
  async function fetchUserDetails(userId: string, type: 'trainee' | 'assessor') {
    // Check if user details already exist
    const userStore = type === 'trainee' ? trainees : assessors;
    if (userStore.value[userId]) {
      return userStore.value[userId];
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        userStore.value[userId] = data;
        return data;
      }
    } catch (error: any) {
      console.error(`Error fetching ${type} details for ID ${userId}:`, error);
      // Don't show error to user for individual user fetches to avoid spam
    }

    return null;
  }

  // Fetch user details for multiple user IDs efficiently
  async function fetchMultipleUserDetails(userIds: string[], type: 'trainee' | 'assessor') {
    if (!userIds || userIds.length === 0) return;

    const userStore = type === 'trainee' ? trainees : assessors;

    // Filter out IDs that already exist in the store
    const missingIds = userIds.filter(id => !userStore.value[id]);

    if (missingIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('id', missingIds);

      if (error) throw error;

      if (data) {
        // Add all fetched users to the store
        data.forEach(user => {
          userStore.value[user.id] = user;
        });
      }
    } catch (error: any) {
      console.error(`Error fetching multiple ${type}s:`, error);
    }
  }

  // Fetch all user details for all assessments
  async function fetchAllUserDetails(assessments: Assessment[]) {
    const allTraineeIds: string[] = [];
    const allAssessorIds: string[] = [];

    // Collect all unique trainee and assessor IDs
    assessments.forEach(assessment => {
      if (assessment.trainees && Array.isArray(assessment.trainees)) {
        allTraineeIds.push(...assessment.trainees);
      }
      if (assessment.assessors && Array.isArray(assessment.assessors)) {
        allAssessorIds.push(...assessment.assessors);
      }
    });

    // Remove duplicates
    const uniqueTraineeIds = [...new Set(allTraineeIds)];
    const uniqueAssessorIds = [...new Set(allAssessorIds)];

    // Fetch user details in parallel for better performance
    await Promise.all([
      fetchMultipleUserDetails(uniqueTraineeIds, 'trainee'),
      fetchMultipleUserDetails(uniqueAssessorIds, 'assessor')
    ]);
  }

  // Fetch user details for a specific assessment
  async function fetchAssessmentUserDetails(assessment: Assessment) {
    const traineeIds: string[] = [];
    const assessorIds: string[] = [];

    if (assessment.trainees && Array.isArray(assessment.trainees)) {
      traineeIds.push(...assessment.trainees);
    }
    if (assessment.assessors && Array.isArray(assessment.assessors)) {
      assessorIds.push(...assessment.assessors);
    }

    await Promise.all([
      fetchMultipleUserDetails(traineeIds, 'trainee'),
      fetchMultipleUserDetails(assessorIds, 'assessor')
    ]);
  }

  // Clear user details (useful for cleanup)
  function clearUserDetails() {

    trainees.value = {};
    assessors.value = {};
  }

  // Fetch template data for a single assessment
  async function fetchTemplateData(assessment: Assessment) {
    if (!assessment.template) return;

    try {
      const { data, error } = await supabase
        .from('assessment_template')
        .select('*')
        .eq('id', assessment.template)
        .single();

      if (error) throw error;

      if (data) {
        // Update the assessment with template data
        assessment.template_data = data;
      }
    } catch (error: any) {
      console.error(`Error fetching template data for assessment ${assessment.id}:`, error);
    }
  }

  // Fetch template data for multiple assessments efficiently
  async function fetchAllTemplateData(assessments: Assessment[]) {
    const templateIds: string[] = [];

    // Collect all unique template IDs
    assessments.forEach(assessment => {
      if (assessment.template && !templateData.value[assessment.template]) {
        templateIds.push(assessment.template);
      }
    });

    // Remove duplicates
    const uniqueTemplateIds = [...new Set(templateIds)];

    if (uniqueTemplateIds.length === 0) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('assessment_template')
        .select('*')
        .in('id', uniqueTemplateIds);

      if (error) throw error;

      if (data) {
        // Store template data in reactive ref
        data.forEach(template => {
          templateData.value[String(template.id)] = template;
        });
      }
    } catch (error: any) {
      console.error('Error fetching template data:', error);
    }
  }
    async function updateAssessment(id: number, updates: Partial<Assessment>) {
    try {
      const { data, error } = await supabase
        .from('assessment')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      showSuccess('Assessment updated successfully.');

      // Update the local AssessmentItem if it's the same ID
      if (AssessmentItem.value?.id === id) {
        AssessmentItem.value = { ...AssessmentItem.value, ...updates };
      }

      // Update in AllAssessments if it exists there
      const index = AllAssessments.value.findIndex(a => a.id === id);
      if (index !== -1) {
        AllAssessments.value[index] = { ...AllAssessments.value[index], ...updates };
      }

      return data;
    } catch (error: any) {
      console.error(error);
      showError(`Failed to update assessment: ${error.message || 'Unknown error'}`);
      return null;
    }
  }
function clearAssessment() {
  AssessmentItem.value = null;
  clearUserDetails();
}
  return {
    AssessmentItem,
    AllAssessments,
    trainees,
    assessors,
    templateData,
    getAssessment,
    getAllAssessments,
    updateAssessment,
    getTodaysAssessments,
    // DO NOT USE THESE FUNCTIONS BELOW UNLESS NEEDED. THEY ARE MADE FOR INTERNAL USE.
    fetchUserDetails,
    fetchMultipleUserDetails,
    fetchAllUserDetails,
    fetchAssessmentUserDetails,
    fetchTemplateData,
    fetchAllTemplateData,
    clearUserDetails,
    clearAssessment
  };
});
