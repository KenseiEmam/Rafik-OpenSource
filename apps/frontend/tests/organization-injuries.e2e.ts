import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { injuryFixture } from './organization-injury-fixture'
import { layoutIssues } from './layout-contract'

test('athlete consent, status correction, limited coach view and withdrawal', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(120000)
  const f = await injuryFixture(),
    workspace = randomUUID(),
    coachPage = await browser.newPage()
  try {
    f.workspaces.push(workspace)
    await f.call(f.admin, '/v1/workspaces', {
      id: workspace,
      kind: 'organization',
      name: 'University injury workflow',
    })
    const coach = await f.addMember(workspace, f.coach, 'trainer'),
      athlete = await f.addMember(workspace, f.athlete, 'trainee')
    await f.assign(athlete.id, coach.id)

    await f.login(page, f.admin, `/organization/${workspace}/admin/injuries`)
    await page.getByRole('button', { name: 'Save consent setup', exact: true }).click()
    await expect(page.getByText('adult · Athlete assent pending', { exact: true })).toBeVisible()

    await f.login(page, f.athlete, `/organization/${workspace}/trainee/injuries`)
    await page.getByRole('button', { name: 'Agree and enable sharing', exact: true }).click()
    await expect(page.getByText(/agreed to share limited participation status/i)).toBeVisible()
    const reportPanel = page.locator('.panel').filter({
      has: page.getByRole('heading', { name: 'Report participation status', exact: true }),
    })
    await reportPanel.locator('select').selectOption('modified')
    await reportPanel.locator('input[type="date"]').fill('2026-10-01')
    await reportPanel.getByRole('button', { name: 'Save status', exact: true }).click()
    await expect(
      page.locator('.record').filter({ hasText: 'Modified participation' }),
    ).toBeVisible()
    const downloadEvent = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download my records', exact: true }).click()
    const download = await downloadEvent,
      file = await download.path(),
      exported = JSON.parse(await readFile(file!, 'utf8'))
    expect(download.suggestedFilename()).toMatch(/^rafik-injury-participation-.*\.json$/)
    expect(exported.records).toEqual([
      expect.objectContaining({
        participation: 'modified',
        effective_from: '2026-10-01',
        state: 'active',
        history: [
          expect.objectContaining({
            action: 'reported',
            participation: 'modified',
            effective_from: '2026-10-01',
          }),
        ],
      }),
    ])
    expect(JSON.stringify(exported)).not.toContain(workspace)
    expect(JSON.stringify(exported)).not.toContain(f.athlete.id)

    await f.login(coachPage, f.coach, `/organization/${workspace}/trainer/injuries`)
    const row = coachPage.locator('.panel li')
    await expect(row).toHaveCount(1)
    await expect(row).toContainText('Injury Athlete')
    await expect(row).toContainText('Modified participation')
    await expect(row).toContainText('2026-10-01')
    await expect(coachPage.getByText(/no medical details or history/i)).toBeVisible()
    await expect(row).not.toContainText(/diagnosis|treatment|history/i)

    await f.login(page, f.athlete, `/organization/${workspace}/trainee/injuries`)
    const record = page.locator('.record').filter({ hasText: 'Modified participation' })
    await record.locator('select').selectOption('unavailable')
    await record.getByRole('button', { name: 'Save correction', exact: true }).click()
    await expect(page.locator('.record').filter({ hasText: 'Unavailable' })).toBeVisible()
    await page.locator('.record details summary').click()
    await expect(page.locator('.record details')).toContainText('corrected')

    await f.login(page, f.admin, `/organization/${workspace}/admin/injuries`)
    await expect(page.getByRole('heading', { name: 'Consent setup' })).toBeVisible()
    await expect(page.getByText('Modified participation', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Unavailable', { exact: true })).toHaveCount(0)

    await f.login(page, f.athlete, `/organization/${workspace}/trainee/injuries`)
    await page.getByRole('button', { name: 'Withdraw sharing', exact: true }).click()
    await expect(page.getByText(/sharing is withdrawn/i)).toBeVisible()
    await f.login(coachPage, f.coach, `/organization/${workspace}/trainer/injuries`)
    await expect(coachPage.getByText('No shared active statuses.', { exact: true })).toBeVisible()

    for (const [width, language, theme] of [
      [320, 'en', 'light'],
      [320, 'ar', 'dark'],
      [1280, 'en', 'dark'],
      [1280, 'ar', 'light'],
    ] as const) {
      await page.setViewportSize({ width, height: 740 })
      await page.evaluate(
        ({ language, theme }) => {
          localStorage.setItem('rafik.locale', language)
          localStorage.setItem('rafik.theme', theme)
        },
        { language, theme },
      )
      await page.reload()
      await expect(page.getByRole('heading', { name: /injury status|حالة الإصابة/i })).toBeVisible()
      expect(await layoutIssues(page)).toEqual([])
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
      await page.screenshot({
        path: info.outputPath(`injury-${info.project.name}-${width}-${language}-${theme}.png`),
        fullPage: true,
      })
    }
  } finally {
    await coachPage.close()
    await f.cleanup()
  }
})
