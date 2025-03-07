<script setup lang="ts"></script>

<template>
  <div class="flex-1 flex w-full items-center justify-center flex-col">
    <div class="w-full mb-6">
      <h1 class="header-medium">GOT A QUESTION?</h1>
      <h1 class="title-medium leading-none">LET US HELP</h1>
    </div>

    <form class="space-y-4 w-full">
      <div class="form-control">
        <label for="Name">Full Name</label>
        <input name="Name" class="rafik-text-input" type="text" placeholder="rafik" required />
      </div>
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
        <label for="subject">Subject of Enquiry</label>
        <input
          name="subject"
          class="rafik-text-input"
          type="text"
          placeholder="What is it about?"
          required
        />
      </div>
      <div class="form-control">
        <label for="message">Message</label>
        <textarea
          name="message"
          class="rafik-text-input"
          rows="6"
          placeholder="Write us a message here..."
          required
        ></textarea>
      </div>
      <div class="text-start">
        <button type="submit" class="btn-lg mx-auto">ASK AWAY</button>
      </div>
    </form>
  </div>
</template>
<script setup lang="ts"></script>
