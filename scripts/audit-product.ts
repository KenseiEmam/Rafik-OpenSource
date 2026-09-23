import { chromium, webkit } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { layoutIssues } from '../tests/layout-contract.ts'
const rel = '40000000-0000-4000-8000-000000000001'
const results: object[] = [],
  errors: string[] = []
mkdirSync('artifacts/product-audit', { recursive: true })
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch()
  try {
    for (const coach of [true, false]) {
      const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5173' })
      const page = await context.newPage()
      page.on('pageerror', (e) => errors.push(e.message))
      await page.goto('/local-preview')
      await page.getByRole('button', { name: coach ? /Laila Khoury/ : /Amir Hassan/ }).click()
      await page.waitForURL(coach ? '**/coach' : '**/today')
      const base = coach ? '/coach' : ''
      const routes = [
        base + '/messages',
        base + '/messages/' + rel,
        base + '/checkins',
        base + '/more',
        base + '/nutrition',
        base + '/appointments',
        base + '/resources',
        base + '/teams',
        base + '/support',
        '/settings',
        ...(coach
          ? [
              '/coach',
              '/coach/clients',
              '/coach/clients/' + rel,
              '/coach/clients/' + rel + '/progress',
              '/coach/plans',
              '/coach/plans/new',
              '/coach/exercises',
              '/coach/forms/new',
              '/coach/business',
              '/coach/nutrition?client=' + rel,
            ]
          : ['/today', '/history', '/progress', '/routine', '/help', '/privacy', '/missing']),
      ]
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
        for (const route of routes) {
          await page.goto(route)
          await page.locator('h1').waitFor()
          await page.locator('.loading-state').waitFor({ state: 'hidden' })
          await page.evaluate(async () => {
            await document.fonts.ready
            await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})))
          })
          const issues = await layoutIssues(page)
          const alerts = await page.locator('main [role=alert]').allTextContents()
          const accessibility =
            state.width === 390
              ? (await new AxeBuilder({ page }).analyze()).violations.map((v) => ({
                  id: v.id,
                  targets: v.nodes.map((n) => n.target),
                }))
              : []
          const file = `${engine.name()}-${coach ? 'coach' : 'client'}-${state.width}-${route.replaceAll('/', '-').replaceAll('?', '-')}.png`
          if (state.width === 320 || state.width === 390)
            await page.screenshot({
              path: 'artifacts/product-audit/' + file,
              fullPage: true,
              animations: 'disabled',
            })
          results.push({
            engine: engine.name(),
            coach,
            route,
            ...state,
            issues,
            alerts,
            accessibility,
          })
          if (issues.length || accessibility.length || alerts.length)
            console.log(JSON.stringify(results.at(-1)))
        }
      }
      await context.close()
    }
    // The update controls only exist in production. Include that surface explicitly.
    const releaseContext = await browser.newContext({ baseURL: 'http://127.0.0.1:5174' })
    const releasePage = await releaseContext.newPage()
    releasePage.on('pageerror', (e) => errors.push(e.message))
    await releasePage.goto('/help')
    for (const width of [320, 390, 1440])
      for (const lang of ['en', 'ar'])
        for (const theme of ['light', 'dark']) {
          await releasePage.setViewportSize({ width, height: width < 400 ? 664 : 1000 })
          await releasePage.evaluate(
            (s) => {
              localStorage.setItem('rafik.locale', s.lang)
              localStorage.setItem('rafik.theme', s.theme)
            },
            { lang, theme },
          )
          await releasePage.reload()
          const panel = releasePage.locator('.app-updates')
          await panel.waitFor()
          await panel.getByRole('button').click()
          await panel.getByRole('button').waitFor({ state: 'visible' })
          await releasePage.waitForFunction(
            () => !document.querySelector('.app-updates button')?.hasAttribute('disabled'),
          )
          await panel.scrollIntoViewIfNeeded()
          await releasePage.evaluate(() => document.fonts.ready)
          const issues = await layoutIssues(releasePage)
          const accessibility =
            width === 390
              ? (await new AxeBuilder({ page: releasePage }).analyze()).violations.map((v) => ({
                  id: v.id,
                  targets: v.nodes.map((n) => n.target),
                }))
              : []
          results.push({
            engine: engine.name(),
            route: '/help (production updates)',
            width,
            lang,
            theme,
            issues,
            accessibility,
            alerts: [],
          })
          if (issues.length || accessibility.length) console.log(JSON.stringify(results.at(-1)))
          if (width === 390)
            await releasePage.screenshot({
              path: `artifacts/product-audit/updates-${engine.name()}-${lang}-${theme}.png`,
              animations: 'disabled',
            })
        }
    await releaseContext.close()
  } finally {
    await browser.close()
  }
}
writeFileSync('artifacts/product-audit/results.json', JSON.stringify({ results, errors }, null, 2))
const failures = results.filter(
  (r: any) => r.issues.length || r.alerts.length || r.accessibility.length,
)
console.log(JSON.stringify({ states: results.length, failures: failures.length, errors }))
if (failures.length || errors.length) process.exitCode = 1
