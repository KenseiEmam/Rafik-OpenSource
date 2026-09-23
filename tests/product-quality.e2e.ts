import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { teamFixture } from './team-fixture'

test('long conversations keep composing reachable, preserve reading position and recover a phone inbox draft', async ({
  page,
}, info) => {
  test.setTimeout(100000)
  const f = await teamFixture()
  try {
    const relation = f.assignment.relationship_id
    for (let i = 0; i < 56; i++)
      await f.rpc(f.owner, 'send_message', {
        p_id: crypto.randomUUID(),
        p_relationship: relation,
        p_body: `Conversation item ${i}. A real coaching detail to read.`,
      })
    await f.login(page, f.client, `/messages/${relation}`)
    const compose = page.getByRole('textbox', { name: 'Message', exact: true })
    await expect(compose).toBeVisible()
    const box = await compose.boundingBox()
    expect(box!.y + box!.height).toBeLessThan(page.viewportSize()!.height)
    await expect(page.locator('.message-log')).toContainText('Conversation item 55')
    await page.locator('.message-log').evaluate((el) => {
      el.scrollTop = 0
    })
    await page.getByRole('button', { name: 'Load earlier messages' }).click()
    await expect(page.locator('.message-log')).toContainText('Conversation item 0.')
    await page.locator('.message-log').evaluate((el) => {
      el.scrollTop = 40
    })
    await f.rpc(f.owner, 'send_message', {
      p_id: crypto.randomUUID(),
      p_relationship: relation,
      p_body: 'Arrived while reading older messages',
    })
    await page.getByRole('button', { name: 'Refresh messages' }).click()
    await expect(page.getByRole('button', { name: 'New messages ↓' })).toBeVisible()
    expect(await page.locator('.message-log').evaluate((el) => el.scrollTop)).toBeLessThan(100)
    const inbox = await f.rpc(f.client, 'conversation_inbox', {})
    expect(inbox[0].unread).toBe(1)
    await page.getByRole('button', { name: 'New messages ↓' }).click()
    await expect
      .poll(async () => (await f.rpc(f.client, 'conversation_inbox', {}))[0].unread)
      .toBe(0)
    await compose.fill('Draft stays with this person')
    if (info.project.name === 'webkit-phone') {
      await page.getByRole('link', { name: 'Back to conversations' }).click()
      await page.getByRole('searchbox', { name: 'Find a conversation' }).fill('No match')
      await expect(page.getByText('No matching conversations.')).toBeVisible()
      await page.getByRole('searchbox', { name: 'Find a conversation' }).fill('R4 Owner')
      await page.locator('.conversation-person').click()
    } else await page.reload()
    await expect(compose).toHaveValue('Draft stays with this person')
    const linkedSession = await f.rpc(f.client, 'start_session', {
      p_id: crypto.randomUUID(),
      p_version_id: f.version.id,
      p_day_id: 'foundation-a',
      p_assignment_id: f.assignment.id,
    })
    await page.goto(`/messages/${relation}?session=${linkedSession.id}`)
    await expect(compose).toHaveValue('Draft stays with this person')
    await expect(page.locator('.context-chip')).toContainText('Linked to a workout')

    await page.getByRole('button', { name: 'Attach a file', exact: true }).click()
    await expect(page.getByRole('combobox', { name: 'Attach a shared file' })).toBeVisible()
    await page.getByRole('button', { name: 'Attach a file', exact: true }).click()
    await page.getByRole('button', { name: 'Send message', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('Message sent.')
    await expect(compose).toHaveValue('')
    await expect(compose).toBeFocused()
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.screenshot({
      path: `artifacts/r5-conversation-${info.project.name}.png`,
      fullPage: true,
    })
  } finally {
    await f.cleanup()
  }
})

test('approved alternative survives offline recording, completion, review and correction without changing the plan', async ({
  page,
  context,
}, info) => {
  test.setTimeout(90000)
  const f = await teamFixture()
  try {
    await f.login(page, f.owner, `/coach/plans/${f.version.plan_id}`)
    const exercise = page.locator('.editor-exercise').first()
    await exercise.getByText('Offer an alternative', { exact: true }).click()
    await exercise.getByRole('checkbox', { name: 'Split squat', exact: true }).check()
    await page.getByRole('button', { name: 'Save draft', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('Draft saved')
    await page.getByRole('button', { name: 'Publish plan', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('Published')
    const versions = await f.owner.api
      .from('plan_versions')
      .select('*')
      .eq('plan_id', f.version.plan_id)
      .order('revision', { ascending: false })
    const version = versions.data![0]!
    await f.rpc(f.owner, 'assign_plan', {
      p_relationship_id: f.assignment.relationship_id,
      p_version_id: version.id,
    })
    const session = await f.rpc(f.client, 'start_session', {
      p_id: crypto.randomUUID(),
      p_version_id: version.id,
      p_day_id: 'foundation-a',
      p_assignment_id: f.assignment.id,
    })
    await f.login(page, f.client, `/workout/${session.id}`)
    await page.getByText('Choose an alternative', { exact: true }).click()
    await context.route('**/rest/v1/rpc/save_session', (route) => route.abort())
    await page.getByRole('combobox', { name: 'Exercise to perform' }).selectOption('split-squat')
    await expect(page.locator('.logger-exercise-heading h2')).toHaveText('Split squat')
    await page.reload()
    await expect(page.locator('.logger-exercise-heading h2')).toHaveText('Split squat')
    await context.unroute('**/rest/v1/rpc/save_session')
    await page.getByRole('button', { name: /Mark set 1 done/ }).click()
    await expect
      .poll(
        async () =>
          (await f.rpc(f.client, 'session_document', { p_id: session.id })).entries.find(
            (e: { exercise_key: string }) =>
              e.exercise_key === session.prescription.exercises[0].key,
          ).exercise_id,
      )
      .toBe('split-squat')
    await page.getByRole('button', { name: 'Finish session', exact: true }).click()
    await page.getByRole('button', { name: 'Finish with recorded sets', exact: true }).click()
    await expect
      .poll(async () => (await f.rpc(f.client, 'session_document', { p_id: session.id })).status)
      .toBe('completed')
    await expect(page.getByRole('status')).toHaveText('Synced with your account')
    const completed = await f.rpc(f.client, 'session_document', { p_id: session.id })
    expect(completed.prescription).toEqual(session.prescription)
    await f.login(page, f.owner, `/coach/review/${session.id}`)
    await expect(page.locator('.review-exercise').first()).toContainText('Split squat')
    await expect(page.locator('.review-exercise').first()).toContainText('Planned: Goblet squat')
    const progress = await f.rpc(f.client, 'training_progress', {
      p_relationship: null,
      p_from: session.local_date,
      p_to: session.local_date,
    })
    expect(progress.find((x: { id: string }) => x.id === session.id).exercises[0].id).toBe(
      'split-squat',
    )
    const corrected = completed.entries.map((e: Record<string, unknown>) =>
      e.exercise_key === session.prescription.exercises[0].key
        ? { ...e, exercise_id: 'goblet-squat' }
        : e,
    )
    const result = await f.rpc(f.client, 'save_session', {
      p_id: session.id,
      p_expected_version: completed.version,
      p_operation_id: crypto.randomUUID(),
      p_entries: corrected,
      p_note: 'Corrected choice',
      p_complete: true,
    })
    expect(result.completed_at).toBe(completed.completed_at)
    expect(result.prescription).toEqual(session.prescription)
    await page.reload()
    await expect(page.locator('.review-exercise').first().getByRole('heading')).toHaveText(
      'Goblet squat',
    )
    await page.screenshot({
      path: `artifacts/r5-choice-review-${info.project.name}.png`,
      fullPage: true,
    })
  } finally {
    await f.cleanup()
  }
})

test('check-in pages stay navigable as records grow and scheduling gives a direct next step', async ({
  page,
}) => {
  const f = await teamFixture()
  try {
    const form = await f.rpc(f.owner, 'save_coaching_form', {
      p_id: crypto.randomUUID(),
      p_title: 'Weekly reflection',
      p_kind: 'checkin',
      p_fields: [{ id: 'energy', label: 'How did it feel?', type: 'text', required: true }],
      p_revision: 0,
    })
    const due = new Date().toISOString().slice(0, 10)
    for (const count of [12, 1])
      await f.rpc(f.owner, 'assign_coaching_form', {
        p_series: crypto.randomUUID(),
        p_relationship: f.assignment.relationship_id,
        p_form: form.id,
        p_revision: form.revision,
        p_due: due,
        p_count: count,
        p_interval: 7,
      })
    await f.login(page, f.owner, '/coach/checkins')
    await expect(page.locator('.request-row')).toHaveCount(12)
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(page.locator('.request-row')).toHaveCount(1)
    await expect(page.getByRole('region', { name: 'Requests', exact: true })).toBeFocused()
    await page.getByRole('button', { name: 'Previous', exact: true }).click()
    await expect(page.locator('.request-row')).toHaveCount(12)
    await page.getByRole('searchbox', { name: 'Find a request' }).fill('No match')
    await expect(page.locator('.request-row')).toHaveCount(0)
    await page.getByRole('link', { name: 'Schedule a check-in', exact: true }).click()
    await page
      .getByRole('combobox', { name: 'Assign to', exact: true })
      .selectOption(f.assignment.relationship_id)
    await page.getByRole('button', { name: 'Assign form', exact: true }).click()
    const confirmation = page.getByRole('link', { name: 'View scheduled request' })
    await expect(confirmation).toBeVisible()
    await confirmation.click()
    await expect(page).toHaveURL(/\/coach\/checkins\/[a-f0-9-]+$/)
    await expect(
      page.getByRole('heading', { name: 'Weekly reflection', exact: true, level: 1 }),
    ).toBeVisible()
  } finally {
    await f.cleanup()
  }
})
