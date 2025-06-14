<script setup lang="ts">
import { ref, onMounted } from 'vue';

const phrases = ['Smarter Training', 'Deeper Insights', 'Stronger Athletes'];
const display = ref(phrases[0]);

const shuffle = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function scramble(text: string, duration = 600) {
  return new Promise<void>((resolve) => {
    const steps = 10;
    const interval = duration / steps;
    let step = 0;
    const original = text.split('');
    const current = [...original];

    const tick = () => {
      for (let i = 0; i < original.length; i++) {
        current[i] =
          step < steps - 1 ? shuffle[Math.floor(Math.random() * shuffle.length)] : original[i];
      }
      let value = current.join('');
      if (!current.includes(' ')) {
        current[Math.round(current.length / 2)] = ' ';
        value = current.join('');
      }
      display.value = value;
      if (++step < steps) setTimeout(tick, interval);
      else resolve();
    };
    tick();
  });
}

onMounted(async () => {
  let i = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await scramble(phrases[i]);
    await new Promise((r) => setTimeout(r, 1600));
    i = (i + 1) % phrases.length;
  }
});
</script>

<template>
  <section class="flex flex-col justify-center md:grid md:grid-cols-5 items-center my-48">
    <!-- Graphic (mobile first) -->
    <div class="md:hidden relative top-6">
      <div class="w-40 h-40 rounded-full absolute right-0 opacity-80 bg-rafik" />
      <div
        class="w-40 h-40 rounded-full bottom-24 right-24 absolute opacity-80 bg-rafik-sectext dark:bg-rafik-darksectext"
      />
      <img
        class="max-h-64 object-cover ms-auto grayscale"
        src="/src/assets/running_man.png"
        alt=""
      />
    </div>

    <!-- Headline -->
    <div class="md:col-span-3 z-20 -top-16 relative">
      <h1 class="header-medium md:header-large font-black">Book&nbsp;Your&nbsp;Demo</h1>
      <h2 class="title-large">{{ display }}</h2>
      <p class="subheader-medium w-3/4 mb-16">
        Experience Rafik in action – see how data-driven programming elevates every rep, set and
        session.
      </p>
    </div>

    <!-- Graphic (desktop) -->
    <div class="md:col-span-2 hidden md:block relative">
      <div class="w-80 h-80 rounded-full absolute right-0 opacity-80 bg-rafik" />
      <div
        class="w-80 h-80 rounded-full bottom-24 right-24 absolute opacity-80 bg-rafik-sectext dark:bg-rafik-darksectext"
      />
      <img
        class="max-h-128 w-full object-cover grayscale"
        src="/src/assets/running_man.png"
        alt=""
      />
    </div>
  </section>
</template>
