<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t , locale } = useI18n();
</script>

<template>
  <div class="min-h-72 flex-1 mb-16 relative w-full">
    <h1 class="title-small my-8 pb-4 border-b border-topsets">
      <span class="text-topsets-pritext dark:text-topsets-darkpritext">
       Easier than ever
      </span>
      <br />
     Performance Tracking
    </h1>
    <div class="grid md:grid-cols-3 gap-8 items-center mt-8">
      <div class="pb-8 gap-8 flex flex-col">
        <img
          src="/src/assets/setlog.jpeg"
          class="h-96 card rounded-xl m-auto shadow-lg"
          alt=""
        />
        <p class="text-body pl-4 border-l border-topsets-secondary">
          Get exercise and drill breakdowns before noting down your set performance.
        </p>
      </div>
      <div class="pb-8 gap-8 flex flex-col">
        <div class="h-96 relative">
          <img
            src="/src/assets/addfood.jpeg"
            class="h-80 absolute card top-0 left-10 rounded-xl m-auto shadow-lg"
            alt=""
          />
          <img
            src="/src/assets/foodlog.jpeg"
            class="h-80 absolute right-10 bottom-0 card rounded-xl m-auto shadow-lg"
            alt=""
          />
        </div>
        <p class="text-body pl-4 border-l border-topsets-secondary">
         Log your meals and get diet recommendations from your coach that align with your macros.
        </p>
      </div>

      <div class="pb-8 gap-8 flex flex-col">
        <img
          src="/src/assets/weightlog.jpeg"
          class="h-96 card rounded-xl m-auto shadow-lg"
          alt=""
        />
        <p class="text-body pl-4 border-l border-topsets-secondary">
           Log your own metrics and weight to give you and your coaches better progress insight.
        </p>
      </div>

    </div>
  </div>
</template>
