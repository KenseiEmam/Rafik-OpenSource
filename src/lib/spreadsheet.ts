// Small, dependency-free spreadsheet reader/writer for roster imports.
// Reads the first worksheet of an .xlsx file (ZIP + SpreadsheetML) and CSV/TSV text;
// writes a single-sheet .xlsx with inline strings. Formulas, styles and dates are not
// interpreted: cells are read as the text or number Excel stored.

export const MAX_SPREADSHEET_BYTES = 5 * 1024 * 1024
const MAX_ROWS = 1000

export class SpreadsheetError extends Error {}

export async function readSpreadsheet(file: File): Promise<string[][]> {
  if (file.size > MAX_SPREADSHEET_BYTES) throw new SpreadsheetError('spreadsheet_too_large')
  const name = file.name.toLowerCase()
  if (name.endsWith('.xls')) throw new SpreadsheetError('spreadsheet_legacy_xls')
  const bytes = new Uint8Array(await file.arrayBuffer())
  const zip = bytes[0] === 0x50 && bytes[1] === 0x4b
  if (zip || name.endsWith('.xlsx')) return readXlsx(bytes)
  return parseDelimited(new TextDecoder().decode(bytes))
}

/** CSV, semicolon CSV or tab-separated text (including cells pasted from Excel). */
export function parseDelimited(text: string): string[][] {
  const clean = text.replace(/^﻿/, '')
  const firstLine = clean.split(/\r?\n/, 1)[0] || ''
  const delimiter = [...'\t;,'].sort(
    (a, b) => firstLine.split(b).length - firstLine.split(a).length,
  )[0]!
  const rows: string[][] = []
  let row: string[] = [],
    cell = '',
    quoted = false
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]!
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"' && !cell) quoted = true
    else if (ch === delimiter) {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      if (rows.length >= MAX_ROWS) break
    } else cell += ch
  }
  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return trimRows(rows)
}

// Blank rows inside the sheet are kept so row numbers match what people see in Excel;
// only trailing blank rows are removed.
function trimRows(rows: string[][]) {
  const trimmed = rows.map((r) => r.map((c) => c.trim())).slice(0, MAX_ROWS)
  while (trimmed.length && !trimmed.at(-1)!.some(Boolean)) trimmed.pop()
  return trimmed
}

// ---- ZIP reading -------------------------------------------------------

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined')
    throw new SpreadsheetError('spreadsheet_unsupported_browser')
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function unzip(bytes: Uint8Array, wanted: (name: string) => boolean) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let end = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--)
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i
      break
    }
  if (end < 0) throw new SpreadsheetError('spreadsheet_unreadable')
  const count = view.getUint16(end + 10, true)
  let offset = view.getUint32(end + 16, true)
  const files = new Map<string, Uint8Array>()
  const decoder = new TextDecoder()
  for (let n = 0; n < count; n++) {
    if (view.getUint32(offset, true) !== 0x02014b50)
      throw new SpreadsheetError('spreadsheet_unreadable')
    const method = view.getUint16(offset + 10, true),
      size = view.getUint32(offset + 20, true),
      nameLength = view.getUint16(offset + 28, true),
      extraLength = view.getUint16(offset + 30, true),
      commentLength = view.getUint16(offset + 32, true),
      local = view.getUint32(offset + 42, true),
      name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength))
    offset += 46 + nameLength + extraLength + commentLength
    if (!wanted(name)) continue
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true)
    const raw = bytes.subarray(start, start + size)
    if (method === 0) files.set(name, raw)
    else if (method === 8) files.set(name, await inflateRaw(raw))
    else throw new SpreadsheetError('spreadsheet_unreadable')
  }
  return files
}

// ---- SpreadsheetML -----------------------------------------------------

const entity = (text: string) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e: string) =>
    e[0] === '#'
      ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1))
      : ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" } as Record<string, string>)[
          e.toLowerCase()
        ]!,
  )
const attribute = (tag: string, name: string) => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1]
// Text runs (<t>) only; phonetic guides (<rPh>) are skipped.
const textOf = (xml: string) =>
  entity(
    [
      ...xml
        .replace(/<(?:\w+:)?rPh\b[\s\S]*?<\/(?:\w+:)?rPh>/g, '')
        .matchAll(/<(?:\w+:)?t(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?t>/g),
    ]
      .map((m) => m[1])
      .join(''),
  )
const columnIndex = (ref: string) =>
  [...(/^[A-Z]+/i.exec(ref)?.[0].toUpperCase() || 'A')].reduce(
    (n, ch) => n * 26 + ch.charCodeAt(0) - 64,
    0,
  ) - 1

export function sheetRows(sheetXml: string, shared: string[] = []): string[][] {
  const rows: string[][] = []
  for (const rowMatch of sheetXml.matchAll(
    /<(?:\w+:)?row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?row>)/g,
  )) {
    const row: string[] = []
    const number = Number(attribute(rowMatch[1] || '', 'r'))
    while (number > rows.length + 1 && rows.length < MAX_ROWS) rows.push([])
    let next = 0
    for (const cell of (rowMatch[2] || '').matchAll(
      /<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g,
    )) {
      const tag = cell[1] || '',
        body = cell[2] || '',
        ref = attribute(tag, 'r'),
        index = ref ? columnIndex(ref) : next,
        type = attribute(tag, 't'),
        value = /<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/.exec(body)?.[1]
      next = index + 1
      let text = ''
      if (type === 's') text = shared[Number(value)] ?? ''
      else if (type === 'inlineStr') text = textOf(body)
      else if (type === 'b') text = value === '1' ? 'TRUE' : value === '0' ? 'FALSE' : ''
      else text = entity(value ?? '')
      while (row.length < index) row.push('')
      row[index] = text
    }
    rows.push(row)
    if (rows.length >= MAX_ROWS) break
  }
  return trimRows(rows)
}

