<template>
  <div class="max-w-4xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Trainer Settings</h1>

    <!-- Tabs Navigation -->
    <div class="flex space-x-4 border-b border-gray-200 mb-4">
      <button
        class="px-4 py-2 -mb-px font-semibold"
        :class="
          activeTab === 'account' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
        "
        @click="(activeTab = 'account')"
      >
        Account Management
      </button>
      <button
        class="px-4 py-2 -mb-px font-semibold"
        :class="
          activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
        "
        @click="(activeTab = 'profile')"
      >
        Profile Information
      </button>
      <button
        class="px-4 py-2 -mb-px font-semibold"
        :class="
          activeTab === 'certifications'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600'
        "
        @click="(activeTab = 'certifications')"
      >
        Certifications
      </button>
    </div>

    <!-- 1. Account Management Tab -->
    <div v-if="activeTab === 'account'">
      <!-- Check if trainer data is loaded -->
      <div v-if="!userStore.Trainer || !userStore.Trainer.email" class="text-gray-500">
        Loading...
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Avatar & Upload Photo -->
        <div class="flex flex-col items-center space-y-4">
          <img
            v-if="userStore.Trainer.avatar"
            :src="userStore.Trainer.avatar"
            alt="Trainer Avatar"
            class="w-24 h-24 rounded-full"
          />
          <button class="btn w-full md:w-auto" @click="uploadPhoto">Upload Photo</button>
        </div>

        <!-- Password Change -->
        <div class="space-y-4">
          <div class="form-control">
            <label class="block text-sm font-medium" for="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              v-model="newPassword"
              class="rafik-text-input w-full"
            />
          </div>

          <div class="form-control">
            <label class="block text-sm font-medium" for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              v-model="confirmPassword"
              class="rafik-text-input w-full"
            />
          </div>

          <button class="btn-lg w-full" @click="changePassword">Change Password</button>
        </div>
      </div>
    </div>

    <!-- 2. Profile Information Tab -->
    <div v-else-if="activeTab === 'profile'">
      <div v-if="!userStore.Trainer || !userStore.Trainer.email" class="text-gray-500">
        Loading...
      </div>
      <div v-else>
        <form class="grid grid-cols-1 md:grid-cols-2 gap-4" @submit.prevent="updateProfileInfo">
          <!-- Email (Read-only) -->
          <div class="form-control">
            <label class="block text-sm font-medium" for="email">Email Address</label>
            <input
              id="email"
              v-model="userStore.Trainer.email"
              class="rafik-text-input w-full"
              type="email"
              readonly
            />
          </div>

          <!-- Phone -->
          <div class="form-control">
            <label class="block text-sm font-medium" for="phone">Phone</label>
            <input
              id="phone"
              v-model="userStore.Trainer.phone"
              class="rafik-text-input w-full"
              type="tel"
              required
            />
          </div>

          <!-- First Name -->
          <div class="form-control">
            <label class="block text-sm font-medium" for="first_name">First Name</label>
            <input
              id="first_name"
              v-model="userStore.Trainer.first_name"
              class="rafik-text-input w-full"
              type="text"
              required
            />
          </div>

          <!-- Last Name -->
          <div class="form-control">
            <label class="block text-sm font-medium" for="last_name">Last Name</label>
            <input
              id="last_name"
              v-model="userStore.Trainer.last_name"
              class="rafik-text-input w-full"
              type="text"
              required
            />
          </div>

          <!-- Age -->
          <div class="form-control">
            <label class="block text-sm font-medium" for="age">Age</label>
            <input
              id="age"
              v-model.number="userStore.Trainer.age"
              class="rafik-text-input w-full"
              type="number"
              min="0"
              required
            />
          </div>

          <!-- Nationality -->
          <div class="form-control">
            <label class="block text-sm font-medium" for="nationality">Nationality</label>
            <input
              id="nationality"
              v-model="userStore.Trainer.nationality"
              class="rafik-text-input w-full"
              type="text"
              required
            />
          </div>

          <!-- Gender (Read-only) -->
          <div class="form-control">
            <label class="block text-sm font-medium" for="gender">Gender</label>
            <input
              id="gender"
              v-model="userStore.Trainer.gender"
              class="rafik-text-input w-full"
              type="text"
              readonly
            />
          </div>

          <!-- Title -->
          <div class="form-control">
            <label class="block text-sm font-medium" for="title">Title</label>
            <input
              id="title"
              v-model="userStore.Trainer.title"
              class="rafik-text-input w-full"
              type="text"
              required
            />
          </div>

          <!-- Years of Experience -->
          <div class="form-control">
            <label class="block text-sm font-medium" for="years_of_experience"
              >Years of Experience</label
            >
            <input
              id="years_of_experience"
              v-model.number="userStore.Trainer.years_of_experience"
              class="rafik-text-input w-full"
              type="number"
              min="0"
              required
            />
          </div>

          <!-- Bio (Full width) -->
          <div class="form-control md:col-span-2">
            <label class="block text-sm font-medium" for="bio">Bio</label>
            <textarea
              id="bio"
              v-model="userStore.Trainer.bio"
              class="rafik-text-input w-full"
              rows="4"
              placeholder="Tell us about yourself..."
            ></textarea>
          </div>

          <!-- Submit Button (Full width) -->
          <div class="md:col-span-2">
            <button type="submit" class="btn-lg w-full md:w-auto">Save Profile</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 3. Certifications Tab -->
    <div v-else-if="activeTab === 'certifications'">
      <div v-if="!userStore.Trainer || !userStore.Trainer.email" class="text-gray-500">
        Loading...
      </div>
      <div v-else>
        <form @submit.prevent="updateCertifications" class="space-y-4">
          <div class="form-control">
            <label class="block text-sm font-medium" for="certifications">
              Certifications (comma-separated)
            </label>
            <input
              id="certifications"
              v-model="certificationsInput"
              class="rafik-text-input w-full"
              type="text"
              placeholder="e.g. 101, 102, 103"
            />
          </div>
          <button type="submit" class="btn-lg w-full md:w-auto">Update Certifications</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// Tab state
