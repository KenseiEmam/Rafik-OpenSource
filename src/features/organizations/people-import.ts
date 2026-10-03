// Pure roster-import rules: column detection, role words and row validation.
// Only the email is required; a name is kept for the admin's own results file
// because the person chooses their display name when accepting the invitation.
import type { Role } from './types'

export const MAX_IMPORT_ROWS = 200
export type ImportRow = {
  line: number
  name: string
  email: string
  role: Role
  problem: '' | 'missing_email' | 'invalid_email' | 'duplicate' | 'invalid_role'
}
/** `header` is the number of rows before the first person (title and header rows). */
export type ImportColumns = { name: number; email: number; role: number; header: number }

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const normalize = (value: string) =>
  value
    .normalize('NFKD')
    // Latin accents and Arabic hamza/harakat, so إ/أ/آ match ا.
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g, '')
    .toLowerCase()
    .replace(/[\s_\-.:*()]+/g, ' ')
    .trim()

const headerWords = {
  email: ['email', 'e mail', 'email address', 'mail', 'البريد', 'البريد الالكتروني', 'الايميل'],
  name: ['name', 'full name', 'trainee', 'client', 'member', 'person', 'الاسم', 'الاسم الكامل'],
  first: ['first name', 'given name', 'الاسم الاول'],
  last: ['last name', 'surname', 'family name', 'اسم العائلة'],
  role: ['role', 'type', 'access', 'الدور', 'الصفة'],
}
const roleWords: Record<string, Role> = {
  trainee: 'trainee',
  client: 'trainee',
  member: 'trainee',
  athlete: 'trainee',
  student: 'trainee',
  متدرب: 'trainee',
  متدربة: 'trainee',
  عميل: 'trainee',
  trainer: 'trainer',
  coach: 'trainer',
  instructor: 'trainer',
  مدرب: 'trainer',
  مدربة: 'trainer',
  admin: 'admin',
  administrator: 'admin',
  manager: 'admin',
  مسؤول: 'admin',
  مسؤولة: 'admin',
  مدير: 'admin',
}

export function roleFrom(value: string, fallback: Role): Role | null {
  const word = normalize(value)
  if (!word) return fallback
  return roleWords[word] || roleWords[word.replace(/s$/, '')] || null
}

/** Finds email/name/role columns from a header row (within the first rows, so a title row
 * above the table is fine), or from the data itself when there is no header. */
export function detectColumns(rows: string[][]): ImportColumns & { first: number; last: number } {
  for (const [index, row] of rows.slice(0, 10).entries()) {
    const header = row.map(normalize)
    const find = (words: string[]) => header.findIndex((cell) => words.includes(cell))
    const email = find(headerWords.email)
    if (email < 0) continue
    return {
      email,
      name: find(headerWords.name),
      first: find(headerWords.first),
      last: find(headerWords.last),
      role: find(headerWords.role),
      header: index + 1,
    }
  }
  // No recognizable header: the email column is the one whose cells look like addresses.
  const sample = rows.slice(0, 50)
  const width = Math.max(0, ...sample.map((r) => r.length))
  const score = (i: number) => sample.filter((r) => emailPattern.test(r[i]?.trim() || '')).length
  let email = -1
  for (let i = 0; i < width; i++) if (score(i) > (email < 0 ? 0 : score(email))) email = i
  const firstData = email < 0 ? 0 : rows.findIndex((r) => emailPattern.test(r[email]?.trim() || ''))
  const name =
    email < 0
      ? -1
      : (Array.from({ length: width }, (_, i) => i).find(
          (i) =>
            i !== email &&
            rows.some((r) => /\p{L}/u.test(r[i] || '') && !emailPattern.test(r[i] || '')),
        ) ?? -1)
  // Rows above the first address (titles, unrecognized headers) are not people.
  return { email, name, first: -1, last: -1, role: -1, header: Math.max(0, firstData) }
}

const filled = (row: string[]) => row.some((cell) => cell.trim())

export function importRows(rows: string[][], fallback: Role = 'trainee'): ImportRow[] {
  const columns = detectColumns(rows)
  const seen = new Set<string>()
  return rows
    .map((row, index) => ({ row, line: index + 1 }))
    .slice(columns.header)
    .filter(({ row }) => filled(row))
    .slice(0, MAX_IMPORT_ROWS)
    .map(({ row, line }) => {
      const cell = (i: number) => (i >= 0 ? row[i]?.trim() || '' : '')
      const email = cell(columns.email)
        .replace(/^mailto:/i, '')
        .toLowerCase()
      const name =
        cell(columns.name) || [cell(columns.first), cell(columns.last)].filter(Boolean).join(' ')
      const role = roleFrom(cell(columns.role), fallback)
      let problem: ImportRow['problem'] = ''
      if (!email) problem = 'missing_email'
      else if (!emailPattern.test(email) || email.length > 254) problem = 'invalid_email'
      else if (seen.has(email)) problem = 'duplicate'
      else if (!role) problem = 'invalid_role'
      if (email) seen.add(email)
      return { line, name: name.slice(0, 100), email, role: role || fallback, problem }
    })
}

export const tooManyRows = (rows: string[][]) =>
  rows.slice(detectColumns(rows).header).filter(filled).length > MAX_IMPORT_ROWS
