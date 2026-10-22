import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { layoutIssues } from './layout-contract'
import media from '../src/content/exercise-media.json' with { type: 'json' }
async function filters(page: import('@playwright/test').Page) {
  const back = page.getByRole('button', { name: 'All exercises', exact: true })
  if (await back.isVisible()) await back.click()
  const toggle = page.getByRole('button', { name: /^Filters/ })
  if ((await toggle.isVisible()) && (await toggle.getAttribute('aria-expanded')) === 'false')
    await toggle.click()
}
async function coach(page: import('@playwright/test').Page) {
  await page.goto('/local-preview')
  await page.getByRole('button', { name: /Laila Khoury/ }).click()
  await expect(page).toHaveURL(/\/coach$/)
  await page.goto('/coach/exercises')
  await expect(page.locator('.catalog-choice').first()).toBeVisible()
}
test('full library categories, bounded pages and later-page selection work across staff scopes', async ({
  page,
}) => {
  await coach(page)
  await expect(page.locator('.catalog-choice')).toHaveCount(24)
  await expect
    .poll(async () =>
      Number((await page.locator('.catalog-summary').innerText()).replace(/[^0-9]/g, '')),
    )
    .toBeGreaterThanOrEqual(1384)
  await page.getByRole('button', { name: 'Next page', exact: true }).click()
  const later = page.locator('.catalog-choice').nth(15)
  const label = await later.locator('strong').innerText()
  await later.click()
  await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible()
  await filters(page)
  await page.getByRole('combobox', { name: 'Body area', exact: true }).selectOption('chest')
  await page.getByRole('combobox', { name: 'Equipment', exact: true }).selectOption('dumbbell')
  await expect(page.locator('.catalog-choice').first()).toBeVisible()
  await expect(page.locator('.catalog-detail .catalog-tags')).toContainText('Chest')
  await page.getByLabel('Search exercises', { exact: true }).fill('zzznomatch')
  await expect(
    page.getByText('No exercises match. Try another name or clear the filters.'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await expect(page.locator('.catalog-choice')).toHaveCount(24)
  await page.goto('/local-preview')
  await page.getByRole('button', { name: /Kareem Nasser/ }).click()
  await expect(page).toHaveURL(/organization/)
  await page.goto('/organization/12000000-0000-4000-8000-000000000001/trainer/exercises')
  await filters(page)
  await page.getByRole('combobox', { name: 'Demonstration', exact: true }).selectOption('video')
  await expect(page.locator('.catalog-summary')).toContainText('45')
  await expect(page.locator('.catalog-choice')).toHaveCount(24)
})
test('continuous demonstration starts on selection, can pause and respects reduced motion', async ({
  page,
}, info) => {
  await coach(page)
  await filters(page)
  await page.getByRole('combobox', { name: 'Demonstration', exact: true }).selectOption('video')
  await page.getByLabel('Search exercises', { exact: true }).fill('Bench Press')
  await page.locator('.catalog-choice').first().click()
  const player = page.locator('.exercise-video video')
  await expect
    .poll(() => player.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0.1))
    .toBe(true)
  await page.getByRole('button', { name: 'Pause demonstration', exact: true }).click()
  await expect.poll(() => player.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true)
  await page.getByRole('button', { name: 'Play demonstration', exact: true }).click()
  await expect.poll(() => player.evaluate((v: HTMLVideoElement) => !v.paused)).toBe(true)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(() => player.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true)
  await page.getByRole('button', { name: 'Play demonstration', exact: true }).click()
  await expect.poll(() => player.evaluate((v: HTMLVideoElement) => !v.paused)).toBe(true)
  await page.screenshot({ path: `artifacts/r15-video-${info.project.name}.png`, fullPage: true })
})
test('video failure keeps instructions, offers retry and range streaming is valid', async ({
  page,
}) => {
  await coach(page)
  await page.route('**/exercise-videos/*.mp4', (route) => route.abort('failed'))
  await filters(page)
  await page.getByRole('combobox', { name: 'Demonstration', exact: true }).selectOption('video')
  await page.getByLabel('Search exercises', { exact: true }).fill('Bench Press')
  await page.locator('.catalog-choice').first().click()
  await expect(page.locator('.video-error')).toBeVisible()
  await expect(page.locator('.catalog-technique li').first()).toBeVisible()
  await page.unroute('**/exercise-videos/*.mp4')
  await page.getByRole('button', { name: 'Retry video', exact: true }).click()
  const player = page.locator('.exercise-video video')
  await expect.poll(() => player.evaluate((v: HTMLVideoElement) => !v.paused)).toBe(true)
  const src = await player.getAttribute('src')
  const response = await page.request.get(src!, { headers: { Range: 'bytes=0-99' } })
  expect(response.status()).toBe(206)
  expect((await response.body()).length).toBe(100)
  const invalid = await page.request.get(src!, { headers: { Range: 'bytes=999999999-' } })
  expect(invalid.status()).toBe(416)
})
test('exercise detail and category controls remain readable across phone, desktop, RTL and themes', async ({
  page,
}, info) => {
  await coach(page)
  for (const width of [320, 1280])
    for (const lang of ['en', 'ar'])
      for (const theme of ['light', 'dark']) {
        await page.setViewportSize({ width, height: width === 320 ? 568 : 900 })
        await page.evaluate(
          ({ lang, theme }) => {
            localStorage.setItem('rafik.locale', lang)
            localStorage.setItem('rafik.theme', theme)
          },
          { lang, theme },
        )
        await page.reload()
        // Use the actual locale switch if the saved preference key changes.
        const arabic = (await page.locator('html').getAttribute('dir')) === 'rtl'
        if (arabic !== (lang === 'ar'))
          await page
            .getByRole('button', { name: lang === 'ar' ? 'Switch to Arabic' : 'Switch to English' })
            .click()
        await expect(page.locator('.catalog-choice').first()).toBeVisible()
        expect(
          await page.evaluate(() => getComputedStyle(document.documentElement).transform),
        ).toBe('none')
        if (width === 320) {
          const firstBounds = await page.locator('.catalog-choice').first().boundingBox()
          expect(firstBounds!.y).toBeLessThan(568)
          await page.screenshot({
            path: `artifacts/r15-entry-${info.project.name}-${lang}-${theme}.png`,
          })
        }
        const toggle = page.getByRole('button', { name: lang === 'en' ? /^Filters/ : /^المرشحات/ })
        if (await toggle.isVisible()) await toggle.click()
        await page
          .getByRole('combobox', {
            name: lang === 'en' ? 'Demonstration' : 'الشرح المرئي',
            exact: true,
          })
          .selectOption('video')
        await page.locator('.catalog-choice').first().click()
        await expect(page.locator('.exercise-video video')).toBeVisible()
        await expect.poll(() => layoutIssues(page)).toEqual([])
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
        await page.screenshot({
          path: `artifacts/r15-catalog-${info.project.name}-${lang}-${theme}-${width}.png`,
          fullPage: true,
        })
        if (width === 320) {
          await page
            .getByRole('button', {
              name: lang === 'en' ? 'All exercises' : 'كل التمارين',
              exact: true,
            })
            .click()
          await expect(page.locator('.catalog-choice').first()).toBeFocused()
          await expect.poll(() => layoutIssues(page)).toEqual([])
        }
      }
})
test('reference positions need no step controls and retain image recovery and starter offline cache', async ({
  page,
}) => {
  await page.goto('/routine')
  await page.route('**/exercise-media/**/1.svg', (route) => route.abort('failed'))
  await page.reload()
  const demo = page.locator('.exercise-demo').first()
  await expect(demo.locator('.demo-frame-error')).toBeVisible()
  await page.unroute('**/exercise-media/**/1.svg')
  await demo.getByRole('button', { name: 'Retry images', exact: true }).click()
  await expect(demo.locator('.demo-positions img')).toHaveCount(3)
  await expect(page.getByRole('button', { name: 'Play steps', exact: true })).toHaveCount(0)
  const base = process.env.RAFIK_TEST_PREVIEW || 'http://127.0.0.1:5174'
  const worker = await page.request.get(base + '/sw.js'),
    script = await worker.text()
  for (const item of media.items)
    for (const frame of item.frames) expect(script).toContain(frame.path.replace('/v1/catalog', ''))
  expect(script).not.toMatch(/wger-[^"']+\.mp4/)
})
