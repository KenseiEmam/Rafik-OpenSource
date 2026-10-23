import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { teamFixture } from './team-fixture'
import { layoutIssues } from './layout-contract'
test('daily institution connects named attention, filters and complete mobile navigation', async ({
  page,
}, info) => {
  const f = await teamFixture()
  try {
    await f.rpc(f.client, 'send_message', {
      p_id: crypto.randomUUID(),
      p_relationship: f.assignment.relationship_id,
      p_body: 'Can we adjust my next session?',
    })
    await f.login(page, f.owner, '/coach')
    await expect(page.locator('.attention-row')).toHaveCount(1)
    await expect(page.locator('.attention-row')).toContainText('R4 Athlete')
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: width === 320 ? 568 : 850 })
      expect(await layoutIssues(page)).toEqual([])
      await page.screenshot({
        path: `artifacts/r7-daily-${info.project.name}-${width}.png`,
        fullPage: true,
      })
    }
    await page.setViewportSize({ width: 390, height: 664 })
    await page.getByLabel('Show', { exact: true }).selectOption('message')
    await expect(page).toHaveURL(/view=message/)
    await page.locator('.attention-row').click()
    await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click()
    await page.getByRole('dialog').getByRole('link', { name: 'Today', exact: true }).click()
    await expect(page.locator('.attention-row')).toHaveCount(0)
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click()
    await expect(
      page.getByRole('dialog').getByRole('link', { name: 'Plans', exact: true }),
    ).toBeVisible()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Close navigation', exact: true })
      .click()
    await page.goto('/today')
    await expect(page).toHaveURL(/\/today$/)
    await page.evaluate(() => {
      localStorage.setItem('rafik.locale', 'ar')
      localStorage.setItem('rafik.theme', 'dark')
    })
    await page.goto('/coach')
    await expect(page.locator('.attention-filter select')).toBeVisible()
    expect(await layoutIssues(page)).toEqual([])
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.screenshot({
      path: `artifacts/r7-daily-${info.project.name}-ar.png`,
      fullPage: true,
    })
  } finally {
    await f.cleanup()
  }
})
