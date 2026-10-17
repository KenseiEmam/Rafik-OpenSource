<script setup lang="ts">
import { language, t } from '../../lib/i18n'
</script>
<template>
  <div class="container page empty-state empty-state--centered">
    <p class="overline">404</p>
    <h1>{{ language('That page isn’t here.', 'هذه الصفحة غير موجودة.') }}</h1>
    <p>
      {{ language('Your next workout is still within reach.', 'تمرينك القادم ما زال في متناولك.') }}
    </p>
    <RouterLink class="button" to="/routine">{{ t('sample') }}</RouterLink>
  </div>
</template>
