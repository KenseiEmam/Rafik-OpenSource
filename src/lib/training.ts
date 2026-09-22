import { backend, rpc } from './backend'
import { clone, type Session, type LocalSession, type PlanDay } from './domain'
import {
  editLocalSession,
  event,
  getLocalSession,
  localSessions,
  putLocalSession,
  storeDraft,
  getDraft,
  removeDraft,
} from './storage'
const syncing = new Map<string, Promise<LocalSession | undefined>>()
export async function startWorkout(
  day: PlanDay,
  title: string,
  versionId: string,
  owner: string,
  assignmentId?: string,
  scheduledDate?: string,
) {
  const existing = (await localSessions(owner)).find(
    (x) =>
      x.session.status === 'in_progress' &&
      x.session.version_id === versionId &&
      x.session.day_id === day.id &&
      x.session.assignment_id === (assignmentId || null) &&
      (!assignmentId || x.session.occurrence_key === `${assignmentId}:${scheduledDate}:${day.id}`),
  )
  if (existing) return existing
  const startKey = `start:${owner}:${assignmentId || versionId}:${day.id}:${scheduledDate || 'flexible'}`
  const id = (await getDraft<string>(startKey)) || crypto.randomUUID()
  await storeDraft(startKey, id)
  let session: Session
  if (owner === 'guest')
    session = {
      id,
      client_id: 'guest',
      coach_id: null,
      assignment_id: null,
      version_id: versionId,
      day_id: day.id,
      title,
      prescription: clone(day),
      status: 'in_progress',
      entries: day.exercises.flatMap((e) =>
        Array.from({ length: e.sets }, (_, i) => ({
          exercise_key: e.key,
          set_index: i,
          reps: e.reps,
          load: e.load,
          unit: e.unit,
          completed: false,
        })),
      ),
      note: '',
      coach_note: '',
      reviewed_at: null,
      started_at: new Date().toISOString(),
      completed_at: null,
      version: 1,
    }
  else
    session = await rpc<Session>('start_session', {
      p_id: id,
      p_version_id: versionId,
      p_day_id: day.id,
      p_assignment_id: assignmentId || null,
      p_scheduled_date: scheduledDate || null,
    })
  const current = await getLocalSession(session.id)
  if (current?.owner === owner) return current
  const row: LocalSession = {
    id: session.id,
    owner,
    session,
    localRevision: 0,
    syncedRevision: 0,
    updatedAt: new Date().toISOString(),
  }
  await putLocalSession(row)
  await removeDraft(startKey)
  await event('session_started', session.id)
  return row
}
export async function loadWorkout(id: string, owner: string) {
  const local = await getLocalSession(id)
  if (local && (local.owner === owner || local.owner === 'guest')) {
    if (
      local.owner === 'guest' ||
      local.pending ||
      local.localRevision > local.syncedRevision ||
      !navigator.onLine
    )
      return local
    try {
      const remote = await rpc<Session | null>('session_document', { p_id: id })
      if (remote?.client_id === owner)
        return editLocalSession(id, (current) => {
          // Another tab may have edited while this read was in flight.
          if (
            !current.pending &&
            current.localRevision === local.localRevision &&
            current.syncedRevision === local.syncedRevision
          )
            current.session = remote
        })
    } catch {
      /* Offline work remains readable. */
    }
    return local
  }
  if (owner === 'guest') throw new Error('unauthenticated')
  const session = await rpc<Session | null>('session_document', { p_id: id })
  if (!session) throw new Error('forbidden')
  // Coach review reads server data separately; this is the client's editing store.
  if (session.client_id !== owner) throw new Error('forbidden')
  return putLocalSession({
    id,
    owner,
    session,
    localRevision: 0,
    syncedRevision: 0,
    updatedAt: new Date().toISOString(),
  })
}
export async function changeWorkout(id: string, fn: (s: Session) => void) {
  const row = await editLocalSession(id, (r) => {
    fn(r.session)
    r.localRevision++
    r.syncError = undefined
  })
  await event(
    row.session.status === 'completed' ? 'session_completed_local' : 'set_saved_local',
    id,
  )
  return row
}
export async function syncWorkout(id: string, owner: string) {
  if (owner === 'guest') return getLocalSession(id)
  if (syncing.has(id)) return syncing.get(id)!
  const run = async () => {
    let row = await getLocalSession(id)
    while (
      row &&
      row.owner === owner &&
      !row.conflict &&
      (row.pending || row.localRevision > row.syncedRevision)
    ) {
      if (!navigator.onLine) return row
      const { data } = await backend.auth.getSession()
      if (data.session?.user.id !== owner) return row
      if (!row.pending)
        row = await editLocalSession(id, (r) => {
          r.pending = {
            id: crypto.randomUUID(),
            expectedVersion: r.session.version,
            entries: clone(r.session.entries),
            note: r.session.note,
            complete: r.session.status === 'completed',
            localRevision: r.localRevision,
          }
        })
      const op = row.pending!
      try {
        const result = await rpc<Session>('save_session', {
          p_id: id,
          p_expected_version: op.expectedVersion,
          p_operation_id: op.id,
          p_entries: op.entries,
          p_note: op.note,
          p_complete: op.complete,
        })
        row = await editLocalSession(id, (r) => {
          if (r.pending?.id !== op.id) return
          r.session.version = result.version
          r.session.coach_note = result.coach_note
          r.session.reviewed_at = result.reviewed_at
          r.session.completed_at = result.completed_at || r.session.completed_at
          r.syncedRevision = op.localRevision
          r.pending = undefined
          r.syncError = undefined
        })
        if (result.status === 'completed') await event('session_synced', id)
      } catch (error) {
        const message = (error as { message?: string }).message || 'network_error'
        row = await editLocalSession(id, (r) => {
          r.syncError = message
          r.conflict = message.includes('conflict') || message.includes('operation_reused')
        })
        return row
      }
    }
    return row
  }
  const task = Promise.resolve(
    navigator.locks ? navigator.locks.request('rafik-sync:' + id, run) : run(),
  )
  syncing.set(id, task)
  try {
    return await task
  } finally {
    syncing.delete(id)
  }
}
export async function adoptGuest(id: string, owner: string) {
  const row = await getLocalSession(id)
  if (!row || row.owner !== 'guest') throw new Error('invalid_session')
  const remote = await rpc<Session>('start_session', {
    p_id: id,
    p_version_id: row.session.version_id,
    p_day_id: row.session.day_id,
  })
  await editLocalSession(id, (r) => {
    r.owner = owner
    r.session.client_id = owner
    r.session.version = remote.version
    r.localRevision++
    r.pending = undefined
  })
  return syncWorkout(id, owner)
}
export async function reloadServerSession(id: string, owner: string) {
  const previous = await getLocalSession(id)
  if (!previous || previous.owner !== owner) throw new Error('forbidden')
  const remote = await rpc<Session>('session_document', { p_id: id })
  await storeDraft('conflict-backup:' + owner + ':' + id, previous)
  return putLocalSession({
    id,
    owner,
    session: remote,
    localRevision: 0,
    syncedRevision: 0,
    updatedAt: new Date().toISOString(),
  })
}
export async function syncPending(owner: string) {
  for (const row of await localSessions(owner)) await syncWorkout(row.id, owner)
}
