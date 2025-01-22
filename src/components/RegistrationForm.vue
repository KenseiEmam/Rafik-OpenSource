<template>
  <div>
    <form class="my-8 space-y-4" @submit.prevent="signUpNewUser">
      <div class="form-control">
        <label for="email">Email Address</label>
        <input
          name="email"
          class="rafik-text-input"
          type="email"
          :value="email"
          placeholder="rafik@example.com"
          required
        />
      </div>
      <div class="form-control">
        <label for="password">Password</label>
        <input
          name="password"
          :value="password"
          class="rafik-text-input"
          type="password"
          @input="handleValid"
          placeholder="*******"
          required
        />
        <ul class="list-disc text-xs mt-1 ml-6">
          <li>Must be atleast 8 characters long.</li>
          <li>Must contain one number and one special letter.</li>
          <li>Must not be too simillar to email address.</li>
        </ul>
      </div>
      <div class="form-control">
        <label for="confirm">Confirm Password</label>
        <input
          name="confirm"
          :value="confirm_password "
          class="rafik-text-input"
          type="password"
          placeholder="*******"
          required
        />
      </div>
      <button type="submit" class="btn-lg">JOIN NOW</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import { supabase } from '../lib/supabaseClient'
const email = ref<string>('');
const password = ref<string>('');
const confirm_password = ref<string>('');
const valid = ref<boolean>(false);

async function signUpNewUser() {
  if((confirm_password.value === password.value) && valid){

    try {
    const { error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        emailRedirectTo: 'https://example.com/welcome',
      },
    })
    if (error) throw error
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    }
  }
  else {
    alert("please revise the password policy!")
  }

}
function handleValid(){
  if (password.value.length > 8 )
  valid.value = true
}
</script>

<style scoped></style>
