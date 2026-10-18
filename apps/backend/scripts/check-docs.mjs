// Check local links across current human-maintained monorepo documentation.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

function markdown(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = resolve(dir, name)
    const normalized = path.replaceAll('\\', '/')
    if (normalized.includes('/docs/archive/') || normalized.includes('/docs/revival/'))
      return []
    if (normalized.includes('/docs/verification/receipts/')) return []
    return statSync(path).isDirectory() ? markdown(path) : path.endsWith('.md') ? [path] : []
  })
}

const files = [
  ...['README.md', 'AGENTS.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'SECURITY.md'].map((path) =>
    resolve(repo, path),
  ),
  ...['apps/frontend/README.md', 'apps/backend/README.md', 'apps/mobile/README.md'].map((path) =>
    resolve(repo, path),
  ),
  ...markdown(resolve(repo, 'docs')),
]
const failures = []

for (const file of files) {
  const source = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '')
  for (const match of source.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const link = match[1]
    if (/^(https?:|#|mailto:)/.test(link)) continue
    const target = decodeURIComponent(link.split('#')[0])
    if (!existsSync(resolve(dirname(file), target)))
      failures.push(`${relative(repo, file)}: ${link}`)
  }
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Checked local links in ${files.length} monorepo documents.`)
}
