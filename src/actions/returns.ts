"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { RETURN_REASONS } from "@/lib/constants";

export type ReturnActionResult = { ok: boolean; error?: string };

/** Покупатель оформляет возврат позиции доставленного заказа. */
export async function createReturnAction(
  orderItemId: string,
  reason: string,
): Promise<ReturnActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Требуется вход" };
  if (!RETURN_REASONS.includes(reason as (typeof RETURN_REASONS)[number])) {
    return { ok: false, error: "Выберите причину возврата" };
  }

  const item = await prisma.orderItem.findFirst({
    where: { id: orderItemId, order: { userId: user.id } },
    include: { order: true, returnRequest: true },
  });
  if (!item) return { ok: false, error: "Позиция не найдена" };
  if (item.order.status !== "DELIVERED") {
    return { ok: false, error: "Возврат доступен только для доставленных заказов" };
  }
  if (item.returnRequest) return { ok: false, error: "Возврат по этой позиции уже оформлен" };

  await prisma.returnRequest.create({
    data: { orderItemId, userId: user.id, reason },
  });

  revalidatePath("/account");
  revalidatePath("/account/returns");
  revalidatePath(`/account/orders/${item.orderId}`);
  return { ok: true };
}
