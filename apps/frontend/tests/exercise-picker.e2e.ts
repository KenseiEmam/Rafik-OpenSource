import { expect, test, type Locator, type Page } from '@playwright/test'
import { teamFixture } from './team-fixture'
import { testApi } from './local-config'

const laterStrength = { id: 'dataset-0859', name: 'wrist rollerer' }
const timedExercise = { id: 'dataset-3637', name: 'wheel run' }
const alternatives = [
  { id: 'dataset-1368', name: 'ankle circles' },
  { id: 'dataset-1428', name: 'wrist circles' },
  { id: 'dataset-1311', name: 'wide hand push up' },
]

async function chooseWithKeyboard(
  page: Page,
  picker: Locator,
  name: string,
  retainsSelection = true,
) {
  await picker.fill(name)
  const popup = page.locator('.exercise-picker-options:visible')
  await expect(popup.locator('.exercise-picker-option')).toHaveCount(1)
  await expect(popup.locator('.exercise-picker-option')).toContainText(name)
  await picker.press('ArrowDown')
  await picker.press('Enter')
  if (retainsSelection) await expect(picker).toHaveValue(name)
}

async function expectVisibleResultContained(popup: Locator) {
  const first = popup.locator('.exercise-picker-option').first()
  await expect(first).toBeVisible()
  const [popupBounds, resultBounds] = await Promise.all([popup.boundingBox(), first.boundingBox()])
  expect(popupBounds).not.toBeNull()
  expect(resultBounds).not.toBeNull()
  expect(resultBounds!.y).toBeGreaterThanOrEqual(popupBounds!.y)
  expect(resultBounds!.y + resultBounds!.height).toBeLessThanOrEqual(
    popupBounds!.y + popupBounds!.height,
  )
}

async function storedPrimaryId(page: Page, key: string) {
  return page.evaluate(
    (draftKey) =>
      new Promise<string | undefined>((resolve, reject) => {
        const open = indexedDB.open('rafik-revamp', 1)
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
          const get = open.result.transaction('drafts').objectStore('drafts').get(draftKey)
          get.onerror = () => reject(get.error)
          get.onsuccess = () => {
            const value = get.result?.value as
              { draft?: { days?: { exercises?: { exerciseId?: string }[] }[] } } | undefined
            resolve(value?.draft?.days?.[0]?.exercises?.[0]?.exerciseId)
            open.result.close()
          }
        }
      }),
    key,
  )
}

