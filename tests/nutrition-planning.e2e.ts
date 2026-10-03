import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { layoutIssues } from './layout-contract'
const relationship = '40000000-0000-4000-8000-000000000001'
async function login(page: Page, name = 'Laila Khoury') {
  await page.goto('/local-preview?legacy=1')
  await page.getByRole('button', { name: new RegExp(name) }).click()
  await expect(page).toHaveURL(name === 'Laila Khoury' ? /\/coach$/ : /\/today$/)
}
test('coach plans an actionable example day; trainee records actual portions with recoverable publication', async ({
  page,
  browser,
}, info) => {
  await login(page)
  await page.goto('/coach/nutrition?client=' + relationship)
  await page.getByText('Calculate grams from a calorie budget', { exact: true }).click()
  await page.getByLabel('Calorie budget (kcal)', { exact: true }).fill('2000')
  await page.getByLabel('Protein (%)', { exact: true }).fill('25')
  await page.getByLabel('Fat (%)', { exact: true }).fill('30')
  await page.getByRole('button', { name: 'Apply to targets', exact: true }).click()
  await expect(page.getByLabel('Protein (g)', { exact: true })).toHaveValue('125')
  await expect(page.getByLabel('Carbohydrate (g)', { exact: true })).toHaveValue('225')
  await page.getByText('Add food to example day', { exact: true }).click()
  await page.getByRole('combobox', { name: 'Suggested meal', exact: true }).selectOption('lunch')
  await page.getByLabel('Find a food', { exact: true }).fill('rice')
  await page.locator('.food-results button').filter({ hasText: /rice/i }).click()
  await page.getByLabel('Suggested amount (g)', { exact: true }).fill('150')
  await page.getByRole('button', { name: 'Add to example day', exact: true }).click()
  await expect(page.locator('.meal-plan-editor')).toContainText('195 kcal')
  let dropped = false
  await page.route('**/v1/commands/save_nutrition_guidance', async (route) => {
    if (!dropped) {
      dropped = true
      await route.fetch()
      await route.abort('failed')
    } else await route.continue()
  })
  await page.getByRole('button', { name: 'Save nutrition plan', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Retry saved change', exact: true })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Client', exact: true })).toBeDisabled()
  await page.reload()
  await page.getByRole('button', { name: 'Retry saved change', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Guidance saved' })).toBeVisible()
  await page.getByRole('button', { name: 'Food record & history', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Suggested meals', exact: true })).toBeVisible()
  const context = await browser.newContext(),
    client = await context.newPage()
  await login(client, 'Amir Hassan')
  await client.goto('/nutrition')
  await client
    .getByRole('combobox', { name: 'Record visibility', exact: true })
    .selectOption(relationship)
  await expect(client.locator('.nutrition-totals')).toContainText('Daily target 2000')
  await client.getByRole('button', { name: 'Use for meal entry', exact: true }).last().click()
  await expect(client.getByLabel('Amount eaten', { exact: true })).toHaveValue('150')
  await client.getByLabel('Amount eaten', { exact: true }).fill('200')
  const mealName = 'Actual rice ' + crypto.randomUUID()
  await client.getByLabel('Food or meal name', { exact: true }).fill(mealName)
  let mealDropped = false
  await client.route('**/v1/commands/save_meal', async (route) => {
    if (!mealDropped) {
      mealDropped = true
      await route.fetch()
      await route.abort('failed')
    } else await route.continue()
  })
  await client.getByRole('button', { name: 'Save meal', exact: true }).click()
  await expect(
    client.getByRole('button', { name: 'Retry saved change', exact: true }),
  ).toBeVisible()
  await client.reload()
  await client.getByRole('button', { name: 'Retry saved change', exact: true }).click()
  const actual = client.locator('article.meal-row').filter({ hasText: mealName })
  await expect(actual).toHaveCount(1)
  await expect(actual).toContainText('260 kcal')
  await page.reload()
  await page.getByRole('button', { name: 'Food record & history', exact: true }).click()
  await expect(page.locator('article.meal-row').filter({ hasText: mealName })).toContainText(
    '260 kcal',
  )
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.screenshot({
    path: `artifacts/r14-nutrition-${info.project.name}.png`,
    fullPage: true,
  })
  await context.close()
})

test('food lookup failure preserves manual entry and recovers; macro helper does not invent a budget', async ({
  page,
}) => {
  await login(page, 'Amir Hassan')
  await page.goto('/nutrition')
  await page.route('**/v1/catalog/foods', (route) => route.abort('failed'))
  await page.getByRole('button', { name: 'Choose from food library', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Food library unavailable')
  await page.getByLabel('Food or meal name', { exact: true }).fill('My labelled meal')
  await page.unroute('**/v1/catalog/foods')
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await page.getByLabel('Find a food', { exact: true }).fill('olive')
  await page.locator('.food-results button').filter({ hasText: /olive/i }).click()
  await expect(page.getByLabel('Amount eaten', { exact: true })).toHaveValue('100')
  await expect(page.locator('#meal-editor')).toContainText('884 kcal')
  await page.getByRole('combobox', { name: 'Portion unit', exact: true }).selectOption('serving')
  await expect(page.locator('#meal-editor')).not.toContainText('884 kcal')
})

test('nutrition drafts follow visibility and date; unfinished helpers do not prevent publishing', async ({
  page,
}) => {
  await login(page, 'Amir Hassan')
  await page.goto('/nutrition')
  const name = page.getByLabel('Food or meal name', { exact: true })
  await name.fill('Private draft')
  await page
    .getByRole('combobox', { name: 'Record visibility', exact: true })
    .selectOption(relationship)
  await expect(name).toHaveValue('')
  await name.fill('Shared draft')
  await page.getByRole('combobox', { name: 'Record visibility', exact: true }).selectOption('')
  await expect(name).toHaveValue('Private draft')
  const date = page.getByLabel('Date', { exact: true }),
    today = await date.inputValue()
  await date.fill('2026-01-02')
  await date.blur()
  await expect(name).toHaveValue('')
  await name.fill('Earlier draft')
  await date.fill(today)
  await date.blur()
  await expect(name).toHaveValue('Private draft')
  await page.reload()
  await expect(name).toHaveValue('Private draft')
  await login(page)
  await page.goto('/coach/nutrition?client=' + relationship)
  await page.getByLabel('Meal guidance', { exact: true }).fill('Client-specific draft')
  const clients = page.getByRole('combobox', { name: 'Client', exact: true })
  await clients.selectOption('')
  await clients.selectOption(relationship)
  await expect(page.getByLabel('Meal guidance', { exact: true })).toHaveValue(
    'Client-specific draft',
  )
  await page.getByText('Calculate grams from a calorie budget', { exact: true }).click()
  await page.getByLabel('Calorie budget (kcal)', { exact: true }).fill('unfinished')
  await page.getByText('Add food to example day', { exact: true }).click()
  await page.getByLabel('Use a food label or custom meal', { exact: true }).check()
  await page.getByLabel('Suggested amount', { exact: true }).fill('-3')
  await page.getByRole('button', { name: 'Save nutrition plan', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Guidance saved' })).toBeVisible()
})

test('nutrition helpers and exercise viewer remain usable in English/Arabic and both themes', async ({
  page,
}, info) => {
  test.setTimeout(180000)
  await login(page)
  for (const lang of ['en', 'ar'])
    for (const theme of ['light', 'dark'])
      for (const width of [320, 1280]) {
        await page.setViewportSize({ width, height: width === 320 ? 568 : 900 })
        await page.evaluate(
          ({ lang, theme }) => {
            localStorage.setItem('rafik.locale', lang)
            localStorage.setItem('rafik.theme', theme)
          },
          { lang, theme },
        )
        await page.goto('/coach/nutrition?client=' + relationship)
        await page
          .getByText(
            lang === 'en'
              ? 'Calculate grams from a calorie budget'
              : 'احسب الغرامات من السعرات المحددة',
            { exact: true },
          )
          .click()
        await page
          .getByText(lang === 'en' ? 'Add food to example day' : 'إضافة طعام لليوم المقترح', {
            exact: true,
          })
          .click()
        await expect(page.locator('.food-results button').first()).toBeVisible()
        await expect.poll(() => layoutIssues(page)).toEqual([])
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
        await page.locator('.nutrition-workspace h1').scrollIntoViewIfNeeded()
        await page.screenshot({
          path: `artifacts/r14-nutrition-${info.project.name}-${lang}-${theme}-${width}.png`,
          fullPage: true,
        })
        await page.goto('/coach/exercises')
        await page
          .getByLabel(lang === 'en' ? 'Search exercises' : 'البحث عن تمرين', { exact: true })
          .fill('Goblet')
        const demo = page.locator('.exercise-demo').first()
        await page.locator('#exercise-choice-goblet-squat').click()
        await expect(demo.locator('.demo-positions img').first()).toBeVisible()
        await expect.poll(() => layoutIssues(page)).toEqual([])
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
        await page.screenshot({
          path: `artifacts/r14-exercise-${info.project.name}-${lang}-${theme}-${width}.png`,
          fullPage: true,
        })
      }
})

test('Arabic sourced portions set the actual gram quantity without changing the nutrient basis', async ({
  page,
}, info) => {
  await login(page, 'Amir Hassan')
  await page.evaluate(() => {
    localStorage.setItem('rafik.locale', 'ar')
    localStorage.setItem('rafik.theme', 'dark')
  })
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/nutrition')
  await page.getByRole('button', { name: 'اختر من مكتبة الطعام', exact: true }).click()
  await page.getByLabel('ابحث عن طعام', { exact: true }).fill('خبز')
  await page.locator('.food-results button').click()
  await page.getByRole('button', { name: /رغيف بيتا كبير/ }).click()
  await expect(page.getByLabel('الكمية المتناولة', { exact: true })).toHaveValue('60')
  await expect(page.locator('#meal-editor')).toContainText('165 kcal')
  await page.getByText('تفاصيل التغذية (اختياري)', { exact: true }).click()
  await expect(page.getByLabel('القيم أدناه لكل (g)', { exact: true })).toHaveValue('100')
  await expect.poll(() => layoutIssues(page)).toEqual([])
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.screenshot({ path: `artifacts/r14-portion-${info.project.name}.png`, fullPage: true })
})

test('a nutrition save finishing after navigation does not rewrite the destination', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await login(page)
  await page.goto('/coach/nutrition?client=' + relationship)
  await page
    .getByLabel('Meal guidance', { exact: true })
    .fill('Finish this save after leaving the page')
  let release!: () => void, received!: () => void
  const held = new Promise<void>((resolve) => (release = resolve)),
    arrived = new Promise<void>((resolve) => (received = resolve))
  await page.route('**/v1/commands/save_nutrition_guidance', async (route) => {
    const response = await route.fetch()
    received()
    await held
    await route.fulfill({ response })
  })
  const pending = () =>
    page.evaluate(
      () =>
        new Promise<number>((resolve, reject) => {
          const open = indexedDB.open('rafik-revamp', 1)
          open.onerror = () => reject(open.error)
          open.onsuccess = () => {
            const db = open.result,
              request = db.transaction('drafts').objectStore('drafts').getAll()
            request.onerror = () => {
              db.close()
              reject(request.error)
            }
            request.onsuccess = () => {
              resolve(
                request.result.filter(
                  (row: { key: string }) =>
                    row.key.startsWith('r4-command:') && row.key.includes(':nutrition:'),
                ).length,
              )
              db.close()
            }
          }
        }),
    )
  await page.getByRole('button', { name: 'Save nutrition plan', exact: true }).click()
  await arrived
  await expect.poll(pending).toBe(1)
  await page.getByRole('link', { name: 'Clients', exact: true }).click()
  await expect(page).toHaveURL(/\/coach\/clients$/)
  release()
  await expect.poll(pending).toBe(0)
  await expect(page).toHaveURL(/\/coach\/clients$/, { timeout: 1000 })
})
