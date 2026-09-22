import { shallowRef, ref } from 'vue'
import type { User } from '@supabase/supabase-js'
import { backend, configured, rpc } from '../lib/backend'
import type { Profile } from '../lib/domain'
import { locale } from '../lib/i18n'
export const user = shallowRef<User | null>(null)
export const profile = ref<Profile | null>(null)
let init: Promise<void> | undefined
export async function refreshProfile() {
  if (!user.value) {
    profile.value = null
    return
  }
  const id = user.value.id
  const p = await rpc<Profile>('ensure_profile', {
    p_name: user.value.user_metadata?.display_name || null,
    p_locale: locale.value,
    p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  })
  if (user.value?.id === id) profile.value = p
}
export function ready() {
  return (init ||= (async () => {
    if (!configured) return
    const { data } = await backend.auth.getSession()
    user.value = data.session?.user || null
    if (user.value) await refreshProfile().catch(() => {})
    backend.auth.onAuthStateChange((_event, session) => {
      const changed = user.value?.id !== session?.user?.id
      user.value = session?.user || null
      if (changed) {
        profile.value = null
        setTimeout(() => void refreshProfile().catch(() => {}), 0)
      }
    })
  })())
}
export async function logout() {
  const { error } = await backend.auth.signOut()
  if (error) throw error
  user.value = null
  profile.value = null
}
