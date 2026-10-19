import { readFileSync } from 'node:fs'
import { posix, resolve } from 'node:path'
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
        // Match Node's ancestor lookup: npm may hoist a binding beside its
        // parent package inside another dependency's node_modules directory.
        let directory = path
        let resolved: { version?: string } | undefined
        while (!resolved) {
          const key =
            directory === '.' ? 'node_modules/' + binding : directory + '/node_modules/' + binding
          resolved = lock.packages[key]
          if (directory === '.') break
          directory = posix.dirname(directory)
        }
        expect(resolved?.version, path + ': ' + binding).toBe(version)
      }
    }
  }
})
