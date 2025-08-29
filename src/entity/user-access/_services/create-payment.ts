import { injectable } from "inversify";
import { PaymentRepository } from "../_repository/user-access";

import { UserId } from "@/kernel/domain/user";
import { generateId } from "@/shared/lib/id";
import { Payment, Product } from "../_domain/type";

export type Command = {
  userId: UserId;
  userEmail: string;
  products: Product[];
};

@injectable()
export class CreatePaymentService {
  constructor(private paymentRepository: PaymentRepository) {}
  async exec(command: Command) {
    const payment: Payment = {
      paymentId: generateId(),
      userId: command.userId,
      userEmail: command.userEmail,
      products: command.products,
      state: {
        type: "pending",
      },
    };

    return this.paymentRepository.save(payment);
  }
}