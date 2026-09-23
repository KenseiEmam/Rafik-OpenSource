import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
const relationship = '40000000-0000-4000-8000-000000000001'
async function login(page: Page, coach = true) {
  await page.goto('/local-preview')
  await page.getByRole('button', { name: coach ? /Laila Khoury/ : /Amir Hassan/ }).click()
  await expect(page).toHaveURL(coach ? /\/coach$/ : /\/today$/)
}
async function clean(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})))
  })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
}
test('optional nutrition connects immutable guidance, saved food and corrected actual meals', async ({
  page,
  browser,
}, info) => {
  const title = `Rice bowl ${Date.now()}`
  await login(page)
  await page.goto('/coach/nutrition?client=' + relationship)
  await page
    .getByLabel('Meal guidance', { exact: true })
    .fill('Keep regular meals and choose food you enjoy.')
  await page.getByRole('button', { name: 'Save guidance', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Guidance saved')
  const context = await browser.newContext(),
    client = await context.newPage()
  await login(client, false)
  await client.goto('/nutrition')
  await client
    .getByRole('combobox', { name: 'Record visibility', exact: true })
    .selectOption(relationship)
  await expect(
    client.getByText('Keep regular meals and choose food you enjoy.', { exact: true }).first(),
  ).toBeVisible()
  await client.getByLabel('Food or meal name', { exact: true }).fill(title)
  await client.getByLabel('Amount eaten', { exact: true }).fill('150')
  await client.getByRole('combobox', { name: 'Portion unit', exact: true }).selectOption('g')
  await client.getByText('Nutrition details (optional)', { exact: true }).click()
  await client.getByLabel('Values below are per').fill('100')
  await client.getByLabel('Energy (kcal)', { exact: true }).fill('130')
  await client.getByRole('button', { name: 'Keep as saved food', exact: true }).click()
  await expect(client.getByRole('status')).toContainText('Saved to your foods')
  await client.getByRole('button', { name: 'Save meal', exact: true }).click()
  await expect(client.locator('.meal-row').filter({ hasText: title }).first()).toContainText(
    '195 kcal',
  )
  await client.reload()
  const row = client.locator('.meal-row').filter({ hasText: title }).first()
  await row.getByRole('button', { name: 'Edit meal', exact: true }).click()
  await client.getByLabel('Amount eaten', { exact: true }).fill('200')
  await client.getByRole('button', { name: 'Save correction', exact: true }).click()
  await expect(client.locator('.meal-row').filter({ hasText: title }).first()).toContainText(
    '260 kcal',
  )
  await clean(client)
  await client.screenshot({
    path: `artifacts/r3-nutrition-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  await page.reload()
  await expect(page.locator('.meal-row').filter({ hasText: title }).first()).toContainText(
    '260 kcal',
  )
  await clean(page)
  await client
    .locator('.meal-row')
    .filter({ hasText: title })
    .first()
    .getByRole('button', { name: 'Remove', exact: true })
    .click()
  await client.getByRole('button', { name: 'Confirm removal', exact: true }).click()
  await expect(client.locator('.meal-row').filter({ hasText: title }).first()).not.toBeVisible()
  await context.close()
})
test('appointment publishing and ambiguous booking retry lead to one rescheduled then cancelled booking', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(90000)
  const title = `Conversation ${Date.now()}`
  await login(page)
  await page.goto('/coach/appointments')
  await page.getByLabel('Appointment title', { exact: true }).fill(title)
  await page.getByLabel('Meeting details', { exact: true }).fill('Local preview studio')
  await page.getByLabel('Offer timezone', { exact: true }).fill('UTC')
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 90)
  d.setUTCHours(8, 0, 0, 0)
  await page
    .getByLabel('First local date and time', { exact: true })
    .fill(d.toISOString().slice(0, 16))
  await page.getByLabel('Number of slots', { exact: true }).fill('2')
  await page.getByRole('button', { name: 'Preview times', exact: true }).click()
  await page.getByRole('button', { name: 'Publish availability', exact: true }).click()
  await expect(page.locator('.slot-row').filter({ hasText: title })).toHaveCount(2)
  const context = await browser.newContext(),
    client = await context.newPage()
  await login(client, false)
  await client.goto('/appointments')
  let once = true
  await client.route('**/v1/commands/book_appointment', async (route) => {
    if (once) {
      once = false
      await route.fetch()
      await route.abort('failed')
    } else await route.continue()
  })
  await client
    .locator('.slot-row')
    .filter({ hasText: title })
    .first()
    .getByRole('button', { name: 'Book this time' })
    .click()
  // Wait for the injected lost acknowledgement, not merely the in-flight pending UI.
  await expect(client.getByRole('button', { name: 'Retry calendar change' })).toBeEnabled()
  await expect(client.getByRole('alert')).toBeVisible()
  await client.reload()
  await client.getByRole('button', { name: 'Retry calendar change' }).click()
  await expect(client.locator('.appointment-row').filter({ hasText: title })).toHaveCount(1)
  await client
    .locator('.appointment-row')
    .filter({ hasText: title })
    .getByRole('button', { name: 'Reschedule', exact: true })
    .click()
  const select = client.getByRole('combobox', { name: 'New time', exact: true })
  await select.selectOption({ index: 1 })
  await client.getByRole('button', { name: 'Confirm new time', exact: true }).click()
  await expect(client.getByRole('status')).toContainText('Calendar updated')
  await clean(client)
  await client.screenshot({
    path: `artifacts/r3-appointments-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  await client
    .locator('.appointment-row')
    .filter({ hasText: title })
    .getByRole('button', { name: 'Cancel appointment', exact: true })
    .click()
  await client.getByRole('button', { name: 'Confirm cancellation', exact: true }).click()
  await expect(client.locator('.appointment-row').filter({ hasText: title })).toHaveCount(0)
  await client.getByLabel('Include history').check()
  await expect(client.locator('.appointment-row').filter({ hasText: title })).toContainText(
    'Cancelled',
  )
  await page.reload()
  for (let i = 0; i < 2; i++)
    await page
      .locator('.slot-row')
      .filter({ hasText: title })
      .first()
      .getByRole('button', { name: 'Withdraw', exact: true })
      .click()
  await expect(page.locator('.slot-row').filter({ hasText: title })).toHaveCount(0)
  await context.close()
})
test('private file recovers lost finalization, shares real bytes, attaches, revokes and deletes', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(90000)
  const title = `Session guide ${Date.now()}`,
    content = 'A useful private guide for the next coaching conversation.'
  await login(page)
  await page.goto('/coach/resources')
  await page.getByLabel('Resource title', { exact: true }).fill(title)
  await page
    .getByLabel('Choose a file', { exact: true })
    .setInputFiles({ name: 'guide.txt', mimeType: 'text/plain', buffer: Buffer.from(content) })
  let once = true
  await page.route('**/v1/commands/finish_resource', async (route) => {
    if (once) {
      once = false
      await route.fetch()
      await route.abort('failed')
    } else await route.continue()
  })
  await page.getByRole('button', { name: 'Upload resource', exact: true }).click()
  await expect(page.locator('.resource-row').filter({ hasText: title })).toContainText('Ready')
  await page.reload()
  const resource = page.locator('.resource-row').filter({ hasText: title })
  const context = await browser.newContext(),
    client = await context.newPage()
  await login(client, false)
  await client.goto('/resources')
  await expect(client.locator('.resource-row').filter({ hasText: title })).toHaveCount(0)
  await resource
    .getByRole('combobox', { name: 'Share with', exact: true })
    .selectOption(relationship)
  await resource.getByRole('button', { name: 'Share resource', exact: true }).click()
  await expect(resource.locator('.resource-share')).toHaveCount(1)
  await client.reload()
  const download = client.waitForEvent('download')
  await client
    .locator('.resource-row')
    .filter({ hasText: title })
    .getByRole('button', { name: 'Download', exact: true })
    .click()
  const file = await download
  const stream = await file.createReadStream()
  let body = ''
  for await (const chunk of stream!) body += chunk
  expect(body).toBe(content)
  await clean(client)
  await page.screenshot({
    path: `artifacts/r3-resources-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  await resource.getByRole('link', { name: 'Attach in conversation' }).click()
  await expect(page.getByRole('combobox', { name: 'Attach a shared file' })).not.toHaveValue('')
  await page.getByLabel('Message', { exact: true }).fill(title)
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  await expect(page.locator('.message-bubble').filter({ hasText: title })).toContainText(title)
  await page.goto('/coach/resources')
  await page
    .locator('.resource-row')
    .filter({ hasText: title })
    .getByRole('button', { name: 'Revoke access' })
    .click()
  await client.reload()
  await expect(client.locator('.resource-row').filter({ hasText: title })).toHaveCount(0)
  await client.goto('/messages/' + relationship)
  await expect(
    client.locator('.message-bubble').filter({ hasText: title }).getByRole('button'),
  ).toBeDisabled()
  await resource.getByRole('button', { name: 'Delete resource', exact: true }).click()
  await resource.getByRole('button', { name: 'Confirm deletion', exact: true }).click()
  await expect(resource).toHaveCount(0)
  await expect(page.getByRole('status')).toContainText('File and resource record removed')
  await context.close()
})
