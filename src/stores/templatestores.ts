import { ref } from "vue";
import { defineStore } from "pinia";
import { supabase } from "@/lib/supabaseClient";
import Swal from "sweetalert2";
import router from "@/router";

export type Template = {
  id: string;
  template_name: string;
  template_description?: string;
  created_by?: number;
   created_by_user?: { id: string; first_name: string; last_name: string; avatar:string; email:string; }; // optional enhancement
  drills?: any[];
  created_at: string;
  organization?: number;
  etc?:number;
};

export const useTemplateStore = defineStore("template", () => {
  const AllTemplates = ref<Template[]>([]);
  const TemplateItem = ref<Template | null>(null); // 🔹 Single template
  const createdByUser = ref<{ [id: string]: any }>({});
  // Fetch all templates
  async function fetchTemplates(userProfile: any) {
    try {
      let query = supabase.from("assessment_template").select("*");

      if (userProfile?.roles?.includes("Organization Trnr")) {
        query = query.eq("created_by", userProfile.id);
      } else if (userProfile?.roles?.includes("Organization Admin")) {
        query = query.eq("organization", userProfile.organization);
      }

      const { data, error } = await query;
      if (error) throw error;

      AllTemplates.value = data || [];
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error fetching templates",
        text: error.message || "Unknown error",
        background: "#081411",
        color: "#E8F3ED",
      });
    }
  }

  async function fetchTemplateById(id: string) {
    try {
      const { data, error } = await supabase
        .from("assessment_template")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      TemplateItem.value = data;

      if (data?.created_by && TemplateItem.value) {
        const user = await fetchCreatedByUser(data.created_by);
        if (user) {
          TemplateItem.value.created_by_user = user; // attach for convenience
        }
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error loading template",
        text: error.message || "Unknown error",
        background: "#081411",
        color: "#E8F3ED",
      });
      TemplateItem.value = null;
      throw error;
    }
  }

  async function updateTemplate(updated: Template) {
    try {
      const { data, error } = await supabase
        .from("assessment_template")
        .update({
          template_name: updated.template_name,
          template_description: updated.template_description,
          drills: updated.drills
        })
        .eq("id", updated.id)
        .select()
        .single();

      if (error) throw error;

      TemplateItem.value = data;

      if (data?.created_by && TemplateItem.value) {
        const user = await fetchCreatedByUser(data.created_by);
        if (user) {
          TemplateItem.value.created_by_user = user; // attach for convenience
        }
      }

      const index = AllTemplates.value.findIndex((t) => t.id === data.id);
      if (index !== -1) {
        AllTemplates.value[index] = data;
      }

      Swal.fire({
        icon: "success",
        title: "Template updated",
        background: "#081411",
        color: "#E8F3ED",
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error updating template",
        text: error.message || "Unknown error",
        background: "#081411",
        color: "#E8F3ED",
      });
      throw error;
    }
  }

  async function createTemplate(template: Omit<Template, "id" | "created_at">) {
    try {
      const { data, error } = await supabase
        .from("assessment_template")
        .insert([template])
        .select()
        .single();

      if (error) throw error;
      if (data) AllTemplates.value.push(data);
      router.push({name:'assessment-template', params:{id:data.id}});
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error creating template",
        text: error.message || "Unknown error",
        background: "#081411",
        color: "#E8F3ED",
      });
      throw error;
    }
  }
async function fetchCreatedByUser(userId: number) {
  if (createdByUser.value[userId]) return createdByUser.value[userId];

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, avatar')
      .eq('id', userId)
      .single();

    if (error) throw error;

    createdByUser.value[userId] = data;
    return data;
  } catch (error: any) {
    console.error('Error fetching creator user:', error);
    return null;
  }
}
  async function deleteTemplate(id: string) {
    try {
      const { error } = await supabase.from("assessment_template").delete().eq("id", id);
      if (error) throw error;

      AllTemplates.value = AllTemplates.value.filter((t) => t.id !== id);
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error deleting template",
        text: error.message || "Unknown error",
        background: "#081411",
        color: "#E8F3ED",
      });
      throw error;
    }
  }

  async function searchTemplates(_query: string) {
    // Optional - search can still be done client-side
  }

  return {
    AllTemplates,
    TemplateItem,
    createdByUser,
    fetchTemplates,
    fetchTemplateById,
    updateTemplate,
    createTemplate,
    deleteTemplate,
    searchTemplates,
  };
});
