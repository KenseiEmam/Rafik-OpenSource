import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { teamFixture } from './team-fixture'
import { layoutIssues } from './layout-contract'

test('timezone picker searches the full catalog, commits keyboard selection and preserves the saved zone', async ({
  page,
}, info) => {
  const f = await teamFixture()
  try {
    await f.login(page, f.owner, '/coach')
    await page.goto('/settings')
    const zone = page.getByRole('combobox', { name: 'Timezone', exact: true })
    await zone.click()
    await expect.poll(() => page.getByRole('option').count()).toBeGreaterThan(400)
    await zone.fill('Chatham')
    await expect(page.getByRole('option', { name: /Pacific\/Chatham/ })).toBeVisible()
    await zone.press('ArrowDown')
    await zone.press('Enter')
    await expect(zone).toHaveValue(/Pacific\/Chatham/)
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible()
    await page.reload()
    await expect(zone).toHaveValue(/Pacific\/Chatham/)
    await zone.fill('not-a-timezone')
    await expect(page.getByText('No timezone found. Try a city such as London.')).toBeVisible()
    await zone.press('Escape')
    await expect(zone).toHaveValue(/Pacific\/Chatham/)
    await page.setViewportSize({ width: 320, height: 568 })
    await zone.fill('Kathmandu')
    await expect(page.getByRole('option', { name: /Asia\/Kath?mandu/ })).toBeVisible()
    await expect.poll(() => layoutIssues(page)).toEqual([])
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.screenshot({ path: info.outputPath('timezone-phone.png') })
    await zone.press('Escape')
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click()
    await expect(
      page.getByRole('dialog').getByRole('link', { name: 'Analytics', exact: true }),
    ).toBeVisible()
    await page.getByRole('dialog').press('Escape')
    await expect(page.getByRole('button', { name: 'Open navigation', exact: true })).toBeFocused()
    await page.getByRole('button', { name: 'Switch to Arabic', exact: true }).click()
    const arabicZone = page.locator('.timezone-anchor input').first()
    await arabicZone.fill('Kathmandu')
    const popup = page.locator('.timezone-options:visible')
    await expect(popup).toHaveCSS('direction', 'rtl')
    await expect(page.getByRole('option', { name: /Asia\/Kath?mandu/ })).toBeVisible()
    await expect.poll(() => layoutIssues(page)).toEqual([])
    await page.screenshot({ path: info.outputPath('timezone-phone-rtl.png') })
    await arabicZone.press('Escape')
  } finally {
    await f.cleanup()
  }
})

test('dashboard keeps navigation stable and analytics readable through filters, tabs and failed refresh', async ({
  page,
}, info) => {
  const f = await teamFixture()
  try {
    await f.login(page, f.owner, '/coach')
    let fail = false
    await page.route('**/v1/coach/analytics?**', async (route) => {
      if (fail)
        return route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Report unavailable' }),
        })
      const query = new URL(route.request().url()).searchParams
      await route.fulfill({
        json: {
          window: { from: query.get('from'), to: query.get('to'), zone: 'UTC' },
          people: [],
          summary: {
            active: 12,
            completed: 11,
            participating: 9,
            pending_review: 3,
            without_program: 2,
            requests: 6,
            submitted: 4,
          },
          daily: [
            { date: query.get('from'), value: 3 },
            { date: query.get('to'), value: 8 },
          ],
          attendance: [
            { label: 'attended', value: 9 },
            { label: 'missed', value: 2 },
            { label: 'booked', value: 1 },
          ],
          workload: [],
          programs: [],
          workloadNext: null,
          programNext: null,
        },
      })
    })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/coach/analytics')
    await expect(page.locator('.chart-plot svg')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Training activity', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(page.locator('.chart-inspector')).toContainText('8 sessions')
    await page
      .getByRole('button', { name: 'Previous data point · Training over time', exact: true })
      .click()
    await expect(page.locator('.chart-inspector')).toContainText('0 sessions')
    await page.getByRole('combobox', { name: 'Reporting period', exact: true }).selectOption('7')
    await expect(page.locator('.chart-inspector')).toContainText('8 sessions')
    await page.getByRole('tab', { name: 'Follow-up', exact: true }).click()
    await expect(
      page.getByRole('heading', { name: 'Check-in response', exact: true }),
    ).toBeVisible()
    await expect(page.locator('.chart-legend')).toContainText('Submitted')
    await page.getByRole('tab', { name: 'Training activity', exact: true }).click()
    await page.getByText('View data table', { exact: true }).first().click()
    await expect(page.getByRole('table').first()).toContainText('8')
    fail = true
    await page.getByRole('combobox', { name: 'Reporting period', exact: true }).selectOption('90')
    await expect(page.getByRole('alert')).toContainText('Showing the last successful report.')
    await expect(page.locator('.chart-plot svg')).toBeVisible()
    fail = false
    await page.getByRole('button', { name: 'Try again', exact: true }).click()
    await expect(page.getByRole('alert')).toHaveCount(0)
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: width < 400 ? 664 : 900 })
      await expect.poll(() => layoutIssues(page)).toEqual([])
      if (width >= 1024)
        await expect
          .poll(() =>
            page.evaluate(() => ({
              document: document.documentElement.scrollHeight,
              viewport: innerHeight,
            })),
          )
          .toEqual({ document: 900, viewport: 900 })
    }
    await page.setViewportSize({ width: 1440, height: 700 })
    await page.locator('#main').evaluate((el) => {
      el.scrollTop = 300
    })
    expect(
      await page.locator('.dashboard-sidebar').evaluate((el) => el.getBoundingClientRect().top),
    ).toBe(64)
    expect(await page.evaluate(() => scrollY)).toBe(0)
    await page.screenshot({ path: info.outputPath('analytics-desktop.png') })
    await page.locator('#main').evaluate((el) => {
      el.scrollTop = 100
    })
    await page
      .getByRole('navigation', { name: 'Institution navigation' })
      .getByRole('link', { name: 'Appointments', exact: true })
      .click()
    await expect(page.getByRole('heading', { name: 'Appointments', exact: true })).toBeVisible()
    await page.goBack()
    await expect(page.locator('.chart-plot svg')).toBeVisible()
    await expect.poll(() => page.locator('#main').evaluate((el) => el.scrollTop)).toBe(100)
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  } finally {
    await f.cleanup()
  }
})
