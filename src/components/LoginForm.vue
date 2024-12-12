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
      </div>

      <button type="submit" class="btn-lg">ACCESS DASHBOARD</button>
    </form>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped></style>
