import "server-only";
import { prisma } from "@/lib/db";

/**
 * Покупал ли пользователь этот товар — право оставить отзыв.
 * Считаем по снимку slug в позициях заказа; отменённые заказы не в счёт.
 */
export async function hasPurchasedProduct(userId: string, productSlug: string): Promise<boolean> {
  const order = await prisma.order.findFirst({
    where: {
      userId,
      status: { not: "CANCELLED" },
      items: { some: { productSlug } },
    },
    select: { id: true },
  });
  return order !== null;
}
