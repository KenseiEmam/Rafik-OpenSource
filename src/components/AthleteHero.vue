<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const emit = defineEmits(['changeComp']);
const { t, locale } = useI18n();

const words = ['stronger', 'fitter', 'smarter', 'faster'];
const title = ref(words[0]);

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randomizeText(target: string, duration = 600) {
  return new Promise<void>((resolve) => {
    const steps = 10;
    const interval = duration / steps;
    let step = 0;

    const original = target.split('');
    const display = [...original];

    const scramble = () => {
      for (let i = 0; i < original.length; i++) {
        if (step < steps - 1) {
          display[i] = chars[Math.floor(Math.random() * chars.length)];
        } else {
          display[i] = original[i];
        }
      }

      title.value = display.join('');

      if (step < steps) {
        step++;
        setTimeout(scramble, interval);
      } else {
        resolve();
      }
    };

    scramble();
  });
}

onMounted(async () => {
  let index = 0;
  while (true) {
    await randomizeText(words[index]);
    await new Promise((r) => setTimeout(r, 1600));
    index = (index + 1) % words.length;
  }
});
</script>


<template>
  <div
    class="flex flex-col justify-center md:grid md:grid-cols-5 items-center my-16 flex-1 relative "
  >
    <div class="md:flex hidden fixed z-40 bottom-5 justify-center left-0 right-0">
      <!-- <div class="card rounded-full px-12">
        <h3 class="text-body text-center">
          {{ t('home.welcome.traineeQuery') }}
          <RouterLink to="application">{{ t('home.welcome.getOurApp') }}</RouterLink>
        </h3>
      </div> -->
    </div>
    <div class="md:hidden relative top-6">
      <div
        class="w-40 h-40 rounded-full bottom-16 opacity-80 absolute right-0 bg-topsets content"
      ></div>
      <div
        class="w-40 h-40 rounded-full bottom-24 opacity-80 absolute right-24 bg-topsets-sectext dark:bg-topsets-darksectext content"
      ></div>
      <img
        class="max-h-64 object-cover ms-auto relative grayscale"
        src="/src/assets/athlete.webp"
        alt=""
      />
    </div>
    <div class="md:col-span-3 relative z-20 -top-16">
      <h1 class="header-medium md:header-large font-black">
        Unlock your true
      </h1>
      <h1 class="title-medium   ">
        Athletic potential
      </h1>


    </div>
    <div class="md:col-span-2 hidden md:block relative">
      <div
        class="w-80 h-80 rounded-full bottom-16 opacity-80 absolute right-0 bg-topsets content"
      ></div>
      <div
        class="w-80 h-80 rounded-full bottom-24 opacity-80 absolute right-24 bg-topsets-sectext dark:bg-topsets-darksectext content"
      ></div>
      <img
        class="max-h-128 w-full object-cover ms-auto relative grayscale"
        src="/src/assets/athlete.webp"
        alt=""
      />
    </div>
  </div>
</template>
