import type { CoachingRequest, ProgressSession } from './types'
export function responseState(q: CoachingRequest, today: string) {
  return q.cancelled
    ? 'cancelled'
    : q.reviewed_at
      ? 'reviewed'
      : q.submitted_at
        ? 'submitted'
        : q.due_date < today
          ? 'overdue'
          : 'due'
}
export function exerciseTrend(sessions: ProgressSession[], exercise: string) {
  return sessions.flatMap((s) => {
    const matches = s.exercises.filter((e) => e.id === exercise)
    return ['strength', 'timed', 'distance'].flatMap((kind) => {
      const sets = matches.filter((e) => e.kind === kind).flatMap((e) => e.sets)
      if (!sets.length) return []
      const value =
        kind === 'timed'
          ? Math.max(...sets.map((x) => x.seconds || 0))
          : kind === 'distance'
            ? Math.max(...sets.map((x) => x.metres || 0))
            : Math.max(...sets.map((x) => x.load * (x.unit === 'lb' ? 0.45359237 : 1)))
      return [
        {
          id: s.id,
          date: s.date,
          kind,
          value: Math.round(value * 100) / 100,
          sets: sets.length,
          reps: sets.reduce((n, x) => n + x.reps, 0),
        },
      ]
    })
  })
}

// PostgREST SQL/validation errors confirm that the command transaction was rejected.
// Transport errors have no SQL code: preserve their exact command for replay.
export function commandRejected(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    /^(P0001|22|23|42501|PGRST)/.test(String(error.code))
  )
}
