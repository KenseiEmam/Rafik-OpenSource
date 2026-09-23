import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
const clientPath = '/coach/clients/40000000-0000-4000-8000-000000000001'
async function coach(page: import('@playwright/test').Page) {
  await page.goto('/local-preview')
  await page.getByRole('button', { name: /Laila Khoury/ }).click()
  await expect(page).toHaveURL(/\/coach$/)
}
test('coach manages a client workspace and restores an archived relationship', async ({
  page,
}, info) => {
  await coach(page)
  await page.goto('/coach/clients')
  await page.getByLabel('Search clients', { exact: true }).fill('Amir')
  await page.getByRole('link', { name: /Amir Hassan/ }).click()
  await expect(page.getByRole('heading', { name: 'Amir Hassan', exact: true })).toBeVisible()
  await page
    .getByLabel('Goals', { exact: true })
    .fill('Build consistency around a busy working week.')
  await page
    .getByLabel('Preferences and constraints', { exact: true })
    .fill('Dumbbells available at home. Two sessions each week.')
  await page
    .getByLabel('Private coach notes', { exact: true })
    .fill('Review the second session before increasing load.')
  await page.getByRole('button', { name: 'Save client notes', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Client notes saved')
  await page.reload()
  await expect(page.getByLabel('Goals', { exact: true })).toHaveValue(
    'Build consistency around a busy working week.',
  )
  await page.screenshot({
    path: `artifacts/r1-client-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('button', { name: 'Archive client', exact: true }).click()
  await page.getByRole('button', { name: 'Confirm archive', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Reactivate client', exact: true })).toBeVisible()
  await page.goto('/coach/clients')
  await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('archived')
  await page.getByRole('link', { name: /Amir Hassan/ }).click()
  await page.getByRole('button', { name: 'Reactivate client', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Archive client', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Switch to Arabic' }).click()
  const mobileNavigation = page.getByRole('button', { name: 'فتح التنقل', exact: true })
  if (await mobileNavigation.isVisible()) await mobileNavigation.click()
  await page.getByRole('combobox', { name: 'المظهر' }).selectOption('dark')
  if (await page.getByRole('dialog').isVisible())
    await page.getByRole('button', { name: 'إغلاق التنقل', exact: true }).click()
  await page.screenshot({
    path: `artifacts/r1-client-ar-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test('custom exercise and mixed multiweek plan reach actual client recording and coach review', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(90000)
  const name = `Controlled hold ${Date.now()}`,
    title = `Two-week strength ${Date.now()}`
  await coach(page)
  await page.goto('/coach/exercises')
  await page.getByRole('button', { name: 'Create exercise', exact: true }).click()
  await page.getByLabel('Exercise name', { exact: true }).fill(name)
  await page.getByRole('combobox', { name: 'Recording type', exact: true }).selectOption('timed')
  await page.locator('.exercise-editor').getByLabel('Equipment', { exact: true }).fill('Mat')
  await page.getByLabel('Movement category', { exact: true }).fill('Brace')
  await page
    .getByLabel('Instructions', { exact: true })
    .fill('Keep breathing. Hold a comfortable, steady position.')
  await page.getByRole('button', { name: 'Save exercise', exact: true }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Exercise library updated' }),
  ).toBeVisible()
  await page.getByLabel('Search exercises', { exact: true }).fill(name)
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  await page.screenshot({
    path: `artifacts/r1-library-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.goto('/coach/plans/new')
  await page.getByLabel('Plan name', { exact: true }).fill(title)
  await page.getByText('Program schedule & exercise search', { exact: true }).click()
  await page.getByLabel('Cycle length (weeks)', { exact: true }).fill('2')
  const exercises = page.locator('.editor-exercise')
  await exercises
    .nth(0)
    .getByRole('combobox', { name: 'Exercise 1', exact: true })
    .selectOption({ label: name })
  await exercises.nth(0).getByLabel('Seconds', { exact: true }).fill('35')
  await exercises.nth(0).getByText('Set targets, effort & grouping', { exact: true }).click()
  await exercises.nth(0).getByLabel('Superset / circuit label', { exact: true }).fill('A')
  await exercises.nth(0).getByLabel('Different targets for each set', { exact: true }).check()
  await exercises
    .nth(0)
    .locator('.per-set-target')
    .nth(1)
    .getByLabel('Seconds', { exact: true })
    .fill('45')
  await exercises
    .nth(1)
    .getByRole('combobox', { name: 'Exercise 2', exact: true })
    .selectOption('brisk-walk')
  await exercises.nth(1).getByLabel('Metres', { exact: true }).fill('400')
  await exercises.nth(1).getByText('Set targets, effort & grouping', { exact: true }).click()
  await exercises.nth(1).getByLabel('Superset / circuit label', { exact: true }).fill('A')
  await page.getByLabel('Cycle week', { exact: true }).fill('2')
  await page.getByRole('button', { name: 'Add day', exact: true }).click()
  await page.getByLabel('Session name', { exact: true }).fill('First cycle session')
  await page.getByLabel('Cycle week', { exact: true }).fill('1')
  await page.getByRole('combobox', { name: 'Day of cycle week', exact: true }).selectOption('0')
  await page.getByRole('button', { name: 'Client preview', exact: true }).click()
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Edit plan', exact: true }).click()
  await page.screenshot({
    path: `artifacts/r1-plan-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('button', { name: 'Publish plan', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Published.')
  await page.goto(clientPath)
  await page.getByRole('button', { name: 'Plan & schedule', exact: true }).click()
  await page
    .getByRole('combobox', { name: 'Published plan', exact: true })
    .selectOption({ label: title + ' · 1' })
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  await page.getByLabel('Start date', { exact: true }).fill(today)
  await page.getByRole('combobox', { name: 'Schedule', exact: true }).selectOption('cycle')
  await page.getByRole('button', { name: 'Apply assignment', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Assignment updated')
  await expect(page.locator('.schedule-row').first()).toContainText('First cycle session')
  await page.screenshot({
    path: `artifacts/r1-schedule-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  const context = await browser.newContext({
      viewport:
        info.project.name === 'webkit-phone'
          ? { width: 390, height: 844 }
          : { width: 1440, height: 1000 },
    }),
    client = await context.newPage()
  try {
    await client.goto('/local-preview')
    await client.getByRole('button', { name: /Amir Hassan/ }).click()
    await expect(client).toHaveURL(/\/today$/)
    await client.getByRole('button', { name: 'Start workout', exact: true }).first().click()
    await expect(client.getByRole('heading', { name, exact: true })).toBeVisible()
    await client.getByRole('spinbutton', { name: 'Set 1 seconds', exact: true }).fill('40')
    await client.getByRole('spinbutton', { name: 'Set 1 RPE', exact: true }).fill('6')
    await client.getByRole('button', { name: 'Mark set 1 done', exact: true }).click()
    await expect(
      client.getByRole('button', { name: 'Mark set 1 incomplete', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(client.locator('.rest-timer')).toHaveCount(0)
    await client.reload()
    await expect(
      client.getByRole('spinbutton', { name: 'Set 1 seconds', exact: true }),
    ).toHaveValue('40')
    await client.getByRole('button', { name: 'Next exercise', exact: true }).click()
    await client.getByRole('spinbutton', { name: 'Set 1 metres', exact: true }).fill('450')
    await client.getByRole('button', { name: 'Mark set 1 done', exact: true }).click()
    await expect(client.getByRole('button', { name: 'Next round', exact: true })).toBeVisible()
    await client.screenshot({
      path: `artifacts/r1-distance-${info.project.name}.png`,
      fullPage: true,
      animations: 'disabled',
    })
    expect((await new AxeBuilder({ page: client }).analyze()).violations).toEqual([])
    await client.getByRole('button', { name: 'Finish session', exact: true }).click()
    await client.getByRole('button', { name: 'Finish with recorded sets', exact: true }).click()
    await expect(client.getByRole('status')).toContainText('Synced')
    const sessionId = client.url().split('/').pop()!
    await page.goto('/coach/review/' + sessionId)
    await expect(page.getByText('40 sec · RPE 6', { exact: true })).toBeVisible()
    await expect(page.getByText('450 m', { exact: true })).toBeVisible()
    await page.screenshot({
      path: `artifacts/r1-review-${info.project.name}.png`,
      fullPage: true,
      animations: 'disabled',
    })
  } finally {
    await context.close()
    await page.goto(clientPath)
    await page.getByRole('button', { name: 'Plan & schedule', exact: true }).click()
    await page
      .getByRole('combobox', { name: 'Published plan', exact: true })
      .selectOption('30000000-0000-4000-8000-000000000001')
    await page.getByRole('combobox', { name: 'Schedule', exact: true }).selectOption('flexible')
    await page.getByRole('button', { name: 'Apply assignment', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('Assignment updated')
  }
})
