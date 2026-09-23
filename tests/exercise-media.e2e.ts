import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { layoutIssues } from './layout-contract'
import media from '../src/content/exercise-media.json' with { type: 'json' }

test('exercise illustrations stay sharp, controllable and reachable across staff roles and public training', async ({
  page,
}, info) => {
  await page.goto('/local-preview')
  await page.getByRole('button', { name: /Laila Khoury/ }).click()
  await expect(page).toHaveURL(/\/coach$/)
  await page.goto('/coach/exercises')
  await page.getByLabel('Search exercises', { exact: true }).fill('Goblet squat')
  const demo = page.locator('.exercise-demo')
  await demo.getByText('See movement', { exact: true }).click()
  const illustration = demo.locator('.demo-stage img')
  await expect(illustration).toHaveAttribute('alt', 'Goblet squat · Position 1 / 3')
  await expect
    .poll(() => illustration.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBe(512)
  await demo.getByRole('button', { name: 'Next position', exact: true }).click()
  await expect(illustration).toHaveAttribute('alt', 'Goblet squat · Position 2 / 3')
  await demo.getByRole('button', { name: 'Play steps', exact: true }).click()
  await expect(demo.getByRole('button', { name: 'Pause', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await demo.getByRole('button', { name: 'Pause', exact: true }).click()
  for (const size of [
    { width: 1280, height: 800 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(size)
    await expect.poll(() => layoutIssues(page)).toEqual([])
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.screenshot({ path: `artifacts/r14-media-${info.project.name}.png`, fullPage: true })
  await page.goto('/local-preview')
  await page.getByRole('button', { name: /Kareem Nasser/ }).click()
  await expect(page).toHaveURL(/organization/)
  await page.goto('/organization/12000000-0000-4000-8000-000000000001/trainer/exercises')
  await page.getByLabel('Search exercises', { exact: true }).fill('Goblet squat')
  await page.getByText('See movement', { exact: true }).click()
  await expect(page.locator('.demo-stage img')).toBeVisible()
  await page.goto('/routine')
  await page.locator('.exercise-demo').first().getByText('See movement', { exact: true }).click()
  await expect(page.locator('.demo-stage img')).toBeVisible()
})

test('illustration failures preserve instructions and a retry; the complete static pack is in the production cache', async ({
  page,
}) => {
  await page.goto('/routine')
  await page.route('**/exercise-media/**/1.svg', (route) => route.abort('failed'))
  const demo = page.locator('.exercise-demo').first()
  await demo.getByText('See movement', { exact: true }).click()
  await expect(demo.getByRole('status')).toContainText('Illustration unavailable')
  await page.unroute('**/exercise-media/**/1.svg')
  await demo.getByRole('button', { name: 'Try image again', exact: true }).click()
  await expect(demo.locator('.demo-stage img')).toBeVisible()
  // Build-time cache contract, independent of the test engine's service-worker support.
  const base = process.env.RAFIK_TEST_PREVIEW || 'http://127.0.0.1:5174'
  const worker = await page.request.get(base + '/sw.js')
  const script = await worker.text()
  for (const item of media.items)
    for (const frame of item.frames) expect(script).toContain(frame.path.replace('/v1/catalog', ''))
})
