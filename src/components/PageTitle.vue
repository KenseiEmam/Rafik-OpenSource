<script setup lang="ts">
const props = defineProps(['header','subheader'])
</script>
<template>
  <div>
    <h2 class="subheader-medium uppercase">{{props.subheader}}</h2>
    <h1 class="title-small">{{ props.header }}</h1>
  </div>
</template>
