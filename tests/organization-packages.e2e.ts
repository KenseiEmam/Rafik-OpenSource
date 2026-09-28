import { test, expect } from '@playwright/test'
import { randomUUID, randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { teamFixture } from './team-fixture'
import { layoutIssues } from './layout-contract'
import { testDatabase } from './local-config'
test('package assignment and reservation recover; completion deducts while independent makeup does not', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(120000)
  const f = await teamFixture(),
    id = randomUUID(),
    ctx = await browser.newContext(),
    trainerPage = await ctx.newPage()
  try {
    await f.call(f.owner, '/v1/workspaces', {
      id,
      kind: 'organization',
      name: 'Madar session packages',
    })
    for (const [person, roles] of [
      [f.coach, ['trainer']],
      [f.client, ['trainee']],
    ] as const) {
      const token = randomBytes(32).toString('hex')
      await f.call(f.owner, `/v1/workspaces/${id}`, {
        operation: randomUUID(),
        action: 'invite',
        id: randomUUID(),
        email: person.email,
        roles,
        token,
      })
      await f.call(person, `/v1/organization-invitations/${token}`, {})
    }
    const people = await f.call(f.owner, `/v1/workspaces/${id}?view=admin`),
      member = people.members.find((m: any) => m.user_id === f.client.id),
      staff = people.members.find((m: any) => m.user_id === f.coach.id)
    await f.call(f.owner, `/v1/workspaces/${id}`, {
      operation: randomUUID(),
      action: 'assign-trainer',
      id: member.id,
      revision: member.revision,
      trainer: staff.id,
    })
    const base = `/organization/${id}/admin`,
      trainerBase = `/organization/${id}/trainer`
    await f.login(page, f.owner, base + '/packages')
    await page.getByRole('button', { name: 'Assign a package', exact: true }).click()
    await page.getByRole('checkbox', { name: 'R4 Client', exact: true }).check()
    await page.getByLabel('Package name', { exact: true }).fill('Eight personal sessions')
    await page.getByLabel('Session allowance', { exact: true }).fill('8')
    await expect(
      page.getByRole('status').filter({ hasText: 'Draft saved on this device.' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Close editor', exact: true }).click()
    await page.reload()
    await page.getByRole('button', { name: 'Continue draft', exact: true }).click()
    await expect(page.getByLabel('Package name', { exact: true })).toHaveValue(
      'Eight personal sessions',
    )
    let lost = false
    await page.route(`**/v1/workspaces/${id}/packages`, async (route) => {
      if (!lost && route.request().method() === 'POST') {
        lost = true
        await route.fetch()
        await route.abort('failed')
      } else await route.continue()
    })
    await page.getByRole('button', { name: 'Assign package', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'Retry saved change', exact: true }),
    ).toBeEnabled()
    await page.reload()
    await page.getByRole('button', { name: 'Retry saved change', exact: true }).click()
    await expect(page.locator('.package-detail h2')).toHaveText('Eight personal sessions')
    expect((await f.call(f.owner, `/v1/workspaces/${id}/packages?view=admin`)).items).toHaveLength(
      1,
    )
    await f.login(trainerPage, f.coach, trainerBase + '/packages')
    await trainerPage.locator('.package-row').click()
    await trainerPage.getByRole('link', { name: 'Book a session', exact: true }).click()
    await expect(trainerPage.getByLabel('Event name', { exact: true })).toHaveValue(
      'Eight personal sessions',
    )
    await trainerPage.getByRole('button', { name: 'Choose people', exact: true }).click()
    await expect(
      trainerPage.getByRole('combobox', { name: 'Package', exact: true }).locator('option:checked'),
    ).toContainText('Eight personal sessions')
    expect(await layoutIssues(trainerPage)).toEqual([])
    expect((await new AxeBuilder({ page: trainerPage }).analyze()).violations).toEqual([])
    await trainerPage.screenshot({
      path: `artifacts/r20-funding-${info.project.name}.png`,
      fullPage: true,
    })
    await trainerPage.getByRole('button', { name: 'Review schedule', exact: true }).click()
    await expect(trainerPage.locator('.event-review')).toContainText('Reserve 1 session')
    await trainerPage.getByRole('button', { name: 'Confirm schedule', exact: true }).click()
    await expect(trainerPage).toHaveURL(/\/calendar\/[a-f0-9-]{36}$/)
    const eid = new URL(trainerPage.url()).pathname.split('/').at(-1)!
    expect(eid).toMatch(/^[a-f0-9-]{36}$/)
    const packages = () => f.call(f.owner, `/v1/workspaces/${id}/packages?view=admin`)
    expect((await packages()).items[0].reserved).toBe(1)
    execFileSync(
      'docker',
      [
        'compose',
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
      {
        cwd: resolve('../rafik-api'),
        input: `update public.organization_events set starts_at=now()-interval '2 hours',ends_at=now()-interval '1 hour' where id='${eid}' and workspace_id='${id}';`,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    )
    await trainerPage.reload()
    await trainerPage
      .getByRole('combobox', { name: 'Attendance for R4 Client', exact: true })
      .selectOption('absent')
    await expect(
      trainerPage.getByRole('button', { name: 'Save attendance', exact: true }),
    ).toBeDisabled()
    await trainerPage
      .getByRole('combobox', { name: 'No-show package decision', exact: true })
      .selectOption('release')
    await trainerPage.getByRole('button', { name: 'Save attendance', exact: true }).click()
    await expect(trainerPage.getByRole('status').filter({ hasText: 'Saved.' })).toBeVisible()
    await trainerPage.getByRole('button', { name: 'Add session note', exact: true }).click()
    await trainerPage
      .getByLabel('Session note for R4 Client', { exact: true })
      .fill('Arrange a replacement after the client returns.')
    await expect(
      trainerPage.getByRole('status').filter({ hasText: 'Draft saved on this device.' }),
    ).toBeVisible()
    await trainerPage.reload()
    await trainerPage.getByRole('button', { name: 'Continue session note', exact: true }).click()
    await expect(trainerPage.getByLabel('Session note for R4 Client', { exact: true })).toHaveValue(
      'Arrange a replacement after the client returns.',
    )
    await trainerPage.getByRole('button', { name: 'Save session note', exact: true }).click()
    await expect(trainerPage.locator('.session-note-copy')).toContainText('Arrange a replacement')
    await trainerPage.getByRole('button', { name: 'Complete session', exact: true }).click()
    await expect(trainerPage.locator('.event-overview .tag')).toHaveText('Completed')
    expect((await packages()).items[0].available).toBe(8)
    await trainerPage
      .getByRole('link', { name: 'Book an independent makeup session', exact: true })
      .click()
    await trainerPage.getByRole('button', { name: 'Choose people', exact: true }).click()
    await expect(
      trainerPage.getByRole('combobox', { name: 'Independent session reason', exact: true }),
    ).toHaveValue('makeup')
    await trainerPage.getByRole('button', { name: 'Review schedule', exact: true }).click()
    await expect(trainerPage.locator('.event-review')).toContainText(
      'Independent — no subscription deduction',
    )
    await trainerPage.getByRole('button', { name: 'Confirm schedule', exact: true }).click()
    await expect(trainerPage).toHaveURL(/\/calendar\/[a-f0-9-]{36}$/)
    expect((await packages()).items[0].reserved).toBe(0)
    await trainerPage.goto(trainerBase + '/calendar/' + eid)
    await trainerPage
      .getByRole('combobox', { name: 'Attendance for R4 Client', exact: true })
      .selectOption('present')
    await trainerPage
      .getByLabel('Correction reason', { exact: true })
      .fill('Client attended; corrected from the register.')
    await trainerPage.getByRole('button', { name: 'Save attendance', exact: true }).click()
    await expect(
      trainerPage.getByRole('button', { name: 'Save attendance', exact: true }),
    ).toBeDisabled()
    await expect(trainerPage.getByRole('status').filter({ hasText: 'Saved.' })).toBeVisible()
    await expect.poll(async () => (await packages()).items[0].used).toBe(1)
    expect((await packages()).items[0].available).toBe(7)
    for (const width of [320, 1280])
      for (const lang of ['en', 'ar'])
        for (const theme of ['light', 'dark']) {
          await page.setViewportSize({ width, height: 900 })
          await page.evaluate(
            (s) => {
              localStorage.setItem('rafik.locale', s.lang)
              localStorage.setItem('rafik.theme', s.theme)
            },
            { lang, theme },
          )
          await page.goto(base + '/packages')
          await expect(page.locator('.package-row')).toHaveCount(1)
          expect(await layoutIssues(page)).toEqual([])
          await page.locator('.package-row').click()
          await expect(page.locator('.package-detail h2')).toHaveText('Eight personal sessions')
          expect(await layoutIssues(page)).toEqual([])
          expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
          await page.screenshot({
            path: `artifacts/r20-packages-${info.project.name}-${width}-${lang}-${theme}.png`,
            fullPage: true,
          })
        }
  } finally {
    await ctx.close()
    await f.cleanup()
  }
})
