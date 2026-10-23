#!/usr/bin/env node
// Coordination check shared by Rafik-OpenSource and rafik-landing (keep both copies identical).
// Shows open work in both repositories, overlap with this branch, what landed on the default
// branch since this branch started, new decisions and [agent-note] comments.
// Usage: node scripts/coordination/check.mjs [--plan path,path] [--strict] [--json]
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const option = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] || '' : ''
}
if (flag('--help')) {
  console.log(`Usage: npm run coord:check -- [--plan <paths>] [--strict] [--json]
  --plan    comma-separated files or folders you intend to touch (before you have changes)
  --strict  exit 2 when another open PR touches the same files or shared areas
  --json    machine-readable output`)
  process.exit(0)
}
const SELF = 'scripts/coordination/check.mjs'
const git = (...a) => {
  try {
    return execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}
const root = git('rev-parse', '--show-toplevel')
if (!root) fail('Run this inside a git checkout.')
const configPath = resolve(root, '.github/coordination.json')
if (!existsSync(configPath)) fail('Missing .github/coordination.json in this repository.')
const config = JSON.parse(readFileSync(configPath, 'utf8'))
const origin = git('remote', 'get-url', 'origin')
const here = Object.keys(config.repositories).find((name) =>
  origin
    .toLowerCase()
    .replace(/\.git$/, '')
    .endsWith(name.toLowerCase()),
)
if (!here) fail(`origin (${origin}) is not listed in .github/coordination.json.`)

function token() {
  if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN)
    return process.env.GH_TOKEN || process.env.GITHUB_TOKEN
  try {
    return execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}
const auth = token()
const warnings = []
async function api(path) {
  const response = await fetch('https://api.github.com/' + path, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'rafik-coordination-check',
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
    },
  })
  if (!response.ok) throw new Error(`GitHub ${response.status} for ${path}`)
  return response.json()
}
async function pages(path, limit = 3) {
  const items = []
  for (let page = 1; page <= limit; page++) {
    const batch = await api(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`)
    items.push(...batch)
    if (batch.length < 100) break
  }
  return items
}

// --- This branch -----------------------------------------------------------------------------
const defaultBranch =
  git('symbolic-ref', '--short', 'refs/remotes/origin/HEAD').replace(/^origin\//, '') || 'main'
git('fetch', '--quiet', 'origin', defaultBranch)
const base = `origin/${defaultBranch}`
const branch = git('rev-parse', '--abbrev-ref', 'HEAD')
const mergeBase = git('merge-base', 'HEAD', base)
const lines = (text) => text.split('\n').filter(Boolean)
const changed = [
  ...new Set([
    ...(mergeBase ? lines(git('diff', '--name-only', `${mergeBase}...HEAD`)) : []),
    ...lines(git('diff', '--name-only', 'HEAD')),
    ...lines(git('ls-files', '--others', '--exclude-standard')),
  ]),
]
const planned = option('--plan')
  .split(',')
  .map((p) => p.trim().replace(/^\.\//, ''))
  .filter(Boolean)
const mine = [...changed, ...planned]
const landed = mergeBase
  ? lines(git('log', '--first-parent', '--format=%h %s', `${mergeBase}..${base}`))
  : []
const settings = config.repositories[here]
const newDecisions = mergeBase
  ? lines(git('diff', '--unified=0', mergeBase, base, '--', settings.decisions))
      .filter((l) => l.startsWith('+- '))
      .map((l) => l.slice(1))
  : []

const covers = (path, target) =>
  target.endsWith('/')
    ? path.startsWith(target) || target.startsWith(path.replace(/\/?$/, '/'))
    : path === target || target.startsWith(path.replace(/\/?$/, '/'))
const areasOf = (repo, files) =>
  (config.repositories[repo]?.sharedAreas || [])
    .filter((area) => files.some((f) => area.paths.some((p) => covers(f, p) || covers(p, f))))
    .map((area) => area.name)
const section = (body, name) => {
  const match = (body || '').match(
    new RegExp(`^##+\\s*${name}[^\\n]*\\n([\\s\\S]*?)(?=^##|$(?![\\s\\S]))`, 'mi'),
  )
  return match ? match[1].replace(/<!--[\s\S]*?-->/g, '').trim() : ''
}
const ago = (iso) => {
  const hours = Math.round((Date.now() - Date.parse(iso)) / 36e5)
  return hours < 1 ? 'just now' : hours < 48 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`
}

// --- Open work in every listed repository ----------------------------------------------------
const since = new Date(Date.now() - (config.noteDays || 14) * 864e5).toISOString()
const report = {
  repository: here,
  branch,
  base,
  changed,
  planned,
  landed,
  newDecisions,
  pulls: [],
  warnings,
}
for (const repo of Object.keys(config.repositories)) {
  let open = []
  try {
    open = await pages(`repos/${repo}/pulls?state=open`, 1)
  } catch (e) {
    warnings.push(
      `Could not list open PRs in ${repo}: ${e.message}${auth ? '' : ' (no GitHub token; set GH_TOKEN or sign in with gh)'}`,
    )
    continue
  }
  for (const pr of open) {
    const own = repo === here && pr.head.ref === branch
    let files = []
    let notes = []
    try {
      files = (await pages(`repos/${repo}/pulls/${pr.number}/files`)).map((f) => f.filename)
      notes = (await pages(`repos/${repo}/issues/${pr.number}/comments?since=${since}`, 1))
        .filter((c) => c.body.includes(config.noteTag))
        .map((c) => ({
          author: c.user.login,
          at: c.created_at,
          text: c.body.trim().split('\n').slice(0, 6).join('\n'),
        }))
    } catch (e) {
      warnings.push(`Could not read ${repo}#${pr.number}: ${e.message}`)
    }
    const sameFiles =
      repo === here && !own
        ? files.filter((f) => mine.some((m) => covers(m, f) || covers(f, m)))
        : []
    const sharedAreas =
      repo === here && !own
        ? areasOf(repo, files).filter((a) => areasOf(repo, mine).includes(a))
        : areasOf(repo, files)
    report.pulls.push({
      repo,
      number: pr.number,
      title: pr.title,
      author: pr.user.login,
      branch: pr.head.ref,
      draft: pr.draft,
      updated: pr.updated_at,
      url: pr.html_url,
      own,
      areas: section(pr.body, 'Areas'),
      dependsOn: section(pr.body, 'Depends on'),
      contractChanges: section(pr.body, 'Contract changes'),
      fileCount: files.length,
      files,
      sameFiles,
      sharedAreas,
      notes,
    })
  }
}

