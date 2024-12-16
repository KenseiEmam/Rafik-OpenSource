<script setup lang="ts"></script>

<template>
  <div
    class="grid md:grid-cols-5 border-rafik-secondary card items-center w-full min-h-128 flex-1 mb-16 p-12 relative items-stretch overflow-hidden"
  >
    <img
      src="https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      class="w-full h-full object-cover absolute grayscale"
      alt=""
    />
    <div class="w-full h-full bg-gradient-to-r from-40% from-rafik-secbg absolute"></div>
    <div class="col-span-3 relative space-y-4">
      <h3 class="title-small">CREATE PROGRAMS THAT SHOW OFF THE REAL YOU</h3>
      <p class="text-body">
        Our top of the line in-house tools are like nothing else on the market, allowing you
        complete flexibility and ease of use to create tailored programs for your clients in an
        efficient time frame.
        <br />
      </p>
      <h3 class="contentH-small">Our tools include but are not limited to:</h3>
      <ul class="list-disc ml-6 text-body space-y-4 text-rafik-pritext">
        <li>
          An extensive library of exercises that you can use or duplicate to create your own custom
          ones. Save these custom exercises for private use, or share them with other PTs.
        </li>
        <li>
          A program creator that allows you to set metrics and create customized workout schedules
          unbound by convential week cycles.
        </li>
        <li>
          Add assissting text documents to reply to your clients outside your working hours using an
          AI interpretter.
        </li>
        <li>
          Set up your own custom pricing model and create discount codes to share with your
          followers at a fingers touch.
        </li>
      </ul>
    </div>
    <div class="col-span-2 relative flex flex-col">
      <img
        class="h-64 card p-0 border absolute z-30 my-0 right-0 top-10"
        src="/src/assets/W&P- Edit Program Workouts.png"
        alt=""
      />
      <img
        class="w-32 card p-0 border absolute z-30 top-32 left-10"
        src="/src/assets/Select Exercise Off-Canvas.png"
        alt=""
      />
      <img
        class="h-36 card p-0 border absolute z-30 my-0 right-5"
        style="top: 45%; bottom: 50%"
        src="/src/assets/W&P- Active Programs.png"
        alt=""
      />
      <img
        class="h-52 card p-0 border absolute z-30 my-0 left-16 -bottom-5"
        src="/src/assets/W&P- Exercise Details.png"
        alt=""
      />
    </div>
  </div>
</template>
<style scoped>
li::marker {
  color: #d7bd21;
}
</style>
