import { test, expect } from 'vitest'
import { importRows, detectColumns, roleFrom, tooManyRows } from './people-import'
import { buildXlsx, parseDelimited, sharedStrings, sheetRows } from '../../lib/spreadsheet'

test('header columns are found in any order, in English or Arabic', () => {
  expect(detectColumns([['Role', 'E-mail', 'Full name']])).toMatchObject({
    email: 1,
    name: 2,
    role: 0,
    header: 1,
  })
  expect(detectColumns([['الاسم', 'البريد الإلكتروني']])).toMatchObject({ email: 1, name: 0 })
})

test('title rows above the header and blank rows keep Excel row numbers', () => {
  const rows = importRows([
    ['Madar members — October'],
    [],
    ['Name', 'Email'],
    ['Sara', 'sara@example.com'],
    [],
    ['Omar', 'omar@example.com'],
  ])
  expect(rows.map((r) => [r.line, r.name])).toEqual([
    [4, 'Sara'],
    [6, 'Omar'],
  ])
})

test('a sheet without headers still finds the email and name columns', () => {
  const rows = importRows([
    ['Sara Khalil', 'sara@example.com'],
    ['Omar', 'OMAR@example.com '],
  ])
  expect(rows.map((r) => [r.line, r.name, r.email, r.role, r.problem])).toEqual([
    [1, 'Sara Khalil', 'sara@example.com', 'trainee', ''],
    [2, 'Omar', 'omar@example.com', 'trainee', ''],
  ])
})

test('rows are validated without dropping their line numbers', () => {
  const rows = importRows(
    [
      ['First name', 'Last name', 'Email', 'Role'],
      ['Sara', 'Khalil', 'sara@example.com', 'client'],
      ['Kareem', '', 'kareem@example.com', 'Coach'],
      ['Copy', '', 'SARA@example.com', ''],
      ['Nobody', '', '', ''],
      ['Typo', '', 'typo@', ''],
      ['Odd', '', 'odd@example.com', 'wizard'],
    ],
    'trainee',
  )
  expect(rows.map((r) => [r.line, r.name, r.role, r.problem])).toEqual([
    [2, 'Sara Khalil', 'trainee', ''],
    [3, 'Kareem', 'trainer', ''],
    [4, 'Copy', 'trainee', 'duplicate'],
    [5, 'Nobody', 'trainee', 'missing_email'],
    [6, 'Typo', 'trainee', 'invalid_email'],
    [7, 'Odd', 'trainee', 'invalid_role'],
  ])
})

test('role words, plurals and Arabic map to organization roles', () => {
  expect(roleFrom('Trainers', 'trainee')).toBe('trainer')
  expect(roleFrom('مدربة', 'trainee')).toBe('trainer')
  expect(roleFrom('', 'trainer')).toBe('trainer')
  expect(roleFrom('owner', 'trainee')).toBeNull()
})

test('large lists are capped', () => {
  const rows = [['Email'], ...Array.from({ length: 201 }, (_, i) => [`p${i}@example.com`])]
  expect(tooManyRows(rows)).toBe(true)
  expect(importRows(rows)).toHaveLength(200)
})

test('CSV, semicolon CSV and pasted Excel cells parse with quotes', () => {
  expect(parseDelimited('Name,Email\n"Khalil, Sara",sara@example.com\r\n')).toEqual([
    ['Name', 'Email'],
    ['Khalil, Sara', 'sara@example.com'],
  ])
  expect(parseDelimited('Name;Email\nSara;sara@example.com')).toEqual([
    ['Name', 'Email'],
    ['Sara', 'sara@example.com'],
  ])
  expect(parseDelimited('Sara\tsara@example.com\n\n')).toEqual([['Sara', 'sara@example.com']])
})

test('SpreadsheetML shared, inline and sparse cells are read by column', () => {
  const shared = sharedStrings(
    '<sst><si><t>Name</t></si><si><r><t>Sa</t></r><r><t>ra &amp; Co</t></r></si></sst>',
  )
  const rows = sheetRows(
    '<sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="inlineStr"><is><t>Email</t></is></c></row>' +
      '<row r="2"><c r="A2" t="s"><v>1</v></c><c r="C2" t="str"><v>sara@example.com</v></c></row></sheetData>',
    shared,
  )
  expect(rows).toEqual([
    ['Name', '', 'Email'],
    ['Sara & Co', '', 'sara@example.com'],
  ])
})

test('written workbooks are valid ZIP containers with escaped text', async () => {
  const blob = buildXlsx([
    ['Name', 'Email'],
    ['A <b> & "c"', 'a@example.com'],
  ])
  const bytes = new Uint8Array(await blob.arrayBuffer())
  expect([bytes[0], bytes[1]]).toEqual([0x50, 0x4b])
  const text = new TextDecoder().decode(bytes)
  expect(text).toContain('A &lt;b&gt; &amp; &quot;c&quot;')
  expect(text).toContain('xl/worksheets/sheet1.xml')
})
