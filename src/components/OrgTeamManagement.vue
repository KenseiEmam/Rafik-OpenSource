<script setup lang="ts"></script>

<template>
  <div class="min-h-72 flex-1 mb-16 relative w-full">
    <h1 class="title-small my-8 pb-4 border-b border-rafik">
      <span class="text-rafik-pritext dark:text-rafik-darkpritext"> Unified </span>
      <br />
      Team&nbsp;&amp;&nbsp;Athlete&nbsp;Management
    </h1>

    <div class="grid md:grid-cols-2 gap-4 items-center mt-8">
      <!-- Roster -->
      <div class="pb-8 gap-8 flex flex-col">
        <img
          src="/src/assets/Entitlements.png"
          class="h-64 card rounded-xl m-auto shadow-lg"
          alt=""
        />
        <p class="text-body pl-4 border-l border-rafik-secondary">
          View every athlete and staff member in one place. Filter by sport, squad, status or
          eligibility to keep your programme running smoothly.
        </p>
      </div>

      <!-- Deep insights -->
      <div class="pb-8 gap-8 flex flex-col">
        <div class="h-64 relative">
          <img
            src="/src/assets/Workout Breakdown.png"
            class="h-52 absolute card top-0 left-10 rounded-xl m-auto shadow-lg"
            alt=""
          />
          <img
            src="/src/assets/Client Statistics.png"
            class="h-52 absolute right-10 bottom-0 card rounded-xl m-auto shadow-lg"
            alt=""
          />
        </div>
        <p class="text-body pl-4 border-l border-rafik-secondary">
          Monitor workload, wellness and compliance to protect athlete health and drive consistent
          performance.
        </p>
      </div>

      <!-- Progress -->
      <div class="pb-8 gap-8 flex flex-col">
        <img
          src="/src/assets/W&P- Custom Exercises.png"
          class="h-64 card rounded-xl m-auto shadow-lg"
          alt=""
        />
        <p class="text-body pl-4 border-l border-rafik-secondary">
          Organisation-level dashboards surface trends across teams so you can benchmark success and
          spot red flags early.
        </p>
      </div>

      <!-- Scheduling -->
      <div class="pb-8 gap-8 flex flex-col">
        <img
          src="/src/assets/W&P- Edit Program Workouts.png"
          class="h-64 card rounded-xl m-auto shadow-lg"
          alt=""
        />
        <p class="text-body pl-4 border-l border-rafik-secondary">
          Align calendars, facilities and travel logistics to keep everyone on-time and
          competition-ready.
        </p>
      </div>
    </div>
  </div>
</template>
