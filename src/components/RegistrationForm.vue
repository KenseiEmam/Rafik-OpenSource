<template>
  <div>
    <form class="my-8 space-y-4">
      <div class="form-control">
        <label for="email">Email Address</label>
        <input
          name="email"
          class="rafik-text-input"
          type="email"
          placeholder="rafik@example.com"
          required
        />
      </div>
      <div class="form-control">
        <label for="password">Password</label>
        <input
          name="password"
          class="rafik-text-input"
          type="password"
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

<script setup lang="ts"></script>

<style scoped></style>
