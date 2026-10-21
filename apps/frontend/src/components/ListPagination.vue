<script setup lang="ts">
import { computed } from 'vue'
import { language as l, locale } from '../lib/i18n'
const props = defineProps<{
  offset: number
  pageSize: number
  total: number
  disabled?: boolean
  label?: string
}>()
const emit = defineEmits<{ page: [offset: number] }>()
const page = computed(() => Math.floor(props.offset / props.pageSize) + 1),
  pages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
</script>
<template>
  <nav
    class="list-pagination"
    :dir="locale === 'ar' ? 'rtl' : 'ltr'"
    :aria-label="label || l('Pagination', 'التنقل بين الصفحات')"
  >
    <span dir="ltr" class="pagination-range" aria-live="polite"
      >{{ total ? offset + 1 : 0 }}–{{ Math.min(offset + pageSize, total) }} / {{ total }}</span
    ><button
      type="button"
      class="pagination-button"
      :disabled="disabled || offset === 0"
      :aria-label="l('Previous page', 'الصفحة السابقة')"
      @click="emit('page', Math.max(0, offset - pageSize))"
    >
      <svg
        viewBox="0 0 20 20"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        aria-hidden="true"
      >
        <path :d="locale === 'ar' ? 'm7 4 6 6-6 6' : 'm13 4-6 6 6 6'" />
      </svg></button
    ><span class="pagination-page"
      >{{ l('Page', 'صفحة') }} <bdi dir="ltr">{{ page }} / {{ pages }}</bdi></span
    ><button
      type="button"
      class="pagination-button"
      :disabled="disabled || offset + pageSize >= total"
      :aria-label="l('Next page', 'الصفحة التالية')"
      @click="emit('page', offset + pageSize)"
    >
      <svg
        viewBox="0 0 20 20"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        aria-hidden="true"
      >
        <path :d="locale === 'ar' ? 'm13 4-6 6 6 6' : 'm7 4 6 6-6 6'" />
      </svg>
    </button>
  </nav>
</template>
<style scoped>
.list-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 0.82rem;
  flex-shrink: 0;
}
.pagination-range {
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  margin-inline-end: 6px;
}
.pagination-page {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.pagination-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  min-height: 40px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
}
.pagination-button:disabled {
  opacity: 0.45;
  cursor: default;
}
@media (max-width: 540px) {
  .list-pagination {
    justify-content: flex-start;
    gap: 6px;
  }
}
</style>
