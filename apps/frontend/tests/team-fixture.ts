import { testApi, testDatabase, testFiles } from './local-config.ts'
import { execFileSync } from 'node:child_process'
import { readFileSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomBytes, randomUUID, createHash } from 'node:crypto'
import type { Page } from '@playwright/test'
const root = resolve(import.meta.dirname, '../../backend'),
  composeFile = resolve(root, '../../infrastructure/compose.yaml'),
  url = testApi
const sql = (input: string) =>
  execFileSync(
    'docker',
    [
      'compose', '-f', composeFile,
      'exec',
      '-T',
      'db',
      'psql',
      '-U',
      'rafik_migrate',
      '-d',
      testDatabase,
      '-v',
      'ON_ERROR_STOP=1',
    ],
    { cwd: root, input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
  )
type Person = { id: string; email: string; session: { cookie: string } }
export async function teamFixture() {
  if (
    !readFileSync(composeFile, 'utf8').startsWith(
      'name: ${RAFIK_INSTANCE_ID:-rafik-prisma-local}',
    )
  )
    throw Error('Local fixture guard failed')
  const people: Person[] = [],
    teamIds: string[] = []
  async function call(who: Person, path: string, args?: Record<string, unknown>) {
    const response = await fetch(url + path, {
      method: args ? 'POST' : 'GET',
      headers: {
        'x-rafik-client': 'web',
        'Content-Type': 'application/json',
        Cookie: 'rafik_session=' + who.session.cookie,
      },
      body: args ? JSON.stringify(args) : undefined,
    })
    const data = await response.json()
    if (!response.ok) throw Error(data.message)
    return data
  }
  const rpc = (who: Person, name: string, args: Record<string, unknown>) =>
    call(who, '/v1/commands/' + name, args)
  const rows = (who: Person, table: string, column?: string, value?: string) =>
    call(
      who,
      '/v1/queries/' +
        table +
        (column ? '?column=' + column + '&value=' + encodeURIComponent(value || '') : ''),
    )
  async function cleanup() {
    if (teamIds.some((id) => !/^[-a-f0-9]{36}$/.test(id))) throw Error('Invalid fixture ID')
    for (const id of teamIds) sql(`delete from public.teams where id='${id}';`)
    for (const p of [...people].reverse()) {
      const media = sql(
        `copy (select 'program',m.workspace_id,m.id from public.program_media m join public.workspaces w on w.id=m.workspace_id where w.created_by='${p.id}' union all select 'organization',a.workspace_id,a.id from public.organization_assets a join public.workspaces w on w.id=a.workspace_id where w.created_by='${p.id}') to stdout with csv;`,
      ).trim()
      for (const line of media ? media.split('\n') : []) {
        const [kind, workspace, id] = line.split(',')
        if (!/^[-a-f0-9]{36}$/.test(workspace || '') || !/^[-a-f0-9]{36}$/.test(id || ''))
          throw Error('Invalid media fixture')
        try {
          unlinkSync(
            resolve(
              root,
              testFiles,
              createHash('sha256').update(`${kind}/${workspace}/${id}`).digest('hex'),
            ),
          )
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
        }
      }
      sql(
        `delete from public.workspaces where created_by='${p.id}'; delete from identity.users where id='${p.id}';`,
      )
    }
  }
  async function createPerson(name: string): Promise<Person> {
    const id = randomUUID(),
      email = `r4-browser-${id}@rafik.test`,
      cookie = randomBytes(32).toString('hex')
    sql(
      `insert into identity.users(id,email,email_confirmed_at) values('${id}','${email}',now()); insert into identity.sessions(token_hash,user_id,expires_at) values('${createHash('sha256').update(cookie).digest('hex')}','${id}',now()+interval '1 hour');`,
    )
    const person = { id, email, session: { cookie } }
    people.push(person)
    await rpc(person, 'ensure_profile', { p_name: name })
    return person
  }
  try {
    for (const name of ['R4 Owner', 'R4 Coach', 'R4 Athlete']) {
      const id = randomUUID(),
        email = `r4-browser-${id}@rafik.test`,
        cookie = randomBytes(32).toString('hex')
      sql(
        `insert into identity.users(id,email,email_confirmed_at) values('${id}','${email}',now()); insert into identity.sessions(token_hash,user_id,expires_at) values('${createHash('sha256').update(cookie).digest('hex')}','${id}',now()+interval '1 hour');`,
      )
      const person = { id, email, session: { cookie } }
      people.push(person)
      await rpc(person, 'ensure_profile', { p_name: name })
      if (name !== 'R4 Athlete')
        await call(person, '/v1/workspaces', { id: randomUUID(), kind: 'independent', name })
    }
    const [owner, coach, client] = people as [Person, Person, Person],
      plan = randomUUID()
    const draft = JSON.parse(
      readFileSync(resolve(root, 'content/starter.json'), 'utf8'),
    ).prescription
    await rpc(owner, 'save_plan', { p_id: plan, p_title: 'R4 shared training', p_draft: draft })
    const version = await rpc(owner, 'publish_plan', { p_id: plan, p_expected_version: 1 })
    const token = randomUUID() + randomUUID()
    await rpc(owner, 'create_invitation', {
      p_email: client.email,
      p_version_id: version.id,
      p_token: token,
      p_request_id: randomUUID(),
    })
    const assignmentId = await rpc(client, 'accept_invitation', { p_token: token })
    const assignment = (await rows(client, 'assignments', 'id', assignmentId))[0]
    async function login(page: Page, who: Person, path: string) {
      await page.context().addCookies([
        {
          name: 'rafik_session',
          value: who.session.cookie,
          url: 'http://127.0.0.1',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ])
      await page.goto(path)
    }
    return {
      owner,
      coach,
      client,
      createPerson,
      call,
      rpc,
      rows,
      login,
      cleanup,
      teamIds,
      assignment,
      version,
    }
  } catch (e) {
    await cleanup()
    throw e
  }
}
