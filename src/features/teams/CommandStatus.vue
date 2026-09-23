<script setup lang="ts">
import { language as l } from '../../lib/i18n'
import type { useCommand } from './commands'
defineProps<{ command: ReturnType<typeof useCommand> }>()
</script>
<template>
  <p v-if="command.state.error" class="notice error" role="alert">{{ command.state.error }}</p>
  <p v-if="command.state.notice" class="notice success" role="status">{{ command.state.notice }}</p>
  <div v-if="command.state.pending" class="notice">
    <p>
      {{
        l(
          'The last change is not confirmed. Retry the saved request before making another change.',
          'لم يتأكد آخر تعديل. أعد محاولة الطلب المحفوظ قبل إجراء تعديل آخر.',
        )
      }}
    </p>
    <button class="button small" :disabled="command.state.busy" @click="command.run()">
      {{ l('Retry saved change', 'إعادة محاولة التعديل المحفوظ') }}
    </button>
  </div>
</template>
