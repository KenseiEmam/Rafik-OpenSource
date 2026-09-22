import { describe, it, expect } from 'vitest'
import { convertLoad } from '../src/lib/domain'
describe('recorded weight units', () => {
  it('converts the actual weight when the display unit changes', () => {
    expect(convertLoad(8, 'kg', 'lb')).toBe(17.64)
    expect(convertLoad(22.05, 'lb', 'kg')).toBe(10)
    expect(convertLoad(0, 'kg', 'lb')).toBe(0)
  })
  it('keeps same-unit values and avoids appreciable round-trip drift', () => {
    for (const kg of [0, 1, 2.5, 8, 17.5, 50, 100]) {
      expect(convertLoad(kg, 'kg', 'kg')).toBe(kg)
      expect(
        Math.abs(convertLoad(convertLoad(kg, 'kg', 'lb'), 'lb', 'kg') - kg),
      ).toBeLessThanOrEqual(0.01)
    }
  })
})
