import { test, expect } from '@playwright/test'
import { randomUUID, randomBytes } from 'node:crypto'
import AxeBuilder from '@axe-core/playwright'
import { teamFixture } from './team-fixture'
import { layoutIssues } from './layout-contract'
test('admin assigns a recoverable task and trainer completes it from the daily queue', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(120000)
  const f = await teamFixture(),
    trainerContext = await browser.newContext(),
    trainer = await trainerContext.newPage(),
    workspace = randomUUID()
  try {
    await f.call(f.owner, '/v1/workspaces', {
      id: workspace,
      kind: 'organization',
      name: 'Madar daily work',
    })
    for (const [person, role] of [
      [f.coach, 'trainer'],
      [f.client, 'trainee'],
    ] as const) {
      const token = randomBytes(32).toString('hex')
      await f.call(f.owner, `/v1/workspaces/${workspace}`, {
        operation: randomUUID(),
        action: 'invite',
        id: randomUUID(),
        email: person.email,
        roles: [role],
        token,
      })
      await f.call(person, `/v1/organization-invitations/${token}`, {})
    }
    const base = `/organization/${workspace}/admin`
    await f.login(page, f.owner, base + '/tasks')
    await page.getByRole('button', { name: 'Assign a task', exact: true }).click()
    await page
      .getByLabel('Task title', { exact: true })
      .fill('Review upcoming training with the team')
    await page.getByRole('checkbox', { name: 'R4 Coach', exact: true }).check()
    await page.getByLabel('Due date (optional)', { exact: true }).fill('2026-09-01')
    await page.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('high')
    await page
      .getByLabel('Instructions (optional)', { exact: true })
      .fill('Check the session plan before the next appointment.')
    await expect(page.getByText('Draft saved on this device', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Close editor', exact: true }).click()
    await page.reload()
    await page.getByRole('button', { name: 'Continue draft', exact: true }).click()
    await expect(page.getByLabel('Task title', { exact: true })).toHaveValue(
      'Review upcoming training with the team',
    )
    let lost = false
    await page.route(`**/v1/workspaces/${workspace}/tasks`, async (route) => {
      if (!lost && route.request().method() === 'POST') {
        lost = true
        await route.fetch()
        await route.abort('failed')
      } else await route.continue()
    })
    await page.getByRole('button', { name: 'Save task', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'Retry saved change', exact: true }),
    ).toBeEnabled()
    await page.reload()
    await page.getByRole('button', { name: 'Retry saved change', exact: true }).click()
    await expect(page.locator('.task-card')).toHaveCount(1)
    await expect(page.locator('.task-card')).toContainText('Overdue')
    await f.login(trainer, f.coach, `/organization/${workspace}/trainer`)
    await expect(trainer.locator('.overview-task-queue')).toContainText(
      'Review upcoming training with the team',
    )
    await trainer.getByRole('link', { name: 'My tasks', exact: true }).click()
    await trainer.getByRole('button', { name: 'Mark complete', exact: true }).click()
    await expect(trainer.getByRole('status').filter({ hasText: 'Saved.' })).toBeVisible()
    await trainer
      .getByRole('combobox', { name: 'Task status', exact: true })
      .selectOption('completed')
    await expect(trainer.locator('.task-card')).toContainText(
      'Review upcoming training with the team',
    )
    await trainer.getByRole('button', { name: 'Reopen', exact: true }).click()
    await expect(trainer.getByRole('status').filter({ hasText: 'Saved.' })).toBeVisible()
    await trainer.getByRole('combobox', { name: 'Task status', exact: true }).selectOption('open')
    await expect(trainer.locator('.task-card')).toHaveCount(1)
    for (const width of [320, 1280])
      for (const lang of ['en', 'ar'])
        for (const theme of ['light', 'dark']) {
          await trainer.setViewportSize({ width, height: 900 })
          await trainer.evaluate(
            ({ lang, theme }) => {
              localStorage.setItem('rafik.locale', lang)
              localStorage.setItem('rafik.theme', theme)
            },
            { lang, theme },
          )
          await trainer.reload()
          await expect(trainer.locator('.task-card')).toBeVisible()
          expect(await layoutIssues(trainer)).toEqual([])
          expect((await new AxeBuilder({ page: trainer }).analyze()).violations).toEqual([])
          await trainer.screenshot({
            path: `artifacts/r19-tasks-${info.project.name}-${width}-${lang}-${theme}.png`,
            fullPage: true,
          })
        }
    await page.goto(base)
    await expect(page.locator('.daily-followup')).toBeVisible()
    expect(await layoutIssues(page)).toEqual([])
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.screenshot({
      path: `artifacts/r19-overview-${info.project.name}.png`,
      fullPage: true,
    })
  } finally {
    await trainerContext.close()
    await f.cleanup()
  }
})
