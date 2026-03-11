import { AccessType } from '@prisma/client'
import { CourseTariff } from '@/kernel/domain/course'
import type { CourseUpsertInput } from '../../_schemas'

export const SUBSCRIPTION_TARIFF_SLOT_COUNT = 3

export type SubscriptionTariffSlot = {
  price: number
  durationDays: number
}

export type SubscriptionTariffMatrix = {
  withoutFeedback: SubscriptionTariffSlot[]
  withFeedback: SubscriptionTariffSlot[]
}

const DEFAULT_SLOT: SubscriptionTariffSlot = {
  price: 1,
  durationDays: 30,
}

const DEFAULT_SLOT_DURATIONS = [30, 90, 180]

function createDefaultSlots() {
  return Array.from(
    { length: SUBSCRIPTION_TARIFF_SLOT_COUNT },
    (_value, index) => ({
      ...DEFAULT_SLOT,
      durationDays: DEFAULT_SLOT_DURATIONS[index] ?? DEFAULT_SLOT.durationDays,
    })
  )
}

export function createDefaultSubscriptionTariffMatrix(): SubscriptionTariffMatrix {
  return {
    withoutFeedback: createDefaultSlots(),
    withFeedback: createDefaultSlots(),
  }
}

function fillSlots(slots: SubscriptionTariffSlot[]) {
  const next = [...slots]

  while (next.length < SUBSCRIPTION_TARIFF_SLOT_COUNT) {
    next.push({
      ...DEFAULT_SLOT,
      durationDays:
        DEFAULT_SLOT_DURATIONS[next.length] ?? DEFAULT_SLOT.durationDays,
    })
  }

  return next.slice(0, SUBSCRIPTION_TARIFF_SLOT_COUNT)
}

export function mapTariffsToSubscriptionMatrix(
  tariffs: CourseTariff[]
): SubscriptionTariffMatrix {
  const sortedTariffs = [...tariffs].sort((left, right) => {
    if (left.feedback !== right.feedback) {
      return Number(left.feedback) - Number(right.feedback)
    }

    return left.durationDays - right.durationDays
  })

  const withoutFeedback = sortedTariffs
    .filter(tariff => !tariff.feedback)
    .map(tariff => ({
      price: tariff.price,
      durationDays: tariff.durationDays,
    }))

  const withFeedback = sortedTariffs
    .filter(tariff => tariff.feedback)
    .map(tariff => ({
      price: tariff.price,
      durationDays: tariff.durationDays,
    }))

  return {
    withoutFeedback: fillSlots(withoutFeedback),
    withFeedback: fillSlots(withFeedback),
  }
}

export function flattenSubscriptionTariffMatrix(
  matrix: SubscriptionTariffMatrix
): CourseUpsertInput['tariffs'] {
  const withoutFeedback = matrix.withoutFeedback.map(slot => ({
    access: AccessType.paid,
    price: Number(slot.price),
    durationDays: Number(slot.durationDays),
    feedback: false,
  }))

  const withFeedback = matrix.withFeedback.map(slot => ({
    access: AccessType.paid,
    price: Number(slot.price),
    durationDays: Number(slot.durationDays),
    feedback: true,
  }))

  return [...withoutFeedback, ...withFeedback]
}
