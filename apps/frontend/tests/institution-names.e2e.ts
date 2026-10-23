import { test, expect } from '@playwright/test'
import { resolve } from 'node:path'

test('first-run web integration uses canonical institution services and renders both locales', async ({
  page,
}) => {
  test.setTimeout(120000)
  const failures: string[] = [],
    legacy: string[] = []
  page.on('pageerror', (error) => failures.push(error.message))
  page.on('response', (response) => {
    if (/\/v1\//.test(response.url()) && response.status() >= 400)
      failures.push(`${response.status()} ${new URL(response.url()).pathname}`)
  })
  page.on('request', (request) => {
    if (/\/v1\/(workspaces|organization-)/.test(request.url())) legacy.push(request.url())
  })
  await page.goto('/setup')
  await page.getByLabel('Your full name').fill('Institution migration administrator')
  await page
    .getByLabel('University or training institution name')
    .fill('Migration acceptance university')
  await page.getByLabel('Sign-in email address').fill('institution-names@rafik.test')
  await page.getByLabel('Password', { exact: true }).fill('Migration-2026!')
  await page.getByLabel('Confirm password').fill('Migration-2026!')
  await page.getByRole('button', { name: 'Create institution and account' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.locator('main h1')).toContainText('Migration acceptance university')
  for (const path of ['/people', '/plans', '/schedule', '/institution-settings']) {
    await page.goto(path)
    await expect(page.locator('main h1')).toBeVisible()
  }
  await page.goto('/people')
  await expect(page.locator('main h1')).toHaveText('People')
  await expect(page.getByRole('tab', { name: 'Athletes', exact: true })).toBeVisible()
  await expect(page.locator('main .empty-state').first()).toBeVisible()
  await page.screenshot({ path: resolve('artifacts/institution-names-en.png'), fullPage: true })
  await page.evaluate(() => {
    localStorage.setItem('rafik.locale', 'ar')
    localStorage.setItem('rafik.theme', 'dark')
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect(page.locator('main h1')).toHaveText('الأشخاص')
  await expect(page.getByRole('tab', { name: 'الرياضيون', exact: true })).toBeVisible()
  await expect(page.locator('main .empty-state').first()).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await page.screenshot({ path: resolve('artifacts/institution-names-ar.png'), fullPage: true })
  expect(legacy).toEqual([])
  expect(failures).toEqual([])
})
