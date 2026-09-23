import { beforeAll, afterEach, describe, expect, it, vi } from 'vitest'
import type { Exercise } from '../src/lib/domain'

const stored = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (key: string) => stored.get(key) ?? null,
  setItem: (key: string, value: string) => stored.set(key, value),
  removeItem: (key: string) => stored.delete(key),
  clear: () => stored.clear(),
})

let catalog: typeof import('../src/lib/exercise-catalog')
let i18n: typeof import('../src/lib/i18n')

beforeAll(async () => {
  // Let Vue initialize its server renderer before i18n's immediate watcher
  // receives the minimal document surface it needs.
  await import('vue')
  vi.stubGlobal('document', { documentElement: { lang: '', dir: '' } })
  ;[catalog, i18n] = await Promise.all([
    import('../src/lib/exercise-catalog'),
    import('../src/lib/i18n'),
  ])
})

afterEach(() => {
  i18n.locale.value = 'en'
})

function exercise(id: string, equipment: string): Exercise {
  return {
    id,
    name: id,
    name_ar: '',
    equipment,
    equipment_ar: '',
    instructions: '',
    instructions_ar: '',
    movement: '',
  }
}

describe('exercise equipment facets', () => {
  it.each([
    ['Barbell, Bench', ['barbell', 'bench']],
    ['EZ bar, Preacher bench', ['ez barbell', 'bench']],
    ['Bench, SZ-Bar', ['bench', 'ez barbell']],
    ['Dumbbell, Incline bench', ['dumbbell', 'bench']],
    ['Bodyweight or dumbbells', ['body weight', 'dumbbell']],
    ['Cable machine', ['cable']],
    ['none (bodyweight exercise)', ['body weight']],
    ['Resistance band', ['band']],
  ])('normalizes %s without losing any equipment', (equipment, expected) => {
    expect(catalog.equipmentCategories(exercise(equipment, equipment))).toEqual(expected)
  })

  it('lets each facet find compound catalog records', () => {
    const exercises = [
      exercise('barbell-bench', 'Barbell, Bench'),
      exercise('ez-preacher', 'EZ bar, Preacher bench'),
      exercise('bodyweight-dumbbell', 'Bodyweight or dumbbells'),
      exercise('cable', 'Cable machine'),
    ]
    const idsFor = (facet: string) =>
      exercises
        .filter((item) => catalog.equipmentCategories(item).includes(facet))
        .map((item) => item.id)

    expect(idsFor('bench')).toEqual(['barbell-bench', 'ez-preacher'])
    expect(idsFor('barbell')).toEqual(['barbell-bench'])
    expect(idsFor('ez barbell')).toEqual(['ez-preacher'])
    expect(idsFor('body weight')).toEqual(['bodyweight-dumbbell'])
    expect(idsFor('dumbbell')).toEqual(['bodyweight-dumbbell'])
    expect(idsFor('cable')).toEqual(['cable'])
  })

  it('has an Arabic label for every current canonical catalog facet', () => {
    const facets = [
      'assisted',
      'assisted pull up machine',
      'band',
      'barbell',
      'bench',
      'body weight',
      'bosu ball',
      'cable',
      'dumbbell',
      'elliptical machine',
      'ez barbell',
      'hammer',
      'hack squat machine',
      'hip adduction machine',
      'kettlebell',
      'leg press machine',
      'leverage machine',
      'lying leg curl machine',
      'mat',
      'medicine ball',
      'olympic barbell',
      'pull-up bar',
      'roller',
      'rope',
      'seated calf raise machine',
      'seated leg curl machine',
      'shoulder press machine',
      'skierg machine',
      'sled machine',
      'smith machine',
      'stability ball',
      'stationary bike',
      'standing leg curl machine',
      'step',
      'stepmill machine',
      'tire',
      'trap bar',
      'treadmill',
      'upper body ergometer',
      'weighted',
      'wheel roller',
    ]

    i18n.locale.value = 'ar'
    for (const facet of facets) {
      expect(catalog.equipmentLabel(facet), facet).toMatch(/[\u0600-\u06ff]/)
    }
  })
})
