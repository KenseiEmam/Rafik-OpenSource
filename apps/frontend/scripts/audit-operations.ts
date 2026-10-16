import { chromium, webkit } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { layoutIssues } from '../tests/layout-contract.ts'
const org = '/organization/12000000-0000-4000-8000-000000000001'
const results: any[] = [],
  errors: object[] = []
mkdirSync('artifacts/operations-audit', { recursive: true })
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch()
  try {
    for (const [name, routes] of [
      ['Amina', ['organizations', 'users', 'support', 'audit'].map((s) => '/platform#' + s)],
      [
        'Rania',
        [
          '/people',
          '/training',
          '/calendar/new',
          '/calendar/new#people',
          '/groups#new',
          '/analytics',
          '/messages#new',
        ].map((s) => org + '/admin' + s),
      ],
      ['Kareem', [org + '/trainer/messages#new', org + '/trainer/analytics']],
    ] as [string, string[]][]) {
      const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5173' }),
        page = await context.newPage()
      page.on('pageerror', (e) =>
        errors.push({ engine: engine.name(), name, url: page.url(), message: e.message }),
      )
      await page.goto('/local-preview')
      await page.getByRole('button', { name: new RegExp(name) }).click()
      await page.waitForURL(name === 'Amina' ? /platform/ : /organization/)
      await page.locator('h1').waitFor()
      await page.waitForLoadState('networkidle')
      for (const state of [
        { width: 320, height: 568, lang: 'en', theme: 'light' },
        { width: 390, height: 664, lang: 'ar', theme: 'dark' },
        { width: 768, height: 850, lang: 'ar', theme: 'light' },
        { width: 1440, height: 1000, lang: 'en', theme: 'dark' },
      ]) {
        await page.setViewportSize(state)
        await page.evaluate((s) => {
          localStorage.setItem('rafik.locale', s.lang)
          localStorage.setItem('rafik.theme', s.theme)
        }, state)
        for (const path of routes) {
          const [url, action] = path.split('#')
          await page.goto(url!)
          await page.locator('h1').waitFor()
          await page.waitForLoadState('networkidle')
          if (action === 'people') {
            await page
              .getByLabel(state.lang === 'en' ? 'Event name' : 'اسم الموعد', { exact: true })
              .fill('Local review')
            await page
              .getByRole('button', {
                name: state.lang === 'en' ? 'Choose people' : 'اختيار الأشخاص',
                exact: true,
              })
              .click()
          }
          if (name === 'Amina')
            await page
              .getByRole('combobox', { name: state.lang === 'en' ? 'Area' : 'القسم', exact: true })
              .selectOption(action!)
          else if (action === 'new')
            await page
              .getByRole('button', {
                name: url!.includes('groups')
                  ? state.lang === 'en'
                    ? 'New group'
                    : 'مجموعة جديدة'
                  : state.lang === 'en'
                    ? 'New conversation'
                    : 'محادثة جديدة',
                exact: true,
              })
              .click()
          await page.waitForLoadState('networkidle')
          await page.evaluate(async () => {
            await document.fonts.ready
            await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})))
          })
          const issues = await layoutIssues(page),
            alerts = await page.locator('main [role=alert]').allTextContents(),
            axe =
              state.width === 390
                ? (await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)
                : []
          const capture = `${engine.name()}-${name}-${path.split('/').at(-1)}-${state.width}.png`
          await page.screenshot({
            path: 'artifacts/operations-audit/' + capture,
            fullPage: true,
            animations: 'disabled',
          })
          results.push({
            engine: engine.name(),
            name,
            path,
            ...state,
            issues,
            alerts,
            axe,
            capture,
          })
          if (issues.length || alerts.length || axe.length) console.log(results.at(-1))
        }
      }
      await context.close()
    }
  } finally {
    await browser.close()
  }
}
writeFileSync(
  'artifacts/operations-audit/results.json',
  JSON.stringify({ results, errors }, null, 2),
)
console.log(`${results.length} states; ${errors.length} page errors`)
if (errors.length || results.some((r) => r.issues.length || r.alerts.length || r.axe.length))
  process.exitCode = 1
