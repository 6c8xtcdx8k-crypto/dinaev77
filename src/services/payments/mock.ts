import type { PaymentProvider } from "./index";

/**
 * Тестовый провайдер оплаты: вместо внешнего шлюза покупатель попадает
 * на внутреннюю страницу /payment/mock/[orderId], где может «оплатить»
 * или «отменить» платёж. Используется в разработке и демо.
 */
export const mockPaymentProvider: PaymentProvider = {
  name: "mock",
  async createPayment({ orderId }) {
    return {
      paymentId: `mock_${orderId}`,
      confirmationUrl: `/payment/mock/${orderId}`,
    };
  },
};
