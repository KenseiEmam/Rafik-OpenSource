<script setup lang="ts"></script>

<template>
  <section id="contact" class="flex-1 card mb-16 p-12">
    <div class="grid md:grid-cols-3 my-auto w-full gap-8">
      <div class="col-span-2 space-y-4">
        <h1 class="title-small">Would Love to Hear From You</h1>
        <p class="mb-8 text-body">
          Have a question about our training? Our Models? Our Services? Reach us through the methods
          down below!
        </p>
      </div>
      <div
        class="border-l pl-8 space-y-4 border-rafik-sectext flex w-full items-center justify-center flex-col w-full"
      >
        <h3 class="header-small">Send us A Message</h3>
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
            <label for="message">Message</label>
            <textarea
              name="message"
              class="rafik-text-input"
              rows="6"
              placeholder="Write us a message here..."
              required
            ></textarea>
          </div>
          <div class="flex w-full">
            <button type="submit" class="btn-lg mx-auto">SEND</button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
