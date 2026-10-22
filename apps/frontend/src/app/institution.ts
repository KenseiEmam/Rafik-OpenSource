import { computed } from 'vue'
import { contexts } from './auth'
export const institution = computed(() => contexts.value.find((c) => c.kind === 'organization'))
export function institutionContext() {
  const current = institution.value
  return { workspace: current?.workspace_id || '', view: current?.role || '', base: '' }
}
