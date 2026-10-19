import { test, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { timezoneOptions, timezoneLabel, timezoneSearchText } from '../src/lib/timezones'
test('timezone catalog preserves valid persisted aliases and fractional/DST offsets', () => {
  const zones = timezoneOptions('US/Eastern')
  expect(zones.length).toBeGreaterThan(400)
  expect(zones).toContain('US/Eastern')
  expect(zones).toContain('UTC')
  expect(timezoneSearchText('Asia/Katmandu')).toContain('Kathmandu')
  expect(timezoneSearchText('Asia/Kathmandu')).toContain('Katmandu')
  expect(timezoneSearchText('Asia/Dubai')).not.toContain('UTC')
  expect(timezoneOptions('invalid/zone')).not.toContain('invalid/zone')
  expect(timezoneLabel('Pacific/Chatham', new Date('2026-06-01T12:00:00Z'))).toContain('UTC+12:45')
  expect(timezoneLabel('Pacific/Chatham', new Date('2026-12-01T12:00:00Z'))).toContain('UTC+13:45')
})
test('owned UI color and spacing tokens have definitions', () => {
  const root = resolve('src')
  const source = readdirSync(root, { recursive: true })
    .filter((x) => /\.(vue|css|ts)$/.test(String(x)))
    .map((x) => readFileSync(resolve(root, String(x)), 'utf8'))
    .join('\n')
  const defined = new Set([...source.matchAll(/(--[\w-]+)\s*:/g)].map((x) => x[1]))
  for (const match of source.matchAll(/\.setProperty\(\s*['"](--[\w-]+)['"]/g))
    defined.add(match[1])
  const used = new Set([...source.matchAll(/var\((--[\w-]+)/g)].map((x) => x[1]))
  expect([...used].filter((x) => !defined.has(x) && !/^--(vis|reka)-/.test(x))).toEqual([])
})
