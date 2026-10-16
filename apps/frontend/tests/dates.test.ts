import { afterAll, expect, test, vi } from 'vitest'
import { formatDate, localDate, addDays } from '../src/lib/dates'
const originalTimezone = process.env.TZ
afterAll(() => {
  if (originalTimezone === undefined) delete process.env.TZ
  else process.env.TZ = originalTimezone
  vi.useRealTimers()
})
test('calendar dates do not move backward for clients west of UTC', () => {
  process.env.TZ = 'America/Los_Angeles'
  expect(formatDate('2026-09-22')).toContain('22')
})
test('client-local today and cycle date arithmetic survive timezone and month boundaries', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-22T01:00:00Z'))
  expect(localDate('America/Los_Angeles')).toBe('2026-09-21')
  expect(localDate('Asia/Dubai')).toBe('2026-09-22')
  expect(addDays('2028-02-28', 2)).toBe('2028-03-01')
  expect(addDays('2026-03-08', 7)).toBe('2026-03-15')
})
