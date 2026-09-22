import { describe, it, expect } from 'vitest'
import { nutrientTotals } from '../src/features/nutrition/model'
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
  it('keeps an empty day unknown rather than reporting zero food intake', () =>
    expect(nutrientTotals([]).kcal).toEqual({ value: null, missing: 0 }))
})
