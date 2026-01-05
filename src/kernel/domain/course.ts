export type CourseId = string
export type CourseSlug = string
export type ContentBlockId = string

export type ContentType = 'FIXED_COURSE' | 'SUBSCRIPTION'

export type CourseTariff = {
  id: string
  access: 'paid'
  price: number
  durationDays: number
  feedback: boolean
}

export function selectDefaultCourseTariff(
  tariffs: CourseTariff[]
): CourseTariff | null {
  const paidTariffs = tariffs.filter(
    tariff =>
      tariff.access === 'paid' &&
      typeof tariff.price === 'number' &&
      tariff.price > 0
  )
  if (paidTariffs.length === 0) {
    return null
  }

  return paidTariffs.reduce((min, tariff) =>
    (tariff.price ?? 0) < (min.price ?? 0) ? tariff : min
  )
}

export function getMinPaidTariffPrice(tariffs: CourseTariff[]): number | null {
  const paidTariffs = tariffs.filter(
    tariff =>
      tariff.access === 'paid' &&
      typeof tariff.price === 'number' &&
      tariff.price > 0
  )
  if (paidTariffs.length === 0) {
    return null
  }

  return paidTariffs.reduce((min, tariff) => {
    const price = tariff.price ?? min
    return price < min ? price : min
  }, paidTariffs[0].price ?? 0)
}
