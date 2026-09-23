import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import type { Page } from '@playwright/test'
const root = resolve('../rafik-api')
export async function teamFixture() {
  if (
    !readFileSync(resolve(root, 'supabase/config.toml'), 'utf8').includes(
      'project_id = "rafik-revamp-local"',
    ) ||
    existsSync(resolve(root, 'supabase/.temp/project-ref'))
  )
    throw Error('Local fixture guard failed')
  const status = JSON.parse(
    execFileSync(resolve(root, 'node_modules/.bin/supabase'), ['status', '-o', 'json'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  )
  const url = 'http://127.0.0.1:55321'
  const admin = createClient(url, status.SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const people: {
    id: string
    email: string
    session: Session
    api: SupabaseClient
  }[] = []
  const teamIds: string[] = []
  async function cleanup() {
    for (const id of teamIds) {
      if (!/^[\da-f-]{36}$/.test(id)) throw Error('Invalid fixture id')
      execFileSync(
        'docker',
        [
          'exec',
          '-i',
          'supabase_db_rafik-revamp-local',
          'psql',
          '-U',
          'postgres',
          '-v',
          'ON_ERROR_STOP=1',
        ],
        { input: `delete from public.teams where id='${id}';`, stdio: ['pipe', 'pipe', 'pipe'] },
      )
    }
    for (const person of [...people].reverse()) {
      const { error } = await admin.auth.admin.deleteUser(person.id)
      if (error) throw error
    }
  }
  try {
    for (const name of ['R4 Owner', 'R4 Coach', 'R4 Client']) {
      const email = `r4-browser-${crypto.randomUUID()}@rafik.test`,
        password = crypto.randomUUID() + 'Local!'
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (error) throw error
      const api = createClient(url, status.ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const login = await api.auth.signInWithPassword({ email, password })
      if (login.error) throw login.error
      people.push({ id: data.user.id, email, session: login.data.session, api })
      const profile = await api.rpc('ensure_profile', { p_name: name })
      if (profile.error) throw profile.error
    }
    const owner = people[0]!,
      coach = people[1]!,
      client = people[2]!,
      plan = crypto.randomUUID()
    async function rpc(who: typeof owner, name: string, args: Record<string, unknown>) {
      const { data, error } = await who.api.rpc(name, args)
      if (error) throw error
      return data
    }
    const draft = JSON.parse(
      readFileSync(resolve(root, 'content/starter.json'), 'utf8'),
    ).prescription
    await rpc(owner, 'save_plan', { p_id: plan, p_title: 'R4 shared training', p_draft: draft })
    const version = await rpc(owner, 'publish_plan', { p_id: plan, p_expected_version: 1 })
    const token = crypto.randomUUID() + crypto.randomUUID()
    await rpc(owner, 'create_invitation', {
      p_email: client.email,
      p_version_id: version.id,
      p_token: token,
      p_request_id: crypto.randomUUID(),
    })
    const assignmentId = await rpc(client, 'accept_invitation', { p_token: token })
    const assignment = (
      await client.api.from('assignments').select('*').eq('id', assignmentId).single()
    ).data!
    async function login(page: Page, who: typeof owner, path: string) {
      await page.goto('/login')
      await page.evaluate(
        (session) => localStorage.setItem('rafik-revamp-auth', JSON.stringify(session)),
        who.session,
      )
      await page.goto(path)
    }
    return { owner, coach, client, rpc, login, cleanup, teamIds, assignment, version }
  } catch (error) {
    await cleanup()
    throw error
  }
}
