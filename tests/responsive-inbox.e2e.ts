import { test, expect } from '@playwright/test'
import { teamFixture } from './team-fixture'
import { expectUsableInbox, layoutIssues } from './layout-contract'

test('populated inbox contains long names and compact rows at short, tall, RTL and resized viewports', async ({
  page,
}, info) => {
  test.setTimeout(90000)
  const f = await teamFixture()
  try {
    const token = crypto.randomUUID() + crypto.randomUUID()
    await f.rpc(f.owner, 'create_invitation', {
      p_email: f.coach.email,
      p_version_id: f.version.id,
      p_token: token,
      p_request_id: crypto.randomUUID(),
    })
    await f.rpc(f.coach, 'accept_invitation', { p_token: token })
    await f.rpc(f.coach, 'update_profile', {
      p_name: 'Alexandria-' + 'LongName'.repeat(8),
      p_locale: 'en',
      p_units: 'kg',
      p_timezone: 'UTC',
    })
    await f.login(page, f.owner, '/coach/messages')
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 664 },
      { width: 444, height: 1043 },
      { width: 844, height: 390 },
      { width: 1440, height: 1000 },
    ]) {
      await page.setViewportSize(viewport)
      for (const lang of ['en', 'ar']) {
        await page.evaluate((lang) => {
          localStorage.setItem('rafik.locale', lang)
          localStorage.setItem('rafik.theme', lang === 'en' ? 'light' : 'dark')
        }, lang)
        await page.reload()
        await expect(page.locator('.conversation-person')).toHaveCount(2)
        await expectUsableInbox(page)
        await page.screenshot({
          path: `artifacts/inbox-${info.project.name}-${viewport.width}-${lang}.png`,
          fullPage: true,
        })
      }
    }
    await page.evaluate(() => localStorage.setItem('rafik.locale', 'en'))
    await page.setViewportSize({ width: 390, height: 664 })
    await page.reload()
    await page.getByRole('searchbox').fill('Alexandria')
    await expect(page.locator('.conversation-person')).toHaveCount(1)
    await page.locator('.conversation-person').click()
    await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Back to conversations' }).click()
    await expectUsableInbox(page)
    await page.getByRole('searchbox').fill('No person matches')
    await expect(page.getByText('No matching conversations.')).toBeVisible()
    await page.getByRole('searchbox').clear()
    await expectUsableInbox(page)
  } finally {
    await f.cleanup()
  }
})

test('long native plan selections and Arabic resource filters stay inside phone controls', async ({
  page,
}) => {
  const f = await teamFixture()
  try {
    const plan = (await f.rows(f.owner, 'plans', 'id', f.version.plan_id))[0]
    await f.rpc(f.owner, 'save_plan', {
      p_id: plan.id,
      p_title: 'A practical strength plan for a busy working week with flexible session choices',
      p_draft: plan.draft,
      p_expected_version: plan.draft_version,
    })
    const version = await f.rpc(f.owner, 'publish_plan', {
      p_id: plan.id,
      p_expected_version: plan.draft_version + 1,
    })
    await f.rpc(f.owner, 'assign_plan', {
      p_relationship_id: f.assignment.relationship_id,
      p_version_id: version.id,
    })
    await page.setViewportSize({ width: 320, height: 568 })
    await f.login(page, f.owner, '/coach/clients')
    await expect(page.locator('.client-row')).toHaveCount(1)
    expect(await layoutIssues(page)).toEqual([])
    await expect(page.locator('.client-row select')).toHaveValue(version.id)
    await page.evaluate(() => localStorage.setItem('rafik.locale', 'ar'))
    await page.setViewportSize({ width: 390, height: 664 })
    await page.goto('/coach/resources')
    await page.locator('.roster-tools select').waitFor()
    expect(await layoutIssues(page)).toEqual([])
  } finally {
    await f.cleanup()
  }
})
