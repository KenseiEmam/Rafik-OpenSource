import { describe, expect, test } from 'vitest'
import { measureFields, measureLimits, hasActualResult } from '../src/lib/set-measures'
import type { Entry } from '../src/lib/domain'

const entry = (patch: Partial<Entry> = {}): Entry => ({
  exercise_key: 'x',
  set_index: 0,
  reps: 0,
  load: 0,
  unit: 'kg',
  completed: false,
  seconds: null,
  metres: null,
  effort: null,
  ...patch,
})

describe('shared set measurement rules', () => {
  test('timed and distance sets record seconds or metres, never reps and load', () => {
    expect(measureFields('strength')).toEqual({ first: 'load', second: 'reps' })
    expect(measureFields(undefined)).toEqual({ first: 'load', second: 'reps' })
    expect(measureFields('timed')).toEqual({ first: 'seconds', second: 'effort' })
    expect(measureFields('distance')).toEqual({ first: 'metres', second: 'effort' })
    expect(measureLimits.seconds).toMatchObject({ max: 86400, step: 1 })
    expect(measureLimits.effort).toMatchObject({ min: 1, max: 10 })
  })

  test('completion needs a positive actual result for the exercise measurement', () => {
    expect(hasActualResult(entry({ reps: 8 }), 'timed')).toBe(false)
    expect(hasActualResult(entry({ seconds: 45 }), 'timed')).toBe(true)
    expect(hasActualResult(entry({ load: 40, reps: 0 }), 'strength')).toBe(false)
    expect(hasActualResult(entry({ metres: 0.5 }), 'distance')).toBe(false)
    expect(hasActualResult(entry({ metres: 400 }), 'distance')).toBe(true)
  })
})
