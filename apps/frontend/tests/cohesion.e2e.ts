import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { layoutIssues } from './layout-contract'

test('coach and organization entry keeps context through sign-in and explains distinct workspaces', async ({
  page,
}, info) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Open your organization', exact: true }).click()
  await expect
    .poll(() => new URL(page.url()).searchParams.get('next'))
    .toBe('/workspaces?start=organization')
  await page.goto('/local-preview')
  await expect(
    page.getByRole('heading', { name: 'Independent coaching', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Organizations', exact: true })).toBeVisible()
  await page.getByRole('button', { name: /Rania/ }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await page.goto('/help')
  await page.getByText('I administer an organization', { exact: true }).click()
  await expect(page.getByText(/Reassigning a trainer preserves/)).toBeVisible()
  expect(await layoutIssues(page)).toEqual([])
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.screenshot({ path: info.outputPath('workspace-help.png'), fullPage: true })
  await page.getByRole('link', { name: 'Choose your workspace', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Choose where to work' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Madar Training/ })).toBeVisible()
})
