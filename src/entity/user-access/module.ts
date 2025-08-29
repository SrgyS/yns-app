import { ContainerModule } from 'inversify'
import { PaymentRepository } from './_repository/user-access'
import { CreatePaymentService } from './_services/create-payment'
import { ReceivePaymentService } from './_services/receive-payment'

export const PaymentEntityModule = new ContainerModule(context => {
  const { bind } = context

  bind(PaymentRepository).toSelf()
  bind(CreatePaymentService).toSelf()
  bind(ReceivePaymentService).toSelf()

})

export { CreatePaymentService, ReceivePaymentService };