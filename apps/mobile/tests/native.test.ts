import { test, mock } from 'node:test'
import assert from 'node:assert/strict'

const storage = new Map<string, string>()
mock.module('expo-crypto', { namedExports: {} })
mock.module('expo-sqlite', { namedExports: {} })
mock.module('expo-secure-store', {
  namedExports: {
    getItemAsync: async (key: string) => storage.get(key) || null,
    setItemAsync: async (key: string, value: string) => {
      storage.set(key, value)
    },
    deleteItemAsync: async (key: string) => {
      storage.delete(key)
    },
  },
})
const { NativeClient } = await import('../src/field/native.ts')

test('authorized responses recheck access after offline failure without treating a write as rejected', async (t) => {
  const session = {
    user: { id: 'coach-test', email: 'coach@rafik.test' },
    access_token: 'a'.repeat(64),
    refresh_token: 'b'.repeat(64),
    access_expires_at: new Date(Date.now() + 600_000).toISOString(),
    refresh_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
  }
  let offline = false,
    denied = false
  t.mock.method(globalThis, 'fetch', async (url: Parameters<typeof globalThis.fetch>[0]) => {
    if (offline) throw Error('fetch failed: java.net.ConnectException: /10.0.2.2:55341')
    if (String(url).endsWith('/auth/login')) return Response.json(session)
    if (denied) return Response.json({ message: 'forbidden' }, { status: 403 })
    return Response.json({
      contexts: [
        {
          workspace_id: 'w',
          member_id: 'm',
          name: 'University',
          role: 'trainer',
          kind: 'organization',
        },
      ],
    })
  })
  const client = await NativeClient.login(
    'https://institution.test/api',
    'coach@rafik.test',
    'test-only',
  )
  offline = true
  await assert.rejects(client.refreshContexts(), /Could not reach your institution/)
  let recoveries = 0
  const unsubscribe = client.onAuthorizedResponse(() => {
    recoveries++
  })
  await assert.rejects(client.request('/contexts'))
  assert.equal(recoveries, 0, 'failed requests cannot announce recovery')
  offline = false
  denied = true
  await assert.rejects(client.request('/contexts'))
  assert.equal(recoveries, 0, 'denial cannot announce recovery')
  denied = false
  assert.equal((await client.refreshContexts())[0].workspace_id, 'w')
  assert.equal(recoveries, 1)
  const stopBrokenObserver = client.onAuthorizedResponse(() => {
    throw Error('UI observer failed')
  })
  await client.request('/contexts', { method: 'POST', body: '{}' })
  assert.equal(recoveries, 2, 'observer errors must not turn success into uncertain replay')
  stopBrokenObserver()
  unsubscribe()
  await client.request('/contexts')
  assert.equal(recoveries, 2, 'an unmounted account no longer receives callbacks')
  t.mock.method(globalThis, 'fetch', async () => Response.json({ contexts: [null] }))
  await assert.rejects(client.refreshContexts(), /invalid institution access/)
  assert.equal(client.contexts[0].workspace_id, 'w', 'bad data cannot replace known context')
  storage.clear()
})
