import { injectable } from "inversify";
import { PaymentRepository } from "../_repository/payment";

import { UserId } from "@/kernel/domain/user";
import { generateId } from "@/shared/lib/id";
import { Payment, Product } from '../_domain/types'

export type Command = {
  userId: UserId;
  userEmail: string;
  products: Product[];
};

@injectable()
export class CreatePaymentService {
  constructor(private paymentRepository: PaymentRepository) {}
  /*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Создает новый платеж на основе данных из команды
   * @param command - данные для создания платежа
   * @returns созданный платеж
   */
  /*******  e7e8af50-bc26-4509-8d2e-f72e2f0640ff  *******/
  async exec(command: Command) {
    const payment: Payment = {
      paymentId: generateId(),
      userId: command.userId,
      userEmail: command.userEmail,
      products: command.products,
      state: {
        type: 'pending',
      },
    }

    return this.paymentRepository.save(payment)
  }
}