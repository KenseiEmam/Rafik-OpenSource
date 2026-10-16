import { it, expect, vi, afterEach } from 'vitest'
import { rows } from '../src/lib/backend'
afterEach(() => vi.unstubAllGlobals())
it('keeps history beyond the server response limit', async () => {
  const records = Array.from({ length: 503 }, (_, id) => ({ id })),
    offsets: number[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const offset = Number(new URL(url).searchParams.get('offset'))
      offsets.push(offset)
      return { ok: true, json: async () => records.slice(offset, offset + 500) }
    }),
  )
  const result = await rows<{ id: number }>('sessions', 'client_id', 'local-test')
  expect(result).toHaveLength(503)
  expect(result.at(-1)?.id).toBe(502)
  expect(offsets).toEqual([0, 500])
})
