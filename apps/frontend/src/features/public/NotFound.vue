<script setup lang="ts">
import { language } from '../../lib/i18n'
</script>
<template>
  <div class="container page empty-state empty-state--centered">
    <p class="overline">404</p>
    <h1>{{ language('That page isn’t here.', 'هذه الصفحة غير موجودة.') }}</h1>
    <p>
      {{
        language(
          'Return to Rafik to continue in your workspace.',
          'عد إلى رفيق للمتابعة في مساحة عملك.',
        )
      }}
    </p>
    <RouterLink class="button" to="/">{{
      language('Return to Rafik', 'العودة إلى رفيق')
    }}</RouterLink>
  </div>
</template>
