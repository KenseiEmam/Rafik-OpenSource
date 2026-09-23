import { staticPreview } from './static-preview'
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
test('guest reaches value, records, reloads, and finishes without signup', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A clear plan')
  await page.screenshot({ path: `artifacts/home-${info.project.name}.png`, fullPage: true })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('link', { name: 'Try a workout', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Build your base' })).toBeVisible()
  await page.getByRole('button', { name: 'Start workout', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Full body A', exact: true })).toBeVisible()
  await page.getByRole('spinbutton', { name: 'Set 1 load', exact: true }).fill('9')
  await page.getByRole('spinbutton', { name: 'Set 1 reps', exact: true }).fill('11')
  await page.getByRole('button', { name: 'Mark set 1 done', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Mark set 1 incomplete', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(page.getByRole('spinbutton', { name: 'Set 1 load', exact: true })).toHaveValue('9')
  await expect(page.getByRole('spinbutton', { name: 'Set 1 reps', exact: true })).toHaveValue('11')
  await page.screenshot({ path: `artifacts/logger-${info.project.name}.png`, fullPage: true })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('button', { name: 'Finish session', exact: true }).click()
  await page.getByRole('button', { name: 'Finish with recorded sets', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Session complete.', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save to my account', exact: true })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Saved on this device')
  expect(errors).toEqual([])
})
test('Arabic sample and dark theme remain readable and fit the viewport', async ({
  page,
}, info) => {
  await page.goto('/routine')
  await page.getByRole('button', { name: 'Switch to Arabic' }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await page.getByRole('combobox', { name: 'المظهر' }).selectOption('dark')
  await page.screenshot({
    path: `artifacts/routine-ar-dark-${info.project.name}.png`,
    fullPage: true,
  })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('button', { name: 'ابدأ التمرين', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('كامل الجسم')
  await page.screenshot({
    path: `artifacts/logger-ar-dark-${info.project.name}.png`,
    fullPage: true,
  })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test('coach publishes and invites; verified client trains; coach replies', async ({
  page,
  browser,
  request,
}, info) => {
  const email = `pilot-${crypto.randomUUID()}@rafik.test`
  const title = `Steady strength ${Date.now()}`
  await page.goto('/local-preview')
  await page.getByRole('button', { name: /Laila Khoury/ }).click()
  await expect(page).toHaveURL(/\/coach$/)
  await page.goto('/coach/plans/new')
  await page.getByLabel('Plan name', { exact: true }).fill(title)
  await page.getByRole('button', { name: 'Client preview', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Goblet squat', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Edit plan', exact: true }).click()
  await page.screenshot({ path: `artifacts/editor-${info.project.name}.png`, fullPage: true })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('button', { name: 'Publish plan', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Published.')
  await page.goto('/coach/clients')
  await page.getByLabel('Client email', { exact: true }).fill(email)
  await page.getByLabel('Published plan', { exact: true }).selectOption({ label: title + ' · 1' })
  await page.getByRole('button', { name: 'Create invitation link' }).click()
  const invite = page.getByRole('textbox', { name: 'Share this link with your client' })
  await expect(invite).toBeVisible()
  const link = await invite.inputValue()
  await page.screenshot({ path: `artifacts/clients-${info.project.name}.png`, fullPage: true })
  const clientContext = await browser.newContext({
    viewport:
      info.project.name === 'webkit-phone'
        ? { width: 390, height: 844 }
        : { width: 1280, height: 900 },
  })
  const client = await clientContext.newPage()
  await client.goto(link)
  await expect(client.getByText('Laila Khoury', { exact: true })).toBeVisible()
  await client.getByRole('button', { name: 'Verify my email' }).click()
  await client.getByLabel('Email address', { exact: true }).fill(email)
  await client.getByRole('button', { name: 'Send me a code' }).click()
  await expect(client.getByRole('heading', { name: 'Check your email' })).toBeVisible()
  let messageId = ''
  await expect
    .poll(async () => {
      const inbox = await (await request.get('http://127.0.0.1:55324/api/v1/messages')).json()
      messageId =
        inbox.messages.find((m: any) => m.To?.some((p: any) => p.Address === email))?.ID || ''
      return messageId
    })
    .not.toBe('')
  const mail = await (
    await request.get('http://127.0.0.1:55324/api/v1/message/' + messageId)
  ).json()
  const code = (mail.Text || mail.HTML).match(/\b\d{6}\b/)?.[0]
  expect(code).toBeTruthy()
  await client.getByLabel('Sign-in code').fill(code)
  await client.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(client).toHaveURL(/\/invite\//)
  await client.getByRole('button', { name: /Accept/ }).click()
  await expect(client).toHaveURL(/\/today$/)
  await client.getByRole('button', { name: 'Start workout', exact: true }).first().click()
  await client.getByRole('spinbutton', { name: 'Set 1 load', exact: true }).fill('7')
  await client.getByRole('button', { name: 'Mark set 1 done', exact: true }).click()
  await client.getByRole('button', { name: 'Finish session', exact: true }).click()
  await client.getByRole('button', { name: 'Finish with recorded sets', exact: true }).click()
  await expect(client.getByRole('status')).toContainText('Synced with your account')
  const workoutUrl = client.url()
  await client.getByLabel('Note for your coach').fill('Last repetitions felt controlled.')
  await client.getByRole('heading', { name: 'Session complete.' }).click()
  await expect(client.getByRole('status')).toContainText('Synced with your account')
  await page.goto('/coach')
  await page.getByRole('searchbox', { name: 'Find a client or update' }).fill(email.split('@')[0]!)
  await page
    .getByRole('link')
    .filter({ hasText: 'Last repetitions felt controlled.' })
    .filter({ hasText: email.split('@')[0] })
    .click()
  await expect(page.getByText('7 kg × 10', { exact: true })).toBeVisible()
  await page
    .getByLabel('Coach feedback')
    .fill('Keep the same load next time and focus on a steady pace.')
  await page.getByRole('button', { name: 'Save review' }).click()
  await expect(page.getByRole('status')).toContainText('Review saved')
  await page.screenshot({ path: `artifacts/review-${info.project.name}.png`, fullPage: true })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await client.goto(workoutUrl)
  await expect(
    client.getByText('Keep the same load next time and focus on a steady pace.'),
  ).toBeVisible()
  await client.getByRole('button', { name: 'Correct recorded sets' }).click()
  await client.getByRole('spinbutton', { name: 'Set 1 reps', exact: true }).fill('9')
  await client.getByRole('button', { name: 'Save correction' }).click()
  await client.getByRole('button', { name: 'Finish with recorded sets' }).click()
  await expect(client.getByRole('status')).toContainText('Synced with your account')
  await client.screenshot({ path: `artifacts/result-${info.project.name}.png`, fullPage: true })
  await clientContext.close()
})

test('offline saves and lost acknowledgments recover; concurrent devices preserve conflicts', async ({
  page,
  context,
  browser,
}) => {
  await page.goto('/local-preview')
  await page.getByRole('button', { name: /Amir Hassan/ }).click()
  await expect(page).toHaveURL(/\/today$/)
  await page.goto('/routine')
  await page.getByRole('button', { name: 'Start workout', exact: true }).click()
  await expect(page.getByRole('spinbutton', { name: 'Set 1 load', exact: true })).toBeVisible()
  const url = page.url()
  await context.setOffline(true)
  await page.getByRole('spinbutton', { name: 'Set 1 load', exact: true }).fill('13')
  await page.getByRole('button', { name: 'Mark set 1 done', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Waiting to sync')
  await context.setOffline(false)
  await expect(page.getByRole('status')).toContainText('Synced with your account')
  let lost = false
  await page.route('**/rest/v1/rpc/save_session', async (route) => {
    if (!lost) {
      lost = true
      await route.fetch()
      await route.abort('failed')
    } else await route.continue()
  })
  await page.getByRole('spinbutton', { name: 'Set 1 reps', exact: true }).fill('14')
  await expect(page.getByRole('status')).toContainText('Sync needs attention')
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Synced with your account')
  await page.unroute('**/rest/v1/rpc/save_session')
  const otherContext = await browser.newContext()
  const other = await otherContext.newPage()
  await other.goto('http://127.0.0.1:5173/local-preview')
  await other.getByRole('button', { name: /Amir Hassan/ }).click()
  await expect(other).toHaveURL(/\/today$/)
  await other.goto(url)
  await expect(other.getByRole('spinbutton', { name: 'Set 1 reps', exact: true })).toHaveValue('14')
  await page.getByRole('spinbutton', { name: 'Set 1 reps', exact: true }).fill('15')
  await expect(page.getByRole('status')).toContainText('Synced with your account')
  await other.getByRole('spinbutton', { name: 'Set 1 reps', exact: true }).fill('16')
  await expect(
    other.getByText('Another device saved a newer version.', { exact: true }),
  ).toBeVisible()
  await expect(other.getByRole('spinbutton', { name: 'Set 1 reps', exact: true })).toHaveValue('16')
  await other.getByRole('button', { name: 'Load latest version' }).click()
  await expect(other.getByRole('spinbutton', { name: 'Set 1 reps', exact: true })).toHaveValue('15')
  await otherContext.close()
})

test('production shell reloads an opened guest workout while offline', async ({
  page,
  context,
  browserName,
}, info) => {
  const isolated = browserName === 'webkit' ? await staticPreview() : undefined
  if (isolated)
    info.annotations.push({
      type: 'network simulation',
      description:
        'WebKit: shut down a test-owned production static server; its offline-emulation mode returns an internal navigation error before service-worker fallback.',
    })
  try {
    await page.addInitScript(() => {
      window.name = crypto.randomUUID()
    })
    await page.goto((isolated?.origin || 'http://127.0.0.1:5174') + '/routine')
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true))
    await expect
      .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
      .toBeTruthy()
    await page.getByRole('button', { name: 'Start workout', exact: true }).click()
    await page.getByRole('spinbutton', { name: 'Set 1 reps', exact: true }).fill('17')
    await page.getByRole('button', { name: 'Mark set 1 done', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'Mark set 1 incomplete', exact: true }),
    ).toBeVisible()
    const boot = await page.evaluate(() => window.name)
    if (isolated) await isolated.stop()
    else await context.setOffline(true)
    await page.reload()
    expect(await page.evaluate(() => window.name)).not.toBe(boot)
    await expect(page.getByRole('spinbutton', { name: 'Set 1 reps', exact: true })).toHaveValue(
      '17',
    )
    await page.getByRole('spinbutton', { name: 'Set 2 reps', exact: true }).fill('12')
    await page.getByRole('button', { name: 'Mark set 2 done', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('Saved on this device')
    await page.reload()
    await expect(page.getByRole('spinbutton', { name: 'Set 2 reps', exact: true })).toHaveValue(
      '12',
    )
  } finally {
    await context.setOffline(false)
    await isolated?.stop()
  }
})

test('guest account save returns to the completed session and adopts it automatically', async ({
  page,
  request,
}) => {
  const email = `guest-${crypto.randomUUID()}@rafik.test`
  await page.goto('/routine')
  await page.getByRole('button', { name: 'Start workout', exact: true }).click()
  await page.getByRole('spinbutton', { name: 'Set 1 load', exact: true }).fill('5.5')
  await page.getByRole('button', { name: 'Mark set 1 done', exact: true }).click()
  await page.getByRole('button', { name: 'Finish session', exact: true }).click()
  await page.getByRole('button', { name: 'Finish with recorded sets' }).click()
  const path = new URL(page.url()).pathname
  await page.getByRole('button', { name: 'Save to my account' }).click()
  await page.getByLabel('Email address', { exact: true }).fill(email)
  await page.getByRole('button', { name: 'Send me a code' }).click()
  await expect(page.getByLabel('Sign-in code')).toBeVisible()
  let messageId = ''
  await expect
    .poll(async () => {
      const inbox = await (await request.get('http://127.0.0.1:55324/api/v1/messages')).json()
      messageId =
        inbox.messages.find((m: any) => m.To?.some((p: any) => p.Address === email))?.ID || ''
      return messageId
    })
    .not.toBe('')
  const mail = await (
    await request.get('http://127.0.0.1:55324/api/v1/message/' + messageId)
  ).json()
  const code = (mail.Text || mail.HTML).match(/\b\d{6}\b/)[0]
  await page.getByLabel('Sign-in code').fill(code)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page).toHaveURL('http://127.0.0.1:5173' + path)
  await expect(page.getByRole('heading', { name: 'Session complete.' })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Synced with your account')
  await expect(page.getByRole('button', { name: 'Save to my account' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Correct recorded sets' }).click()
  await expect(page.getByRole('spinbutton', { name: 'Set 1 load', exact: true })).toHaveValue('5.5')
})

test('plan drafts recover after interruption and failed publication', async ({ page }) => {
  await page.goto('/local-preview')
  await page.getByRole('button', { name: /Laila Khoury/ }).click()
  await expect(page).toHaveURL(/\/coach$/)
  await page.goto('/coach/plans/new')
  await page.getByLabel('Plan name', { exact: true }).fill('Recoverable strength plan')
  await page.getByLabel('Plan name', { exact: true }).blur()
  await page.reload()
  await expect(page.getByLabel('Plan name', { exact: true })).toHaveValue(
    'Recoverable strength plan',
  )
  await expect(
    page.getByText('Your local draft has been restored.', { exact: false }),
  ).toBeVisible()
  await page.route('**/rest/v1/rpc/save_plan', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Test connection unavailable' }),
    }),
  )
  await page.getByRole('button', { name: 'Publish plan', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByLabel('Plan name', { exact: true })).toHaveValue(
    'Recoverable strength plan',
  )
  await page.unroute('**/rest/v1/rpc/save_plan')
  await page.getByRole('button', { name: 'Publish plan', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Published.')
})

test('invalid set values cannot be marked complete, and keyboard skip navigation works', async ({
  page,
  browserName,
}) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A clear plan')
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
  await page.goto('/routine')
  await page.getByRole('button', { name: 'Start workout', exact: true }).click()
  await page.getByRole('spinbutton', { name: 'Set 1 reps', exact: true }).fill('-1')
  await expect(page.getByRole('button', { name: 'Mark set 1 done', exact: true })).toBeDisabled()
  await expect(page.getByRole('alert')).toContainText('valid number')
  await page.getByRole('spinbutton', { name: 'Set 1 reps', exact: true }).fill('12')
  await page.getByRole('button', { name: 'Mark set 1 done', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Mark set 1 incomplete', exact: true }),
  ).toBeVisible()
})
