// Check maintained engineering links. Historical audit links refer to recorded baselines.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
function markdown(dir) {
  return readdirSync(dir).flatMap(name => {
    const path = resolve(dir, name)
    return statSync(path).isDirectory() ? markdown(path) : path.endsWith('.md') ? [path] : []
  })
}
const files = ['README.md', 'CONTRIBUTING.md', 'docs/README.md'].map(f => resolve(root, f))
files.push(...markdown(resolve(root, 'docs/decisions')), ...markdown(resolve(root, 'docs/reference')), ...markdown(resolve(root, 'docs/implementation')))
const web = resolve(root, '../RAFIK-FRONTEND')
if (existsSync(web)) files.push(...['README.md', 'CONTRIBUTING.md'].map(f => resolve(web, f)))
const failures = []
for (const file of files) {
  const source = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '')
  for (const match of source.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const link = match[1]
    if (/^(https?:|#|mailto:)/.test(link)) continue
    const target = decodeURIComponent(link.split('#')[0])
    // The companion repository is optional for backend-only CI checkout.
    const absolute = resolve(dirname(file), target)
    if (!existsSync(web) && absolute.startsWith(web + '/')) continue
    if (!existsSync(absolute)) failures.push(`${file.slice(root.length + 1)}: ${link}`)
  }
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1 }
else console.log(`Checked local links in ${files.length} maintained engineering documents.`)
