<script setup lang="ts">
const props = defineProps(['header','subheader'])
</script>
<template>
  <div>
    <h2 class="2xl:text-4xl leading-none text-lg subheader-medium uppercase">{{props.subheader}}</h2>
    <h1 class="2xl:text-4xl text-lg title-small">{{ props.header }}</h1>
  </div>
</template>
