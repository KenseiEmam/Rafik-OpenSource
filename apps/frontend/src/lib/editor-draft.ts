import { getDraft, storeDraft, removeDraft } from './storage'

/** Move a pre-route draft only after its new record-scoped copy is durable. */
export async function loadEditorDraft<T extends { id: string; revision?: number }>(
  baseKey: string,
  editor: string,
): Promise<T | undefined> {
  const key = baseKey + ':' + (editor || 'new')
  const stored = await getDraft<T>(key)
  if (stored) return stored
  const legacy = await getDraft<T>(baseKey)
  if (!legacy) return undefined
  const target = legacy.revision ? legacy.id : 'new'
  if (editor && target !== editor) return undefined
  await storeDraft(baseKey + ':' + target, legacy)
  await removeDraft(baseKey)
  return legacy
}