const activeTab = ref<'account' | 'profile' | 'certifications'>('account')

// Password change fields
const newPassword = ref('')
const confirmPassword = ref('')

// Certifications input (comma-separated)
const certificationsInput = ref('')

// On mount, fetch the trainer profile
onMounted(() => {
  userStore.getTrainer().then(() => {
    // Once loaded, if there's an existing certifications array, convert it to a string
    if (userStore.Trainer?.certifications) {
      certificationsInput.value = userStore.Trainer.certifications.join(', ')
    }
  })
})

// 1. Change Password
async function changePassword() {
  if (!newPassword.value || newPassword.value !== confirmPassword.value) {
    alert('Passwords do not match or are empty.')
    return
  }
  try {
    // Example using Supabase to update user password
    const { error } = await supabase.auth.updateUser({
      password: newPassword.value,
    })
    if (error) throw error

    alert('Password changed successfully!')
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (err: any) {
    console.error(err)
    alert(`Failed to change password: ${err.message || 'Unknown error'}`)
  }
}

// 2. Update Profile Information
async function updateProfileInfo() {
  if (!userStore.Trainer) {
    alert('Trainer data not found.')
    return
  }
  try {
    // Update the users table
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        first_name: userStore.Trainer.first_name,
        last_name: userStore.Trainer.last_name,
        phone: userStore.Trainer.phone,
        age: userStore.Trainer.age,
        nationality: userStore.Trainer.nationality,
      })
      .eq('id', userStore.Trainer.id)

    if (userUpdateError) throw userUpdateError

    // Update the trainer_profile table
    const { error: profileUpdateError } = await supabase
      .from('trainer_profile')
      .update({
        title: userStore.Trainer.title,
        years_of_experience: userStore.Trainer.years_of_experience,
        bio: userStore.Trainer.bio,
      })
      .eq('id', userStore.Trainer.trainer_profile_id)

    if (profileUpdateError) throw profileUpdateError

    alert('Profile information updated successfully!')
  } catch (err: any) {
    console.error(err)
    alert(`Failed to update profile: ${err.message || 'Unknown error'}`)
  }
}

// 3. Update Certifications
async function updateCertifications() {
  if (!userStore.Trainer) {
    alert('Trainer data not found.')
    return
  }

  // Convert the comma-separated input into an array of numbers
  userStore.Trainer.certifications = certificationsInput.value
    .split(',')
    .map((id) => parseInt(id.trim()))
    .filter((num) => !isNaN(num))

  try {
    const { error } = await supabase
      .from('trainer_profile')
      .update({
        certifications: userStore.Trainer.certifications,
      })
      .eq('id', userStore.Trainer.trainer_profile_id)

    if (error) throw error

    alert('Certifications updated successfully!')
  } catch (err: any) {
    console.error(err)
    alert(`Failed to update certifications: ${err.message || 'Unknown error'}`)
  }
}

// 4. Upload Photo (example placeholder)
async function uploadPhoto() {
  alert('Upload photo logic goes here!')
  // e.g., open a file dialog, then upload to Supabase storage, update userStore.Trainer.avatar
}
</script>

<style scoped>
/* Example styling for demonstration purposes; adjust as needed */
.form-control label {
  margin-bottom: 0.25rem;
}
</style>