export function sharedStrings(xml: string) {
  return [...xml.matchAll(/<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/g)].map((m) =>
    textOf(m[1] || ''),
  )
}

async function readXlsx(bytes: Uint8Array) {
  const files = await unzip(
    bytes,
    (name) =>
      name === 'xl/workbook.xml' ||
      name === 'xl/_rels/workbook.xml.rels' ||
      name === 'xl/sharedStrings.xml' ||
      name.startsWith('xl/worksheets/'),
  )
  const text = (name: string) => {
    const file = files.get(name)
    return file ? new TextDecoder().decode(file) : ''
  }
  // The first sheet in workbook order, which is not necessarily sheet1.xml.
  const firstSheet = /<(?:\w+:)?sheet\b[^>]*?\sr:id="([^"]+)"/.exec(text('xl/workbook.xml'))?.[1]
  const target = firstSheet
    ? new RegExp(`<Relationship\\b[^>]*?Id="${firstSheet}"[^>]*?Target="([^"]+)"`).exec(
        text('xl/_rels/workbook.xml.rels'),
      )?.[1] ||
      new RegExp(`<Relationship\\b[^>]*?Target="([^"]+)"[^>]*?Id="${firstSheet}"`).exec(
        text('xl/_rels/workbook.xml.rels'),
      )?.[1]
    : undefined
  const path = target
    ? target.startsWith('/')
      ? target.slice(1)
      : 'xl/' + target.replace(/^\.\//, '')
    : [...files.keys()].filter((n) => /^xl\/worksheets\/[^/]+\.xml$/.test(n)).sort()[0]
  const sheet = path ? text(path) : ''
  if (!sheet) throw new SpreadsheetError('spreadsheet_unreadable')
  return sheetRows(sheet, sharedStrings(text('xl/sharedStrings.xml')))
}

// ---- Writing -----------------------------------------------------------

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(data: Uint8Array) {
  let c = 0xffffffff
  for (const byte of data) c = crcTable[(c ^ byte) & 0xff]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function zip(files: [string, string][]) {
  const encoder = new TextEncoder()
  const parts: Uint8Array[] = [],
    central: Uint8Array[] = []
  let offset = 0
  for (const [name, content] of files) {
    const nameBytes = encoder.encode(name),
      data = encoder.encode(content),
      crc = crc32(data)
    const local = new Uint8Array(30 + nameBytes.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true)
    lv.setUint16(6, 0x0800, true) // UTF-8 names
    lv.setUint32(14, crc, true)
    lv.setUint32(18, data.length, true)
    lv.setUint32(22, data.length, true)
    lv.setUint16(26, nameBytes.length, true)
    local.set(nameBytes, 30)
    const entry = new Uint8Array(46 + nameBytes.length)
    const cv = new DataView(entry.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true)
    cv.setUint16(6, 20, true)
    cv.setUint16(8, 0x0800, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, data.length, true)
    cv.setUint32(24, data.length, true)
    cv.setUint16(28, nameBytes.length, true)
    cv.setUint32(42, offset, true)
    entry.set(nameBytes, 46)
    parts.push(local, data)
    central.push(entry)
    offset += local.length + data.length
  }
  const size = central.reduce((n, e) => n + e.length, 0)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, files.length, true)
  ev.setUint16(10, files.length, true)
  ev.setUint32(12, size, true)
  ev.setUint32(16, offset, true)
  return new Blob([...parts, ...central, end] as BlobPart[], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

const escapeXml = (value: string) =>
  value
    // Characters XML 1.0 cannot carry.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
const columnName = (index: number) => {
  let name = ''
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26))
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name
  return name
}

/** One-sheet workbook; every cell is stored as text so emails and phone numbers stay intact. */
export function buildXlsx(rows: string[][], sheetName = 'Sheet1', widths: number[] = []) {
  const cols = widths.length
    ? `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    : ''
  const data = rows
    .map(
      (row, r) =>
        `<row r="${r + 1}">${row
          .map(
            (value, c) =>
              `<c r="${columnName(c)}${r + 1}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`,
          )
          .join('')}</row>`,
    )
    .join('')
  return zip([
    [
      '[Content_Types].xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    ],
    [
      '_rels/.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    ],
    [
      'xl/workbook.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXml(sheetName.slice(0, 31))}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ],
    [
      'xl/_rels/workbook.xml.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    ],
    [
      'xl/worksheets/sheet1.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${data}</sheetData></worksheet>`,
    ],
  ])
}

export function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}
