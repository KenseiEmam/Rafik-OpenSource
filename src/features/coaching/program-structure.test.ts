import { test, expect, vi } from 'vitest'
vi.mock('../../lib/i18n', () => ({
  language: (en: string) => en,
  locale: { value: 'en' },
  t: (key: string) => key,
}))
import { duplicateSession, duplicateWeek } from './program-structure'
import sample from '../../content/sample.json'
import { upgradePrescription } from '../../lib/prescriptions'
import { clone, type Prescription } from '../../lib/domain'
test('session/week copies preserve targets but own every editable key and schedule slot', () => {
  const original = upgradePrescription(clone(sample.prescription) as Prescription),
    before = clone(original),
    session = duplicateSession(original, 0, ' copy'),
    result = duplicateWeek(session, 1)
  expect(original).toEqual(before)
  expect(result.days).toHaveLength(session.days.length * 2)
  expect(new Set(result.days.map((d) => d.id)).size).toBe(result.days.length)
  expect(new Set(result.days.flatMap((d) => d.exercises.map((e) => e.key))).size).toBe(
    result.days.flatMap((d) => d.exercises).length,
  )
  expect(new Set(result.days.map((d) => `${d.week}:${d.weekday}`)).size).toBe(result.days.length)
  result.days.at(-1)!.exercises[0]!.reps = 99
  expect(original.days[0]!.exercises[0]!.reps).not.toBe(99)
  expect(() => duplicateWeek({ ...original, cycleWeeks: 12 }, 1)).toThrow('invalid_day_count')
})
