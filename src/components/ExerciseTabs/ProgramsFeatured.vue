<template>
  <div></div>
</template>
<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const { t , locale } = useI18n();
// Props to receive the program object
const props = defineProps({
  exercise: {
    type: Object,
    required: true
  }
});
</script>
