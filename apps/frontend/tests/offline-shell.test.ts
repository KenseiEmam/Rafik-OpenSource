import { test, expect } from 'vitest'
import { shellIdentity } from '../build/offline-shell'
test('HTML-only and fixed-name public asset edits create a new shell version', () => {
  const first = {
    'index.html': '<title>Rafik</title>',
    'brand.png': new Uint8Array([1]),
    'app.js': 'unchanged',
  }
  expect(shellIdentity(first)).not.toBe(
    shellIdentity({ ...first, 'index.html': '<title>New Rafik</title>' }),
  )
  expect(shellIdentity(first)).not.toBe(
    shellIdentity({ ...first, 'brand.png': new Uint8Array([2]) }),
  )
  expect(shellIdentity(first)).toBe(
    shellIdentity({
      'app.js': 'unchanged',
      'brand.png': new Uint8Array([1]),
      'index.html': '<title>Rafik</title>',
    }),
  )
})
