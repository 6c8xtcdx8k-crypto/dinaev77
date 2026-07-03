"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { changeOrderStatus } from "@/services/orders";

/**
 * Подтверждение mock-платежа. В реальной интеграции эту роль выполняет
 * webhook платёжного провайдера (см. src/app/api/payments/webhook/route.ts).
 */
export async function confirmMockPaymentAction(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "NEW") redirect("/account");

  await changeOrderStatus(orderId, "PAID", "Оплата получена (mock-провайдер)");
  redirect(`/checkout/success/${orderId}`);
}

export async function cancelMockPaymentAction(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (order && order.status === "NEW") {
    await changeOrderStatus(orderId, "CANCELLED", "Покупатель отменил оплату");
  }
  redirect("/cart");
}
