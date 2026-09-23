import { describe, it, expect } from 'vitest'
import { commandRejected, exerciseTrend, responseState } from '../src/features/ongoing/helpers'
import type { ProgressSession, CoachingRequest } from '../src/features/ongoing/types'
describe('progress interpretation', () => {
  it('distinguishes rejected commands from unknown delivery', () => {
    expect(commandRejected({ statusCode: 400, message: 'invalid_context' })).toBe(true)
    expect(commandRejected({ statusCode: 503, message: 'service_unavailable' })).toBe(false)
    expect(commandRejected(new Error('offline'))).toBe(false)
  })
  it('converts completed weights and keeps duration separate from strength', () => {
    const sessions: ProgressSession[] = [
      {
        id: 'one',
        date: '2026-09-20',
        title: 'Training',
        exercises: [
          {
            id: 'row',
            name: 'Row',
            name_ar: 'سحب',
            kind: 'strength',
            sets: [
              { load: 100, unit: 'lb', reps: 8, seconds: null, metres: null, effort: 7 },
              { load: 40, unit: 'kg', reps: 10, seconds: null, metres: null, effort: null },
            ],
          },
          {
            id: 'row',
            name: 'Hold',
            name_ar: 'ثبات',
            kind: 'timed',
            sets: [{ load: 0, unit: 'kg', reps: 1, seconds: 45, metres: null, effort: null }],
          },
        ],
      },
    ]
    expect(exerciseTrend(sessions, 'row')).toEqual([
      { id: 'one', date: '2026-09-20', kind: 'strength', value: 45.36, sets: 2, reps: 18 },
      { id: 'one', date: '2026-09-20', kind: 'timed', value: 45, sets: 1, reps: 1 },
    ])
    expect(exerciseTrend(sessions, 'missing')).toEqual([])
  })
  it('does not call an already submitted or cancelled response overdue', () => {
    const q = {
      due_date: '2026-09-01',
      cancelled: false,
      reviewed_at: null,
      submitted_at: null,
    } as CoachingRequest
    expect(responseState(q, '2026-09-22')).toBe('overdue')
    expect(responseState({ ...q, submitted_at: '2026-09-05' }, '2026-09-22')).toBe('submitted')
    expect(responseState({ ...q, cancelled: true }, '2026-09-22')).toBe('cancelled')
  })
})
