import { it, expect, vi } from 'vitest'
const fixture = vi.hoisted(() => ({
  records: Array.from({ length: 503 }, (_, id) => ({ id })),
  requests: [] as number[],
}))
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => {
      let offset = 0
      const query = {
        select: () => query,
        order: () => query,
        eq: () => query,
        range: (start: number) => {
          offset = start
          fixture.requests.push(start)
          return query
        },
        then: (resolve: (value: unknown) => void) =>
          Promise.resolve({ data: fixture.records.slice(offset, offset + 500), error: null }).then(
            resolve,
          ),
      }
      return query
    },
  }),
}))
import { rows } from '../src/lib/backend'
it('keeps history beyond the server response limit', async () => {
  const result = await rows<{ id: number }>('sessions', 'client_id', 'local-test')
  expect(result).toHaveLength(503)
  expect(result.at(-1)?.id).toBe(502)
  expect(fixture.requests).toEqual([0, 500])
})
