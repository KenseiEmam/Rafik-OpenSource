import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/** Keep requested sizing in the URL; ranges change only when rows are accepted. */
export function useListPageSize(fallback: number, reload: () => void) {
  const route = useRoute(),
    router = useRouter()
  const pageSizes = fallback === 24 || fallback === 12 ? [12, 24, 48, 96] : [10, 25, 50, 100]
  const recordLimit = computed(() => {
    const n = Number(route.query.limit)
    return pageSizes.includes(n) ? n : fallback
  })
  const appliedLimit = ref(recordLimit.value)
  const acceptLimit = () => {
    appliedLimit.value = recordLimit.value
  }
  watch(
    () => route.query.limit,
    () => reload(),
  )
  const changeLimit = (limit: number) =>
    router.replace({ query: { ...route.query, limit: String(limit), offset: undefined } })
  return { recordLimit, appliedLimit, pageSizes, acceptLimit, changeLimit }
}
