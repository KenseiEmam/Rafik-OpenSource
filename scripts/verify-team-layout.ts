import { chromium, webkit } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { writeFileSync, mkdirSync } from 'node:fs'
import { layoutIssues } from '../tests/layout-contract.ts'
import { teamFixture } from '../tests/team-fixture.ts'
const engine = process.argv.includes('--webkit') ? webkit : chromium
const artifactDir =
  engine.name() === 'chromium' ? 'artifacts/r4-layout' : 'artifacts/r6-team-webkit'
const f = await teamFixture(),
  browser = await engine.launch(),
  context = await browser.newContext({ baseURL: 'http://127.0.0.1:5173' }),
  page = await context.newPage()
const results: object[] = [],
  errors: string[] = []
page.on('pageerror', (error) => errors.push(error.message))
try {
  const id = crypto.randomUUID()
  f.teamIds.push(id)
  await f.rpc(f.owner, 'create_team', { p_id: id, p_name: 'Together coaching · تدريب معاً' })
  const token = crypto.randomUUID() + crypto.randomUUID()
  await f.rpc(f.owner, 'invite_team_member', {
    p_id: crypto.randomUUID(),
    p_team: id,
    p_email: f.coach.email,
    p_role: 'coach',
    p_token: token,
  })
  await f.rpc(f.coach, 'accept_team_invitation', { p_token: token })
  const enrollment = crypto.randomUUID(),
    group = crypto.randomUUID(),
    support = crypto.randomUUID()
  await f.rpc(f.owner, 'propose_team_client', {
    p_id: enrollment,
    p_team: id,
    p_relationship: f.assignment.relationship_id,
  })
  await f.rpc(f.client, 'respond_team_client', { p_id: enrollment, p_revision: 1, p_accept: true })
  await f.rpc(f.owner, 'save_team_group', {
    p_id: group,
    p_team: id,
    p_name: 'Morning strength · القوة صباحاً',
    p_revision: 0,
  })
  await f.rpc(f.owner, 'set_team_group_client', {
    p_group: group,
    p_client: enrollment,
    p_included: true,
  })
  await f.rpc(f.owner, 'share_team_plan', {
    p_id: crypto.randomUUID(),
    p_team: id,
    p_version: f.version.id,
  })
  await f.rpc(f.client, 'create_support_case', {
    p_id: support,
    p_team: id,
    p_subject: 'Adjusting my training week',
    p_detail:
      'Please help me move this week’s sessions around a work trip. Can we keep the same exercises?',
  })
  await f.rpc(f.owner, 'request_team_handoff', {
    p_id: enrollment,
    p_revision: 2,
    p_coach: f.coach.id,
  })
  const routes = [
    { name: 'team-list', path: '/coach/teams' },
    ...['Clients', 'Staff', 'Groups', 'Shared library', 'Activity'].map((tab, i) => ({
      name: 'team-' + i,
      path: '/coach/teams/' + id,
      tab,
    })),
    { name: 'business', path: '/coach/business?team=' + id },
    { name: 'support-owner', path: '/coach/support?team=' + id },
    { name: 'enrollment', path: '/teams', client: true },
    { name: 'support-client', path: '/support', client: true },
    { name: 'invitation', path: '/team-invite/' + token },
  ]
  mkdirSync(artifactDir, { recursive: true })
  for (const width of [320, 390, 768, 1440])
    for (const lang of ['en', 'ar'])
      for (const theme of ['light', 'dark']) {
        await page.setViewportSize({ width, height: width <= 390 ? 664 : 1000 })
        for (const r of routes) {
          await page.goto('/login')
          // Wait for Auth bootstrap before replacing the synthetic session/navigation.
          await page.locator('main h1').waitFor()
          await page.evaluate(
            ({ session, lang, theme }) => {
              localStorage.setItem('rafik-revamp-auth', JSON.stringify(session))
              localStorage.setItem('rafik.locale', lang)
              localStorage.setItem('rafik.theme', theme)
            },
            {
              session: 'client' in r && r.client ? f.client.session : f.owner.session,
              lang,
              theme,
            },
          )
          await page.goto(r.path)
          await page.locator('main h1').waitFor()
          if ('tab' in r) {
            await page
              .locator('.workspace-tabs button')
              .nth(['Clients', 'Staff', 'Groups', 'Shared library', 'Activity'].indexOf(r.tab))
              .click()
          }
          if (r.name === 'team-2') await page.locator('select').first().selectOption(group)
          if (r.name === 'business') await page.locator('details summary').click()
          if (r.name.startsWith('support'))
            await page.locator('.support-list button').first().click()
          await page.evaluate(async () => {
            await document.fonts.ready
            await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})))
          })
          const issues = await layoutIssues(page)
          const overflow = issues.length > 0
          const axe =
            width === 390
              ? (await new AxeBuilder({ page }).analyze()).violations.map((v) => ({
                  id: v.id,
                  nodes: v.nodes.map((n) => n.target),
                }))
              : []
          results.push({ route: r.name, width, lang, theme, overflow, issues, violations: axe })
          if (overflow || axe.length) console.log('ISSUE', JSON.stringify(results.at(-1)))
          if (
            (width === 390 && lang === 'ar' && theme === 'dark') ||
            (width === 1440 && lang === 'en' && theme === 'light')
          )
            await page.screenshot({
              path: `${artifactDir}/${r.name}-${width}-${lang}-${theme}.png`,
              fullPage: true,
              animations: 'disabled',
            })
        }
        console.log(`Checked ${width}px ${lang} ${theme}`)
      }
  writeFileSync(
    artifactDir + '.json',
    JSON.stringify({ engine: engine.name(), checks: results.length, errors, results }, null, 2),
  )
  if (
    errors.length ||
    results.some(
      (r) =>
        (r as { overflow: boolean; violations: unknown[] }).overflow ||
        (r as { violations: unknown[] }).violations.length,
    )
  )
    throw Error('Layout issues found')
  console.log(
    `${results.length} layouts passed; ${results.filter((r) => (r as { width: number }).width === 390).length} accessibility states checked.`,
  )
} finally {
  await browser.close()
  await f.cleanup()
}
