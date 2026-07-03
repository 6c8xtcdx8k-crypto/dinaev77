"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCart, getCartLines } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { createOrder } from "@/services/orders";
import { validatePromoCode } from "@/services/promo";
import { getPaymentProvider } from "@/services/payments";
import { prisma } from "@/lib/db";
import type { DeliveryMethod } from "@/lib/constants";

export type CheckoutFormState = { error?: string } | undefined;

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Укажите имя получателя"),
  customerEmail: z.string().email("Некорректный email"),
  customerPhone: z.string().min(10, "Укажите телефон"),
  deliveryMethod: z.enum(["COURIER", "PICKUP"]),
  deliveryAddress: z.string().min(5, "Укажите адрес доставки или пункт выдачи"),
  promoCode: z.string().optional(),
});

export async function placeOrderAction(
  _prev: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    customerPhone: formData.get("customerPhone"),
    deliveryMethod: formData.get("deliveryMethod"),
    deliveryAddress: formData.get("deliveryAddress"),
    promoCode: (formData.get("promoCode") as string) || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const cart = await getCart();
  if (!cart) return { error: "Корзина пуста" };
  const user = await getCurrentUser();

  const result = await createOrder({
    cartId: cart.id,
    userId: user?.id ?? null,
    ...parsed.data,
    deliveryMethod: parsed.data.deliveryMethod as DeliveryMethod,
  });
  if (!result.ok) return { error: result.error };

  // Создаём платёж и отправляем покупателя на страницу оплаты.
  const order = await prisma.order.findUniqueOrThrow({ where: { id: result.orderId } });
  const provider = getPaymentProvider();
  const payment = await provider.createPayment({
    orderId: order.id,
    orderNumber: order.number,
    amount: order.total,
    description: `Оплата заказа №${order.number} в Styleberries`,
  });
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentId: payment.paymentId },
  });

  revalidatePath("/", "layout");
  redirect(payment.confirmationUrl);
}

/** Проверка промокода на странице корзины/оформления (без создания заказа). */
export async function checkPromoAction(code: string): Promise<
  { ok: true; discount: number; code: string } | { ok: false; error: string }
> {
  const cart = await getCart();
  if (!cart) return { ok: false, error: "Корзина пуста" };
  const lines = await getCartLines(cart.id);
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const res = await validatePromoCode(code, subtotal);
  if (!res.ok) return res;
  return { ok: true, discount: res.discount, code: res.promo.code };
}
