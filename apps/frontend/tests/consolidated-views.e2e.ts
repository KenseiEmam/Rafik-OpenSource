import { test, expect } from '@playwright/test'
import { randomUUID, randomBytes } from 'node:crypto'
import { teamFixture } from './team-fixture'

test('one Resources screen and role-aware Nutrition resolve through the supported routes', async ({
  page,
}) => {
  test.setTimeout(120000)
  const f = await teamFixture(),
    id = randomUUID()
  try {
    await f.call(f.owner, '/v1/workspaces', {
      id,
      kind: 'organization',
      name: 'Consolidated views',
    })
    const token = randomBytes(32).toString('hex')
    await f.call(f.owner, `/v1/workspaces/${id}`, {
      action: 'invite',
      operation: randomUUID(),
      id: randomUUID(),
      email: f.client.email,
      roles: ['trainee'],
      token,
    })
    await f.call(f.client, `/v1/organization-invitations/${token}`, {})
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    const resources = page.waitForResponse((r) => r.url().includes(`/v1/workspaces/${id}/assets?`))
    await f.login(page, f.owner, '/resources')
    expect((await resources).status()).toBe(200)
    await expect(page.getByRole('heading', { name: 'Resources', exact: true })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'No files in this view', exact: true }),
    ).toBeVisible()
    const plans = page.waitForResponse((r) =>
      r.url().includes(`/v1/workspaces/${id}/nutrition-plans?`),
    )
    await page.goto('/nutrition')
    expect((await plans).status()).toBe(200)
    await expect(page.getByRole('heading', { name: 'Nutrition plans', exact: true })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'No plans match this view.', exact: true }),
    ).toBeVisible()
    const diary = page.waitForResponse((r) => r.url().includes(`/v1/workspaces/${id}/nutrition?`))
    await f.login(page, f.client, '/nutrition')
    expect((await diary).status()).toBe(200)
    await expect(page.getByRole('heading', { name: 'Nutrition', exact: true })).toBeVisible()
    await expect(page.locator('.loading-state')).toHaveCount(0)
    await expect(page.locator('main .notice.error')).toHaveCount(0)
    expect(errors).toEqual([])
  } finally {
    await f.cleanup()
  }
})
