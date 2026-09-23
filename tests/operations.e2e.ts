import { test, expect } from '@playwright/test'
import { randomUUID, randomBytes } from 'node:crypto'
import AxeBuilder from '@axe-core/playwright'
import { teamFixture } from './team-fixture'
import { layoutIssues } from './layout-contract'
test('platform operator has a separate audited account workflow and private deep links return through sign-in', async ({
  page,
}, info) => {
  const f = await teamFixture(),
    restoreReason = `Restore isolated account ${randomUUID()}`
  try {
    await page.goto('/notifications?event=' + randomUUID())
    await expect(page).toHaveURL(/\/login\?next=/)
    await page.goto('/platform')
    await expect(page).toHaveURL(/\/login\?next=/)
    await page.goto('/local-preview')
    await page.getByRole('button', { name: /Amina/ }).click()
    await expect(page).toHaveURL('/platform')
    await page.getByRole('combobox', { name: 'Area', exact: true }).selectOption('users')
    await page.getByRole('searchbox', { name: 'Search', exact: true }).fill(f.client.email)
    await page.getByRole('button', { name: 'Refresh results', exact: true }).click()
    await page.getByRole('button', { name: 'Suspend access', exact: true }).click()
    await page
      .getByRole('textbox', { name: 'Reason for this action', exact: true })
      .fill('Local browser acceptance of suspension')
    await page.getByRole('button', { name: 'Confirm action', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Saved.' })).toBeVisible()
    await page.getByRole('button', { name: 'Restore access', exact: true }).click()
    await page
      .getByRole('textbox', { name: 'Reason for this action', exact: true })
      .fill(restoreReason)
    await page.getByRole('button', { name: 'Confirm action', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Suspend access', exact: true })).toBeVisible()
    await page.getByRole('combobox', { name: 'Area', exact: true }).selectOption('audit')
    await expect(page.getByText(restoreReason, { exact: true })).toBeVisible()
    expect(await layoutIssues(page)).toEqual([])
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.screenshot({ path: info.outputPath('platform-audit.png'), fullPage: true })
  } finally {
    await f.cleanup()
  }
})
test('organization trainer can create a conversation with their assigned trainee and keeps the required own participant', async ({
  page,
}) => {
  const f = await teamFixture(),
    id = randomUUID()
  try {
    await f.call(f.owner, '/v1/workspaces', {
      id,
      kind: 'organization',
      name: 'Scoped communication',
    })
    const join = async (who: typeof f.coach, roles: string[]) => {
      const token = randomBytes(32).toString('hex')
      await f.call(f.owner, `/v1/workspaces/${id}`, {
        operation: randomUUID(),
        action: 'invite',
        id: randomUUID(),
        email: who.email,
        roles,
        token,
      })
      await f.call(who, `/v1/organization-invitations/${token}`, {})
    }
    await join(f.coach, ['trainer'])
    await join(f.client, ['trainee'])
    const org = await f.call(f.owner, `/v1/workspaces/${id}?view=admin`),
      coach = org.members.find((m: any) => m.user_id === f.coach.id),
      client = org.members.find((m: any) => m.user_id === f.client.id)
    await f.call(f.owner, `/v1/workspaces/${id}`, {
      operation: randomUUID(),
      action: 'assign-trainer',
      id: client.id,
      revision: client.revision,
      trainer: coach.id,
    })
    await f.login(page, f.coach, `/organization/${id}/trainer/messages`)
    await page.setViewportSize({ width: 320, height: 568 })
    await page.getByRole('button', { name: 'New conversation', exact: true }).click()
    const editorSize = await page
      .locator('.channel-editor')
      .evaluate((el) => ({ scroll: el.scrollHeight, box: el.clientHeight }))
    expect(editorSize.scroll).toBeLessThanOrEqual(editorSize.box + 2)
    await page.getByLabel('Conversation name', { exact: true }).fill('Weekly training questions')
    await page.getByRole('checkbox', { name: 'R4 Client', exact: true }).check()
    await page.getByRole('button', { name: 'Create conversation', exact: true }).click()
    await expect(page).toHaveURL(/messages\/[a-f0-9-]{36}$/)
    await page
      .getByRole('textbox', { name: 'Write a message', exact: true })
      .fill('What would help with the next session?')
    await page.getByRole('button', { name: 'Send message', exact: true }).click()
    await expect(page.locator('.message-bubble')).toContainText(
      'What would help with the next session?',
    )
    expect(await layoutIssues(page)).toEqual([])
  } finally {
    await f.cleanup()
  }
})

test('large member selection searches the full roster and keeps reviewed choices across pages and reload', async ({
  page,
}, info) => {
  const f = await teamFixture(),
    id = randomUUID()
  try {
    await f.call(f.owner, '/v1/workspaces', {
      id,
      kind: 'organization',
      name: 'Roster selection test',
    })
    const { execFileSync } = await import('node:child_process'),
      { testDatabase } = await import('./local-config')
    const people = Array.from({ length: 61 }, (_, i) => ({
      id: randomUUID(),
      name: `Trainee ${String(i).padStart(3, '0')} with a long displayed name`,
    }))
    execFileSync(
      'docker',
      [
        'compose',
        'exec',
        '-T',
        'db',
        'psql',
        '-U',
        'rafik_migrate',
        '-d',
        testDatabase,
        '-v',
        'ON_ERROR_STOP=1',
      ],
      {
        cwd: '../rafik-api',
        input: `insert into public.workspace_members(id,workspace_id,name,roles) values ${people.map((p) => `('${p.id}','${id}','${p.name}',ARRAY['trainee'])`).join(',')};`,
        stdio: 'pipe',
      },
    )
    await f.login(page, f.owner, `/organization/${id}/admin/groups`)
    await page.getByRole('button', { name: 'New group', exact: true }).click()
    await page.getByLabel('Name', { exact: true }).fill('Reviewed roster selection')
    const picker = page.locator('.member-picker')
    await expect(picker.getByRole('checkbox')).toHaveCount(25)
    await picker.getByRole('checkbox', { name: people[0]!.name, exact: true }).check()
    await picker.getByRole('button', { name: 'Load more people', exact: true }).click()
    await expect(picker.getByRole('checkbox')).toHaveCount(50)
    await picker.getByRole('checkbox', { name: people[49]!.name, exact: true }).check()
    await expect(picker.locator('.chosen-members')).toContainText(people[49]!.name)
    await expect(picker.getByRole('checkbox')).toHaveCount(50)
    await expect(
      picker.getByRole('checkbox', { name: people[49]!.name, exact: true }),
    ).toBeChecked()
    await picker.getByRole('searchbox').fill('060')
    await picker.getByRole('button', { name: 'Search people', exact: true }).click()
    await picker.getByRole('checkbox', { name: people[60]!.name, exact: true }).check()
    await expect(picker.locator('.chosen-members')).toContainText(people[0]!.name)
    await expect(page.getByText('Draft saved on this device.', { exact: true })).toBeVisible()
    await page.reload()
    await expect(picker.locator('.chosen-members')).toContainText(people[60]!.name)
    await expect(picker.locator('.chosen-members')).toContainText(people[0]!.name)
    await page.setViewportSize({ width: 320, height: 568 })
    expect(await layoutIssues(page)).toEqual([])
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.screenshot({ path: info.outputPath('paged-selection.png'), fullPage: true })
    await page.getByRole('button', { name: 'Save group', exact: true }).click()
    await expect(
      page.getByRole('heading', { name: 'Reviewed roster selection', exact: true }),
    ).toBeVisible()
  } finally {
    await f.cleanup()
  }
})
