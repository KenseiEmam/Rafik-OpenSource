import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, openSync, closeSync } from 'node:fs'
import { resolve } from 'node:path'

// Disposable API/native acceptance only. Never reset or seed the user's preview.
const repo = resolve(import.meta.dirname, '../../..'),
  backend = resolve(repo, 'apps/backend')
const compose = resolve(repo, 'infrastructure/compose.yaml'),
  stamp = String(Date.now())
const database = `rafik_browser_${stamp}`,
  out = resolve(repo, 'apps/mobile/.expo/acceptance', stamp)
if (Number(process.versions.node.split('.')[0]) !== 24)
  throw Error('Field acceptance currently requires Node 24.')
const device = process.argv.includes('--device')
if (process.argv.slice(2).some((a) => a !== '--device'))
  throw Error('Use no arguments or --device.')
if (!readFileSync(compose, 'utf8').startsWith('name: ${RAFIK_INSTANCE_ID:-rafik-prisma-local}'))
  throw Error('Local Compose guard failed.')
mkdirSync(out, { recursive: true })
const env = {
  ...process.env,
  NODE_ENV: 'development',
  RAFIK_RUNTIME_MODE: '',
  PORT: '55341',
  DATABASE_URL: `postgresql://rafik_api:rafik-local-api-only@127.0.0.1:55332/${database}`,
  MIGRATION_DATABASE_URL: `postgresql://rafik_migrate:rafik-local-migrations-only@127.0.0.1:55332/${database}`,
  RAFIK_TEST_API: 'http://127.0.0.1:55341',
  RAFIK_TEST_DATABASE: database,
  RAFIK_TEST_FILES: `.local/browser-${stamp}`,
  ...(device ? { RAFIK_FIELD_DEVICE_FIXTURE: resolve(out, 'fixture.json') } : {}),
}
const sql = (db, query) =>
  execFileSync(
    'docker',
    [
      'compose',
      '-f',
      compose,
      'exec',
      '-T',
      'db',
      'psql',
      '-U',
      'rafik_migrate',
      '-d',
      db,
      '-v',
      'ON_ERROR_STOP=1',
    ],
    { cwd: backend, input: query, stdio: ['pipe', 'pipe', 'pipe'] },
  )
const run = (args) =>
  new Promise((accept, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: backend,
      env,
      stdio: 'inherit',
      windowsHide: true,
    })
    child.once('error', reject)
    child.once('exit', (code) =>
      code === 0 ? accept() : reject(Error(`Acceptance command exited ${code}`)),
    )
  })
let created = false,
  server
const receipt = { database, device, status: 'running', started_at: new Date().toISOString() }
try {
  let occupied = false
  try {
    await fetch(env.RAFIK_TEST_API + '/health', { signal: AbortSignal.timeout(400) })
    occupied = true
  } catch {}
  if (occupied) throw Error('Isolated API port 55341 is occupied; no service was stopped.')
  sql('rafik', `CREATE DATABASE ${database};`)
  created = true
  await run([resolve(repo, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy'])
  const fd = openSync(resolve(out, 'api.log'), 'w')
  server = spawn(process.execPath, ['--experimental-transform-types', 'server/index.ts'], {
    cwd: backend,
    env,
    stdio: ['ignore', fd, fd],
    windowsHide: true,
  })
  closeSync(fd)
  server.on('error', (error) => {
    receipt.server_error = error.message
  })
  let ready = false
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null || receipt.server_error) break
    try {
      if ((await fetch(env.RAFIK_TEST_API + '/health')).ok) {
        ready = true
        break
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100))
  }
  if (!ready)
    throw Error(
      'Isolated API failed to start: ' + readFileSync(resolve(out, 'api.log'), 'utf8').slice(-2000),
    )
  await run([
    '--experimental-transform-types',
    '--test',
    '--test-isolation=none',
    'tests/field-acceptance.test.ts',
  ])
  receipt.status = 'passed'
  if (device) {
    console.log(
      'Isolated device fixture ready at ' +
        env.RAFIK_FIELD_DEVICE_FIXTURE +
        '. Type done then Enter, or use Ctrl+C in an interactive terminal, to clean up.',
    )
    await new Promise((accept) => {
      const finish = () => {
        process.stdin.pause()
        accept()
      }
      process.once('SIGINT', finish)
      process.once('SIGTERM', finish)
      process.stdin.setEncoding('utf8')
      process.stdin.on('data', (data) => {
        if (String(data).trim() === 'done') finish()
      })
      process.stdin.resume()
    })
  }
} catch (error) {
  receipt.status = 'failed'
  receipt.error = error.message
  process.exitCode = 1
  console.error(error.message)
} finally {
  if (server && server.exitCode === null) {
    server.kill('SIGTERM')
    await new Promise((r) => {
      server.once('exit', r)
      setTimeout(r, 2000)
    })
  }
  if (created) {
    if (!/^rafik_browser_[0-9]+$/.test(database)) throw Error('Cleanup database guard failed')
    sql('rafik', `DROP DATABASE ${database} WITH (FORCE);`)
  }
  const privateFiles = resolve(backend, env.RAFIK_TEST_FILES)
  if (
    !privateFiles.startsWith(resolve(backend, '.local') + '\\') &&
    !privateFiles.startsWith(resolve(backend, '.local') + '/')
  )
    throw Error('Cleanup path guard failed')
  rmSync(privateFiles, { recursive: true, force: true })
  if (
    !out.startsWith(resolve(repo, 'apps/mobile/.expo/acceptance') + '\\') &&
    !out.startsWith(resolve(repo, 'apps/mobile/.expo/acceptance') + '/')
  )
    throw Error('Cleanup output guard failed')
  rmSync(out, { recursive: true, force: true })
  receipt.finished_at = new Date().toISOString()
  console.log(JSON.stringify({ ...receipt, cleaned: true }))
}
