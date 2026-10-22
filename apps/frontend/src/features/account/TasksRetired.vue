<script setup lang="ts">
import { language as l } from '../../lib/i18n'
</script>
<template>
  <div class="container page narrow">
    <h1>{{ l('Tasks has been retired', 'تم إيقاف المهام') }}</h1>
    <p>
      {{
        l(
          'Task management is no longer part of Rafik. Your programs, workouts and schedule remain available.',
          'لم تعد إدارة المهام جزءاً من رفيق. تظل برامجك وتمارينك وجدولك متاحة.',
        )
      }}
    </p>
    <RouterLink class="button" to="/dashboard">{{
      l('Open dashboard', 'فتح لوحة التحكم')
    }}</RouterLink>
  </div>
</template>
