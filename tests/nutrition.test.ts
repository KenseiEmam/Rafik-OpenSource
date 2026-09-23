import { describe, expect, it } from 'vitest'
import { allocateMacros, macroEnergy, nutrientTotals } from '../src/features/nutrition/model'
describe('nutrition quantities and truthful totals', () => {
  it('scales every macro from the source basis without treating unknown as zero', () => {
    const nutrients = { kcal: 130, protein_g: 2.69, carb_g: 28.17, fat_g: 0.28 }
    const result = nutrientTotals([
      { quantity: 150, basis: 100, nutrients },
      { quantity: 1, basis: 1, nutrients: { protein_g: 0 } },
    ])
    expect(result.kcal).toEqual({ value: 195, missing: 1 })
    expect(result.protein_g).toEqual({ value: 4, missing: 0 })
    expect(result.carb_g).toEqual({ value: 42.3, missing: 1 })
    expect(nutrients.kcal).toBe(130)
    expect(nutrientTotals([]).kcal.value).toBeNull()
  })
  it('does not display infinity or NaN while a portion is being corrected', () => {
    expect(nutrientTotals([{ quantity: 100, basis: 0, nutrients: { kcal: 130 } }]).kcal).toEqual({
      value: null,
      missing: 1,
    })
  })
  it('allocates a coach-chosen budget, rather than inferring a calorie recommendation', () => {
    const n = allocateMacros(2000, 25, 30)!
    expect(n).toEqual({ kcal: 2000, protein_g: 125, carb_g: 225, fat_g: 66.7 })
    expect(macroEnergy(n)).toBe(2000.3)
    expect(allocateMacros(2000, 80, 30)).toBeNull()
    expect(allocateMacros(0, 25, 30)).toBeNull()
    expect(allocateMacros(NaN, 25, 30)).toBeNull()
    expect(macroEnergy({ protein_g: 100 })).toBeNull()
  })
})

describe('manual nutrition totals', () => {
  it('scales explicit portions without treating missing nutrients as zero', () => {
    const result = nutrientTotals([
      { quantity: 150, basis: 100, nutrients: { kcal: 130, protein_g: null } },
      { quantity: 1, basis: 1, nutrients: { protein_g: 0 } },
    ])
    expect(result.kcal).toEqual({ value: 195, missing: 1 })
    expect(result.protein_g).toEqual({ value: 0, missing: 1 })
    expect(result.fat_g).toEqual({ value: null, missing: 2 })
  })
  it('keeps an empty day unknown', () => {
    expect(nutrientTotals([]).kcal).toEqual({ value: null, missing: 0 })
  })
})
