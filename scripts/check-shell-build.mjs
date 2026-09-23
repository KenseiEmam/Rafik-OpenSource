import { build } from 'vite'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import { shellIdentity } from '../build/offline-shell.ts'
const root = mkdtempSync(join(tmpdir(), 'rafik-shell-check-'))
try {
  const identities = []
  for (const version of ['one', 'two']) {
    const outDir = join(root, version)
    await build({
      logLevel: 'silent',
      build: { outDir, emptyOutDir: true },
      plugins: [
        {
          name: 'test-html-only-release',
          transformIndexHtml(html) {
            return html.replace('<head>', `<head><meta name="test-release" content="${version}">`)
          },
        },
      ],
    })
    const worker = readFileSync(join(outDir, 'sw.js'), 'utf8')
    const identity = worker.match(/const CACHE="([^"]+)/)?.[1]
    const assets = JSON.parse(worker.match(/const ASSETS=(.*);/)?.[1] || '[]')
    assert(assets.includes('/index.html'), 'shell must contain HTML')
    const contents = Object.fromEntries(
      assets
        .filter((path) => path !== '/')
        .map((path) => [path.slice(1), readFileSync(join(outDir, path.slice(1)))]),
    )
    assert.equal(
      identity,
      shellIdentity(contents),
      'worker identity must match the final files, after all build transforms',
    )
    identities.push(identity)
  }
  assert.notEqual(identities[0], identities[1], 'HTML-only changes must produce a distinct shell')
  console.log('PASS: two real builds, final-file hashes and HTML-only version changes')
} finally {
  rmSync(root, { recursive: true, force: true })
}
