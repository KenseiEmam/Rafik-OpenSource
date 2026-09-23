import { shallowRef, ref } from 'vue'
import { api, configured, rpc, request, type ApiUser } from '../lib/backend'
import type { Profile } from '../lib/domain'
import type { Context } from '../features/organizations/types'
import { locale } from '../lib/i18n'
export const user = shallowRef<ApiUser | null>(null)
export const profile = ref<Profile | null>(null)
export const contexts = ref<Context[]>([])
export async function refreshContexts() {
  const id = user.value?.id
  if (!id) {
    contexts.value = []
    return
  }
  const data = await request<{ contexts: Context[] }>('/v1/contexts')
  if (user.value?.id === id) contexts.value = data.contexts
}
let init: Promise<void> | undefined
export async function refreshProfile() {
  if (!user.value) {
    profile.value = null
    contexts.value = []
    return
  }
  const id = user.value.id
  const p = await rpc<Profile>('ensure_profile', {
    p_name: user.value.user_metadata?.display_name || null,
    p_locale: locale.value,
    p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  })
  if (user.value?.id === id) {
    profile.value = p
    await refreshContexts()
  }
}
export function ready() {
  return (init ||= (async () => {
    if (!configured) return
    user.value = await api.session().catch(() => null)
    if (user.value) await refreshProfile().catch(() => {})
    api.onSession((current) => {
      const changed = user.value?.id !== current?.id
      user.value = current
      if (changed) {
        profile.value = null
        contexts.value = []
        setTimeout(() => void refreshProfile().catch(() => {}), 0)
      }
    })
  })())
}
export async function logout() {
  await api.logout()
  user.value = null
  profile.value = null
  contexts.value = []
}
