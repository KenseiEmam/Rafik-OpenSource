import { onMounted, reactive } from 'vue'
import { user } from '../../app/auth'
import { rpc } from '../../lib/backend'
import type { Database } from '../../lib/database.types'
import { getDraft, storeDraft, removeDraft } from '../../lib/storage'
import { errorMessage, language as l } from '../../lib/i18n'
import { commandRejected } from '../ongoing/helpers'
type Name = keyof Database['public']['Functions']
type Pending = { name: Name; args: Record<string, unknown> }
// One explicit user command, persisted before dispatch. This is not a background queue.
export function useCommand(
  scope: string,
  after: (name: Name, result: unknown, args: Record<string, unknown>) => Promise<void>,
) {
  const key = `r4-command:${user.value!.id}:${scope}`
  const state = reactive({
    ready: false,
    busy: false,
    pending: null as Pending | null,
    error: '',
    notice: '',
  })
  onMounted(async () => {
    try {
      state.pending = (await getDraft<Pending>(key)) || null
    } catch (e) {
      state.error = errorMessage(e)
    } finally {
      state.ready = true
    }
  })
  async function run(name?: Name, args: Record<string, unknown> = {}) {
    if (state.busy || !state.ready) return
    state.busy = true
    state.error = ''
    state.notice = ''
    try {
      if (!state.pending && name)
        state.pending = JSON.parse(JSON.stringify({ name, args })) as Pending
      if (!state.pending) return
      await storeDraft(key, state.pending)
      const pending = state.pending
      const result = await rpc(pending.name, pending.args)
      await after(pending.name, result, pending.args)
      await removeDraft(key)
      state.pending = null
      state.notice = l('Saved.', 'تم الحفظ.')
    } catch (e) {
      if (commandRejected(e)) {
        state.pending = null
        await removeDraft(key)
      }
      state.error = errorMessage(e)
    } finally {
      state.busy = false
    }
  }
  return { state, run }
}
