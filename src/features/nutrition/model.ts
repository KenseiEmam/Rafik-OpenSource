import type { Database } from '../../lib/database.types'
export type Nutrients = Partial<Record<'kcal' | 'protein_g' | 'carb_g' | 'fat_g', number | null>>
export type Food = Omit<Database['public']['Tables']['saved_foods']['Row'], 'nutrients'> & {
  nutrients: Nutrients
}
export type Meal = Omit<Database['public']['Tables']['meal_entries']['Row'], 'nutrients'> & {
  nutrients: Nutrients
}
export type Guidance = Omit<
  Database['public']['Tables']['nutrition_guidance']['Row'],
  'targets'
> & { targets: Nutrients }
export const nutrientKeys = ['kcal', 'protein_g', 'carb_g', 'fat_g'] as const
export function nutrientTotals(meals: Pick<Meal, 'quantity' | 'basis' | 'nutrients'>[]) {
  return Object.fromEntries(
    nutrientKeys.map((k) => {
      const known = meals.filter((m) => typeof m.nutrients[k] === 'number')
      return [
        k,
        {
          value: known.length
            ? Math.round(
                known.reduce((n, m) => n + (m.nutrients[k]! * m.quantity) / m.basis, 0) * 10,
              ) / 10
            : null,
          missing: meals.length - known.length,
        },
      ]
    }),
  ) as Record<(typeof nutrientKeys)[number], { value: number | null; missing: number }>
}
