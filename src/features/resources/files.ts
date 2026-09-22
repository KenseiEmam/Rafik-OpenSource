import { backend, rpc, rows } from '../../lib/backend'
import type { Database } from '../../lib/database.types'
export type Resource = Database['public']['Tables']['resources']['Row']
export type Share = Database['public']['Tables']['resource_shares']['Row']
export const fileTypes = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png', 'image/webp']
export async function downloadResource(resource: Resource) {
  const { data, error } = await backend.storage
    .from('rafik-private')
    .download(resource.object_path, {}, { cache: 'no-store' })
  if (error) throw error
  const url = URL.createObjectURL(data),
    link = document.createElement('a')
  link.href = url
  link.download = resource.filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export async function deleteResource(resource: Resource) {
  const retired = await rpc<Resource>('retire_resource', {
    p_id: resource.id,
    p_revision: resource.revision,
  })
  const { error } = await backend.storage.from('rafik-private').remove([retired.object_path])
  if (error) throw error
  await rpc('remove_resource_record', { p_id: resource.id })
}
export async function cleanupAccountResources(owner: string) {
  for (const r of await rows<Resource>('resources', 'owner_id', owner)) await deleteResource(r)
}
