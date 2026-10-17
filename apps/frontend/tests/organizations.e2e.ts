import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { teamFixture } from './team-fixture'
import { layoutIssues } from './layout-contract'
test('separate institution roles and reassigns responsibility with recoverable commands', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(90000)
  const f = await teamFixture(),
    staffContext = await browser.newContext(),
    clientContext = await browser.newContext(),
    staff = await staffContext.newPage(),
    client = await clientContext.newPage()
  try {
    await f.login(page, f.owner, '/workspaces')
    await page.getByRole('button', { name: 'Set up a workspace', exact: true }).click()
    await page.getByLabel('Name', { exact: true }).fill('Madar test organization')
    await page.getByRole('button', { name: 'Create workspace', exact: true }).click()
    await expect(page).toHaveURL(/\/organization\/[a-f0-9-]+\/admin$/)
    const base = new URL(page.url()).pathname,
      id = base.split('/')[2]!
    await page.getByRole('button', { name: 'Invite people', exact: true }).click()
    await page.getByLabel('Email address', { exact: true }).fill(f.coach.email)
    await page.getByRole('radio', { name: 'Trainer', exact: true }).check()
    await expect(
      page.getByText('Invitation draft saved on this device.', { exact: true }),
    ).toBeVisible()
    await page.reload()
    await expect(page.getByLabel('Email address', { exact: true })).toHaveValue(f.coach.email)
    await expect(page.getByRole('radio', { name: 'Trainer', exact: true })).toBeChecked()
    await page.getByRole('button', { name: 'Create invitation', exact: true }).click()
    const link = await page.getByLabel('Invitation link', { exact: true }).inputValue()
    await f.login(staff, f.coach, new URL(link).pathname)
    await staff.getByRole('button', { name: 'Accept invitation', exact: true }).click()
    await expect(staff).toHaveURL(new RegExp(`/organization/${id}/trainer$`))
    await page.getByLabel('Email address', { exact: true }).fill(f.client.email)
    await page.getByRole('button', { name: 'Create invitation', exact: true }).click()
    const clientLink = await page.getByLabel('Invitation link', { exact: true }).inputValue()
    await f.login(client, f.client, new URL(clientLink).pathname)
    await client.getByRole('button', { name: 'Accept invitation', exact: true }).click()
    await expect(client).toHaveURL(new RegExp(`/organization/${id}/trainee$`))
    await page.goto(base + '/people')
    await page.getByRole('button', { name: 'Manage R4 Athlete', exact: true }).click()
    await page
      .locator('.organization-trainer-form')
      .getByRole('checkbox', { name: 'R4 Coach', exact: true })
      .check()
    let lost = false
    await page.route('**/v1/workspaces/' + id, async (route) => {
      if (
        !lost &&
        route.request().method() === 'POST' &&
        route.request().postDataJSON().action === 'assign-trainer'
      ) {
        lost = true
        await route.fetch()
        await route.abort('failed')
      } else await route.continue()
    })
    await page.getByRole('button', { name: 'Update trainer', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'Retry saved change', exact: true }),
    ).toBeVisible()
    await page.reload()
    await page.getByRole('button', { name: 'Retry saved change', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Saved.' })).toBeVisible()
    await staff.goto(`/organization/${id}/trainer/people`)
    await expect(staff.getByRole('heading', { name: 'R4 Athlete', exact: true })).toBeVisible()
    await expect(staff.getByRole('button', { name: /Manage/ })).toHaveCount(0)
    await expect(staff.getByRole('heading', { name: 'R4 Owner', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Manage R4 Coach', exact: true }).click()
    await page.getByRole('checkbox', { name: 'Active membership', exact: true }).uncheck()
    await page.getByRole('button', { name: 'Save membership', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Saved.' })).toBeVisible()
    await staff.reload()
    await expect(staff.getByRole('alert')).toContainText('no longer available')
    await expect(staff.getByRole('heading', { name: 'R4 Athlete', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Manage R4 Owner', exact: true }).click()
    await page.getByRole('checkbox', { name: 'Active membership', exact: true }).uncheck()
    await page.getByRole('button', { name: 'Save membership', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('another active administrator')
    await page.goto(base + '/people')
    await expect(page.getByRole('heading', { name: 'R4 Athlete', exact: true })).toBeVisible()
    expect(await layoutIssues(page)).toEqual([])
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.screenshot({
      path: `artifacts/organization-people-${info.project.name}.png`,
      fullPage: true,
      animations: 'disabled',
    })
  } finally {
    await staffContext.close()
    await clientContext.close()
    await f.cleanup()
  }
})