// --- Shared script drift and this branch's change fragment -----------------------------------
const selfHash = createHash('sha256')
  .update(readFileSync(fileURLToPath(import.meta.url)))
  .digest('hex')
for (const repo of Object.keys(config.repositories).filter((r) => r !== here)) {
  try {
    const copy = await api(`repos/${repo}/contents/${SELF}`)
    const theirs = createHash('sha256').update(Buffer.from(copy.content, 'base64')).digest('hex')
    if (theirs !== selfHash)
      warnings.push(`${SELF} differs from the copy in ${repo}. Keep both identical.`)
  } catch {
    warnings.push(`${repo} has no ${SELF} on its default branch yet.`)
  }
}
const fragmentDir = settings.changes || 'changes/'
const hasFragment = changed.some(
  (f) => f.startsWith(fragmentDir) && f.endsWith('.md') && !f.endsWith('README.md'),
)
if (changed.length && branch !== defaultBranch && !hasFragment)
  warnings.push(
    `No change fragment yet: add ${fragmentDir}<short-name>.md (see ${fragmentDir}README.md).`,
  )

// Open PRs that touch the same files as each other, whoever owns them.
const crossings = []
for (const [i, a] of report.pulls.entries())
  for (const b of report.pulls.slice(i + 1)) {
    if (a.repo !== b.repo) continue
    const shared = a.files.filter((f) => b.files.includes(f))
    const areas = areasOf(a.repo, a.files).filter((x) => areasOf(b.repo, b.files).includes(x))
    if (shared.length || areas.length)
      crossings.push({ repo: a.repo, a: a.number, b: b.number, shared, areas })
  }
