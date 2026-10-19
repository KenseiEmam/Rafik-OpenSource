import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

test('the root lockfile retains compiler bindings for other operating systems', () => {
  const lock = JSON.parse(
    readFileSync(resolve(import.meta.dirname, '../../../package-lock.json'), 'utf8'),
  ) as {
    packages: Record<string, { version?: string; optionalDependencies?: Record<string, string> }>
  }
  for (const name of ['rolldown', '@tailwindcss/oxide', 'lightningcss', 'esbuild']) {
    const parents = Object.entries(lock.packages).filter(([path]) =>
      path.endsWith('node_modules/' + name),
    )
    expect(parents.length, name).toBeGreaterThan(0)
    for (const [path, parent] of parents) {
      const bindings = Object.entries(parent.optionalDependencies || {})
      expect(bindings.length, name).toBeGreaterThan(0)
      for (const [binding, version] of bindings) {
        const nested = lock.packages[path + '/node_modules/' + binding]
        expect((nested || lock.packages['node_modules/' + binding])?.version, binding).toBe(version)
      }
    }
  }
})
