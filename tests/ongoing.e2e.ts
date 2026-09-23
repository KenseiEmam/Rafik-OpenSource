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
test('check-in moves through draft, submission, review, correction and contextual conversation', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(100000)
  const title = `Weekly reflection ${Date.now()}`
  await login(page)
  await page.goto('/coach/forms/new')
  await page.getByLabel('Template title', { exact: true }).fill(title)
  await page.getByRole('button', { name: 'Save template', exact: true }).click()
  await expect(page).toHaveURL(/\/coach\/forms\/(?!new)/)
  await page.goto('/coach/checkins')
  await page.getByRole('combobox', { name: 'Assign to', exact: true }).selectOption(relationship)
  await page
    .getByRole('combobox', { name: 'Template', exact: true })
    .selectOption({ label: title + ' · v1' })
  await page.getByRole('button', { name: 'Assign form', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Assigned.')
  const link = page.locator('.request-row').filter({ hasText: title }).first()
  const href = await link.getAttribute('href')
  expect(href).toBeTruthy()
  const clientContext = await browser.newContext()
  const client = await clientContext.newPage()
  await login(client, false)
  await client.goto('/checkins/' + href!.split('/').pop())
  await client
    .getByLabel('How did training feel this week?')
    .fill('Felt steady. The second session was harder.')
  await client.getByRole('button', { name: 'Save draft', exact: true }).click()
  await expect(client.getByRole('status')).toContainText('Draft saved')
  await client.reload()
  await expect(client.getByLabel('How did training feel this week?')).toHaveValue(
    'Felt steady. The second session was harder.',
  )
  await client.getByLabel('Energy, from 1 (low) to 5 (high)').fill('3')
  await client.getByRole('button', { name: 'Submit response', exact: true }).click()
  await expect(client.getByRole('status')).toContainText('Response submitted')
  await page.goto(href!)
  await expect(page.locator('.answer-row').first()).toContainText('Felt steady.')
  await page
    .getByLabel('Feedback for your client')
    .fill('Keep the next session comfortable. We can adjust the second day.')
  await page.getByRole('button', { name: 'Save review', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Review saved')
  await page.screenshot({
    path: `artifacts/r2-review-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  await clean(page)
  await client.reload()
  await expect(client.locator('.coach-feedback')).toContainText(
    'Keep the next session comfortable.',
  )
  await client.getByLabel('Energy, from 1 (low) to 5 (high)').fill('4')
  await client.getByRole('button', { name: 'Save correction', exact: true }).click()
  await expect(client.locator('.coach-feedback')).toHaveCount(0)
  await client.getByRole('link', { name: 'Discuss this response' }).click()
  await client.getByLabel('Message', { exact: true }).fill('Could we move the second workout?')
  await client.getByRole('button', { name: 'Send message', exact: true }).click()
  await expect(client.getByRole('status')).toContainText('Message sent.')
  await page.goto('/coach')
  await page.getByRole('combobox', { name: 'Show', exact: true }).selectOption('message')
  await expect(page.locator('.attention-panel')).toContainText('Unread messages')
  await page.goto('/coach/messages/' + relationship)
  await expect(page.locator('.message-log')).toContainText('Could we move the second workout?')
  await page
    .getByLabel('Message', { exact: true })
    .fill('Yes, I can adjust the schedule from your plan.')
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Message sent.')
  await page.screenshot({
    path: `artifacts/r2-messages-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  await clean(page)
  await client.reload()
  await expect(client.locator('.message-log')).toContainText('Yes, I can adjust the schedule')
  await clientContext.close()
  await page.getByRole('button', { name: 'Switch to Arabic' }).click()
  await page.getByRole('combobox', { name: 'المظهر' }).selectOption('dark')
  await page.screenshot({
    path: `artifacts/r2-messages-ar-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  await clean(page)
})
test('assessment scheduling, cancellation and comparable results are real records', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(90000)
  await login(page)
  const title = `Hold assessment ${Date.now()}`
  await page.goto('/coach/forms/new')
  await page.getByRole('button', { name: 'Use assessment starter' }).click()
  await page.getByLabel('Template title', { exact: true }).fill(title)
  await page.getByRole('button', { name: 'Save template', exact: true }).click()
  await expect(page).toHaveURL(/\/coach\/forms\/(?!new)/)
  await page.goto('/coach/checkins')
  await page.getByRole('combobox', { name: 'Assign to', exact: true }).selectOption(relationship)
  await page
    .getByRole('combobox', { name: 'Template', exact: true })
    .selectOption({ label: title + ' · v1' })
  await page.getByLabel('Occurrences', { exact: true }).fill('3')
  await page.getByRole('button', { name: 'Assign form', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Assigned.')
  const links = page.locator('.request-row').filter({ hasText: title })
  await expect(links).toHaveCount(3)
  const paths = await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')!))
  const cc = await browser.newContext()
  const client = await cc.newPage()
  await login(client, false)
  for (const [i, path] of paths.slice(0, 2).entries()) {
    await client.goto(path.replace('/coach', ''))
    await client.getByLabel('Hold duration').fill(String(35 + i * 5))
    await client.getByRole('button', { name: 'Submit response', exact: true }).click()
    await expect(client.getByRole('status')).toContainText('Response submitted')
  }
  await client.reload()
  await expect(client.locator('.comparison-entry')).toContainText('35 s')
  await clean(client)
  await page.goto(paths[2]!)
  await page.getByRole('button', { name: 'Cancel this occurrence' }).click()
  await page.getByRole('button', { name: 'Confirm cancellation' }).click()
  await expect(page.locator('.page-heading')).toContainText('This request was cancelled.')
  await page.goto(paths[1]!)
  await expect(page.locator('.comparison-entry')).toContainText('35 s')
  await page.screenshot({
    path: `artifacts/r2-assessment-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  await cc.close()
})
test('progress and private/shared measurement correction survive reload', async ({
  page,
  browser,
}, info) => {
  await login(page, false)
  await page.goto('/progress')
  await expect(page.locator('.progress-summary strong')).not.toHaveText('0')
  await page.getByLabel('Value', { exact: true }).fill('74.5')
  await page.getByRole('combobox', { name: 'Share with', exact: true }).selectOption(relationship)
  await page.getByRole('button', { name: 'Save measurement', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Measurement saved')
  const row = page.locator('.measurement-row').filter({ hasText: '74.5 kg' }).first()
  await row.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByLabel('Value', { exact: true }).fill('74.2')
  await page.getByRole('button', { name: 'Save correction', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Measurement saved')
  await page.reload()
  await expect(
    page.locator('.measurement-row').filter({ hasText: '74.2 kg' }).first(),
  ).toBeVisible()
  await clean(page)
  await page.screenshot({
    path: `artifacts/r2-progress-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  const cc = await browser.newContext()
  const coach = await cc.newPage()
  await login(coach)
  await coach.goto('/coach/clients/' + relationship + '/progress')
  await expect(
    coach.locator('.measurement-row').filter({ hasText: '74.2 kg' }).first(),
  ).toBeVisible()
  await cc.close()
  await page
    .locator('.measurement-row')
    .filter({ hasText: '74.2 kg' })
    .first()
    .getByRole('button', { name: 'Remove', exact: true })
    .click()
  await page.getByRole('button', { name: 'Confirm removal' }).click()
  await page.getByRole('button', { name: 'Switch to Arabic' }).click()
  await page.getByRole('combobox', { name: 'المظهر' }).selectOption('dark')
  await clean(page)
  await page.screenshot({
    path: `artifacts/r2-progress-ar-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
})
test('ambiguous message delivery retries the saved ID after reload without duplicates', async ({
  page,
}) => {
  await login(page, false)
  await page.goto('/messages/' + relationship)
  const body = `Retry message ${Date.now()}`
  await page.getByLabel('Message', { exact: true }).fill(body)
  let once = true
  await page.route('**/v1/commands/send_message', async (route) => {
    if (once) {
      once = false
      await route.fetch()
      await route.abort('failed')
    } else await route.continue()
  })
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Retry send' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Retry send' })).toBeVisible()
  await page.getByRole('button', { name: 'Retry send' }).click()
  await expect(page.getByRole('status')).toContainText('Message sent.')
  await expect(page.locator('.message-bubble').filter({ hasText: body })).toHaveCount(1)
})

test('assignment retry survives a lost acknowledgement and rejected messages remain editable', async ({
  page,
}) => {
  await login(page)
  await page.goto('/coach/checkins')
  await page.getByRole('combobox', { name: 'Assign to', exact: true }).selectOption(relationship)
  await page
    .getByRole('combobox', { name: 'Template', exact: true })
    .selectOption('72000000-0000-4000-8000-000000000001')
  // Count all occurrences, including reviewed history, so the assertion survives earlier manual use.
  await page.getByRole('combobox', { name: 'Show', exact: true }).selectOption('all')
  const before = Number((await page.locator('.request-total').innerText()).split(' ')[0])
  let once = true
  await page.route('**/v1/commands/assign_coaching_form', async (route) => {
    if (once) {
      once = false
      await route.fetch()
      await route.abort('failed')
    } else await route.continue()
  })
  await page.getByRole('button', { name: 'Assign form', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Assign to', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Assign form', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Assigned.')
  await page.getByRole('combobox', { name: 'Show', exact: true }).selectOption('all')
  await page.getByRole('searchbox', { name: 'Find a request' }).fill('')
  await expect(page.locator('.request-total')).toHaveText(`${before + 1} requests`)
  await page.goto(
    '/coach/messages/' + relationship + '?session=00000000-0000-4000-8000-000000000001',
  )
  await page.getByLabel('Message', { exact: true }).fill('Context validation test')
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByLabel('Message', { exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Remove link', exact: true }).click()
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Message sent.')
})
