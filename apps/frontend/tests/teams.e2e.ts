import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { teamFixture } from './team-fixture'

// Standalone coach teams and the gym business/billing screens were retired (R7A and the
// university direction). Their old links must land in the institution workspace instead.
test('retired team and business links route into the institution workspace', async ({ page }) => {
  const f = await teamFixture(),
    id = randomUUID()
  try {
    await f.call(f.owner, '/v1/workspaces', {
      id,
      kind: 'organization',
      name: 'Legacy link institution',
    })
    const base = `/organization/${id}/admin`
    await f.login(page, f.owner, '/coach/teams')
    await expect(page).toHaveURL(base + '/groups')
    await expect(page.getByLabel('Team name', { exact: true })).toHaveCount(0)
    await page.goto('/coach/teams/' + randomUUID())
    await expect(page).toHaveURL(base + '/groups')
    await page.goto('/coach/business')
    await expect(page).toHaveURL(base + '/settings')
    await expect(page.getByText('Local provider simulation', { exact: true })).toHaveCount(0)
    await page.goto('/teams')
    await expect(page).toHaveURL(new RegExp(`^[^?]*/organization/${id}/`))
  } finally {
    await f.cleanup()
  }
})
