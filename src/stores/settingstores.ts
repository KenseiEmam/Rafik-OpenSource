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

// Interface for settings
interface Settings {
  id: string;
  user_id: string;
  language: string;
  dark_mode: boolean;
  units: number;
}

interface TrainerSettings {
  seats_available:number,
  follow_up:number,
  available_hours:string,
}
export const useSettingsStore = defineStore('Settings', () => {
  const settings = ref<Settings | null>(null);
  const trainer_settings = ref<TrainerSettings | null>(null);
  // Fetch user settings by user_id
  async function fetchSettings(user_id: string) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*', )
        .eq('user_id', user_id)
        .single();

      if (error) throw new Error(error.message);

      settings.value = data;
      localStorage.setItem("langauge", data.language)
      localStorage.setItem("dark_mode", data.dark_mode)
      localStorage.setItem("units", data.units)

      return settings.value;
    } catch (error) {
      showError('Failed to fetch trainer settings.');
    }
  }
  // Fetch trainer settings by user_id
  async function fetchTrainerSettings() {

    try {
      const user_id= localStorage.getItem('UserID')
      if (!user_id) throw new Error('No User ID in Local Storage');
      const { data, error } = await supabase
        .from('trainer_profile')
        .select('seats_available, follow_up, available_hours')
        .eq('user_id', user_id)
        .single();

      if (error) throw new Error(error.message);

      trainer_settings.value = data;
      return trainer_settings.value;
    } catch (error) {
      showError('Failed to fetch settings.');
    }
  }

  // Update settings by user_id
  async function updateSettings( updatedSettings: Partial<Settings>) {
    try {

      if(!settings.value) throw new Error("User settings not loaded yet , try again!")
      const { data, error } = await supabase
        .from('user_settings')
        .update(updatedSettings)
        .eq('id', settings.value.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      settings.value = data;
      showSuccess('Settings updated successfully!');

    } catch (error) {
      showError('Failed to update settings.');
    }
  }

    // Update trainer settings by user_id
    async function updateTrainerSettings( updatedSettings: Partial<TrainerSettings>) {
      try {
        const user_id= localStorage.getItem('UserID')
        if (!user_id) throw new Error('No User ID in Local Storage');
        const { data, error } = await supabase
          .from('trainer_profile')
          .update(updatedSettings)
          .eq('user_id', user_id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        trainer_settings.value = data;
      showSuccess('Trainer Settings updated successfully!');

      } catch (error) {
        showError('Failed to update settings.');
      }
    }

  return {
    settings,
    trainer_settings,
    fetchSettings,
    fetchTrainerSettings,
    updateSettings,
    updateTrainerSettings
  };
});
