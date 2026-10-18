import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  AppState,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { NativeClient, operationId } from './native'
import {
  ApiFailure,
  failureText,
  fieldEvent,
  fieldRoster,
  finishProblems,
  stateText,
  type CachedRoster,
  type Command,
  type EventSnapshot,
  type FieldAttendance,
  type FieldEvent,
  type FieldCommand,
  type Owner,
} from './model'
import type { FieldStore } from './store'
import { AttendanceSync } from './sync'
import { Button, displayDate, localDate, type Styles } from './ui'
import { ScoreEditor } from './ScoreEditor'

export function WorkspaceScreen({
  client,
  store,
  workspace,
  styles,
  closing,
  onPersisting,
}: {
  client: NativeClient
  store: FieldStore
  workspace: string
  styles: Styles
  closing: boolean
  onPersisting: (busy: boolean) => void
}) {
  const [owner] = useState<Owner>(() => ({
    instance: client.instance,
    user: client.user.id,
    workspace,
  }))
  const runner = useRef<AttendanceSync | null>(null)
  const [events, setEvents] = useState<FieldEvent[]>([])
  const [cached, setCached] = useState<CachedRoster[]>([])
  const [queueHead, setQueueHead] = useState<Command | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<EventSnapshot | null>(null)
  const [onlineRoster, setOnlineRoster] = useState<ReturnType<typeof fieldRoster> | null>(null)
  const [next, setNext] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draftSaving, setDraftSaving] = useState(false)
  const [editor, setEditor] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const alive = useRef(true)
  const selectedRef = useRef<string | null>(null)
  const busyRef = useRef(false)
  const savingRef = useRef(false)
  const closingRef = useRef(closing)
  closingRef.current = closing
  const [window] = useState(() => {
    const from = new Date()
    const to = new Date(from)
    to.setDate(to.getDate() + 13)
    return {
      from: localDate(from),
      to: localDate(to),
      zone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    }
  })

  async function reloadLocal() {
    const list = await store.list(owner)
    const id = selectedRef.current
    const detail = id ? await store.snapshot(owner, id) : null
    const head = await store.next(owner)
    if (alive.current) {
      setCached(list)
      setQueueHead(head)
      if (selectedRef.current === id) setSnapshot(detail)
    }
  }
  async function sync() {
    if (!alive.current || closingRef.current) return
    try {
      const startedWithWork = await store.next(owner)
      let finished = false
      await runner.current?.run((completed) => {
        if (completed && alive.current) {
          finished = true
          setEvents((prior) =>
            prior.map((event) => (event.id === completed.event.id ? completed.event : event)),
          )
          if (selectedRef.current === completed.event.id) {
            setOnlineRoster(completed)
            setEditor(null)
          }
        }
        if (alive.current)
          void reloadLocal().catch((e) => {
            if (alive.current) setMessage(failureText(e))
          })
      })
      await reloadLocal()
      if (startedWithWork) {
        const remaining = await store.next(owner)
        if (alive.current)
          setMessage(
            remaining
              ? `${stateText[remaining.state]}. ${remaining.error || ''}`
              : finished
                ? 'Event completed and confirmed by your institution. The device copy was removed.'
                : 'Saved field changes confirmed by your institution.',
          )
      }
    } catch (error) {
      if (alive.current) setMessage(failureText(error))
    }
  }
  async function refresh(offset = 0) {
    if (busyRef.current || closingRef.current) return
    busyRef.current = true
    setBusy(true)
    try {
      const query = new URLSearchParams({ ...window, view: 'trainer', offset: String(offset) })
      const result = await client.request<{ items: unknown[]; next: number | null }>(
        `/workspaces/${workspace}/calendar?${query}`,
      )
      const items = result.items.map(fieldEvent)
      if (!alive.current) return
      setEvents((prior) =>
        offset ? [...prior, ...items.filter((i) => !prior.some((e) => e.id === i.id))] : items,
      )
      setNext(result.next)
      setMessage('Schedule refreshed. Open an event online to save its attendance roster.')
      await sync()
    } catch (error) {
      if (error instanceof ApiFailure && error.status === 403) {
        for (const item of await store.list(owner)) await store.block(owner, item.event.id)
        if (alive.current) {
          setEvents([])
          setNext(null)
        }
        await reloadLocal()
      }
      if (alive.current) setMessage(`${failureText(error)} Previously opened events remain below.`)
    } finally {
      busyRef.current = false
      if (alive.current) setBusy(false)
    }
  }
  useEffect(() => {
    alive.current = true
    const active = new AttendanceSync(store, owner, (path, body) =>
      client.request(path, { method: 'POST', body }),
    )
    runner.current = active
    void reloadLocal()
      .then(() => refresh())
      .catch((e) => {
        if (alive.current) setMessage(failureText(e))
      })
    const foreground = () => {
      if (AppState.currentState === 'active') void sync()
    }
    const subscription = AppState.addEventListener('change', foreground)
    // Retry connectivity return only while active. No background-sync guarantee.
    const timer = setInterval(foreground, 30_000)
    return () => {
      alive.current = false
      active.stop()
      subscription.remove()
      clearInterval(timer)
    }
  }, [])
  useEffect(() => {
    if (closing) runner.current?.stop()
  }, [closing])
  useEffect(() => {
    onPersisting(saving || draftSaving)
  }, [saving, draftSaving, onPersisting])
  useEffect(() => () => onPersisting(false), [onPersisting])

  async function openEvent(id: string) {
    if (busyRef.current || closingRef.current) return
    busyRef.current = true
    setBusy(true)
    setMessage('')
    selectedRef.current = id
    setSelected(id)
    setSnapshot(null)
    setOnlineRoster(null)
    setSearch('')
    setEditor(null)
    try {
      const saved = await store.snapshot(owner, id)
      if (!alive.current || selectedRef.current !== id) return
      setSnapshot(saved)
      if (saved?.commands.some((c) => c.state !== 'acknowledged')) {
        setMessage(
          'Saved changes are shown below. Confirm or resolve them before downloading a newer roster.',
        )
        await sync()
        return
      }
      const data = await client.request<unknown>(
        `/workspaces/${workspace}/calendar?view=trainer&id=${id}&summary=true`,
      )
      if (!alive.current || selectedRef.current !== id) return
      const roster = fieldRoster(data, id)
      await store.saveRoster(owner, roster)
      if (!alive.current || selectedRef.current !== id) return
      setOnlineRoster(roster)
      await reloadLocal()
      setMessage(
        roster.event.state === 'scheduled'
          ? 'Event package saved for field capture on this device.'
          : 'This event is read-only. Its offline roster has been removed.',
      )
    } catch (error) {
      if (error instanceof ApiFailure && error.status === 403) await store.block(owner, id)
      if (alive.current && selectedRef.current === id) {
        await reloadLocal()
        setMessage(failureText(error))
      }
    } finally {
      busyRef.current = false
      if (alive.current) setBusy(false)
    }
  }
  async function record(member: string, value: FieldAttendance) {
    if (!snapshot || savingRef.current || closingRef.current) return
    const person = snapshot.roster.people.find((p) => p.member_id === member)
    if (!person) return
    savingRef.current = true
    setSaving(true)
    setMessage('Saving attendance on this device…')
    try {
      await store.enqueue(owner, {
        action: 'attendance',
        view: 'trainer',
        id: snapshot.roster.event.id,
        member,
        attendance: value,
        revision: person.revision,
        operation: operationId(),
      })
      if (alive.current) {
        await reloadLocal()
        setMessage('Attendance saved on this device. Awaiting institution confirmation.')
      }
      await sync()
    } catch (error) {
      if (alive.current) setMessage(failureText(error))
    } finally {
      savingRef.current = false
      if (alive.current) setSaving(false)
    }
  }
  async function submitCommand(payload: FieldCommand): Promise<boolean> {
    if (savingRef.current || closingRef.current) return false
    savingRef.current = true
    setSaving(true)
    try {
      await store.enqueue(owner, payload)
      if (alive.current) {
        await reloadLocal()
        setMessage(
          payload.action === 'finish'
            ? 'Completion saved on device; waiting for institution confirmation.'
            : 'Scores saved on device; waiting for institution confirmation.',
        )
      }
      await sync()
      return true
    } catch (error) {
      if (alive.current) setMessage(failureText(error))
      return false
    } finally {
      savingRef.current = false
      if (alive.current) setSaving(false)
    }
  }
  function finish() {
    if (!snapshot || savingRef.current || busyRef.current || closingRef.current) return
    const event = snapshot.roster.event
    Alert.alert(
      'Complete this event?',
      'All attendance and assessment results must already be confirmed. Completing clears the saved event package from this device.',
      [
        { text: 'Keep event open', style: 'cancel' },
        {
          text: 'Complete event',
          onPress: () => {
            if (!alive.current || selectedRef.current !== event.id) return
            void submitCommand({
              action: 'finish',
              view: 'trainer',
              id: event.id,
              revision: event.revision,
              operation: operationId(),
            })
          },
        },
      ],
    )
  }
  function removeCopy() {
    const id = selectedRef.current
    if (!id || busyRef.current || savingRef.current || closingRef.current) return
    Alert.alert(
      'Remove saved event from this device?',
      'This permanently discards its pending changes and offline roster on this device. An unconfirmed change may already exist on the server. Server records are not undone.',
      [
        { text: 'Keep saved work', style: 'cancel' },
        {
          text: 'Discard device copy',
          style: 'destructive',
          onPress: () => {
            if (!alive.current || closingRef.current) return
            void store
              .remove(owner, id)
              .then(async () => {
                if (alive.current && selectedRef.current === id) {
                  selectedRef.current = null
                  setSelected(null)
                  setEditor(null)
                  setDraftSaving(false)
                  setSnapshot(null)
                  setOnlineRoster(null)
                  await reloadLocal()
                  setMessage(
                    'Device copy removed. Open the event online to review current server records.',
                  )
                }
              })
              .catch((e) => {
                if (alive.current) setMessage(failureText(e))
              })
          },
        },
      ],
    )
  }

  const roster = snapshot?.roster || onlineRoster
  const pending = snapshot?.commands.filter((c) => c.state !== 'acknowledged') || []
  const paused = pending.some((c) => ['needs_attention', 'blocked'].includes(c.state))
  const workspacePaused = !!queueHead && ['needs_attention', 'blocked'].includes(queueHead.state)
  const finishing = pending.some((c) => c.payload.action === 'finish')
  const completionProblems = roster ? finishProblems(roster) : []
  const list = [
    ...events,
    ...cached.filter((c) => !events.some((e) => e.id === c.event.id)).map((c) => c.event),
  ]
  const filtered =
    roster?.people.filter(
      (p) =>
        p.duty === 'trainee' && p.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    ) || []
  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>
        {selected ? roster?.event.title || 'Event attendance' : 'Coach schedule'}
      </Text>
      {message ? (
        <Text accessibilityLiveRegion="polite" style={styles.message}>
          {message}
        </Text>
      ) : null}
      {workspacePaused && queueHead.event_id !== selected ? (
        <View style={styles.card}>
          <Text style={styles.label}>Saved attendance needs review</Text>
          <Text style={styles.hint}>
            Sending is paused at{' '}
            {cached.find((c) => c.event.id === queueHead.event_id)?.event.title ||
              'an earlier event'}
            . Resolve it before sending more changes.
          </Text>
          <Button
            title="Review saved change"
            disabled={busy || saving || closing}
            onPress={() => void openEvent(queueHead.event_id)}
            styles={styles}
          />
        </View>
      ) : null}
      {!selected ? (
        <>
          <Text style={styles.hint}>
            Upcoming 14 days · {window.zone}. Saved events remain available outside this window.
          </Text>
          <Button
            title={busy ? 'Refreshing…' : 'Refresh schedule and sync'}
            disabled={busy || saving || closing}
            onPress={() => void refresh()}
            styles={styles}
          />
          {list.map((event) => (
            <Pressable
              key={event.id}
              accessibilityRole="button"
              disabled={busy || closing}
              accessibilityLabel={`Open ${event.title}`}
              onPress={() => void openEvent(event.id)}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>{event.title}</Text>
              <Text style={styles.hint}>
                {displayDate(event.starts_at)} · {event.kind} · {event.state}
              </Text>
              {event.location ? <Text style={styles.hint}>{event.location}</Text> : null}
              <Text style={styles.link}>
                {cached.some((c) => c.event.id === event.id)
                  ? 'Saved on this device · Open roster'
                  : 'Open online to save roster'}
              </Text>
            </Pressable>
          ))}
          {next !== null ? (
            <Button
              title="Load more events"
              disabled={busy || closing}
              onPress={() => void refresh(next)}
              styles={styles}
            />
          ) : null}
          {!list.length && !busy ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>No field events to show</Text>
              <Text style={styles.hint}>
                Ask your institution to assign you as event staff. Open the event online before
                heading offline.
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <>
          <Button
            title="Back to schedule"
            disabled={saving || draftSaving || busy || closing}
            onPress={() => {
              selectedRef.current = null
              setSelected(null)
              setSnapshot(null)
              setOnlineRoster(null)
              setSearch('')
              setMessage('')
            }}
            styles={styles}
          />
          {roster ? (
            <>
              <Text style={styles.hint}>
                {displayDate(roster.event.starts_at)} · {roster.event.kind} · {roster.event.state}
              </Text>
              {snapshot ? (
                <Text style={styles.hint}>
                  Roster downloaded {displayDate(snapshot.roster.saved_at)}. Permission is checked
                  again when sending.
                </Text>
              ) : null}
              {snapshot?.roster.blocked ? (
                <Text style={styles.message}>
                  Access blocked. Saved work is retained for explicit review or discard; attendance
                  entry is locked.
                </Text>
              ) : null}
              {paused ? (
                <Text style={styles.message}>
                  Sending is paused. Read the affected athlete’s status. Review current records in
                  the institution web app, then discard this device copy before downloading a fresh
                  roster.
                </Text>
              ) : null}
              <View style={styles.actions}>
                <Button
                  title="Sync saved attendance"
                  disabled={
                    busy ||
                    saving ||
                    closing ||
                    paused ||
                    pending.some((c) => c.state === 'sending')
                  }
                  onPress={() => void sync()}
                  styles={styles}
                  primary
                />
                <Button
                  title="Refresh roster"
                  disabled={
                    busy ||
                    saving ||
                    draftSaving ||
                    closing ||
                    !!pending.length ||
                    !!snapshot?.drafts.length
                  }
                  onPress={() => void openEvent(selected)}
                  styles={styles}
                />
              </View>
              {roster.event.kind === 'assessment' && !roster.definition?.length ? (
                <Text style={styles.message}>
                  This older attendance package has no assessment definition. Resolve saved
                  attendance, then refresh online to enter scores.
                </Text>
              ) : null}
              <TextInput
                accessibilityLabel="Find athlete in this event"
                editable={!draftSaving && !saving}
                placeholder="Find athlete in this event"
                placeholderTextColor={styles.hint.color}
                value={search}
                onChangeText={setSearch}
                style={styles.input}
              />
              <Text style={styles.hint}>
                {roster.people.filter((p) => p.duty === 'trainee').length} athletes in event ·{' '}
                {filtered.length} shown
              </Text>
              {filtered.map((person) => {
                const latest = snapshot?.commands
                  .filter(
                    (c) =>
                      c.payload.action === 'attendance' && c.payload.member === person.member_id,
                  )
                  .at(-1)
                const unsettled = latest && latest.state !== 'acknowledged'
                const value =
                  unsettled && latest.payload.action === 'attendance'
                    ? latest.payload.attendance
                    : person.attendance
                const result = roster.results?.find((r) => r.member_id === person.member_id)
                const resultCommand = snapshot?.commands
                  .filter(
                    (c) => c.payload.action === 'result' && c.payload.member === person.member_id,
                  )
                  .at(-1)
                const queuedResult =
                  resultCommand?.payload.action === 'result' &&
                  resultCommand.state !== 'acknowledged'
                    ? resultCommand.payload
                    : undefined
                const locked =
                  saving ||
                  busy ||
                  closing ||
                  !snapshot ||
                  snapshot.roster.blocked ||
                  workspacePaused ||
                  paused ||
                  finishing ||
                  !!queuedResult ||
                  draftSaving ||
                  !!unsettled ||
                  roster.event.state !== 'scheduled' ||
                  Date.parse(roster.event.starts_at) > Date.now() ||
                  !person.active
                return (
                  <View key={person.member_id} style={styles.card}>
                    <Text style={styles.cardTitle}>{person.name}</Text>
                    <Text style={styles.label}>Attendance: {value}</Text>
                    <Text accessibilityLiveRegion="polite" style={styles.hint}>
                      {latest ? stateText[latest.state] : 'Downloaded server attendance'}
                    </Text>
                    {latest?.error ? <Text style={styles.message}>{latest.error}</Text> : null}
                    {!person.active ? (
                      <Text style={styles.hint}>Inactive athlete — entry unavailable</Text>
                    ) : null}
                    <View style={styles.actions}>
                      {(['present', 'absent', 'excused'] as const).map((mark) => (
                        <Button
                          key={mark}
                          title={mark.charAt(0).toUpperCase() + mark.slice(1)}
                          styles={styles}
                          primary={value === mark}
                          disabled={locked || value === mark}
                          onPress={() => void record(person.member_id, mark)}
                        />
                      ))}
                    </View>
                    {roster.event.kind === 'assessment' ? (
                      <>
                        {result ? (
                          <View style={{ gap: 6 }}>
                            <Text style={styles.label}>
                              Confirmed assessment · revision {result.revision}
                            </Text>
                            {roster.definition?.map((drill) => (
                              <Text key={drill.key} style={styles.hint}>
                                {drill.name}: {result.values[drill.key] ?? 'Not recorded'}
                                {drill.unit ? ` ${drill.unit}` : ''}
                              </Text>
                            ))}
                            {result.note ? (
                              <Text style={styles.hint}>Assessor note: {result.note}</Text>
                            ) : null}
                          </View>
                        ) : null}
                        {resultCommand ? (
                          <Text style={styles.hint}>
                            Scores: {stateText[resultCommand.state]}
                            {resultCommand.error ? ` · ${resultCommand.error}` : ''}
                          </Text>
                        ) : null}
                        {snapshot?.drafts.some((d) => d.member === person.member_id) ? (
                          <Text style={styles.hint}>Score draft saved on device</Text>
                        ) : null}
                        {roster.definition?.length &&
                        (value === 'present' ||
                          result ||
                          queuedResult ||
                          snapshot?.drafts.some((d) => d.member === person.member_id)) ? (
                          <Button
                            title={
                              editor === person.member_id
                                ? 'Scores editor open'
                                : queuedResult
                                  ? 'Review saved scores'
                                  : result
                                    ? 'Review / correct scores'
                                    : 'Record assessment scores'
                            }
                            disabled={
                              editor === person.member_id ||
                              saving ||
                              draftSaving ||
                              busy ||
                              closing
                            }
                            onPress={() => setEditor(person.member_id)}
                            styles={styles}
                          />
                        ) : null}
                        {editor === person.member_id && snapshot && roster.definition?.length ? (
                          <ScoreEditor
                            key={`${roster.event.id}:${person.member_id}:${result?.revision || 0}`}
                            owner={owner}
                            event={roster.event.id}
                            member={person.member_id}
                            name={person.name}
                            definition={roster.definition}
                            result={result}
                            queuedResult={queuedResult}
                            savedDraft={snapshot.drafts.find((d) => d.member === person.member_id)}
                            store={store}
                            styles={styles}
                            locked={
                              saving ||
                              busy ||
                              closing ||
                              snapshot.roster.blocked ||
                              workspacePaused ||
                              paused ||
                              finishing ||
                              !!queuedResult ||
                              !person.active ||
                              value !== 'present' ||
                              roster.event.state !== 'scheduled' ||
                              Date.parse(roster.event.starts_at) > Date.now()
                            }
                            onPersisting={setDraftSaving}
                            onDraftSaved={async (discarded) => {
                              await reloadLocal()
                              const latest = await store.snapshot(owner, roster.event.id)
                              if (
                                alive.current &&
                                (discarded ||
                                  latest?.drafts.some((d) => d.member === person.member_id))
                              )
                                setMessage(
                                  discarded
                                    ? `Score draft for ${person.name} discarded from this device.`
                                    : `Score draft for ${person.name} saved on this device. Submit it to confirm the result.`,
                                )
                            }}
                            onError={(message) => {
                              if (alive.current) setMessage(message)
                            }}
                            onSubmit={submitCommand}
                            onClose={() => setEditor(null)}
                          />
                        ) : null}
                      </>
                    ) : null}
                  </View>
                )
              })}
              {!filtered.length ? (
                <Text style={styles.hint}>
                  {search ? 'No athletes match this name.' : 'This event has no athletes.'}
                </Text>
              ) : null}
              {snapshot && roster.event.state === 'scheduled' ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Complete event</Text>
                  {completionProblems.map((problem) => (
                    <Text key={problem} style={styles.hint}>
                      {problem}
                    </Text>
                  ))}
                  {pending.length ? (
                    <Text style={styles.hint}>
                      {pending.length} saved change(s) awaiting confirmation.
                    </Text>
                  ) : null}
                  {snapshot.drafts.length ? (
                    <Text style={styles.hint}>
                      Submit or discard {snapshot.drafts.length} score draft(s) before completing.
                    </Text>
                  ) : null}
                  <Button
                    title={finishing ? 'Completion waiting for confirmation' : 'Complete event'}
                    onPress={finish}
                    styles={styles}
                    primary
                    disabled={
                      busy ||
                      saving ||
                      draftSaving ||
                      closing ||
                      workspacePaused ||
                      snapshot.roster.blocked ||
                      !!pending.length ||
                      !!snapshot.drafts.length ||
                      !!completionProblems.length ||
                      Date.parse(roster.event.starts_at) > Date.now()
                    }
                  />
                </View>
              ) : null}
              {snapshot ? (
                <Button
                  title="Remove device copy / discard pending work"
                  disabled={busy || saving || closing || pending.some((c) => c.state === 'sending')}
                  onPress={removeCopy}
                  styles={styles}
                />
              ) : null}
            </>
          ) : busy ? (
            <ActivityIndicator accessibilityLabel="Opening event roster" />
          ) : (
            <Text style={styles.hint}>
              No offline roster exists. Connect to your institution and reopen this event.
            </Text>
          )}
        </>
      )}
      <Text style={styles.hint}>
        Only this account’s explicitly opened rosters are stored on this device. Sync runs while the
        app is active.
      </Text>
    </ScrollView>
  )
}
