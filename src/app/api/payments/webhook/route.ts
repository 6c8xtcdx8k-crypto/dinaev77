import { NextResponse } from "next/server";

/**
 * Webhook платёжного провайдера (заготовка для продакшена).
 *
 * При интеграции реального провайдера (ЮKassa, Stripe…):
 *  1. Проверьте подпись запроса секретом провайдера.
 *  2. Найдите заказ по paymentId из payload.
 *  3. При событии успешной оплаты вызовите changeOrderStatus(orderId, "PAID").
 *
 * В демо-режиме используется mock-провайдер, который подтверждает оплату
 * через страницу /payment/mock/[orderId] — этот endpoint не задействован.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Webhook not configured. See docs/ARCHITECTURE.md → Платежи." },
    { status: 501 },
  );
}
