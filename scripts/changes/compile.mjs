#!/usr/bin/env node
// Folds per-PR change notes (changes/*.md) into CHANGELOG.md and docs/development/ledger.md.
// Each PR adds its own note file instead of editing those two shared files, so parallel PRs
// never conflict on them. Usage: node scripts/changes/compile.mjs [--check]
//   --check  validate every note's format without changing anything (safe for CI)
import { readFileSync, readdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const dir = resolve(root, 'changes')
const targets = {
  Changelog: { file: resolve(root, 'CHANGELOG.md'), anchor: '## Unreleased\n\n' },
  Ledger: { file: resolve(root, 'docs/development/ledger.md'), anchor: '## Recent work\n\n' },
}
const check = process.argv.includes('--check')
const notes = existsSync(dir)
  ? readdirSync(dir)
      .filter((name) => name.endsWith('.md') && name !== 'README.md')
      .sort()
  : []
const problems = []
const collected = { Changelog: [], Ledger: [] }
for (const name of notes) {
  const text = readFileSync(resolve(dir, name), 'utf8')
  const sections = {}
  for (const part of text.split(/^## /m).slice(1)) {
    const [heading, ...body] = part.split('\n')
    sections[heading.trim()] = body.join('\n').trim()
  }
  for (const key of Object.keys(sections))
    if (!(key in targets))
      problems.push(`${name}: unknown section "## ${key}" (use Changelog or Ledger)`)
  if (!sections.Changelog)
    problems.push(`${name}: missing a "## Changelog" section with at least one "- " item`)
  for (const [key, body] of Object.entries(sections)) {
    if (!(key in targets) || !body) continue
    if (!body.startsWith('- '))
      problems.push(`${name}: "## ${key}" must be a list starting with "- "`)
    collected[key].push(body)
  }
}
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
if (check) {
  console.log(`changes: ${notes.length} note(s) valid.`)
  process.exit(0)
}
if (!notes.length) {
  console.log('changes: nothing to compile.')
  process.exit(0)
}
for (const [key, { file, anchor }] of Object.entries(targets)) {
  if (!collected[key].length) continue
  const current = readFileSync(file, 'utf8')
  if (!current.includes(anchor)) {
    console.error(`${file} has no "${anchor.trim()}" heading to insert under.`)
    process.exit(1)
  }
  writeFileSync(file, current.replace(anchor, anchor + collected[key].join('\n\n') + '\n\n'))
}
for (const name of notes) rmSync(resolve(dir, name))
console.log(`changes: compiled ${notes.length} note(s) into CHANGELOG.md and the ledger.`)
