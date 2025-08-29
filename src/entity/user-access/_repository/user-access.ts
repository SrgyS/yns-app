import { injectable } from "inversify";
import { dbClient } from "@/shared/lib/db";
import { CourseId } from "@/kernel/domain/course";
import { UserId } from "@/kernel/domain/user";
import { PaymentId } from "@/kernel/domain/payment";
import { UserAccess } from "../_domain/type";
import { CourseContentType } from "@prisma/client";

@injectable()
export class UserAccessRepository {
  findCoursePayment(
    userId: UserId,
    courseId: CourseId,
  ): Promise<UserAccess | undefined> {
    return this.queryCoursePayment(userId, courseId).then((payment) => {
      if (!payment) {
        return undefined;
      }
      return this.dbPaymentToPayment(payment);
    });
  }

  findPaymentById(paymentId: PaymentId): Promise<UserAccess | undefined> {
    return dbClient.payment
      .findUnique({
        where: {
          id: paymentId,
        },
        include: {
          products: true,
        },
      })
      .then((payment) => {
        if (!payment) {
          return undefined;
        }
        return this.dbPaymentToPayment(payment);
      });
  }

  async save(payment: Payment): Promise<Payment> {
    return this.dbPaymentToPayment(
      await dbClient.payment.upsert({
        where: {
          id: payment.paymentId,
        },
        create: {
          userEmail: payment.userEmail,
          state: payment.state.type,
          userId: payment.userId,
          id: payment.paymentId,
          products: {
            createMany: {
              data: payment.products.map((product) => ({
                name: product.name,
                price: product.price,
                quantity: product.quantity,
                sku: product.sku,
                type: product.type,
              })),
            },
          },
        },
        update: {
          state: payment.state.type,
        },
        include: {
          products: true,
        },
      }),
    );
  }

  private dbUserAccessToUserAccess(
    dbPayment: NotNull<
      Awaited<ReturnType<PaymentRepository["queryCoursePayment"]>>
    >,
  ): Payment {
    return {
      paymentId: dbPayment.id,
      userId: dbPayment.userId,
      userEmail: dbPayment.userEmail,
      products: dbPayment.products.map((product) => ({
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        sku: product.sku,
        type: product.type,
      })),
      state: {
        type: dbPayment.state,
      },
    };
  }

  private queryUserAccessPayment(type: UserAccessType, userId: UserId ) {
    return dbClient.userAccess.findFirst({
      where: {
        userId,
        type,
      },
    });
  }
}

type NotNull<T> = T extends null ? never : T;