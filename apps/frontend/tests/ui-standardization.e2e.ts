import { test, expect } from '@playwright/test'
import { randomUUID, randomBytes } from 'node:crypto'
import { mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { teamFixture } from './team-fixture'
import { layoutIssues } from './layout-contract'

test('dedicated editors preserve drafts, acknowledge writes, return to lists and size records', async ({
  page,
}, info) => {
  test.skip(
    process.env.RAFIK_UI_AUDIT_ROLLOUT === '1' && info.project.name === 'chromium',
    'Reuse the passing Chromium editor journey; this batch adds WebKit and the final layout matrix',
  )
  test.setTimeout(360000)
  const f = await teamFixture(),
    workspace = randomUUID(),
    base = `/organization/${workspace}/admin`
  const output = resolve('../../artifacts/ui-audit/2026-10-21/rollout', info.project.name)
  mkdirSync(output, { recursive: true })
  try {
    await f.call(f.owner, '/v1/workspaces', {
      id: workspace,
      kind: 'organization',
      name: 'Rafik design review · مراجعة التصميم',
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
    const people = await f.call(f.owner, `/v1/workspaces/${workspace}?view=admin`)
    const coach = people.members.find((m: any) => m.user_id === f.coach.id)
    const athlete = people.members.find((m: any) => m.user_id === f.client.id)
    await f.call(f.owner, `/v1/workspaces/${workspace}`, {
      operation: randomUUID(),
      action: 'assign-trainer',
      id: athlete.id,
      revision: athlete.revision,
      trainer: coach.id,
    })
    await page.addInitScript(() => {
      localStorage.setItem('rafik.locale', 'en')
      localStorage.setItem('rafik.theme', 'light')
    })
    await f.login(page, f.owner, base + '/assessment-templates')
    await page.getByRole('button', { name: 'New template', exact: true }).click()
    await expect(page).toHaveURL(/assessment-templates\/new$/)
    await page.getByLabel('Name', { exact: true }).fill('Field readiness')
    await page.getByLabel('Drill name', { exact: true }).fill('Controlled repetitions')
    await page.getByLabel('Unit', { exact: true }).fill('reps')
    await expect(page.getByText('Draft saved on this device.', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Field readiness')
    await expect(page.locator('.service-library-row')).toHaveCount(0)
    await page.getByRole('button', { name: 'Save template', exact: true }).click()
    await expect(page).toHaveURL(base + '/assessment-templates')
    await expect(page.locator('.service-library-row')).toContainText('Field readiness')
    await expect(page.locator('.notice.success')).toHaveCount(0)
    await page
      .locator('.service-library-row')
      .getByRole('button', { name: 'Edit', exact: true })
      .click()
    await expect(page).toHaveURL(/assessment-templates\/[a-f0-9-]{36}$/)
    await page.getByLabel('Name', { exact: true }).fill('Field readiness revised')
    await page.getByRole('button', { name: 'Save template', exact: true }).click()
    await expect(page).toHaveURL(base + '/assessment-templates')
    await expect(page.locator('.service-library-row')).toContainText('Field readiness revised')

    await page.goto(base + '/groups')
    await page.getByRole('button', { name: 'New group', exact: true }).click()
    await expect(page).toHaveURL(base + '/groups/new')
    await page.getByLabel('Name', { exact: true }).fill('Preseason squad')
    await page.getByRole('checkbox', { name: 'R4 Athlete', exact: true }).check()
    await page.getByRole('checkbox', { name: 'R4 Coach', exact: true }).check()
    await page.getByRole('button', { name: 'Save group', exact: true }).click()
    await expect(page).toHaveURL(base + '/groups')
    await expect(page.locator('.service-library-row')).toContainText('Preseason squad')

    await page.goto(base + '/tasks')
    await page.getByRole('button', { name: 'Assign a task', exact: true }).click()
    await expect(page).toHaveURL(base + '/tasks/new')
    await page.getByLabel('Task title', { exact: true }).fill('Review readiness before practice')
    await page.getByRole('checkbox', { name: 'R4 Coach', exact: true }).check()
    await expect(page.getByText('Draft saved on this device', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Back to tasks', exact: true }).click()
    await page.getByRole('button', { name: 'Continue draft', exact: true }).click()
    await expect(page.getByLabel('Task title', { exact: true })).toHaveValue(
      'Review readiness before practice',
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
    await expect(page).toHaveURL(base + '/tasks')
    await expect(page.locator('.task-card')).toHaveCount(1)
    await page.locator('.task-card').getByRole('button', { name: 'Edit', exact: true }).click()
    await expect(page.getByLabel('Task title', { exact: true })).toHaveValue(
      'Review readiness before practice',
    )
    await page.reload()
    await expect(page.getByLabel('Task title', { exact: true })).toHaveValue(
      'Review readiness before practice',
    )
    await page.getByRole('link', { name: 'Back to tasks', exact: true }).click()

    const tasks = await f.call(f.owner, `/v1/workspaces/${workspace}/tasks?view=admin`)
    expect(
      (
        await f.call(
          f.coach,
          `/v1/workspaces/${workspace}/tasks?view=trainer&id=${tasks.items[0].id}`,
        )
      ).items,
    ).toHaveLength(1)
    const other = await f.createPerson('Unlinked coach')
    const otherToken = randomBytes(32).toString('hex')
    await f.call(f.owner, `/v1/workspaces/${workspace}`, {
      operation: randomUUID(),
      action: 'invite',
      id: randomUUID(),
      email: other.email,
      roles: ['trainer'],
      token: otherToken,
    })
    await f.call(other, `/v1/organization-invitations/${otherToken}`, {})
    expect(
      (
        await f.call(
          other,
          `/v1/workspaces/${workspace}/tasks?view=trainer&id=${tasks.items[0].id}`,
        )
      ).items,
    ).toHaveLength(0)

    await page.goto(base + '/people')
    const sizeRead = page.waitForResponse(
      (r) => r.url().includes('/people?') && r.url().includes('limit=25'),
    )
    await page.getByRole('combobox', { name: 'Records per page', exact: true }).selectOption('25')
    await sizeRead
    await expect(page).toHaveURL(/limit=25/)
    await expect(page.getByRole('combobox', { name: 'Records per page', exact: true })).toHaveValue(
      '25',
    )
    await page.reload()
    await expect(page.getByRole('combobox', { name: 'Records per page', exact: true })).toHaveValue(
      '25',
    )
    expect(await layoutIssues(page)).toEqual([])

    await page.goto(base + '/exercises')
    await page.getByRole('button', { name: 'Create exercise', exact: true }).click()
    await expect(page).toHaveURL(base + '/exercises/new')
    await page.getByLabel('Exercise name', { exact: true }).fill('Controlled preseason row')
    await page
      .getByLabel('Instructions', { exact: true })
      .fill('Keep a steady trunk and pull with control.')
    await page
      .getByRole('combobox', { name: 'Movement category', exact: true })
      .selectOption('compound')
    const image = readFileSync(
      resolve(
        '../backend/content/exercise-videos/wger-fff4c294-93f0-4926-b3a2-bf59ad4afaa5-623708fc-r1.webp',
      ),
    )
    await page
      .getByLabel('Upload demonstration', { exact: true })
      .setInputFiles({ name: 'preseason-row.webp', mimeType: 'image/webp', buffer: image })
    await expect(page.getByText('Uploaded: preseason-row.webp', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Save exercise', exact: true }).click()
    await expect(page).toHaveURL(base + '/exercises')
    await page
      .getByRole('searchbox', { name: 'Search exercises', exact: true })
      .fill('Controlled preseason row')
    await expect(page.locator('.catalog-choice')).toHaveCount(1)
    // Phones show the catalog as list → detail; opening the result reveals its actions.
    await page.locator('.catalog-choice').click()
    await page.getByRole('button', { name: 'Edit exercise', exact: true }).click()
    await expect(page.getByLabel('Exercise name', { exact: true })).toHaveValue(
      'Controlled preseason row',
    )

    for (const [lang, theme, width] of [
      ['en', 'light', 1440],
      ['ar', 'dark', 320],
    ] as const) {
      await page.setViewportSize({ width, height: 800 })
      await page.evaluate(
        (c) => {
          localStorage.setItem('rafik.locale', c.lang)
          localStorage.setItem('rafik.theme', c.theme)
        },
        { lang, theme },
      )
      await page.reload()
      await expect(page.locator('.exercise-editor')).toBeVisible()
      expect(await layoutIssues(page)).toEqual([])
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
      await page.screenshot({
        path: resolve(output, `${lang}-${theme}-${width}-exercise-editor.png`),
        fullPage: true,
      })
    }
  } finally {
    await f.cleanup()
  }
})
