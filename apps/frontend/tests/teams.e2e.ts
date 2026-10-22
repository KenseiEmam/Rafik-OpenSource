import { test, expect } from '@playwright/test'

test('retired standalone team routes use the normal missing-page state', async ({ page }) => {
  for (const path of ['/teams', '/coach/teams', '/coach/business', '/team-invite/retired']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: 'That page isn’t here.' })).toBeVisible()
  }
})
