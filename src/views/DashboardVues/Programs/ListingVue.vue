<template>
  <div class="flex h-screen overflow-auto">
    <div
      v-if="programStore.AllPrograms"
      class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 space-y-8"
    >
      <!-- Page Title -->
      <PageTitle subheader="workouts &" header="programs" />

      <!-- Tabs -->
      <div class="flex xl:w-3/4 gap-8 justify-between items-center">
        <button
          :class="activeTab === 'Active Program' ? 'text-rafik-pritext' : ''"
          class="nav-btn max-w-16"
          @click="setActiveTab('Active Program')"
        >
          Active Programs
        </button>
        <button
          :class="activeTab === 'Drafted Programs' ? 'text-rafik-pritext' : ''"
          class="nav-btn uppercase max-w-16"
          @click="setActiveTab('Drafted Programs')"
        >
          Drafted Programs
        </button>
        <button
          :class="activeTab === 'My Workouts' ? 'text-rafik-pritext' : ''"
          class="nav-btn uppercase max-w-16"
          @click="setActiveTab('My Workouts')"
        >
          My Workouts
        </button>
        <button
          :class="activeTab === 'Custom Exercises' ? 'text-rafik-pritext' : ''"
          class="nav-btn uppercase max-w-16"
          @click="setActiveTab('Custom Exercises')"
        >
          Custom Exercises
        </button>
      </div>

      <!-- Active Program Grid -->
       <transition name="slide-fade">

        <div v-if="activeTab === 'Active Program'" class="grid md:grid-cols-3 gap-8 h-full align-stretch">
          <!-- Existing Programs -->
          <div
            v-for="program in programStore.ActivePrograms"
            :key="program.id"
            @click="detailsRoute(program.id)"
            class="border-2 group flex flex-col relative border-rafik-sectext hover:border-rafik-secondary hover:cursor-pointer rounded-lg overflow-hidden"
          >
            <img
              :src="program.program_photo"
              class="w-full h-full object-cover absolute grayscale group-hover:grayscale-0 transition duration-300"
              alt=""
            />
            <div class="w-full opacity-70 h-full bg-rafik-pribg absolute"></div>
            <div class="w-full opacity-0 group-hover:opacity-60 h-full bg-gradient-to-t from-rafik-alternate to-50 absolute"></div>
            <div class="p-8 space-y-4 relative flex flex-col items-end">
              <h2 class="subheader-medium flex gap-4 items-center group-hover:text-rafik-pritext">
                <svg xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="currentColor" viewBox="0 0 576 512" class="W:8 xl:w-8 2xl:w-10 text-rafik-sectext group-hover:text-rafik">
                  <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                </svg>
                {{ program.overall_rating }}
              </h2>
              <div class="scale-x-0 group-hover:scale-x-100 origin-right duration-150 ease-in-out">
                <p class="text-body">0 Active Trainees</p>
                <p class="text-body">{{ 0 * program.price_one }} AED in Revenue</p>
              </div>
            </div>
            <div class="p-8 space-y-4 relative mt-auto">
              <h3 class="title-small text-rafik-sectext group-hover:text-rafik">
                {{ program.program_name }}
              </h3>
              <div class="h-0 group-hover:h-auto transition opacity-0 group-hover:opacity-100 ease-in space-y-4">
                <p class="text-body group-hover:text-rafik-pritext text-rafik-sectext line-clamp-3">
                  {{ program.program_description }}
                </p>
                <div class="grid grid-cols-2">
                  <!-- Limit to 4 Tags -->
                  <p class="text-body" v-for="(tag, index) in program.tags.slice(0, 4)" :key="index">
                    {{ tag }}
                  </p>
                </div>
                <h3 class="contentH-large">{{ program.price_one }} AED
                  <p class="text-body">Monthly</p>
                </h3>
              </div>
            </div>
          </div>

          <!-- Placeholder for Empty Slots -->
          <div
            v-for="index in additionalSlots"
            :key="'placeholder-' + index"
            class="border-2 border-dashed flex flex-col items-center justify-center border-rafik-sectext bg-rafik-pribg rounded-lg overflow-hidden"
          >
            <p class="text-center header-small uppercase w-1/3">+<br> ADD ANOTHER</p>
            <p class="text-center label text-rafik-sectext w-1/2">Expand your arsenal and revenue potential by adding another program. The review process may take 3 days to a week.</p>
          </div>
        </div>

       </transition>
           <!-- Drafted Program Grid -->
           <transition name="slide-fade">

            <div v-if="activeTab === 'Drafted Programs'" class="grid md:grid-cols-3 gap-8 h-full align-stretch">
              <!-- Existing Programs -->
              <div
                v-for="program in programStore.DraftedPrograms"
                :key="program.id"
                @click="detailsRoute(program.id)"
                class="border-2 group flex flex-col relative border-rafik-sectext hover:border-rafik-secondary hover:cursor-pointer rounded-lg overflow-hidden"
              >
                <img
                  :src="program.program_photo"
                  class="w-full h-full object-cover absolute grayscale group-hover:grayscale-0 transition duration-300"
                  alt=""
                />
                <div class="w-full opacity-70 h-full bg-rafik-pribg absolute"></div>
                <div class="w-full opacity-0 group-hover:opacity-60 h-full bg-gradient-to-t from-rafik-alternate to-50 absolute"></div>
                <div class="p-8 space-y-4 relative flex flex-col items-end">
              <h2 class="subheader-medium flex gap-4 items-center group-hover:text-rafik-pritext">
                Status: {{ program.status}}
              </h2>
            </div>
                <div class="p-8 space-y-4 relative mt-auto">
                  <h3 class="title-small text-rafik-sectext group-hover:text-rafik">
                    {{ program.program_name }}
                  </h3>
                  <div class="h-0 group-hover:h-auto transition opacity-0 group-hover:opacity-100 ease-in space-y-4">
                <p class="text-body group-hover:text-rafik-pritext text-rafik-sectext line-clamp-3">
                  {{ program.program_description }}
                </p>
                <div class="grid grid-cols-2">
                  <!-- Limit to 4 Tags -->
                  <p class="text-body" v-for="(tag, index) in program.tags.slice(0, 4)" :key="index">
                    {{ tag }}
                  </p>
                </div>
              </div>
                </div>
              </div>

              <!-- Placeholder for Empty Slots -->
              <div
                v-for="index in additionalDrafs"
                :key="'placeholder-' + index"
                class="border-2 border-dashed flex flex-col items-center justify-center border-rafik-sectext bg-rafik-pribg rounded-lg overflow-hidden"
              >
                <p class="text-center header-small uppercase w-1/3">+<br> ADD ANOTHER</p>
                <p class="text-center label text-rafik-sectext w-1/2">Expand your arsenal and revenue potential by adding another program. The review process may take 3 days to a week.</p>
              </div>
            </div>

          </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import PageTitle from "@/components/PageTitle.vue";
import { computed, onMounted, ref } from "vue";
import { useProgramStore } from "@/stores/programstores";
import router from "@/router";

const activeTab = ref("Active Program");
const programStore = useProgramStore();

// Compute additional slots to fill up the grid
const additionalSlots = computed(() => {
  const programsCount = programStore.ActivePrograms?.length || 0;
  return Math.max(0, 3 - programsCount);
});
const additionalDrafs = computed(() => {
  const programsCount = programStore.DraftedPrograms?.length || 0;
  return Math.max(0, 3 - programsCount);
});

// Change active tab handler
function setActiveTab(tab: string) {
  activeTab.value = tab;
}
// Route to details
function detailsRoute(id: number){
  router.push({name:'program-details', params:{id:id}})
}
// Fetch programs on component mount
onMounted(() => {
  programStore.getAllPrograms();
});
</script>
