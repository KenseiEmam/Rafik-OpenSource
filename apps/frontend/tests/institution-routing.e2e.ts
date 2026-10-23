import { test, expect } from '@playwright/test'
import { randomUUID, randomBytes } from 'node:crypto'
import { teamFixture } from './team-fixture'
import { layoutIssues } from './layout-contract'

test('flat routes preserve legacy bookmarks, derive roles and retire Tasks', async ({
  page,
}, info) => {
  test.setTimeout(120000)
  const f = await teamFixture(),
    id = randomUUID()
  try {
    await f.call(f.owner, '/v1/institutions', {
      id,
      kind: 'institution',
      name: 'Routing institution',
    })
    const token = randomBytes(32).toString('hex')
    await f.call(f.owner, `/v1/institution`, {
      operation: randomUUID(),
      action: 'invite',
      id: randomUUID(),
      email: f.coach.email,
      roles: ['trainer'],
      token,
    })
    await f.call(f.coach, `/v1/invitations/${token}`, {})
    await f.login(page, f.owner, '/dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const draftKeys = [
      `trainer-tasks:${f.owner.id}:${id}:admin:new`,
      `r4-command:${f.owner.id}:trainer-tasks:${f.owner.id}:${id}:admin`,
      `plan:${f.owner.id}:${id}:admin:keep`,
      'trainer-tasks:another-account:keep',
    ]
    await page.evaluate(async (keys) => {
      const database = await new Promise<IDBDatabase>((accept, reject) => {
        const request = indexedDB.open('rafik-revamp', 1)
        request.onsuccess = () => accept(request.result)
        request.onerror = () => reject(request.error)
      })
      await new Promise<void>((accept, reject) => {
        const tx = database.transaction('drafts', 'readwrite')
        for (const key of keys)
          tx.objectStore('drafts').put({
            key,
            value: { title: 'Fixture draft' },
            savedAt: new Date().toISOString(),
          })
        tx.oncomplete = () => accept()
        tx.onerror = () => reject(tx.error)
      })
      database.close()
    }, draftKeys)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const remaining = await page.evaluate(async () => {
      const database = await new Promise<IDBDatabase>((accept) => {
        const request = indexedDB.open('rafik-revamp', 1)
        request.onsuccess = () => accept(request.result)
      })
      const keys = await new Promise<IDBValidKey[]>((accept) => {
        const request = database.transaction('drafts').objectStore('drafts').getAllKeys()
        request.onsuccess = () => accept(request.result)
      })
      database.close()
      return keys
    })
    expect(remaining).not.toContain(draftKeys[0])
    expect(remaining).not.toContain(draftKeys[1])
    expect(remaining).toContain(draftKeys[2])
    expect(remaining).toContain(draftKeys[3])
    await expect(page.locator('.dashboard-navigation a[href="/tasks"]')).toHaveCount(0)
    await expect(page.locator('.dashboard-navigation a[href="/institution-settings"]')).toHaveCount(
      1,
    )
    await page.goto(`/organization/${id}/trainer/people?search=R4&limit=25`)
    await expect(page).toHaveURL(/\/people\?search=R4&limit=25$/)
    await expect(page.getByRole('heading', { name: 'People', exact: true })).toBeVisible()
    await page.goto(`/organization/${id}/admin/settings`)
    await expect(page).toHaveURL(/\/institution-settings$/)
    await expect(
      page.getByRole('heading', { name: 'Institution settings', exact: true }),
    ).toBeVisible()
    await page.goto(`/organization/${id}/admin/calendar?view=month`)
    await expect(page).toHaveURL(/\/schedule\?view=month$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.goto(`/organization/${id}/admin/tasks/new`)
    await expect(page).toHaveURL(/\/tasks\/new$/)
    await expect(page.getByRole('heading', { name: 'That page isn’t here.' })).toBeVisible()
    await page.goto(`/organization/${randomUUID()}/admin/people`)
    await expect(page).toHaveURL(/\/access$/)
    await expect(page.getByRole('heading', { name: 'Institution access' })).toBeVisible()
    await page.getByRole('button', { name: 'Retry', exact: true }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    for (const path of ['/institutions', '/tasks', '/coach/forms', '/checkins', '/teams']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { name: 'That page isn’t here.' })).toBeVisible()
    }
    await f.login(page, f.coach, `/organization/${id}/admin/schedule`)
    await expect(page).toHaveURL(/\/schedule$/)
    await expect(page.locator('.dashboard-navigation a[href="/institution-settings"]')).toHaveCount(
      0,
    )
    await page.goto('/institution-settings')
    await expect(page).toHaveURL(/\/dashboard$/)
    await page.goto('/schedule')
    await page.evaluate(() => {
      localStorage.setItem('rafik.locale', 'ar')
      localStorage.setItem('rafik.theme', 'dark')
    })
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('.loading-state')).toHaveCount(0)
    expect(await layoutIssues(page)).toEqual([])
  } finally {
    await f.cleanup()
  }
})
