import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { teamFixture } from './team-fixture'
test.use({ actionTimeout: 10000 })

test('team invitation, client consent, group assignment and handoff work with recovered commands', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(120000)
  const f = await teamFixture(),
    context = await browser.newContext(),
    client = await context.newPage(),
    staffContext = await browser.newContext(),
    staff = await staffContext.newPage()
  try {
    await f.login(page, f.owner, '/coach/teams')
    await page.getByLabel('Team name', { exact: true }).fill('R4 browser team')
    await page.getByRole('button', { name: 'Create team', exact: true }).click()
    await expect(page).toHaveURL(/\/coach\/teams\/[\da-f-]+$/)
    const id = page.url().split('/').pop()!
    f.teamIds.push(id)
    await page.getByRole('button', { name: 'Staff', exact: true }).click()
    await page.getByLabel('Staff email', { exact: true }).fill(f.coach.email)
    await page.getByRole('button', { name: 'Create staff invitation', exact: true }).click()
    const link = page.getByLabel('Staff invitation link', { exact: true })
    await expect(link).toBeVisible()
    await f.login(staff, f.coach, await link.inputValue())
    await staff.getByRole('button', { name: 'Accept team invitation', exact: true }).click()
    await expect(staff).toHaveURL('/coach/teams/' + id)
    await expect(staff.getByRole('heading', { name: 'R4 browser team', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Clients', exact: true }).click()
    await page
      .getByRole('combobox', { name: 'Your client', exact: true })
      .selectOption(f.assignment.relationship_id)
    await page.getByRole('button', { name: 'Request team enrollment', exact: true }).click()
    await expect(page.getByText('Awaiting client approval', { exact: true })).toBeVisible()
    // Browser contexts represent different signed-in people.
    await f.login(client, f.client, '/today')
    await expect(client.getByText('Review your team invitation', { exact: true })).toBeVisible()
    await client.goto('/teams')
    await client.getByRole('button', { name: 'Join this team', exact: true }).click()
    await expect(client.getByRole('button', { name: 'Join this team', exact: true })).toBeHidden()
    await page.reload()
    await page.getByRole('button', { name: 'Groups', exact: true }).click()
    await page.getByLabel('Group name', { exact: true }).fill('Morning group')
    await page.getByRole('button', { name: 'Save group', exact: true }).click()
    await page
      .getByRole('combobox', { name: 'Selected group', exact: true })
      .selectOption({ label: 'Morning group' })
    await page
      .getByRole('combobox', { name: 'Add client to group', exact: true })
      .selectOption({ label: 'R4 Athlete' })
    await page.getByRole('button', { name: 'Add to group', exact: true }).click()
    await page.getByRole('checkbox', { name: 'R4 Athlete', exact: true }).check()
    await page
      .getByRole('combobox', { name: 'Published plan for group', exact: true })
      .selectOption(f.version.id)
    await page.getByRole('button', { name: 'Review assignment', exact: true }).click()
    let dropped = false
    await page.route('**/v1/commands/assign_team_group', async (route) => {
      if (!dropped) {
        dropped = true
        await route.fetch()
        await route.abort('failed')
      } else await route.continue()
    })
    await page.getByRole('button', { name: 'Confirm group assignment', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'Retry saved change', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Retry saved change', exact: true }),
    ).toBeEnabled()
    await page.reload()
    await page.getByRole('button', { name: 'Retry saved change', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Retry saved change', exact: true })).toBeHidden()
    const receipts = { data: await f.rows(f.owner, 'team_assignments') }
    expect(receipts.data).toHaveLength(1)
    await page.getByRole('button', { name: 'Shared library', exact: true }).click()
    await page
      .getByRole('combobox', { name: 'Your published version', exact: true })
      .selectOption(f.version.id)
    await page.getByRole('button', { name: 'Share plan with team', exact: true }).click()
    await staff.reload()
    await staff.getByRole('button', { name: 'Shared library', exact: true }).click()
    await staff.getByRole('button', { name: 'Copy to my plans', exact: true }).click()
    await expect(staff).toHaveURL(/\/coach\/plans\/[\da-f-]+$/)
    await page.getByRole('button', { name: 'Clients', exact: true }).click()
    await page.getByRole('combobox', { name: 'New coach', exact: true }).selectOption(f.coach.id)
    await page.getByRole('button', { name: 'Request coach change', exact: true }).click()
    await client.reload()
    await client.getByRole('button', { name: 'Approve coach change', exact: true }).click()
    await expect(
      client.getByRole('button', { name: 'Approve coach change', exact: true }),
    ).toBeHidden()
    await staff.goto('/coach/teams/' + id)
    await expect(staff.getByRole('heading', { name: 'R4 Athlete', exact: true })).toBeVisible()
    await expect(
      staff.getByRole('link', { name: 'Open coaching workspace', exact: true }),
    ).toBeVisible()
    await expect(staff.getByRole('combobox', { name: 'New coach', exact: true })).toHaveCount(0)
    expect((await new AxeBuilder({ page: staff }).analyze()).violations).toEqual([])
    expect(
      await staff.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy()
    await staff.screenshot({
      path: `artifacts/r4-team-${info.project.name}.png`,
      fullPage: true,
      animations: 'disabled',
    })
  } finally {
    await context.close()
    await staffContext.close()
    await f.cleanup()
  }
})

test('local business states and team support preserve privacy and recover typed drafts', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(90000)
  const f = await teamFixture(),
    context = await browser.newContext(),
    client = await context.newPage()
  try {
    const id = crypto.randomUUID()
    f.teamIds.push(id)
    await f.rpc(f.owner, 'create_team', { p_id: id, p_name: 'R4 support team' })
    const enrollment = crypto.randomUUID()
    await f.rpc(f.owner, 'propose_team_client', {
      p_id: enrollment,
      p_team: id,
      p_relationship: f.assignment.relationship_id,
    })
    await f.rpc(f.client, 'respond_team_client', {
      p_id: enrollment,
      p_revision: 1,
      p_accept: true,
    })
    await f.login(page, f.owner, '/coach/business?team=' + id)
    await page.getByText('Local provider simulation', { exact: true }).click()
    await page
      .getByRole('combobox', { name: 'Simulated state', exact: true })
      .selectOption('past_due')
    await page.getByRole('button', { name: 'Apply simulated event', exact: true }).click()
    await expect(
      page.getByRole('heading', { name: 'New team activity is restricted', exact: true }),
    ).toBeVisible()
    await f.login(client, f.client, '/support')
    await client.getByLabel('Subject', { exact: true }).fill('R4 team support request')
    await client
      .getByLabel('What happened?', { exact: true })
      .fill('Please explain the revised schedule.')
    await client.getByRole('combobox', { name: 'Send request to', exact: true }).selectOption(id)
    await client.reload()
    await expect(client.getByLabel('What happened?', { exact: true })).toHaveValue(
      'Please explain the revised schedule.',
    )
    await client.getByRole('button', { name: 'Save support request', exact: true }).click()
    await expect(
      client.getByRole('heading', { name: 'R4 team support request', exact: true }),
    ).toBeVisible()
    await page.goto('/coach/support?team=' + id)
    await page.getByRole('button', { name: /R4 team support request/ }).click()
    await page
      .getByLabel('Response', { exact: true })
      .fill('Your coach can still update your existing training.')
    await page.getByRole('button', { name: 'Respond and resolve', exact: true }).click()
    await client.reload()
    await client.getByRole('combobox', { name: 'Show cases', exact: true }).selectOption('all')
    await client.getByRole('button', { name: /R4 team support request/ }).click()
    await expect(
      client.getByText('Your coach can still update your existing training.', { exact: true }),
    ).toBeVisible()
    expect((await new AxeBuilder({ page: client }).analyze()).violations).toEqual([])
    await client.screenshot({
      path: `artifacts/r4-support-${info.project.name}.png`,
      fullPage: true,
      animations: 'disabled',
    })
  } finally {
    await context.close()
    await f.cleanup()
  }
})
