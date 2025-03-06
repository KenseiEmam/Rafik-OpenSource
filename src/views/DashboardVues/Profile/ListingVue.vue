<template>
  <div class="flex h-screen overflow-auto">
    <div v-if="userStore.Trainer" class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 space-y-6">
      <!-- Page Title -->
      <PageTitle subheader="my" header="profile" />

      <!-- Tabs -->
      <div class="flex gap-8 2xl:gap-16 items-center pb-2 border-b border-rafik-sectext">
        <button
          :class="activeTab === 'profile' ? 'text-rafik-pritext' : ''"
          class="nav-btn"
          @click="activeTab = 'profile'"
        >
          Details
        </button>
        <button
          :class="activeTab === 'account' ? 'text-rafik-pritext' : ''"
          class="nav-btn uppercase"
          @click="activeTab = 'account'"
        >
          Change Password
        </button>
        <button
          :class="activeTab === 'certifications' ? 'text-rafik-pritext' : ''"
          class="nav-btn uppercase"
          @click="activeTab = 'certifications'"
        >
          Certifications
        </button>
      </div>

      <!-- Loading Spinner -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-rafik-pritext"></div>
      </div>

      <template v-else>
        <!-- Account Management Tab -->
        <div v-if="activeTab === 'account'">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div class="form-control">
                <label class="block text-sm font-medium" for="newPassword">New Password</label>
                <input id="newPassword" placeholder='*******' type="password" v-model="newPassword" class="rafik-text-input w-full" />
              </div>

              <div class="form-control">
                <label class="block text-sm font-medium" for="confirmPassword">Confirm Password</label>
                <input id="confirmPassword" placeholder='*******' type="password" v-model="confirmPassword" class="rafik-text-input w-full" />
              </div>
              <ul
          class="list-disc text-xs mt-2 ml-6 text-gray-600"

        >
          <li :class="{'text-red-500': !isPasswordValid}">Must be at least 8 characters long.</li>
          <li :class="{'text-red-500': !isPasswordValid}">Must contain at least one number and one special character.</li>
          <li :class="{'text-red-500': !isPasswordValid}">Must not be too similar to the email address.</li>
        </ul>
              <button class="btn-lg w-full" @click="changePassword">Change Password</button>
            </div>
          </div>
        </div>

        <!-- Profile Information Tab -->
        <div v-else-if="activeTab === 'profile'">
          <form class="grid grid-cols-1 md:grid-cols-2 gap-4" @submit.prevent="updateProfileInfo">
                         <!-- Avatar & Upload Photo -->
        <div class="flex flex-col items-center space-y-4">
          <img
            v-if="userStore.Trainer.avatar"
            :src="userStore.Trainer.avatar"
            alt="Trainer Avatar"
            class="w-24 h-24 2xl:h-44 2xl:w-44 rounded-full"
          />
          <input type="file" @change="uploadPhoto" accept="image/*" class="hidden" id="upload-photo" />
          <label for="upload-photo" class="btn-md-outline w-full md:w-auto cursor-pointer">
            Upload Photo
          </label>
        </div>
        <div class="space-y-3">
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

        <!-- Certifications Tab -->
        <div v-else-if="activeTab === 'certifications'">
          <form @submit.prevent="updateCertifications" class="space-y-4">
            <div class="form-control">
              <label class="block text-sm font-medium" for="certifications">Certifications (comma-separated)</label>
              <input id="certifications" v-model="certificationsInput" class="rafik-text-input w-full" type="text" placeholder="e.g. 101, 102, 103" />
            </div>
            <button type="submit" class="btn-lg w-full md:w-auto">Update Certifications</button>
          </form>
        </div>
      </template>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useUserStore } from '@/stores/user'
import PageTitle from '@/components/Navigation/PageTitle.vue'
import Swal from 'sweetalert2'

const userStore = useUserStore()
const loading = ref(true) // Added loading state
// Reactive validation states
const isPasswordValid = ref<boolean>(false);
const doPasswordsMatch = computed(() => newPassword.value === confirmPassword.value);
const canSubmit = computed(() => isPasswordValid.value && doPasswordsMatch.value);

