import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { writeFileSync, mkdirSync } from 'node:fs'
const browser = await chromium.launch()
const results = [], errors = []
mkdirSync('artifacts', { recursive: true })
try {
  for (const coach of [true, false]) {
    const context = await browser.newContext()
    const page = await context.newPage()
    page.on('pageerror', e => errors.push(e.message))
    await page.goto('http://127.0.0.1:5173/local-preview?legacy=1')
    await page.getByRole('button', { name: coach ? /Laila Khoury/ : /Amir Hassan/ }).click()
    await page.waitForURL(coach ? '**/coach' : '**/today')
    const base = coach ? '/coach' : ''
    const routes = [base + '/messages', base + '/messages/40000000-0000-4000-8000-000000000001', base + '/checkins', coach ? '/coach/plans' : '/today']
    for (const width of [320, 390, 768, 1440]) for (const lang of ['en', 'ar']) for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 850 })
      await page.evaluate(({ lang, theme }) => { localStorage.setItem('rafik.locale', lang); localStorage.setItem('rafik.theme', theme) }, { lang, theme })
      for (const route of routes) {
        await page.goto('http://127.0.0.1:5173' + route)
        await page.locator('h1').waitFor()
        await page.locator('.loading-state').waitFor({ state: 'hidden' })
        await page.evaluate(async () => { await document.fonts.ready; await Promise.all(document.getAnimations().map(a => a.finished.catch(() => {}))) })
        const metrics = await page.evaluate(() => {
          const composer = document.querySelector('.message-compose textarea')?.getBoundingClientRect()
          return { overflow: document.documentElement.scrollWidth > innerWidth, composerReachable: composer ? composer.bottom <= innerHeight && composer.top >= 0 : null }
        })
        const row = { coach, route, width, lang, theme, ...metrics }
        if (width === 390) row.accessibility = (await new AxeBuilder({ page }).analyze()).violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))
        if ((width === 1440 && lang === 'en' && theme === 'light') || (width === 390 && lang === 'ar' && theme === 'dark')) await page.screenshot({ path: `artifacts/r5-final-${route.replaceAll('/', '-')}-${width}-${lang}.png`, fullPage: true })
        results.push(row)
      }
    }
    await context.close()
  }
} finally { await browser.close() }
writeFileSync('artifacts/r5-quality-layout.json', JSON.stringify({ results, errors }, null, 2))
const failed = results.filter(r => r.overflow || r.composerReachable === false || r.accessibility?.length)
console.log(JSON.stringify({ layouts: results.length, accessibilityChecks: results.filter(r => r.accessibility).length, failures: failed, errors }, null, 2))
if (failed.length || errors.length) process.exitCode = 1