report.crossings = crossings
const conflicts = report.pulls.filter(
  (p) => !p.own && p.repo === here && (p.sameFiles.length || p.sharedAreas.length),
)
if (flag('--json')) {
  console.log(
    JSON.stringify(
      { ...report, conflicts: conflicts.map((p) => `${p.repo}#${p.number}`) },
      null,
      2,
    ),
  )
} else {
  const out = []
  const shortRepo = (r) => r.split('/')[1]
  out.push(`Coordination check · ${here} · ${branch} (vs ${base})`)
  out.push(
    changed.length
      ? `Your changes: ${changed.length} file(s)${planned.length ? `; planned: ${planned.join(', ')}` : ''}`
      : planned.length
        ? `Planned: ${planned.join(', ')}`
        : 'No changes yet. Pass --plan <paths> to check the areas you intend to touch.',
  )
  out.push('')
  if (landed.length) {
    out.push(
      `${base} gained ${landed.length} commit(s) since this branch started. Rebase before building on them:`,
    )
    for (const l of landed.slice(0, 10)) out.push(`  ${l}`)
    if (landed.length > 10) out.push(`  … ${landed.length - 10} more`)
    out.push('')
  }
  if (newDecisions.length) {
    out.push(`New decisions on ${base} (${settings.decisions}):`)
    for (const d of newDecisions) out.push(`  ${d}`)
    out.push('')
  }
  out.push('Open work:')
  if (!report.pulls.length) out.push('  none')
  for (const p of report.pulls) {
    out.push(
      `  ${shortRepo(p.repo)}#${p.number}${p.own ? ' (this branch)' : ''} ${p.title} — ${p.author} · ${p.branch}${p.draft ? ' · draft' : ''} · updated ${ago(p.updated)} · ${p.fileCount} file(s)`,
    )
    if (p.areas) out.push(`      Areas: ${p.areas.replace(/\s*\n\s*/g, '; ')}`)
    if (p.contractChanges && !/^(none|-|n\/a)\.?$/i.test(p.contractChanges))
      out.push(`      Contract changes: ${p.contractChanges.replace(/\s*\n\s*/g, '; ')}`)
    if (p.dependsOn && !/^(none|-|n\/a)\.?$/i.test(p.dependsOn))
      out.push(`      Depends on: ${p.dependsOn.replace(/\s*\n\s*/g, '; ')}`)
    if (p.sameFiles.length)
      out.push(
        `      ! Same files as you: ${p.sameFiles.slice(0, 8).join(', ')}${p.sameFiles.length > 8 ? ` … +${p.sameFiles.length - 8}` : ''}`,
      )
    if (p.sharedAreas.length)
      out.push(
        `      ${p.repo === here && !p.own ? '! Shared area with you' : 'Shared areas'}: ${p.sharedAreas.join(', ')}`,
      )
    for (const n of p.notes)
      out.push(`      Note from ${n.author} (${ago(n.at)}): ${n.text.replace(/\s*\n\s*/g, ' / ')}`)
  }
  out.push('')
  if (crossings.length) {
    out.push('Open PRs that overlap each other (agree an order or split before both land):')
    for (const c of crossings)
      out.push(
        c.shared.length
          ? `  ${shortRepo(c.repo)} #${c.a} and #${c.b}: ${c.shared.length} same file(s), e.g. ${c.shared.slice(0, 4).join(', ')}`
          : `  ${shortRepo(c.repo)} #${c.a} and #${c.b}: same area (${c.areas.join(', ')}), no shared files`,
      )
    out.push('')
  }
  for (const w of warnings) out.push(`Warning: ${w}`)
  if (warnings.length) out.push('')
  out.push(
    conflicts.length
      ? `Result: ${conflicts.length} open PR(s) overlap with your work (${conflicts.map((p) => '#' + p.number).join(', ')}). Read them first; then build on them, agree a split with an ${config.noteTag} comment, or narrow your scope, and record which in your PR's "Depends on" section.`
      : 'Result: no overlap with other open PRs in this repository.',
  )
  console.log(out.join('\n'))
}
process.exit(flag('--strict') && conflicts.length ? 2 : 0)

function fail(message) {
  console.error(`coord:check: ${message}`)
  process.exit(1)
}