function validatePassword() {
  const hasNumber = /\d/.test(newPassword.value);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword.value);
  const isLongEnough = newPassword.value.length >= 8;
  const notSimilarToEmail = !userStore.Trainer?.email || !userStore.Trainer.email.includes(newPassword.value);

  isPasswordValid.value = hasNumber && hasSpecialChar && isLongEnough && notSimilarToEmail;
}

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
    background: '#081411',
    color: '#E8F3ED',
  })
}

const activeTab = ref<'account' | 'profile' | 'certifications'>('profile')
const newPassword = ref('')
const confirmPassword = ref('')
const certificationsInput = ref('')
const selectedFile = ref<File | null>(null)

onMounted(async () => {
  try {
    await userStore.getTrainer()
    if (userStore.Trainer?.certifications) {
      certificationsInput.value = userStore.Trainer.certifications.join(', ')
    }
  } catch (err: any) {
    console.error('Error fetching trainer data:', err)
    showError('Failed to load profile data.')
  } finally {
    loading.value = false // Set loading to false once data is loaded
  }
})

async function changePassword() {
  validatePassword()
  if (!canSubmit) {
    showError('Passwords do not fit criteria!')
    return
  }
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword.value })
    if (error) throw error
    showSuccess('Password changed successfully!')
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (err: any) {
    console.error(err)
    showError(`Failed to change password: ${err.message || 'Unknown error'}`)
  }
}

async function updateProfileInfo() {
  if (!userStore.Trainer) {
    showError('Trainer data not found.')
    return
  }
  loading.value=true
  try {
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

    const { error: profileUpdateError } = await supabase
      .from('trainer_profile')
      .update({
        title: userStore.Trainer.title,
        years_of_experience: userStore.Trainer.years_of_experience,
        bio: userStore.Trainer.bio,
      })
      .eq('id', userStore.Trainer.trainer_profile_id)
    if (profileUpdateError) throw profileUpdateError
    showSuccess('Profile information updated successfully!')
  } catch (err: any) {
    console.error(err)
    showError(`Failed to update profile: ${err.message || 'Unknown error'}`)
  }
  finally {
    loading.value = false // Set loading to false once data is loaded
  }
}

async function updateCertifications() {
  if (!userStore.Trainer) {
    showError('Trainer data not found.')
    return
  }
  loading.value=true
  userStore.Trainer.certifications = certificationsInput.value
    .split(',')
    .map((id) => parseInt(id.trim()))
    .filter((num) => !isNaN(num))

  try {
    const { error } = await supabase
      .from('trainer_profile')
      .update({ certifications: userStore.Trainer.certifications })
      .eq('id', userStore.Trainer.trainer_profile_id)
    if (error) throw error

    showSuccess('Certifications updated successfully!')
  } catch (err: any) {
    console.error(err)
    showError(`Failed to update certifications: ${err.message || 'Unknown error'}`)
  }
  finally {
    loading.value = false // Set loading to false once data is loaded
  }
}

const uploadPhoto = async (event: Event) => {
  if (!userStore.Trainer) {
    showError('Trainer data not found.')
    return
  }
  loading.value=true
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]

    const uploadedUrl = await uploadFileToBucket()
    if (uploadedUrl) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ avatar: uploadedUrl })
          .eq('id', userStore.Trainer.id)
        if (error) throw error

        userStore.Trainer.avatar = uploadedUrl
        showSuccess('Profile picture updated successfully!')
      } catch (err: any) {
        console.error(err)
        showError(`Failed to update profile picture: ${err.message}`)
      }
      finally {
    loading.value = false // Set loading to false once data is loaded
  }
    }
  }
}

const uploadFileToBucket = async (): Promise<string | null> => {
  if (!selectedFile.value) {
    showError('Please select an image.')
    return null
  }
  try {
    const { data, error } = await supabase.storage
      .from('storage')
      .upload(`media/${Date.now()}_${selectedFile.value.name}`, selectedFile.value, {
        cacheControl: '3600',
        upsert: true,
      })
    if (error) throw error

    const { data: publicUrlData } = supabase.storage.from('storage').getPublicUrl(data.path)
    return publicUrlData.publicUrl
  } catch (err: any) {
    console.error(err)
    showError(`Upload failed: ${err.message}`)
    return null
  }
}
</script>



<style scoped>
/* Example styling for demonstration purposes; adjust as needed */
.form-control label {
  margin-bottom: 0.25rem;
}
</style>
