import { removeFile, rpc, rows } from '../../lib/backend'
import type { Database } from '@rafik/shared/database.types'
type Resource = Database['public']['Tables']['resources']['Row']
// Account deletion must also remove historical standalone resources. This is not a second Resources UI.
export async function deleteResource(resource: Resource) {
  const retired = await rpc<Resource>('retire_resource', {
    p_id: resource.id,
    p_revision: resource.revision,
  })
  await removeFile(retired.object_path)
  await rpc('remove_resource_record', { p_id: resource.id })
}
export async function cleanupAccountResources(owner: string) {
  for (const r of await rows<Resource>('resources', 'owner_id', owner)) await deleteResource(r)
}
