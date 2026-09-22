import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
const url = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:55321'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const hostname = new URL(url).hostname
if (url.includes('pexviywnztvqomfosvho'))
  throw new Error('The retired backend cannot be used by the revamp.')
export const localPreview =
  import.meta.env.DEV &&
  import.meta.env.VITE_LOCAL_PREVIEW === 'true' &&
  ['127.0.0.1', 'localhost'].includes(hostname)
export const configured = Boolean(key)
export const backend = createClient(url, key || 'local-configuration-required', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'rafik-revamp-auth',
  },
})
export async function rpc<T>(
  name: keyof Database['public']['Functions'],
  args: Record<string, unknown> = {},
) {
  const { data, error } = await backend.rpc(name, args)
  if (error) throw error
  return data as T
}
export async function rows<T>(
  table: Exclude<keyof Database['public']['Tables'], 'set_entries' | 'session_operations'>,
  column?: string,
  value?: string,
) {
  const collected: T[] = []
  // PostgREST caps each response. Read stable pages so older history is not silently omitted.
  for (let offset = 0; ; offset += 500) {
    let query = backend
      .from(table)
      .select('*')
      .order('id')
      .range(offset, offset + 499)
    if (column && value !== undefined) query = query.eq(column, value)
    const { data, error } = await query
    if (error) throw error
    collected.push(...((data || []) as T[]))
    if (!data || data.length < 500) return collected
  }
}
