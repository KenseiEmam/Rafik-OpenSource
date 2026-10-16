import { test, expect } from '@playwright/test'
import { staticPreview } from './static-preview'
import { layoutIssues } from './layout-contract'

test('a waiting release never interrupts a workout; failed install preserves the running version and close/reopen adopts the update', async ({
  browser,
}, info) => {
  test.setTimeout(90000)
  let release = 'broken'
  const server = await staticPreview((path, body) => {
    if (path.endsWith('index.html'))
      return Buffer.from(
        body.toString().replace('<head>', `<head><meta name="test-release" content="${release}">`),
      )
    if (path.endsWith('sw.js')) {
      const source = body.toString().replace(/rafik-shell-[a-f0-9]+/, `rafik-shell-test-${release}`)
      return Buffer.from(
        (release === 'broken'
          ? "self.addEventListener('install',e=>e.waitUntil(Promise.reject(new Error('injected install failure'))));\n"
          : '') + source,
      )
    }
    return body
  })
  const context = await browser.newContext({
    viewport:
      info.project.name === 'webkit-phone'
        ? { width: 390, height: 664 }
        : { width: 1440, height: 1000 },
  })
  try {
    const workout = await context.newPage()
    await workout.goto(server.origin + '/help')
    const firstInstall = workout.locator('.app-updates')
    await expect(firstInstall).toContainText('Could not check or download')
    release = 'one'
    await firstInstall.getByRole('button').click()
    await expect(firstInstall).toContainText('latest available version')
    await workout.goto(server.origin + '/routine')
    await workout.evaluate(() => navigator.serviceWorker.ready)
    await workout.getByRole('button', { name: 'Start workout', exact: true }).click()
    await expect(workout).toHaveURL(/\/workout\//)
    const workoutUrl = workout.url()
    await workout.getByRole('spinbutton', { name: 'Set 1 reps', exact: true }).fill('13')
    await workout.getByRole('button', { name: 'Mark set 1 done', exact: true }).click()
    await expect(workout.getByRole('status')).toContainText('Saved on this device')
    const help = await context.newPage()
    await help.goto(server.origin + '/help')
    const updates = help.getByRole('region', { name: 'App updates' })
    release = 'broken'
    await updates.getByRole('button').click()
    await expect(updates).toContainText('Could not check or download')
    await workout.reload()
    await expect(workout.locator('meta[name=test-release]')).toHaveAttribute('content', 'one')
    await expect(workout.getByRole('spinbutton', { name: 'Set 1 reps', exact: true })).toHaveValue(
      '13',
    )
    release = 'two'
    await updates.getByRole('button').click()
    await expect(updates).toContainText('An update is ready.')
    await expect(workout).toHaveURL(workoutUrl)
    await workout.reload()
    await expect(workout.locator('meta[name=test-release]')).toHaveAttribute('content', 'one')
    expect(await layoutIssues(help)).toEqual([])
    await updates.scrollIntoViewIfNeeded()
    await help.screenshot({ path: `artifacts/app-update-${info.project.name}.png` })
    await help.close()
    await workout.close()
    // A blank page is outside the worker scope, so it cannot keep the old worker alive.
    const next = await context.newPage()
    await next.goto(server.origin + '/help')
    // Browser lifecycle may finish activation just after the last old document closes.
    await expect
      .poll(async () => {
        await next.reload()
        return next.locator('meta[name=test-release]').getAttribute('content')
      })
      .toBe('two')
    await next.goto(workoutUrl)
    await expect(next.getByRole('spinbutton', { name: 'Set 1 reps', exact: true })).toHaveValue(
      '13',
    )
    const cacheUrls = await next.evaluate(async () =>
      (
        await Promise.all(
          (await caches.keys()).map(async (name) =>
            (await (await caches.open(name)).keys()).map((r) => r.url),
          ),
        )
      ).flat(),
    )
    expect(cacheUrls.some((url) => /rest\/v1|auth\/v1|storage\/v1/.test(url))).toBe(false)
    await server.stop()
    await next.reload()
    await expect(next.getByRole('spinbutton', { name: 'Set 1 reps', exact: true })).toHaveValue(
      '13',
    )
  } finally {
    await context.close()
    await server.stop()
  }
})
