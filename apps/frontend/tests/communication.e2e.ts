import { test, expect } from '@playwright/test'
import { randomUUID, randomBytes } from 'node:crypto'
import AxeBuilder from '@axe-core/playwright'
import { teamFixture } from './team-fixture'
import { layoutIssues } from './layout-contract'
test('organization conversations preserve scope, compact layout, drafts and exact send recovery; notification links reach the right context', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(120000)
  const f = await teamFixture(),
    clientContext = await browser.newContext(),
    client = await clientContext.newPage(),
    id = randomUUID()
  try {
    await f.call(f.owner, '/v1/workspaces', {
      id,
      kind: 'organization',
      name: 'Madar communication test',
    })
    const token = randomBytes(32).toString('hex')
    await f.call(f.owner, `/v1/workspaces/${id}`, {
      operation: randomUUID(),
      action: 'invite',
      id: randomUUID(),
      email: f.client.email,
      roles: ['trainee'],
      token,
    })
    await f.call(f.client, `/v1/organization-invitations/${token}`, {})
    const base = `/organization/${id}/admin/messages`
    await f.login(page, f.owner, base)
    await page.getByRole('button', { name: 'New conversation', exact: true }).click()
    await page
      .getByLabel('Conversation name', { exact: true })
      .fill('Foundation questions and progress')
    await page.getByRole('checkbox', { name: 'R4 Client', exact: true }).check()
    await page.getByRole('button', { name: 'Create conversation', exact: true }).click()
    await expect(page).toHaveURL(/\/messages\/[a-f0-9-]{36}$/)
    const channel = new URL(page.url()).pathname.split('/').at(-1)!
    await page
      .getByRole('textbox', { name: 'Write a message', exact: true })
      .fill('Let us review your first week together.')
    await expect(page.getByText('Draft saved on this device', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('textbox', { name: 'Write a message', exact: true })).toHaveValue(
      'Let us review your first week together.',
    )
    let lost = false
    await page.route(`**/v1/workspaces/${id}/communication`, async (r) => {
      if (
        !lost &&
        r.request().method() === 'POST' &&
        r.request().postDataJSON()?.action === 'send'
      ) {
        lost = true
        await r.fetch()
        await r.abort('failed')
      } else await r.continue()
    })
    await page.getByRole('button', { name: 'Send message', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'Retry saved change', exact: true }),
    ).toBeEnabled()
    await page.reload()
    await page.getByRole('button', { name: 'Retry saved change', exact: true }).click()
    await expect(page.getByRole('textbox', { name: 'Write a message', exact: true })).toHaveValue(
      '',
    )
    await expect(
      page
        .locator('.message-bubble')
        .filter({ hasText: 'Let us review your first week together.' }),
    ).toHaveCount(1)
    await f.login(client, f.client, '/notifications')
    await client.getByRole('button', { name: 'Notification preferences', exact: true }).click()
    await client.getByRole('combobox', { name: 'Quiet from', exact: true }).selectOption('0')
    await client.getByRole('combobox', { name: 'Until', exact: true }).selectOption('0')
    await client.getByRole('button', { name: 'Save preferences', exact: true }).click()
    await expect(client.getByRole('status').filter({ hasText: 'Saved.' })).toBeVisible()
    await client.getByRole('button', { name: 'Back to updates', exact: true }).click()
    await client.getByRole('button', { name: 'New conversation updates', exact: false }).click()
    await expect(client).toHaveURL(`/organization/${id}/trainee/messages/${channel}`)
    await expect(
      client
        .locator('.message-bubble')
        .filter({ hasText: 'Let us review your first week together.' }),
    ).toHaveCount(1)
    await client.getByRole('button', { name: /^Participants/ }).click()
    await expect(
      client.locator('.channel-people').getByText('R4 Owner · manager', { exact: true }),
    ).toBeVisible()
    await client.getByRole('button', { name: /^Participants/ }).click()
    await client
      .getByRole('textbox', { name: 'Write a message', exact: true })
      .fill('The first session felt clear, thank you.')
    await client.getByRole('button', { name: 'Send message', exact: true }).click()
    await expect(client.getByRole('textbox', { name: 'Write a message', exact: true })).toHaveValue(
      '',
    )
    expect(await layoutIssues(client)).toEqual([])
    expect((await new AxeBuilder({ page: client }).analyze()).violations).toEqual([])
    await client.screenshot({
      path: info.outputPath('organization-conversation.png'),
      fullPage: true,
    })
    await client.goto(`/organization/${id}/trainee/messages`)
    await expect(
      client.getByRole('link', { name: /Foundation questions and progress/ }),
    ).toBeVisible()
    for (const size of [
      { width: 320, height: 568 },
      { width: 390, height: 664 },
      { width: 844, height: 390 },
    ]) {
      await client.setViewportSize(size)
      expect(await layoutIssues(client)).toEqual([])
      expect((await client.locator('.conversation-person').boundingBox())!.height).toBeLessThan(130)
    }
    await client
      .getByRole('searchbox', { name: 'Find a conversation', exact: true })
      .fill('no matching group')
    await client.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(client.getByText(/No matching conversations/)).toBeVisible()
  } finally {
    await clientContext.close()
    await f.cleanup()
  }
})