test('large exercise picker stays bounded and preserves searchable plan choices', async ({
  page,
  request,
}, info) => {
  test.setTimeout(90000)
  const sourceResponse = await request.get(testApi + '/v1/catalog/exercises')
  expect(sourceResponse.ok()).toBeTruthy()
  const source = (await sourceResponse.json()) as {
    exercises: { id: string; name: string; kind: string }[]
  }
  expect(source.exercises).toHaveLength(1324)
  for (const expected of [laterStrength, timedExercise, ...alternatives])
    expect(source.exercises).toContainEqual(expect.objectContaining(expected))

  const fixture = await teamFixture()
  try {
    await fixture.login(page, fixture.owner, '/coach/plans/new')
    const exercise = page.locator('.editor-exercise').first()
    const primary = exercise.getByRole('combobox', { name: 'Exercise 1', exact: true })

    await primary.click()
    let popup = page.locator('.exercise-picker-options:visible')
    await expect(popup.locator('.exercise-picker-hint')).toContainText(
      /Showing 40 of 1[3-9]\d{2} exercises/,
    )
    await expect(popup.locator('.exercise-picker-option')).toHaveCount(40)
    await expectVisibleResultContained(popup)
    const filterToggle = popup.getByRole('button', { name: /^Filters/ })
    await expect(popup.getByRole('combobox', { name: 'Equipment', exact: true })).toHaveCount(0)
    await filterToggle.click()
    await popup.getByRole('combobox', { name: 'Equipment', exact: true }).selectOption('bench')
    const bodyArea = popup.getByRole('combobox', { name: 'Body area', exact: true })
    await bodyArea.selectOption('chest')
    await expect(filterToggle).toContainText('2')
    await expect(popup.getByText('Bench Press', { exact: true })).toBeVisible()
    await expect(popup.getByText('Hip Thrust', { exact: true })).toHaveCount(0)
    await bodyArea.selectOption('upper legs')
    await expect(popup.getByText('Hip Thrust', { exact: true })).toBeVisible()
    await popup.getByRole('button', { name: 'Clear filters', exact: true }).click()
    await expect(filterToggle).toHaveText('Filters')
    await expect(popup.locator('.exercise-picker-option')).toHaveCount(40)
    await filterToggle.click()
    await expectVisibleResultContained(popup)
    await page.screenshot({
      path: `artifacts/r15-exercise-picker-${info.project.name}-initial.png`,
      fullPage: false,
    })
    await primary.press('Escape')
    await expect(popup).toBeHidden()

    // Filling a closed picker must keep the incoming query when that input event opens it.
    // The last source record is reached through metadata as well as its name.
    await primary.fill('lower arms rollerer')
    popup = page.locator('.exercise-picker-options:visible')
    await expect(popup.locator('.exercise-picker-option')).toHaveCount(1)
    await expect(popup.locator('.exercise-picker-option')).toContainText(laterStrength.name)
    await primary.press('ArrowDown')
    await primary.press('Enter')
    await expect(primary).toHaveValue(laterStrength.name)
    await expect
      .poll(() => storedPrimaryId(page, `plan:${fixture.owner.id}:new`))
      .toBe(laterStrength.id)

    await page.reload()
    const restoredExercise = page.locator('.editor-exercise').first()
    const restoredPrimary = restoredExercise.getByRole('combobox', {
      name: 'Exercise 1',
      exact: true,
    })
    await expect(restoredPrimary).toHaveValue(laterStrength.name)
    await restoredPrimary.click()
    popup = page.locator('.exercise-picker-options:visible')
    await expect(popup.locator('[data-state="checked"]')).toContainText(laterStrength.name)
    await restoredPrimary.press('Escape')
    await expect(popup).toBeHidden()
    await expect(restoredPrimary).toHaveValue(laterStrength.name)

    await restoredExercise.getByText('Offer an alternative', { exact: true }).click()
    const alternativePicker = restoredExercise.getByRole('combobox', {
      name: 'Add approved alternative 1',
      exact: true,
    })

    // A strength prescription does not offer a timed alternative.
    await alternativePicker.fill(timedExercise.name)
    popup = page.locator('.exercise-picker-options:visible')
    await expect(popup.locator('.exercise-picker-option')).toHaveCount(0)
    await expect(popup.locator('.exercise-picker-empty')).toBeVisible()
    await alternativePicker.press('Escape')

    for (const option of alternatives) {
      await chooseWithKeyboard(page, alternativePicker, option.name, false)
      await expect(
        restoredExercise.getByRole('button', {
          name: `Remove alternative ${option.name}`,
          exact: true,
        }),
      ).toBeVisible()
    }
    await expect(restoredExercise.getByRole('button', { name: /^Remove alternative/ })).toHaveCount(
      3,
    )
    await expect(alternativePicker).toBeDisabled()

    // Changing recording type clears alternatives through the existing editor mutation.
    await chooseWithKeyboard(page, restoredPrimary, timedExercise.name)
    await expect(restoredExercise.getByRole('button', { name: /^Remove alternative/ })).toHaveCount(
      0,
    )
    await expect(alternativePicker).toBeEnabled()

    await restoredPrimary.click()
    popup = page.locator('.exercise-picker-options:visible')
    await popup.getByRole('button', { name: /^Filters/ }).click()
    await popup
      .getByRole('combobox', { name: 'Recording type', exact: true })
      .selectOption('distance')
    const filteredOptions = popup.locator('.exercise-picker-option')
    await expect(filteredOptions.first()).toContainText('Distance')
    expect(await filteredOptions.count()).toBeGreaterThan(0)
    expect(await filteredOptions.count()).toBeLessThanOrEqual(40)
    for (const metadata of await filteredOptions.locator('small').allTextContents())
      expect(metadata).toContain('Distance')
    await popup.getByRole('button', { name: 'Clear filters', exact: true }).click()
    await expect(popup.locator('.exercise-picker-option')).toHaveCount(40)
    await restoredPrimary.press('Escape')
    await expect(restoredPrimary).toHaveValue(timedExercise.name)

    await page.setViewportSize({ width: 320, height: 720 })
    await page.getByRole('button', { name: 'Switch to Arabic', exact: true }).click()
    const arabicPrimary = restoredExercise.getByRole('combobox', {
      name: 'التمرين 1',
      exact: true,
    })
    // Imported records have no Arabic name yet, so the usable English name remains visible.
    await expect(arabicPrimary).toHaveValue(timedExercise.name)
    await arabicPrimary.click()
    popup = page.locator('.exercise-picker-options:visible')
    await expect(popup).toBeVisible()
    await expect(popup).toHaveCSS('direction', 'rtl')
    const mountedOptions = await popup.locator('.exercise-picker-option').count()
    expect(mountedOptions).toBeGreaterThan(0)
    expect(mountedOptions).toBeLessThanOrEqual(40)
    const bounds = await popup.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy()
    await expectVisibleResultContained(popup)
    await page.screenshot({
      path: `artifacts/r15-exercise-picker-${info.project.name}-phone-rtl.png`,
      fullPage: false,
    })
    await arabicPrimary.press('Escape')
    await expect(arabicPrimary).toHaveValue(timedExercise.name)
  } finally {
    await fixture.cleanup()
  }
})
