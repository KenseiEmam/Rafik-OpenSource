import type { ApiErrorBody, ApiUser } from '@rafik/shared/contracts'
import type { Database } from '@rafik/shared/database.types'
export type { ApiUser } from '@rafik/shared/contracts'
const url =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:55331' : '/api')
if (url.includes('pexviywnztvqomfosvho')) throw new Error('The retired backend cannot be used.')
export const configured = Boolean(url)
export const localPreview =
  import.meta.env.DEV &&
  import.meta.env.VITE_LOCAL_PREVIEW === 'true' &&
  ['127.0.0.1', 'localhost'].includes(new URL(url).hostname)
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
  }
}
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url + path, {
    ...options,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'x-rafik-client': 'web',
      ...(options.body instanceof Blob ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  })
  if (!response.ok) {
    const error = await response
      .json()
      .catch((): ApiErrorBody => ({ message: 'service_unavailable' }))
    throw new ApiError(response.status, error.message)
  }
  return response.json() as Promise<T>
}
const listeners = new Set<(user: ApiUser | null) => void>()
const channel =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('rafik-session') : null
function changed(user: ApiUser | null, broadcast = true) {
  if (user) localStorage.setItem('rafik.cached-user', JSON.stringify(user))
  else localStorage.removeItem('rafik.cached-user')
  listeners.forEach((fn) => fn(user))
  if (broadcast) channel?.postMessage(user)
}
if (channel) channel.onmessage = (event) => changed(event.data, false)
export const api = {
  async session() {
    try {
      const result = await request<{ user: ApiUser | null }>('/v1/auth/session')
      changed(result.user, false)
      return result.user
    } catch (e) {
      if (!navigator.onLine) {
        try {
          return JSON.parse(localStorage.getItem('rafik.cached-user') || 'null') as ApiUser | null
        } catch {
          return null
        }
      }
      throw e
    }
  },
  onSession(fn: (user: ApiUser | null) => void) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  requestCode(email: string) {
    return request('/v1/auth/request-code', { method: 'POST', body: JSON.stringify({ email }) })
  },
  async verifyCode(email: string, token: string) {
    const result = await request<{ user: ApiUser }>('/v1/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, token }),
    })
    changed(result.user)
    return result.user
  },
  async preview(email: string) {
    if (!localPreview) throw new ApiError(403, 'forbidden')
    const result = await request<{ user: ApiUser }>('/v1/auth/local-preview', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
    changed(result.user)
    return result.user
  },
  async logout() {
    await request('/v1/auth/logout', { method: 'POST', body: '{}' })
    changed(null)
  },
}
export async function rpc<T>(
  name: keyof Database['public']['Functions'],
  args: Record<string, unknown> = {},
) {
  return request<T>('/v1/commands/' + name, { method: 'POST', body: JSON.stringify(args) })
}
export async function rows<T>(
  table: Exclude<keyof Database['public']['Tables'], 'set_entries' | 'session_operations'>,
  column?: string,
  value?: string,
) {
  const collected: T[] = []
  for (let offset = 0; ; offset += 500) {
    const parameters = new URLSearchParams({ offset: String(offset), limit: '500' })
    if (column && value !== undefined) {
      parameters.set('column', column)
      parameters.set('value', value)
    }
    const data = await request<T[]>('/v1/queries/' + table + '?' + parameters)
    collected.push(...data)
    if (data.length < 500) return collected
  }
}
export async function uploadFile(path: string, file: File, type: string) {
  return request('/v1/files/' + encodeURIComponent(path), {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': type },
  })
}
export async function downloadFile(path: string) {
  const response = await fetch(url + '/v1/files/' + encodeURIComponent(path), {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!response.ok) throw new ApiError(response.status, 'resource_unavailable')
  return response.blob()
}
export function removeFile(path: string) {
  return request('/v1/files/' + encodeURIComponent(path), { method: 'DELETE' })
}

export const programImage = (id: string) => url + '/v1/program-media/' + encodeURIComponent(id)
