import {
  getMinPaidTariffPrice,
  selectDefaultCourseTariff,
  type CourseTariff,
} from './course'

const makeTariff = (overrides: Partial<CourseTariff> = {}): CourseTariff => ({
  id: overrides.id ?? 't1',
  access: overrides.access ?? 'paid',
  price: overrides.price ?? 100,
  durationDays: overrides.durationDays ?? 30,
  feedback: overrides.feedback ?? false,
})

describe('course tariffs', () => {
  test('selectDefaultCourseTariff returns null when no paid tariffs', () => {
    expect(selectDefaultCourseTariff([])).toBeNull()
    expect(
      selectDefaultCourseTariff([makeTariff({ price: 0 })])
    ).toBeNull()
  })

  test('selectDefaultCourseTariff returns the lowest priced paid tariff', () => {
    const t1 = makeTariff({ id: 't1', price: 300 })
    const t2 = makeTariff({ id: 't2', price: 100 })
    const t3 = makeTariff({ id: 't3', price: 200 })
    expect(selectDefaultCourseTariff([t1, t2, t3])?.id).toBe('t2')
  })

  test('getMinPaidTariffPrice returns min or null', () => {
    const t1 = makeTariff({ price: 250 })
    const t2 = makeTariff({ price: 150 })
    expect(getMinPaidTariffPrice([t1, t2])).toBe(150)
    expect(getMinPaidTariffPrice([makeTariff({ price: 0 })])).toBeNull()
  })
})
