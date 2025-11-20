import { PaymentId } from '@/kernel/domain/payment'
import { UserId } from '@/kernel/domain/user'

export type CourseContentType = 'FIXED_COURSE' | 'SUBSCRIPTION'

export type Product = {
  type: CourseContentType
  sku: string
  name: string
  price: number
  quantity: number
}

export interface PendingPaymentStatus {
  type: 'pending'
}

export interface SuccessPaymentStatus {
  type: 'success'
}

export interface FailedPaymentStatus {
  type: 'failed'
}

export type PaymentState =
  | PendingPaymentStatus
  | SuccessPaymentStatus
  | FailedPaymentStatus

export type Payment = {
  paymentId: PaymentId
  userId: UserId
  userEmail: string
  products: Product[]
  state: PaymentState
}
