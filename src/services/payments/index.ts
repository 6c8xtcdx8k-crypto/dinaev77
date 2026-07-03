import "server-only";
import { mockPaymentProvider } from "./mock";

/**
 * Абстракция платёжного провайдера. Чтобы подключить реальную оплату
 * (ЮKassa, Stripe, CloudPayments…), реализуйте этот интерфейс и
 * зарегистрируйте провайдера в getPaymentProvider().
 *
 * Поток: createPayment() возвращает URL страницы оплаты, куда
 * редиректится покупатель; после оплаты провайдер дергает webhook
 * (или, в mock-режиме, страницу подтверждения), где заказ помечается PAID.
 */
export interface PaymentProvider {
  readonly name: string;
  /** Создать платёж и вернуть URL для редиректа покупателя. */
  createPayment(input: {
    orderId: string;
    orderNumber: number;
    amount: number; // копейки
    description: string;
  }): Promise<{ paymentId: string; confirmationUrl: string }>;
}

export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? "mock";
  switch (name) {
    case "mock":
      return mockPaymentProvider;
    // case "yookassa": return yookassaProvider;  // см. docs/ARCHITECTURE.md
    // case "stripe":   return stripeProvider;
    default:
      throw new Error(`Unknown payment provider: ${name}`);
  }
}
