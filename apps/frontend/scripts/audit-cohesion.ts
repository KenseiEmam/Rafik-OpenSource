import { chromium, webkit } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { layoutIssues } from '../tests/layout-contract.ts'
const results: any[] = [],
  errors: object[] = []
mkdirSync('artifacts/cohesion-audit', { recursive: true })
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch()
  try {
    const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5173' }),
      page = await context.newPage()
    page.on('pageerror', (e) =>
      errors.push({ engine: engine.name(), url: page.url(), message: e.message }),
    )
    await page.goto('/')
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
      for (const path of ['/', '/help', '/local-preview']) {
        await page.goto(path)
        await page.locator('h1').waitFor()
        await page.waitForLoadState('networkidle')
        if (path === '/help')
          await page
            .getByText(state.lang === 'en' ? 'I administer an organization' : 'أنا مسؤول مؤسسة', {
              exact: true,
            })
            .click()
        await page.evaluate(async () => {
          await document.fonts.ready
          await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})))
        })
        const issues = await layoutIssues(page),
          alerts = await page.locator('main [role=alert]').allTextContents(),
          axe = (await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id),
          capture = `${engine.name()}-${path.slice(1) || 'home'}-${state.width}.png`
        await page.screenshot({
          path: 'artifacts/cohesion-audit/' + capture,
          fullPage: true,
          animations: 'disabled',
        })
        results.push({ engine: engine.name(), path, ...state, issues, alerts, axe, capture })
        if (issues.length || alerts.length || axe.length) console.log(results.at(-1))
      }
    }
    await context.close()
  } finally {
    await browser.close()
  }
}
writeFileSync('artifacts/cohesion-audit/results.json', JSON.stringify({ results, errors }, null, 2))
console.log(`${results.length} states; ${errors.length} page errors`)
if (errors.length || results.some((r) => r.issues.length || r.alerts.length || r.axe.length))
  process.exitCode = 1
