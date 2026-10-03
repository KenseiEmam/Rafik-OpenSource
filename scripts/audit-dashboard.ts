import { chromium, webkit, expect, type Request } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { layoutIssues } from '../tests/layout-contract.ts'
const org = '/organization/12000000-0000-4000-8000-000000000001'
const results: object[] = [],
  errors: object[] = []
mkdirSync('artifacts/dashboard-audit', { recursive: true })
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch()
  try {
    for (const name of ['Rania', 'Kareem', 'Laila']) {
      const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5173' }),
        page = await context.newPage()
      // Looping previews may keep media requests active. Wait for domain reads,
      // not global network idleness, before inspecting the rendered data surface.
      const pending = new Set<Request>()
      page.on('request', (request) => {
        if (
          ['fetch', 'xhr'].includes(request.resourceType()) &&
          new URL(request.url()).pathname.startsWith('/v1/')
        )
          pending.add(request)
      })
      page.on('requestfinished', (request) => pending.delete(request))
      page.on('requestfailed', (request) => pending.delete(request))
      const dataReady = async () => {
        await expect
          .poll(() => pending.size, {
            timeout: 15000,
            message: `Domain requests must finish at ${page.url()}`,
          })
          .toBe(0)
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        )
      }
      page.on('pageerror', (e) =>
        errors.push({ engine: engine.name(), name, url: page.url(), message: e.message }),
      )
      await page.goto('/local-preview?legacy=1')
      await page.getByRole('button', { name: new RegExp(name) }).click()
      await page.waitForURL(name === 'Laila' ? /\/coach$/ : /\/organization\//)
      await dataReady()
      const base = name === 'Laila' ? '/coach' : org + (name === 'Rania' ? '/admin' : '/trainer')
      const paths = [
        '',
        '/analytics',
        '/analytics#delivery',
        '/plans',
        '/exercises',
        name === 'Laila' ? '/clients' : '/people',
        name === 'Laila' ? '/appointments#zone' : '/calendar/new#zone',
        '/settings#zone',
      ]
      for (const state of [
        { width: 320, height: 568, lang: 'en', theme: 'light' },
        { width: 390, height: 664, lang: 'ar', theme: 'dark' },
        { width: 1024, height: 850, lang: 'ar', theme: 'light' },
        { width: 1440, height: 1000, lang: 'en', theme: 'dark' },
      ]) {
        await page.setViewportSize(state)
        await page.evaluate((s) => {
          localStorage.setItem('rafik.locale', s.lang)
          localStorage.setItem('rafik.theme', s.theme)
        }, state)
        for (const path of paths) {
          const [suffix, action] = path.split('#'),
            url = suffix === '/settings' ? '/settings' : base + suffix
          await page.goto(url)
          await page.locator('h1').waitFor()
          await page.locator('.loading-state').waitFor({ state: 'hidden' })
          await dataReady()
          if (action === 'delivery')
            await page
              .getByRole('tab', {
                name:
                  name === 'Laila'
                    ? state.lang === 'en'
                      ? 'Follow-up'
                      : 'المتابعة'
                    : state.lang === 'en'
                      ? 'Delivery & capacity'
                      : 'التدريب وقدرة الفريق',
                exact: true,
              })
              .click()
          if (action === 'zone') {
            const label =
              suffix === '/appointments'
                ? state.lang === 'en'
                  ? 'View times in'
                  : 'عرض الأوقات حسب'
                : state.lang === 'en'
                  ? 'Timezone'
                  : 'المنطقة الزمنية'
            const input = page.getByRole('combobox', { name: label, exact: true })
            await input.click()
            await input.fill('Chatham')
            await page.getByRole('option', { name: /Pacific\/Chatham/ }).waitFor()
          }
          await page.evaluate(async () => {
            await document.fonts.ready
            await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})))
          })
          const issues = await layoutIssues(page),
            alerts = await page.locator('main [role=alert]').allTextContents(),
            axe = (await new AxeBuilder({ page }).analyze()).violations.map((v) => ({
              id: v.id,
              targets: v.nodes.map((n) => n.target),
            }))
          const geometry = await page.evaluate(() => ({
            document: document.documentElement.scrollHeight,
            viewport: innerHeight,
            main: document.querySelector('main')!.getBoundingClientRect().toJSON(),
          }))
          if (state.width >= 1024 && geometry.document > geometry.viewport + 1)
            issues.push('desktop document scrolls outside workspace')
          const capture = `${engine.name()}-${name}-${path.replaceAll('/', '-') || 'overview'}-${state.width}.png`
          await page.screenshot({
            path: 'artifacts/dashboard-audit/' + capture,
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
            geometry,
            capture,
          })
          if (issues.length || alerts.length || axe.length)
            console.log('ISSUE', JSON.stringify(results.at(-1)))
        }
      }
      await context.close()
      console.log('Checked', engine.name(), name)
    }
  } finally {
    await browser.close()
  }
}
writeFileSync(
  'artifacts/dashboard-audit/results.json',
  JSON.stringify({ results, errors }, null, 2),
)
console.log(`${results.length} states; ${errors.length} page errors`)
if (errors.length || results.some((r: any) => r.issues.length || r.alerts.length || r.axe.length))
  process.exitCode = 1
