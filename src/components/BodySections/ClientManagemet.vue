<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t , locale } = useI18n();
</script>

<template>
  <div class="min-h-72 flex-1 mb-16 relative w-full">
    <h1 class="title-small my-8 pb-4 border-b border-rafik">
      <span class="text-rafik-pritext dark:text-rafik-darkpritext">
        Unparalleled
      </span>
      <br />
     Trainee Management
    </h1>
    <div class="grid md:grid-cols-2 gap-4 items-center mt-8">
      <div class="pb-8 gap-8 flex flex-col">
        <img
          src="/src/assets/My Clients.png"
          class="h-64 card rounded-xl m-auto shadow-lg"
          alt=""
        />
        <p class="text-body pl-4 border-l border-rafik-secondary">
          Search and filter all your trainees to your desired priorities and scheduled needs.
        </p>
      </div>
      <div class="pb-8 gap-8 flex flex-col">
        <div class="h-64 relative">
          <img
            src="/src/assets/Workout Breakdown.png"
            class="h-52 absolute card top-0 left-10 rounded-xl m-auto shadow-lg"
            alt=""
          />
          <img
            src="/src/assets/Diet Log Breakdown.png"
            class="h-52 absolute right-10 bottom-0 card rounded-xl m-auto shadow-lg"
            alt=""
          />
        </div>
        <p class="text-body pl-4 border-l border-rafik-secondary">
          Zoom in and take an even deeper look into your athletes' daily lives from their detailed workout and diet logs.
        </p>
      </div>

      <div class="pb-8 gap-8 flex flex-col">
        <img
          src="/src/assets/WK-progress.png"
          class="h-64 card rounded-xl m-auto shadow-lg"
          alt=""
        />
        <p class="text-body pl-4 border-l border-rafik-secondary">
           Track their achievements and performance metrics to maximize program design.

        </p>
      </div>
      <div class="pb-8 gap-8 flex flex-col">
        <img
          src="/src/assets/WK-plan.png"
          class="h-64 card rounded-xl m-auto shadow-lg"
          alt=""
        />
        <p class="text-body pl-4 border-l border-rafik-secondary">
          Get all your client insights and customize their individual workout plan.
        </p>
      </div>
    </div>
  </div>
</template>
