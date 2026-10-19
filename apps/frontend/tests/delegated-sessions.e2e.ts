import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomUUID, randomBytes } from 'node:crypto'
import AxeBuilder from '@axe-core/playwright'
import { teamFixture } from './team-fixture'
import { layoutIssues } from './layout-contract'

async function inspect(page: Page, name: string, info: { project: { name: string } }) {
  expect(await layoutIssues(page)).toEqual([])
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.screenshot({
    path: `artifacts/r1e-${name}-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
}

test('coach records a session on the athlete’s behalf with attribution, exact retry and history', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(180000)
  const f = await teamFixture(),
    athleteContext = await browser.newContext(),
    athletePage = await athleteContext.newPage(),
    workspace = randomUUID(),
    endpoint = `/v1/workspaces/${workspace}`,
    today = new Date().toISOString().slice(0, 10)
  try {
    await f.call(f.owner, '/v1/workspaces', {
      id: workspace,
      kind: 'organization',
      name: 'Madar delegated',
    })
    for (const [person, roles] of [
      [f.coach, ['trainer']],
      [f.client, ['trainee']],
    ] as const) {
      const token = randomBytes(32).toString('hex')
      await f.call(f.owner, endpoint, {
        operation: randomUUID(),
        action: 'invite',
        id: randomUUID(),
        email: person.email,
        roles,
        token,
      })
      await f.call(person, `/v1/organization-invitations/${token}`, {})
    }
    let people = await f.call(f.owner, `${endpoint}?view=admin`)
    const coach = people.members.find((m: any) => m.user_id === f.coach.id)
    let athlete = people.members.find((m: any) => m.user_id === f.client.id)
    await f.call(f.owner, endpoint, {
      operation: randomUUID(),
      action: 'assign-trainer',
      id: athlete.id,
      revision: athlete.revision,
      trainer: coach.id,
    })
    const plan = JSON.parse(
      readFileSync(resolve(import.meta.dirname, '../../backend/content/starter.json'), 'utf8'),
    ).prescription
    const version = (
      await f.call(f.coach, endpoint + '/programs', {
        operation: randomUUID(),
        action: 'publish',
        view: 'trainer',
        id: randomUUID(),
        title: 'Track block',
        draft: plan,
        revision: null,
      })
    ).version.id
    people = await f.call(f.owner, `${endpoint}?view=admin`)
    athlete = people.members.find((m: any) => m.user_id === f.client.id)
    await f.call(f.coach, endpoint + '/delivery', {
      operation: randomUUID(),
      action: 'assign',
      view: 'trainer',
      version_id: version,
      start_date: today,
      schedule_mode: 'flexible',
      members: [{ id: athlete.id, revision: athlete.revision, replaces: null }],
    })

    // Coach starts from the athlete profile and records under their own name.
    const base = `/organization/${workspace}/trainer`
    await f.login(page, f.coach, `${base}/athletes/${athlete.id}`)
    await page.getByRole('link', { name: 'Record a session for Track block' }).click()
    await expect(page.getByText('under your own name', { exact: false })).toBeVisible()
    const firstDay = plan.days.find((d: any) => !d.restDay)
    await page.getByRole('button', { name: 'Record ' + firstDay.name, exact: true }).click()
    await expect(page).toHaveURL(/\/record\/[a-f0-9-]{36}$/)
    await expect(page.getByText('Recorded on behalf of')).toBeVisible()
    const firstSet = page.locator('.delegated-set').first()
    await firstSet.getByLabel(/^Load/).fill('22.5')
    await firstSet.getByRole('checkbox', { name: 'Done' }).check()
    let lost = false,
      saves = 0
    await page.route(`**${endpoint}/sessions`, async (route) => {
      const body = route.request().method() === 'POST' ? route.request().postDataJSON() : null
      if (body?.action === 'save') saves++
      if (!lost && body?.action === 'save') {
        lost = true
        await route.fetch()
        await route.abort('failed')
      } else await route.continue()
    })
    await page.getByRole('button', { name: 'Finish session', exact: true }).click()
    await page.getByRole('button', { name: 'Retry saved change', exact: true }).click()
    const history = page.getByRole('region', { name: 'Record history' })
    await expect(history.getByRole('listitem')).toHaveCount(2)
    await expect(history).toContainText('R4 Coach · started')
    await expect(history).toContainText('R4 Coach · saved as completed')
    expect(saves).toBe(2)
    await inspect(page, 'record', info)
    const recordUrl = page.url()
    const sessionId = recordUrl.split('/').at(-1)

    // The athlete sees who recorded the session and can open it to correct it.
    await f.login(athletePage, f.client, `/workout/${sessionId}?workspace=${workspace}`)
    await expect(
      athletePage.getByRole('note').filter({ hasText: 'Recorded by R4 Coach on your behalf.' }),
    ).toBeVisible()
    await inspect(athletePage, 'athlete-banner', info)

    // Arabic dark phone view of the coach record page.
    await page.unroute(`**${endpoint}/sessions`)
    await page.evaluate(() => {
      localStorage.setItem('rafik.locale', 'ar')
      localStorage.setItem('rafik.theme', 'dark')
    })
    await page.setViewportSize({ width: 320, height: 740 })
    await page.goto(recordUrl)
    await expect(page.getByRole('heading', { name: 'سجل التعديلات' })).toBeVisible()
    await inspect(page, 'record-ar-dark-320', info)
  } finally {
    await athleteContext.close()
    await f.cleanup()
  }
})
