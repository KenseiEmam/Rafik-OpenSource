<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const cards = [{text:'Schools & Clubs',page:'organizations',img:'https://images.unsplash.com/photo-1638149055389-05cd7b2fac2f?q=80&w=3871&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},{text:'Coaches',page:'coaches',img:'https://images.unsplash.com/photo-1529932398402-e0b30f66a559?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},{text:'Athletes',page:'athletes',img:'https://images.unsplash.com/photo-1526676317768-d9b14f15615a?q=80&w=3987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}]
const { t , locale } = useI18n();
</script>

<template>
  <div
    class="border-rafik-secondary w-full  items-center w-full my-3 flex-1 mb-16 relative items-stretch overflow-hidden"
  >

    <div class="col-span-3 relative space-y-4">
      <h3 class=" text-2xl md:text-4xl 2xl:text-5xl md:header-large">
     Learn How <span class="text-rafik font-black">Rafik</span> Helps
      </h3>
      <div class="grid md:grid-cols-3 h-96 2xl:h-128 align-stretch w-full text-body text-rafik-pritext dark:text-rafik-darkpritext">
              <router-link :to="{name:card.page}" v-for="card in cards"
        class="border group flex flex-col cursor-pointer relative border-rafik-darksectext hover:border-rafik-secondary h-full  overflow-hidden p-0"
      >
            <img
              :src="card.img"
              class="w-full h-full scale-150 group-hover:scale-100 object-cover absolute grayscale group-hover:grayscale-0 transition duration-300"
              alt=""
            />
            <div
              class="w-full opacity-70 h-full bg-rafik-pribg dark:bg-rafik-darkpribg absolute"
            ></div>
            <div
              class="w-full opacity-0 group-hover:opacity-60 h-full bg-gradient-to-t from-white dark:from-rafik-alternate to-50 absolute"
            ></div>
        <div
          class="p-8 2xl:p-16 h-full relative flex flex-col"
        >
          <h3 class="header-medium opacity-40 group-hover:opacity-100 italic mt-auto group-hover:mb-auto 2xl:header-medium group-hover:title-medium group-hover:-rotate-90 transform origin-bottom">{{ card.text }}</h3>
      </div>
      </router-link>
    </div>
    </div>
  </div>
</template>
<style scoped>
li::marker {
  color: #d7bd21;
}
</style>
