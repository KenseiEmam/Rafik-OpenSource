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
    path: `artifacts/r1d-${name}-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
}

test('athlete profile shows each staff role only what it is allowed to see', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(180000)
  const f = await teamFixture(),
    contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]),
    [primaryPage, supportPage, otherPage] = await Promise.all(contexts.map((c) => c.newPage())),
    workspace = randomUUID(),
    endpoint = `/v1/workspaces/${workspace}`,
    today = new Date().toISOString().slice(0, 10)
  try {
    await f.call(f.owner, '/v1/workspaces', {
      id: workspace,
      kind: 'organization',
      name: 'Madar profiles',
    })
    const support = await f.createPerson('Supporting Coach'),
      other = await f.createPerson('Unlinked Coach')
    for (const [person, roles] of [
      [f.coach, ['trainer']],
      [support, ['trainer']],
      [other, ['trainer']],
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
    const find = (p: { id: string }) => people.members.find((m: any) => m.user_id === p.id)
    let athlete = find(f.client)
    const primary = find(f.coach),
      supporting = find(support),
      football = randomUUID()
    await f.call(f.owner, endpoint + '/sports', {
      operation: randomUUID(),
      action: 'sport',
      view: 'admin',
      id: football,
      name: 'Football',
      kind: 'sport',
      archived: false,
      revision: 0,
    })
    for (const m of [athlete, supporting])
      await f.call(f.owner, endpoint + '/sports', {
        operation: randomUUID(),
        action: 'member-sports',
        view: 'admin',
        member: m.id,
        sports: [football],
        previous: [],
      })
    await f.call(f.owner, endpoint, {
      operation: randomUUID(),
      action: 'assign-trainer',
      id: athlete.id,
      revision: athlete.revision,
      trainer: primary.id,
    })
    await f.call(f.owner, endpoint, {
      operation: randomUUID(),
      action: 'link-coach',
      id: randomUUID(),
      athlete: athlete.id,
      coach: supporting.id,
      sport: football,
    })
    const plan = JSON.parse(
      readFileSync(resolve(import.meta.dirname, '../../backend/content/starter.json'), 'utf8'),
    ).prescription
    people = await f.call(f.owner, `${endpoint}?view=admin`)
    athlete = find(f.client)
    for (const [title, sport] of [
      ['Speed block', football],
      ['Strength block', null],
    ] as const) {
      const version = (
        await f.call(f.coach, endpoint + '/programs', {
          operation: randomUUID(),
          action: 'publish',
          view: 'trainer',
          id: randomUUID(),
          title,
          draft: plan,
          revision: null,
        })
      ).version.id
      await f.call(f.coach, endpoint + '/delivery', {
        operation: randomUUID(),
        action: 'assign',
        view: 'trainer',
        version_id: version,
        start_date: today,
        schedule_mode: 'flexible',
        sport,
        members: [{ id: athlete.id, revision: athlete.revision, replaces: null }],
      })
    }
    await f.call(f.coach, endpoint + '/nutrition', {
      operation: randomUUID(),
      action: 'publish',
      view: 'trainer',
      member: athlete.id,
      id: randomUUID(),
      revision: 0,
      effective_on: today,
      expires_on: null,
      targets: { kcal: 2400 },
      guidance: 'Fuel around training',
      meals: [],
    })
    await f.call(f.owner, endpoint + '/injuries', {
      action: 'configure',
      view: 'admin',
      member_id: athlete.id,
      age_group: 'adult',
      guardian_authorized: false,
      revision: 0,
    })
    await f.call(f.client, endpoint + '/injuries', { action: 'assent', view: 'trainee' })
    await f.call(f.client, endpoint + '/injuries', {
      operation: randomUUID(),
      action: 'report',
      view: 'trainee',
      id: randomUUID(),
      participation: 'modified',
      effective_from: today,
      revision: 0,
    })
    const profile = (view: string) => `/organization/${workspace}/${view}/athletes/${athlete.id}`

    // Primary coach: everything for their athlete, including participation status.
    await f.login(primaryPage, f.coach, profile('trainer'))
    await expect(primaryPage.getByRole('heading', { name: 'R4 Athlete', level: 1 })).toBeVisible()
    const plans = primaryPage.getByRole('region', { name: 'Active plans' })
    await expect(plans.getByText('Speed block')).toBeVisible()
    await expect(plans.getByText('Strength block')).toBeVisible()
    await expect(primaryPage.getByText('Current plan: version 1')).toBeVisible()
    await expect(primaryPage.getByText('has not shared their meal diary')).toBeVisible()
    const status = primaryPage.getByRole('region', { name: 'Participation status' })
    await expect(status).toContainText('Modified participation')
    await expect(status).toContainText('not a medical assessment')
    await expect(primaryPage.getByRole('region', { name: 'Overview' })).toContainText(
      'Supporting Coach · Football',
    )
    await inspect(primaryPage, 'primary', info)

    // Supporting coach: football plan only, no nutrition or participation sections.
    await f.login(supportPage, support, profile('trainer'))
    const supportPlans = supportPage.getByRole('region', { name: 'Active plans' })
    await expect(supportPlans.getByText('Speed block')).toBeVisible()
    await expect(supportPlans.getByText('Strength block')).toHaveCount(0)
    await expect(supportPage.getByRole('region', { name: 'Nutrition' })).toHaveCount(0)
    await expect(supportPage.getByRole('region', { name: 'Participation status' })).toHaveCount(0)
    await expect(supportPage.getByText('You support this athlete.')).toBeVisible()

    // Unlinked coach: nothing beyond a clear refusal.
    await f.login(otherPage, other, profile('trainer'))
    await expect(
      otherPage.getByRole('heading', { name: 'This athlete is not available to you.' }),
    ).toBeVisible()
    await expect(otherPage.getByText('Speed block')).toHaveCount(0)

    // Administrator: consent setup only, never the status itself.
    await f.login(page, f.owner, profile('admin'))
    const consent = page.getByRole('region', { name: 'Participation status' })
    await expect(consent).toContainText('Consent setup is complete.')
    await expect(consent).toContainText('The athlete has assented.')
    await expect(consent).not.toContainText('Modified participation')
    await expect(page.getByRole('region', { name: 'Nutrition' })).toBeVisible()

    // Entry point from People, then Arabic dark at phone width.
    await page.goto(`/organization/${workspace}/admin/people`)
    await page.getByRole('link', { name: 'Profile for R4 Athlete' }).click()
    await expect(page).toHaveURL(new RegExp(`/athletes/${athlete.id}$`))
    await page.evaluate(() => {
      localStorage.setItem('rafik.locale', 'ar')
      localStorage.setItem('rafik.theme', 'dark')
    })
    await page.setViewportSize({ width: 320, height: 740 })
    await page.reload()
    await expect(page.getByRole('heading', { name: 'الخطط النشطة' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await inspect(page, 'admin-ar-dark-320', info)
  } finally {
    await Promise.all(contexts.map((c) => c.close()))
    await f.cleanup()
  }
})
